import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
	GlobalWorkerOptions,
	getDocument,
	type PDFDocumentLoadingTask,
	type PDFDocumentProxy,
} from "pdfjs-dist";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.mjs?url";

GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

interface FallbackViewerProps {
	pdfUrl: string;
}

/**
 * Visor de respaldo sin WebGL: renderiza cada página en un <canvas> 2D
 * plano con los mismos controles de navegación, sin animación de volteo.
 */
export function FallbackViewer({ pdfUrl }: FallbackViewerProps) {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const docRef = useRef<PDFDocumentProxy | null>(null);
	const loadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let disposed = false;
		const loadingTask = getDocument({ url: pdfUrl });
		loadingTaskRef.current = loadingTask;
		void loadingTask.promise
			.then((doc) => {
				if (disposed) return;
				docRef.current = doc;
				setTotalPages(doc.numPages);
				setIsLoading(false);
			})
			.catch((err: unknown) => {
				if (disposed) return;
				console.error("Error cargando PDF de la edición:", err);
				setError(
					"No se pudo cargar la edición. Intenta descargar el PDF directamente.",
				);
				setIsLoading(false);
			});
		return () => {
			disposed = true;
			void loadingTaskRef.current?.destroy();
		};
	}, [pdfUrl]);

	useEffect(() => {
		if (!docRef.current || !canvasRef.current) return;
		let disposed = false;
		void docRef.current.getPage(page).then(async (pdfPage) => {
			if (disposed) return;
			const canvas = canvasRef.current;
			if (!canvas) return;
			const viewport = pdfPage.getViewport({ scale: 1.6 });
			canvas.width = viewport.width;
			canvas.height = viewport.height;
			const canvasContext = canvas.getContext("2d");
			if (!canvasContext) return;
			await pdfPage.render({ canvas, canvasContext, viewport }).promise;
		});
		return () => {
			disposed = true;
		};
	}, [page, totalPages]);

	if (isLoading) {
		return (
			<div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-3 bg-unag-dark-green">
				<div className="w-8 h-8 rounded-full border-2 border-unag-yellow/25 border-t-unag-yellow animate-spin" />
				<p className="text-sm text-white/70 tracking-wide">Cargando edición…</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-3 bg-unag-dark-green px-6 text-center">
				<p className="text-sm text-white/80 max-w-sm">{error}</p>
				<a
					href={pdfUrl}
					download
					className="inline-flex items-center gap-2 bg-unag-green hover:bg-unag-light-green text-white text-sm px-5 py-2 rounded-full transition-colors"
				>
					Descargar PDF
				</a>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full min-h-0">
			<div className="flex-1 min-h-0 overflow-auto flex items-start justify-center bg-unag-dark-green p-4">
				<canvas ref={canvasRef} className="max-w-full h-auto shadow-2xl rounded" />
			</div>
			<div className="flex items-center justify-center gap-4 py-3 px-4 border-t border-unag-green/25">
				<div className="flex items-center gap-3 bg-white/5 border border-unag-green/20 px-4 py-2 rounded-full">
					<button
						type="button"
						onClick={() => setPage((p) => Math.max(1, p - 1))}
						disabled={page <= 1}
						title="Anterior"
						className="text-white disabled:opacity-25 disabled:cursor-default hover:opacity-100 opacity-85 transition-opacity cursor-pointer"
					>
						<ChevronLeft size={16} />
					</button>
					<span className="text-sm text-white/70 tabular-nums min-w-16 text-center">
						<b className="text-white font-semibold">{page}</b> / {totalPages}
					</span>
					<button
						type="button"
						onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
						disabled={page >= totalPages}
						title="Siguiente"
						className="text-white disabled:opacity-25 disabled:cursor-default hover:opacity-100 opacity-85 transition-opacity cursor-pointer"
					>
						<ChevronRight size={16} />
					</button>
				</div>
			</div>
		</div>
	);
}
