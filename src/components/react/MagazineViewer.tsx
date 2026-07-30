import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Eye, X } from "lucide-react";

const Flipbook = lazy(() => import("./flipbook/Flipbook"));

const overlayVariants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1, transition: { duration: 0.25 } },
	exit: { opacity: 0, transition: { duration: 0.2 } },
};

const panelVariants = {
	hidden: { opacity: 0, scale: 0.97 },
	visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] as const } },
	exit: { opacity: 0, scale: 0.97, transition: { duration: 0.2 } },
};

interface MagazineViewerProps {
	pdfUrl: string;
	title: string;
	volume: string;
	variant?: "primary" | "secondary";
}

/**
 * Botón "Ver edición" + modal fullscreen con el visor flipbook de la revista.
 * Carga three.js/pdf.js de forma diferida: solo cuando el modal se abre.
 */
export function MagazineViewer({
	pdfUrl,
	title,
	volume,
	variant = "primary",
}: MagazineViewerProps) {
	const [open, setOpen] = useState(false);
	const [mounted, setMounted] = useState(false);
	const triggerRef = useRef<HTMLButtonElement | null>(null);
	const dialogRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!open) return;

		document.body.style.overflow = "hidden";
		dialogRef.current?.focus();

		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") setOpen(false);
		};
		window.addEventListener("keydown", onKeyDown);

		return () => {
			document.body.style.overflow = "";
			window.removeEventListener("keydown", onKeyDown);
			triggerRef.current?.focus();
		};
	}, [open]);

	const buttonClass =
		variant === "primary"
			? "inline-flex items-center justify-center gap-2 bg-unag-green hover:bg-unag-light-green text-white hover:text-unag-dark-green transition-all text-sm px-5 py-2 rounded-full shadow-md hover:shadow-lg hover:scale-[1.03] cursor-pointer"
			: "inline-flex items-center justify-center gap-2 bg-unag-green hover:bg-unag-dark-green text-white hover:text-white transition-all text-sm px-5 py-2 rounded-full shadow-md hover:shadow-lg hover:scale-[1.03] cursor-pointer";

	const modal = (
		<AnimatePresence>
			{open && (
				<motion.div
					variants={overlayVariants}
					initial="hidden"
					animate="visible"
					exit="exit"
					className="fixed inset-0 z-70 bg-unag-dark-green/95 backdrop-blur-sm"
				>
					<motion.div
						ref={dialogRef}
						variants={panelVariants}
						role="dialog"
						aria-modal="true"
						aria-label={`Visor de ${title}`}
						tabIndex={-1}
						className="flex flex-col h-full w-full outline-none"
					>
						<header className="flex items-center justify-between gap-3 px-5 md:px-7 py-4 border-b border-unag-green">
							<div className="flex gap-2 min-w-0 items-center">
								<span className="">
									<img src="/img/logo-revista-blanco.png" className="w-40" alt="logo revista cientifica unag" />
								</span>
								<span className="hidden sm:inline text-white/40 text-sm">/</span>
								<span className="hidden sm:inline text-white/60 text-sm truncate">
									{title}
								</span>
							</div>
							<div className="flex items-center gap-3 shrink-0">
								<span className="text-[11px] tracking-wider uppercase font-semibold text-white bg-unag-green px-2.5 py-1 rounded">
									{volume}
								</span>
								<button
									type="button"
									onClick={() => setOpen(false)}
									aria-label="Cerrar visor"
									className="text-white hover:text-unag-yellow transition-colors cursor-pointer"
								>
									<X className="w-6 h-6" />
								</button>
							</div>
						</header>

						<div className="flex-1 min-h-0">
							<Suspense
								fallback={
									<div className="flex flex-col items-center justify-center h-full gap-3 bg-unag-dark-green">
										<div className="w-8 h-8 rounded-full border-2 border-unag-yellow/25 border-t-unag-yellow animate-spin" />
										<p className="text-sm text-white/70 tracking-wide">
											Cargando edición…
										</p>
									</div>
								}
							>
								{open && <Flipbook pdfUrl={pdfUrl} />}
							</Suspense>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);

	return (
		<>
			<button
				ref={triggerRef}
				type="button"
				onClick={() => setOpen(true)}
				className={buttonClass}
			>
				<Eye size={18} />
				Ver edición
			</button>

			{mounted ? createPortal(modal, document.body) : null}
		</>
	);
}
