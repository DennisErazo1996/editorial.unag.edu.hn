import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Download, Eye, FileText } from "lucide-react";

interface DocFile {
	code: string;
	title: string;
	file: string;
}

interface Tab {
	id: string;
	label: string;
	basePath: string;
	files: DocFile[];
}

interface DocumentTabsProps {
	tabs: Tab[];
}

const panelVariants = {
	hidden: { opacity: 0, y: 8 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
	exit: { opacity: 0, y: -8, transition: { duration: 0.15, ease: "easeIn" as const } },
};

const gridVariants = {
	hidden: {},
	visible: { transition: { staggerChildren: 0.05 } },
};

const cardVariants = {
	hidden: { opacity: 0, y: 12 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export function DocumentTabs({ tabs }: DocumentTabsProps) {
	const [activeId, setActiveId] = useState(tabs[0]?.id);
	const activeTab = tabs.find((tab) => tab.id === activeId) ?? tabs[0];

	return (
		<>
			<div className="flex flex-wrap gap-2 border-b border-unag-light-gray mb-8">
				{tabs.map((tab) => {
					const isActive = tab.id === activeTab.id;
					return (
						<button
							key={tab.id}
							type="button"
							onClick={() => setActiveId(tab.id)}
							className={`relative px-5 py-3 text-sm md:text-base font-semibold transition-colors cursor-pointer ${
								isActive ? "text-unag-dark-green" : "text-unag-gray hover:text-unag-dark-green"
							}`}
						>
							{tab.label}
							{isActive && (
								<motion.div
									layoutId="tab-underline"
									className="absolute left-0 right-0 -bottom-px h-0.5 bg-unag-green"
									transition={{ type: "spring", stiffness: 400, damping: 32 }}
								/>
							)}
						</button>
					);
				})}
			</div>

			<AnimatePresence mode="wait">
				<motion.div
					key={activeTab.id}
					variants={panelVariants}
					initial="hidden"
					animate="visible"
					exit="exit"
				>
					{activeTab.files.length > 0 ? (
						<motion.div
							variants={gridVariants}
							initial="hidden"
							animate="visible"
							className="grid grid-cols-1 md:grid-cols-2 gap-4"
						>
							{activeTab.files.map((doc) => (
								<motion.div
									key={doc.code}
									variants={cardVariants}
									className="group relative overflow-hidden flex items-start gap-4 bg-unag-light-gray/40 rounded-2xl p-5"
								>
									<div className="absolute top-0 left-0 w-1 h-full bg-unag-green transform origin-right scale-y-0 group-hover:scale-y-100 transition-transform duration-400" />

									<div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-unag-green/10 text-unag-green">
										<FileText size={22} />
									</div>
									<div className="flex-1 min-w-0">
										<span className="inline-block text-xs font-semibold text-unag-dark-green bg-unag-green/20 rounded-full px-2.5 py-0.5 mb-2">
											{doc.code}
										</span>
										<h3 className="text-sm md:text-base font-semibold text-unag-dark-green leading-snug mb-4">
											{doc.title}
										</h3>
										<div className="flex flex-wrap gap-2">
											<a
												href={`${activeTab.basePath}/${doc.file}`}
												target="_blank"
												rel="noopener noreferrer"
												className="inline-flex items-center gap-1.5 bg-unag-green hover:bg-unag-dark-green text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors"
											>
												<Eye size={14} />
												Ver
											</a>
											<a
												href={`${activeTab.basePath}/${doc.file}`}
												download
												className="inline-flex items-center gap-1.5 border border-unag-dark-green hover:bg-unag-dark-green text-unag-dark-green hover:text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors"
											>
												<Download size={14} />
												Descargar
											</a>
										</div>
									</div>
								</motion.div>
							))}
						</motion.div>
					) : (
						<span className="inline-block bg-unag-overlay-green text-unag-dark-green text-xs font-semibold rounded-full px-3 py-1">
							Contenido pendiente
						</span>
					)}
				</motion.div>
			</AnimatePresence>
		</>
	);
}
