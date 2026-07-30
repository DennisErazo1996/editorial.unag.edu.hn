import * as THREE from "three";
import {
	GlobalWorkerOptions,
	getDocument,
	type PDFDocumentLoadingTask,
	type PDFDocumentProxy,
} from "pdfjs-dist";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.mjs?url";

GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

/** Tope de resolución por página: evita rasterizar a 4K y disparar la VRAM. */
const MAX_TEXTURE_WIDTH = 1400;
/** Páginas antes/después de la actual que se mantienen en textura. */
const PRELOAD_RADIUS = 1;

interface CachedPage {
	texture: THREE.CanvasTexture;
	canvas: HTMLCanvasElement;
}

/**
 * Carga un PDF y rasteriza sus páginas a texturas de Three.js bajo demanda,
 * con una caché acotada alrededor de la página actual.
 */
export class PageTextureSource {
	private loadingTask: PDFDocumentLoadingTask | null = null;
	private doc: PDFDocumentProxy | null = null;
	private cache = new Map<number, CachedPage>();
	private pending = new Map<number, Promise<THREE.CanvasTexture>>();
	/** Relación de aspecto (ancho/alto) real de la primera página cargada. */
	aspect = 1.294;
	totalPages = 0;

	async load(pdfUrl: string): Promise<number> {
		this.loadingTask = getDocument({ url: pdfUrl });
		this.doc = await this.loadingTask.promise;
		this.totalPages = this.doc.numPages;
		return this.totalPages;
	}

	async getTexture(pageNum: number): Promise<THREE.CanvasTexture> {
		const cached = this.cache.get(pageNum);
		if (cached) return cached.texture;

		const pending = this.pending.get(pageNum);
		if (pending) return pending;

		const job = this.renderPage(pageNum);
		this.pending.set(pageNum, job);
		try {
			return await job;
		} finally {
			this.pending.delete(pageNum);
		}
	}

	private async renderPage(pageNum: number): Promise<THREE.CanvasTexture> {
		if (!this.doc) throw new Error("PDF no cargado");
		const page = await this.doc.getPage(pageNum);
		const baseViewport = page.getViewport({ scale: 1 });
		const scale = Math.min(MAX_TEXTURE_WIDTH / baseViewport.width, 3);
		const viewport = page.getViewport({ scale });

		const canvas = document.createElement("canvas");
		canvas.width = Math.floor(viewport.width);
		canvas.height = Math.floor(viewport.height);
		const canvasContext = canvas.getContext("2d");
		if (!canvasContext) throw new Error("No se pudo obtener contexto 2D");

		await page.render({ canvas, canvasContext, viewport }).promise;

		const texture = new THREE.CanvasTexture(canvas);
		texture.colorSpace = THREE.SRGBColorSpace;
		texture.generateMipmaps = false;
		texture.minFilter = THREE.LinearFilter;
		texture.magFilter = THREE.LinearFilter;

		this.aspect = viewport.width / viewport.height;
		this.cache.set(pageNum, { texture, canvas });
		return texture;
	}

	/** Precarga las páginas vecinas a `centerPage` y libera las que quedan fuera de rango. */
	preloadAround(centerPage: number): void {
		const jobs: Promise<THREE.CanvasTexture>[] = [];
		for (
			let p = centerPage - PRELOAD_RADIUS;
			p <= centerPage + PRELOAD_RADIUS;
			p++
		) {
			if (p >= 1 && p <= this.totalPages) jobs.push(this.getTexture(p));
		}
		void Promise.all(jobs).then(() => this.prune(centerPage));
	}

	private prune(centerPage: number): void {
		for (const [num, entry] of this.cache) {
			if (Math.abs(num - centerPage) > PRELOAD_RADIUS + 1) {
				entry.texture.dispose();
				this.cache.delete(num);
			}
		}
	}

	/** Libera toda la caché de texturas y el documento PDF. */
	destroy(): void {
		for (const entry of this.cache.values()) entry.texture.dispose();
		this.cache.clear();
		this.pending.clear();
		void this.loadingTask?.destroy();
		this.loadingTask = null;
		this.doc = null;
	}
}
