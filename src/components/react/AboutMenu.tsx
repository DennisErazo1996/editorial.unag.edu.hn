import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import {
	BookOpen,
	ChevronDown,
	FileText,
	PenLine,
	UserCheck,
	Users,
	X,
} from "lucide-react";

const ITEMS = [
	{ label: "Sobre la revista", href: "/acerca-de/sobre-la-revista", icon: BookOpen },
	{ label: "Equipo editorial", href: "/acerca-de/equipo-editorial", icon: Users },
	{ label: "Autores", href: "/acerca-de/autores", icon: PenLine },
	{ label: "Políticas", href: "/acerca-de/politicas", icon: FileText },
	{ label: "Revisores", href: "/acerca-de/revisores", icon: UserCheck },
];

const overlayVariants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1, transition: { duration: 0.25 } },
	exit: { opacity: 0, transition: { duration: 0.2 } },
};

const panelVariants = {
	hidden: { opacity: 0, scale: 0.96, y: 12 },
	visible: {
		opacity: 1,
		scale: 1,
		y: 0,
		transition: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] as const },
	},
	exit: { opacity: 0, scale: 0.96, y: 12, transition: { duration: 0.2 } },
};

const gridVariants = {
	hidden: {},
	visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const itemVariants = {
	hidden: { opacity: 0, y: 16 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export function AboutMenu() {
	const [open, setOpen] = useState(false);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!open) return;

		document.body.style.overflow = "hidden";

		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") setOpen(false);
		};
		window.addEventListener("keydown", onKeyDown);

		return () => {
			document.body.style.overflow = "";
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [open]);

	const modal = (
		<AnimatePresence>
			{open && (
				<motion.div
					role="dialog"
					aria-modal="true"
					aria-label="Menú Acerca de"
					variants={overlayVariants}
					initial="hidden"
					animate="visible"
					exit="exit"
					onClick={() => setOpen(false)}
					className="fixed inset-0 z-60 flex items-center justify-center bg-unag-dark-green/90 backdrop-blur-xl p-6"
				>
					<motion.div
						variants={panelVariants}
						onClick={(e) => e.stopPropagation()}
						className="relative w-full max-w-4xl"
					>
						<button
							type="button"
							onClick={() => setOpen(false)}
							aria-label="Cerrar menú"
							className="absolute -top-14 right-0 md:top-0 md:-right-14 text-white hover:text-unag-yellow transition-colors cursor-pointer"
						>
							<X className="w-8 h-8" />
						</button>

						<motion.div
							variants={gridVariants}
							initial="hidden"
							animate="visible"
							className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6"
						>
							{ITEMS.map(({ label, href, icon: Icon }) => (
								<motion.a
									key={label}
									href={href}
									variants={itemVariants}
									className="group flex flex-col items-center justify-center gap-3 rounded-3xl border border-white/15 bg-white/5 p-6 md:p-8 text-center text-white hover:bg-white/10 hover:border-unag-light-green transition-colors"
								>
									<Icon className="w-8 h-8 md:w-10 md:h-10 text-unag-green group-hover:text-unag-light-green transition-colors" />
									<span className="font-semibold text-sm md:text-base">
										{label}
									</span>
								</motion.a>
							))}
						</motion.div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				aria-expanded={open}
				aria-haspopup="dialog"
				className="inline-flex items-center gap-1 hover:text-unag-yellow transition-colors cursor-pointer"
			>
				Acerca de
				<motion.span
					animate={{ rotate: open ? 180 : 0 }}
					transition={{ duration: 0.25 }}
					className="inline-flex"
				>
					<ChevronDown className="w-4 h-4" />
				</motion.span>
			</button>

			{mounted ? createPortal(modal, document.body) : null}
		</>
	);
}
