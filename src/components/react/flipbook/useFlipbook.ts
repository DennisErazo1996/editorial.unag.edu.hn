import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { PageTextureSource } from "./pageTextures";

const PAGE_H = 5.6;
const FLIP_DURATION = 780; // ms
const MAX_PIXEL_RATIO = 2;
const ZOOM_LEVELS = [9.4, 7.5, 6.0];
const SWIPE_THRESHOLD = 50; // px

type Mode = "single" | "spread";

interface FlipbookState {
	isLoading: boolean;
	error: string | null;
	currentPage: number;
	totalPages: number;
	canPrev: boolean;
	canNext: boolean;
	zoomIndex: number;
}

interface FlipbookActions {
	next: () => void;
	prev: () => void;
	first: () => void;
	last: () => void;
	zoomIn: () => void;
	zoomOut: () => void;
}

const initialState: FlipbookState = {
	isLoading: true,
	error: null,
	currentPage: 1,
	totalPages: 0,
	canPrev: false,
	canNext: false,
	zoomIndex: 0,
};

/**
 * Encapsula toda la lógica imperativa de Three.js + pdf.js del visor flipbook:
 * escena, geometría de páginas con "curl", animación de volteo, carga de
 * texturas y ciclo de vida (montaje/desmontaje sin fugas de contexto WebGL).
 */
export function useFlipbook(pdfUrl: string) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [state, setState] = useState<FlipbookState>(initialState);
	const [webglSupported, setWebglSupported] = useState(true);

	// Refs de control accesibles desde los callbacks de la toolbar,
	// sin depender de closures viejas del efecto de montaje.
	const flipRef = useRef<(direction: 1 | -1) => void>(() => {});
	const gotoRef = useRef<(page: number) => void>(() => {});
	const zoomRef = useRef<(index: number) => void>(() => {});

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		if (!hasWebGL()) {
			setWebglSupported(false);
			return;
		}

		let disposed = false;
		let animationFrame = 0;
		let dirty = true;
		let animating = false;
		let currentPage = 1;
		let totalPages = 0;
		let mode: Mode = matchMedia("(min-width: 768px)").matches
			? "spread"
			: "single";
		let zoomIndex = 0;

		const source = new PageTextureSource();

		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(
			32,
			container.clientWidth / Math.max(container.clientHeight, 1),
			0.1,
			100,
		);
		camera.position.set(0, 0, ZOOM_LEVELS[0]);

		const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		renderer.outputColorSpace = THREE.SRGBColorSpace;
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
		renderer.setSize(container.clientWidth, container.clientHeight);
		container.appendChild(renderer.domElement);

		scene.add(new THREE.AmbientLight(0xffffff, 0.85));
		const key = new THREE.DirectionalLight(0xffffff, 0.9);
		key.position.set(3, 4, 6);
		scene.add(key);
		const rim = new THREE.DirectionalLight(0xe8f0ff, 0.2);
		rim.position.set(-4, -2, 3);
		scene.add(rim);

		const shadowMesh = new THREE.Mesh(
			new THREE.PlaneGeometry(7.4, 1.6),
			new THREE.MeshBasicMaterial({
				map: makeShadowTexture(),
				transparent: true,
				opacity: 0.55,
				depthWrite: false,
			}),
		);
		shadowMesh.position.set(0, -3.05, -0.05);
		scene.add(shadowMesh);

		let leftMesh: THREE.Mesh | null = null;
		let rightMesh: THREE.Mesh | null = null;
		let flipMesh: THREE.Mesh | null = null;

		const pageWidth = () => PAGE_H * source.aspect;

		function animate() {
			animationFrame = requestAnimationFrame(animate);
			if (!dirty && !animating) return;
			renderer.render(scene, camera);
			if (!animating) dirty = false;
		}

		function updatePublicState() {
			// Debe reflejar exactamente los límites que flip() valida (mismo
			// tamaño de paso), o el botón queda habilitado sin poder avanzar.
			const step = mode === "spread" ? 2 : 1;
			setState({
				isLoading: false,
				error: null,
				currentPage,
				totalPages,
				canPrev: currentPage - step >= 1,
				canNext: currentPage + step <= totalPages,
				zoomIndex,
			});
		}

		const matFor = (tex: THREE.Texture) =>
			new THREE.MeshStandardMaterial({
				map: tex,
				roughness: 0.92,
				metalness: 0.02,
				side: THREE.DoubleSide,
			});

		/** Reconstruye la(s) malla(s) estática(s) para la página/spread actual. */
		async function buildView() {
			if (leftMesh) {
				scene.remove(leftMesh);
				leftMesh = null;
			}
			if (rightMesh) {
				scene.remove(rightMesh);
				rightMesh = null;
			}

			if (mode === "spread") {
				const leftNum = currentPage % 2 === 0 ? currentPage : currentPage - 1;
				const rightNum = leftNum + 1;
				const [leftTex, rightTex] = await Promise.all([
					leftNum >= 1 ? source.getTexture(leftNum) : null,
					rightNum <= totalPages ? source.getTexture(rightNum) : null,
				]);
				if (disposed) return;
				// El aspecto real de la página solo se conoce tras rasterizarla,
				// así que el ancho de la geometría se calcula después de esperar
				// la textura (si no, la primera página sale estirada con el
				// aspecto por defecto).
				const w = pageWidth();
				if (leftTex) {
					const geo = new THREE.PlaneGeometry(w, PAGE_H);
					leftMesh = new THREE.Mesh(geo, matFor(leftTex));
					leftMesh.position.set(-w / 2 - 0.01, 0, 0);
					scene.add(leftMesh);
				}
				if (rightTex) {
					const geo = new THREE.PlaneGeometry(w, PAGE_H);
					rightMesh = new THREE.Mesh(geo, matFor(rightTex));
					rightMesh.position.set(w / 2 + 0.01, 0, 0);
					scene.add(rightMesh);
				}
			} else {
				const tex = await source.getTexture(currentPage);
				if (disposed) return;
				const w = pageWidth();
				const geo = new THREE.PlaneGeometry(w, PAGE_H);
				rightMesh = new THREE.Mesh(geo, matFor(tex));
				rightMesh.position.set(0, 0, 0);
				scene.add(rightMesh);
			}

			source.preloadAround(currentPage);
			dirty = true;
			updatePublicState();
		}

		/** Rotación rígida alrededor del lomo + arqueo, igual que el prototipo de referencia. */
		function bendGeometry(
			geo: THREE.PlaneGeometry,
			progress: number,
			width: number,
			direction: 1 | -1,
		) {
			const pos = geo.attributes.position;
			const orig = geo.userData.orig as Float32Array;
			const angle = progress * Math.PI;
			const spineX = direction === 1 ? -width / 2 : width / 2;
			const sign = direction === 1 ? 1 : -1;
			// Arco de "levantamiento" — el borde libre se separa del libro
			// como una hoja real, en vez de rotar como una tapa rígida.
			const lift = Math.sin(angle) * 0.55;
			for (let i = 0; i < pos.count; i++) {
				const x0 = orig[i * 3];
				const y0 = orig[i * 3 + 1];
				const d = sign * (x0 - spineX);
				const edgeFactor = d / width; // 0 en el lomo, 1 en el borde libre
				const curl = Math.sin(Math.PI * edgeFactor) * 0.4 * Math.sin(angle);
				const x = spineX + sign * Math.cos(angle) * d;
				const z = Math.sin(angle) * d + curl + lift * edgeFactor;
				pos.setXYZ(i, x, y0, z);
			}
			pos.needsUpdate = true;
			geo.computeVertexNormals();
		}

		/** Ease natural de vuelta de página: arranque suave, aceleración media, asiento suave. */
		function pageEase(t: number) {
			return t < 0.5
				? 4 * t * t * t
				: 1 - Math.pow(-2 * t + 2, 3) / 2;
		}

		/** Textura espejada horizontalmente: usada en la cara trasera de la hoja
		 * para que, tras el giro de 180°, el contenido se vea en su orientación
		 * correcta (no invertido) en vez de repetir la textura frontal. */
		function mirroredTexture(tex: THREE.Texture): THREE.Texture {
			const mirrored = tex.clone();
			mirrored.wrapS = THREE.RepeatWrapping;
			mirrored.repeat.x = -1;
			mirrored.offset.x = 1;
			mirrored.needsUpdate = true;
			return mirrored;
		}

		function disposeMesh(mesh: THREE.Mesh | null) {
			if (!mesh) return;
			scene.remove(mesh);
			mesh.geometry.dispose();
			const mat = mesh.material;
			if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
			else mat.dispose();
		}

		function flip(direction: 1 | -1) {
			if (animating || totalPages === 0) return;
			const step = mode === "spread" ? 2 : 1;
			const targetPage = currentPage + direction * step;
			if (targetPage < 1 || targetPage > totalPages) return;

			animating = true;
			dirty = true;
			const w = pageWidth();

			// Página visible que empieza a girar (cara frontal de la hoja física).
			const frontNum =
				direction === 1
					? mode === "spread"
						? (currentPage % 2 === 0 ? currentPage : currentPage - 1) + 1
						: currentPage
					: mode === "spread"
						? currentPage % 2 === 0
							? currentPage
							: currentPage - 1
						: currentPage - 1;
			// Cara trasera de esa misma hoja: lo que queda mirando a cámara al
			// completar el giro (misma hoja física, no una página nueva).
			const backNum = direction === 1 ? frontNum + 1 : frontNum - 1;
			// Página que queda expuesta en el hueco que la hoja deja libre —
			// se construye y coloca desde ya para que se vea "detrás" mientras
			// la hoja se levanta, en vez de aparecer de golpe al terminar.
			const revealNum = backNum + direction;

			const clampedFront = Math.max(1, Math.min(totalPages, frontNum));

			void Promise.all([
				source.getTexture(clampedFront),
				backNum >= 1 && backNum <= totalPages
					? source.getTexture(backNum)
					: Promise.resolve(null),
				mode === "spread" && revealNum >= 1 && revealNum <= totalPages
					? source.getTexture(revealNum)
					: Promise.resolve(null),
			]).then(([frontTex, backTex, revealTex]) => {
				if (disposed) return;

				// La hoja opuesta a la que gira ya no pertenece al spread nuevo
				// (queda "cerrada" del otro lado del libro) — se retira de una
				// vez para no competir visualmente con la página revelada.
				if (mode === "spread") {
					if (direction === 1) {
						disposeMesh(leftMesh);
						leftMesh = null;
					} else {
						disposeMesh(rightMesh);
						rightMesh = null;
					}
				}

				let revealMesh: THREE.Mesh | null = null;
				if (revealTex) {
					const rgeo = new THREE.PlaneGeometry(w, PAGE_H);
					revealMesh = new THREE.Mesh(rgeo, matFor(revealTex));
					revealMesh.position.set(
						direction === 1 ? w / 2 + 0.01 : -w / 2 - 0.01,
						0,
						0,
					);
					scene.add(revealMesh);
				}

				const geo = new THREE.PlaneGeometry(w, PAGE_H, 32, 4);
				geo.userData.orig = Float32Array.from(geo.attributes.position.array);
				const frontMat = new THREE.MeshStandardMaterial({
					map: frontTex,
					roughness: 0.9,
					side: THREE.FrontSide,
				});
				const group = new THREE.Group();
				const frontFace = new THREE.Mesh(geo, frontMat);
				group.add(frontFace);

				let backMat: THREE.MeshStandardMaterial | null = null;
				if (backTex) {
					backMat = new THREE.MeshStandardMaterial({
						map: mirroredTexture(backTex),
						roughness: 0.9,
						side: THREE.BackSide,
					});
					group.add(new THREE.Mesh(geo, backMat));
				}
				group.position.set(
					direction === 1 ? w / 2 + 0.01 : -w / 2 - 0.01,
					0,
					0.02,
				);
				scene.add(group);
				flipMesh = frontFace;

				if (direction === 1 && rightMesh) rightMesh.visible = false;
				if (direction === -1 && leftMesh) leftMesh.visible = false;
				if (mode === "single" && rightMesh) rightMesh.visible = false;

				const shadowMat = shadowMesh.material as THREE.MeshBasicMaterial;
				const baseShadowOpacity = 0.55;

				const start = performance.now();
				const step = (now: number) => {
					if (disposed) return;
					const t = Math.min(1, (now - start) / FLIP_DURATION);
					const eased = pageEase(t);
					bendGeometry(geo, eased, w, direction);
					// La sombra se profundiza mientras la página se separa del
					// libro y vuelve a su tono base al asentarse, reforzando
					// la sensación de profundidad de una hoja real.
					const liftAmount = Math.sin(eased * Math.PI);
					shadowMat.opacity = baseShadowOpacity + liftAmount * 0.3;
					shadowMesh.scale.set(1 + liftAmount * 0.12, 1, 1);
					dirty = true;
					if (t < 1) {
						requestAnimationFrame(step);
					} else {
						scene.remove(group);
						geo.dispose();
						frontMat.dispose();
						if (backMat) {
							backMat.map?.dispose();
							backMat.dispose();
						}
						flipMesh = null;
						shadowMat.opacity = baseShadowOpacity;
						shadowMesh.scale.set(1, 1, 1);
						currentPage = Math.max(1, Math.min(totalPages, targetPage));
						animating = false;

						if (mode === "spread") {
							// La cara trasera de la hoja ya mostraba la página
							// correcta en su posición final: se promueve a malla
							// estática directamente, sin reconstruir ni esperar
							// una nueva textura (evita el "flash" final).
							const restTex = backTex ?? frontTex;
							const rgeo2 = new THREE.PlaneGeometry(w, PAGE_H);
							const restMesh = new THREE.Mesh(rgeo2, matFor(restTex));
							restMesh.position.set(
								direction === 1 ? -w / 2 - 0.01 : w / 2 + 0.01,
								0,
								0,
							);
							scene.add(restMesh);
							if (direction === 1) {
								leftMesh = restMesh;
								if (revealMesh) {
									revealMesh.visible = true;
									rightMesh = revealMesh;
								} else {
									rightMesh = null;
								}
							} else {
								rightMesh = restMesh;
								if (revealMesh) {
									revealMesh.visible = true;
									leftMesh = revealMesh;
								} else {
									leftMesh = null;
								}
							}
							source.preloadAround(currentPage);
							dirty = true;
							updatePublicState();
						} else {
							if (revealMesh) disposeMesh(revealMesh);
							void buildView();
						}
					}
				};
				requestAnimationFrame(step);
			});
		}

		function goto(page: number) {
			if (animating || totalPages === 0) return;
			currentPage = Math.max(1, Math.min(totalPages, page));
			void buildView();
		}

		function setZoom(index: number) {
			zoomIndex = Math.max(0, Math.min(ZOOM_LEVELS.length - 1, index));
			camera.position.z = ZOOM_LEVELS[zoomIndex];
			dirty = true;
			updatePublicState();
		}

		flipRef.current = flip;
		gotoRef.current = goto;
		zoomRef.current = setZoom;

		function onResize() {
			if (!container) return;
			const newMode: Mode = matchMedia("(min-width: 768px)").matches
				? "spread"
				: "single";
			const modeChanged = newMode !== mode;
			mode = newMode;
			camera.aspect =
				container.clientWidth / Math.max(container.clientHeight, 1);
			camera.updateProjectionMatrix();
			renderer.setSize(container.clientWidth, container.clientHeight);
			dirty = true;
			if (modeChanged && totalPages > 0) void buildView();
		}

		const resizeObserver = new ResizeObserver(onResize);
		resizeObserver.observe(container);

		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "ArrowRight") flip(1);
			if (e.key === "ArrowLeft") flip(-1);
		};
		window.addEventListener("keydown", onKeyDown);

		// Swipe táctil (principalmente para móvil, modo "single").
		let touchStartX = 0;
		const onPointerDown = (e: PointerEvent) => {
			touchStartX = e.clientX;
		};
		const onPointerUp = (e: PointerEvent) => {
			const delta = e.clientX - touchStartX;
			if (Math.abs(delta) < SWIPE_THRESHOLD) return;
			flip(delta < 0 ? 1 : -1);
		};
		renderer.domElement.addEventListener("pointerdown", onPointerDown);
		renderer.domElement.addEventListener("pointerup", onPointerUp);

		animate();

		void source
			.load(pdfUrl)
			.then((pages) => {
				if (disposed) return;
				totalPages = pages;
				currentPage = 1;
				return buildView();
			})
			.catch((err: unknown) => {
				if (disposed) return;
				console.error("Error cargando PDF de la edición:", err);
				setState((s) => ({
					...s,
					isLoading: false,
					error:
						"No se pudo cargar la edición. Intenta descargar el PDF directamente.",
				}));
			});

		return () => {
			disposed = true;
			cancelAnimationFrame(animationFrame);
			resizeObserver.disconnect();
			window.removeEventListener("keydown", onKeyDown);
			renderer.domElement.removeEventListener("pointerdown", onPointerDown);
			renderer.domElement.removeEventListener("pointerup", onPointerUp);

			source.destroy();

			scene.traverse((obj) => {
				if (obj instanceof THREE.Mesh) {
					obj.geometry.dispose();
					const mat = obj.material;
					if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
					else mat.dispose();
				}
			});

			renderer.dispose();
			renderer.forceContextLoss();
			if (renderer.domElement.parentNode === container) {
				container.removeChild(renderer.domElement);
			}
		};
	}, [pdfUrl]);

	const actions: FlipbookActions = {
		next: () => flipRef.current(1),
		prev: () => flipRef.current(-1),
		first: () => gotoRef.current(1),
		last: () => gotoRef.current(state.totalPages),
		zoomIn: () => zoomRef.current(state.zoomIndex + 1),
		zoomOut: () => zoomRef.current(state.zoomIndex - 1),
	};

	return { containerRef, state, actions, webglSupported };
}

function hasWebGL(): boolean {
	try {
		const canvas = document.createElement("canvas");
		return !!(
			canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
		);
	} catch {
		return false;
	}
}

function makeShadowTexture(): THREE.CanvasTexture {
	const c = document.createElement("canvas");
	c.width = 256;
	c.height = 64;
	const ctx = c.getContext("2d");
	if (ctx) {
		const g = ctx.createRadialGradient(128, 32, 4, 128, 32, 120);
		g.addColorStop(0, "rgba(0,0,0,0.55)");
		g.addColorStop(1, "rgba(0,0,0,0)");
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, 256, 64);
	}
	return new THREE.CanvasTexture(c);
}
