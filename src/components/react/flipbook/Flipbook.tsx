import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ZoomIn, ZoomOut } from "lucide-react";
import { useFlipbook } from "./useFlipbook";
import { FallbackViewer } from "./FallbackViewer";

interface FlipbookProps {
	pdfUrl: string;
}

/**
 * Canvas WebGL + toolbar del visor de la revista. No conoce Three.js/pdf.js
 * directamente: toda la lógica imperativa vive en useFlipbook.
 */
export default function Flipbook({ pdfUrl }: FlipbookProps) {
	const { containerRef, state, actions, webglSupported } = useFlipbook(pdfUrl);

	if (!webglSupported) {
		return <FallbackViewer pdfUrl={pdfUrl} />;
	}

	return (
		<div className="flex flex-col h-full min-h-0">
			<div className="relative flex-1 min-h-0">
				<div ref={containerRef} className="absolute inset-0" />

				{state.isLoading && (
					<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-unag-dark-green">
						<div className="w-8 h-8 rounded-full border-2 border-unag-yellow/25 border-t-unag-yellow animate-spin" />
						<p className="text-sm text-white/70 tracking-wide">
							Cargando edición…
						</p>
					</div>
				)}

				{state.error && (
					<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-unag-dark-green px-6 text-center">
						<p className="text-sm text-white/80 max-w-sm">{state.error}</p>
						<a
							href={pdfUrl}
							download
							className="inline-flex items-center gap-2 bg-unag-green hover:bg-unag-light-green text-white text-sm px-5 py-2 rounded-full transition-colors"
						>
							Descargar PDF
						</a>
					</div>
				)}
			</div>

			{!state.isLoading && !state.error && (
				<div className="flex items-center justify-center gap-4 py-3 px-4 border-t border-unag-green/25">
					<div className="flex items-center gap-3 bg-white/5 border border-unag-green/20 px-4 py-2 rounded-full">
						<button
							type="button"
							onClick={actions.first}
							disabled={!state.canPrev}
							title="Primera página"
							className="text-white disabled:opacity-25 disabled:cursor-default hover:opacity-100 opacity-85 transition-opacity cursor-pointer"
						>
							<ChevronsLeft size={16} />
						</button>
						<button
							type="button"
							onClick={actions.prev}
							disabled={!state.canPrev}
							title="Anterior"
							className="text-white disabled:opacity-25 disabled:cursor-default hover:opacity-100 opacity-85 transition-opacity cursor-pointer"
						>
							<ChevronLeft size={16} />
						</button>
						<span className="text-sm text-white/70 tabular-nums min-w-16 text-center">
							<b className="text-white font-semibold">{state.currentPage}</b> /{" "}
							{state.totalPages}
						</span>
						<button
							type="button"
							onClick={actions.next}
							disabled={!state.canNext}
							title="Siguiente"
							className="text-white disabled:opacity-25 disabled:cursor-default hover:opacity-100 opacity-85 transition-opacity cursor-pointer"
						>
							<ChevronRight size={16} />
						</button>
						<button
							type="button"
							onClick={actions.last}
							disabled={!state.canNext}
							title="Última página"
							className="text-white disabled:opacity-25 disabled:cursor-default hover:opacity-100 opacity-85 transition-opacity cursor-pointer"
						>
							<ChevronsRight size={16} />
						</button>
					</div>

					<div className="flex items-center gap-2 bg-white/5 border border-unag-green/20 px-4 py-2 rounded-full">
						<button
							type="button"
							onClick={actions.zoomOut}
							disabled={state.zoomIndex === 0}
							title="Alejar"
							className="text-white disabled:opacity-25 disabled:cursor-default hover:opacity-100 opacity-85 transition-opacity cursor-pointer"
						>
							<ZoomOut size={16} />
						</button>
						<button
							type="button"
							onClick={actions.zoomIn}
							disabled={state.zoomIndex === 2}
							title="Acercar"
							className="text-white disabled:opacity-25 disabled:cursor-default hover:opacity-100 opacity-85 transition-opacity cursor-pointer"
						>
							<ZoomIn size={16} />
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

