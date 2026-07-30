import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { PageTextureSource } from "./pageTextures";

const PAGE_H = 5.6;
const FLIP_DURATION = 620; // ms
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
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
		renderer.setSize(container.clientWidth, container.clientHeight);
		container.appendChild(renderer.domElement);

		scene.add(new THREE.AmbientLight(0xfff2d8, 0.85));
		const key = new THREE.DirectionalLight(0xfff6e6, 0.9);
		key.position.set(3, 4, 6);
		scene.add(key);
		const rim = new THREE.DirectionalLight(0xbfd8ff, 0.25);
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

		/** Reconstruye la(s) malla(s) estática(s) para la página/spread actual. */
		async function buildView() {
			const matFor = (tex: THREE.Texture) =>
				new THREE.MeshStandardMaterial({
					map: tex,
					roughness: 0.92,
					metalness: 0.02,
					side: THREE.DoubleSide,
				});

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
			for (let i = 0; i < pos.count; i++) {
				const x0 = orig[i * 3];
				const y0 = orig[i * 3 + 1];
				const d = sign * (x0 - spineX);
				const curl = Math.sin(Math.PI * (d / width)) * 0.14 * Math.sin(angle);
				const x = spineX + sign * Math.cos(angle) * d;
				const z = Math.sin(angle) * d + curl;
				pos.setXYZ(i, x, y0, z);
			}
			pos.needsUpdate = true;
			geo.computeVertexNormals();
		}

		function flip(direction: 1 | -1) {
			if (animating || totalPages === 0) return;
			const step = mode === "spread" ? 2 : 1;
			const targetPage = currentPage + direction * step;
			if (targetPage < 1 || targetPage > totalPages) return;

			animating = true;
			dirty = true;
			const w = pageWidth();

			const flippingNum =
				direction === 1
					? mode === "spread"
						? (currentPage % 2 === 0 ? currentPage : currentPage - 1) + 1
						: currentPage
					: mode === "spread"
						? currentPage % 2 === 0
							? currentPage
							: currentPage - 1
						: currentPage - 1;

			const clamped = Math.max(1, Math.min(totalPages, flippingNum));

			void source.getTexture(clamped).then((tex) => {
				if (disposed) return;
				const geo = new THREE.PlaneGeometry(w, PAGE_H, 24, 2);
				geo.userData.orig = Float32Array.from(geo.attributes.position.array);
				const mat = new THREE.MeshStandardMaterial({
					map: tex,
					roughness: 0.9,
					side: THREE.DoubleSide,
				});
				flipMesh = new THREE.Mesh(geo, mat);
				flipMesh.position.set(
					direction === 1 ? w / 2 + 0.01 : -w / 2 - 0.01,
					0,
					0.02,
				);
				scene.add(flipMesh);

				if (direction === 1 && rightMesh) rightMesh.visible = false;
				if (direction === -1 && leftMesh) leftMesh.visible = false;
				if (mode === "single" && rightMesh) rightMesh.visible = false;

				const start = performance.now();
				const step = (now: number) => {
					if (disposed) return;
					const t = Math.min(1, (now - start) / FLIP_DURATION);
					const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
					bendGeometry(geo, eased, w, direction);
					dirty = true;
					if (t < 1) {
						requestAnimationFrame(step);
					} else {
						if (flipMesh) scene.remove(flipMesh);
						geo.dispose();
						flipMesh = null;
						currentPage = Math.max(1, Math.min(totalPages, targetPage));
						animating = false;
						void buildView();
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
