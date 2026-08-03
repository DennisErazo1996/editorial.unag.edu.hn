import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, FileUp, Upload } from "lucide-react";

const AREAS_TEMATICAS = [
	"Producción agrícola y pecuaria",
	"Desarrollo rural",
	"Medicina veterinaria",
	"Territorio y sostenibilidad",
	"Sanidad animal",
	"Comunidades y gestión local",
	"Zootecnia y sistemas de producción animal",
	"Economía agraria",
	"Agroecología",
	"Política y legislación agraria",
	"Recursos naturales y ambiente",
	"Innovación y tecnología aplicada al sector agropecuario",
	"Biodiversidad y conservación",
	"Tecnología alimentaria",
	"Empresas agrarias",
	"Educación y extensión en áreas afines",
	"Gestión de sistemas productivos",
	"Cambio climático",
	"Seguridad alimentaria",
	"Pueblos indígenas",
	"Otra",
];

const TIPOS_ARTICULO = [
	"Artículos científicos originales",
	"Nota científica",
	"Artículos de revisión",
	"Ensayo académico",
	"Notas técnicas",
	"Estudio de caso",
];

const DECLARACIONES = [
	"Declaro que el manuscrito es original e inédito.",
	"Declaro que el artículo no ha sido enviado simultáneamente a otra revista.",
	"Confirmo que todos los autores conocen y aprueban la postulación.",
	"Acepto el proceso de evaluación editorial de la Revista Científica UNAG.",
	"Acepto el tratamiento de los datos personales para fines editoriales.",
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClass =
	"w-full rounded-xl border border-unag-dark-green/20 bg-unag-light-gray/50 px-4 py-2.5 text-unag-dark-green placeholder:text-unag-gray/60 focus:outline-none focus:ring-2 focus:ring-unag-green transition-shadow";

const attemptedInputClass = `${inputClass} invalid:border-red-400 invalid:focus:ring-red-400`;

const labelClass = "block text-sm font-semibold text-unag-dark-green mb-1.5";

function Field({
	label,
	required,
	children,
}: {
	label: string;
	required?: boolean;
	children: React.ReactNode;
}) {
	return (
		<div>
			<label className={labelClass}>
				{label} {required && <span className="text-unag-green">*</span>}
			</label>
			{children}
		</div>
	);
}

export function ArticleForm() {
	const [submitted, setSubmitted] = useState(false);
	const [attempted, setAttempted] = useState(false);
	const [loading, setLoading] = useState(false);
	const [serverError, setServerError] = useState("");
	const [areaTematica, setAreaTematica] = useState("");
	const [areaOtra, setAreaOtra] = useState("");
	const [declaraciones, setDeclaraciones] = useState<boolean[]>(
		Array(DECLARACIONES.length).fill(false),
	);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [manuscritoNombre, setManuscritoNombre] = useState("");
	const [cartaNombre, setCartaNombre] = useState("");

	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (submitted) {
			containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	}, [submitted]);

	function toggleDeclaracion(index: number) {
		setDeclaraciones((prev) => prev.map((v, i) => (i === index ? !v : v)));
	}

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setAttempted(true);
		const form = e.currentTarget;
		const nextErrors: Record<string, string> = {};

		if (!form.checkValidity()) {
			nextErrors.form = "Completá todos los campos obligatorios marcados con *.";
		}

		const email = (form.elements.namedItem("correo") as HTMLInputElement)?.value ?? "";
		if (email && !EMAIL_REGEX.test(email)) {
			nextErrors.correo = "El correo electrónico no tiene un formato válido.";
		}

		const palabrasClave = (
			form.elements.namedItem("palabrasClave") as HTMLInputElement
		)?.value.trim();
		if (palabrasClave) {
			const count = palabrasClave.split(",").filter((p) => p.trim()).length;
			if (count < 3 || count > 5) {
				nextErrors.palabrasClave = "Ingresá de 3 a 5 palabras clave separadas por coma.";
			}
		}

		if (!declaraciones.every(Boolean)) {
			nextErrors.declaraciones = "Debés aceptar las 5 declaraciones para continuar.";
		}

		setErrors(nextErrors);
		if (Object.keys(nextErrors).length > 0) return;

		setLoading(true);
		setServerError("");
		try {
			const data = new FormData(form);
			const res = await fetch("/api/enviar-articulo", { method: "POST", body: data });
			const json = await res.json();
			if (json.ok) {
				setSubmitted(true);
			} else {
				setServerError(json.error ?? "Error al enviar. Intente nuevamente.");
			}
		} catch {
			setServerError("Error de conexión. Verificá tu internet e intentá de nuevo.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div ref={containerRef} className="max-w-4xl mx-auto scroll-mt-24">
			<AnimatePresence mode="wait">
				{submitted ? (
					<motion.div
						key="confirmacion"
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.35 }}
						className="bg-unag-overlay-green rounded-3xl p-8 md:p-12 text-center"
					>
						<CheckCircle2 className="w-16 h-16 text-unag-green mx-auto mb-4" />
						<h2 className="texto-cursiva text-4xl md:text-5xl text-unag-dark-green mb-4">
							Su artículo ha sido recibido exitosamente
						</h2>
						<p className="text-unag-gray leading-relaxed">
							Gracias por postular su manuscrito a la Revista Científica UNAG.
						</p>
						<p className="text-unag-gray leading-relaxed mt-3">
							El Comité Editorial realizará una revisión inicial para verificar el
							cumplimiento de los requisitos establecidos. Posteriormente, recibirá una
							notificación al correo electrónico registrado con el estado de su
							postulación.
						</p>
						<p className="text-unag-gray leading-relaxed mt-3">
							Agradecemos su interés en contribuir al fortalecimiento de la
							investigación científica de la Universidad Nacional de Agricultura.
						</p>
						<button
							type="button"
							onClick={() => {location.reload(); setSubmitted(false)}}
							className="mt-8 inline-flex items-center justify-center bg-unag-green hover:bg-unag-yellow text-white hover:text-unag-dark-green font-bold text-sm px-6 py-2.5 rounded-full transition-colors cursor-pointer"
						>
							Enviar otro artículo
						</button>
					</motion.div>
				) : (
					<motion.form
						key="formulario"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.25 }}
						noValidate
						onSubmit={handleSubmit}
						className="space-y-14"
					>
						<section>
							<h2 className="texto-cursiva text-4xl text-unag-dark-green mb-6">
								Información del autor responsable
							</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
								<Field label="Nombre completo" required>
									<input name="nombre" required className={attempted ? attemptedInputClass : inputClass} />
								</Field>
								<Field label="Documento de identidad">
									<input name="documento" className={attempted ? attemptedInputClass : inputClass} />
								</Field>
								<Field label="Correo electrónico institucional" required>
									<input
										name="correo"
										type="email"
										required
										className={attempted ? attemptedInputClass : inputClass}
									/>
									{errors.correo && (
										<p className="text-sm text-red-600 mt-1">{errors.correo}</p>
									)}
								</Field>
								<Field label="Teléfono de contacto" required>
									<input name="telefono" required className={attempted ? attemptedInputClass : inputClass} />
								</Field>
								<Field label="Institución de procedencia" required>
									<input name="institucion" required className={attempted ? attemptedInputClass : inputClass} />
								</Field>
								<Field label="Facultad, departamento o unidad académica">
									<input name="facultad" className={attempted ? attemptedInputClass : inputClass} />
								</Field>
								<Field label="Cargo o profesión">
									<input name="cargo" className={attempted ? attemptedInputClass : inputClass} />
								</Field>
								<Field label="Ciudad">
									<input name="ciudad" className={attempted ? attemptedInputClass : inputClass} />
								</Field>
								<Field label="País" required>
									<input name="pais" required className={attempted ? attemptedInputClass : inputClass} />
								</Field>
								<Field label="ORCID" required>
									<input
										name="orcid"
										required
										placeholder="0000-0000-0000-0000"
										className={attempted ? attemptedInputClass : inputClass}
									/>
								</Field>
								<Field label="Google Scholar">
									<input name="googleScholar" className={attempted ? attemptedInputClass : inputClass} />
								</Field>
								<Field label="Afiliación institucional completa">
									<input name="afiliacion" className={attempted ? attemptedInputClass : inputClass} />
								</Field>
							</div>
						</section>

						<section>
							<h2 className="texto-cursiva text-4xl text-unag-dark-green mb-6">
								Información del artículo
							</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
								<Field label="Título del artículo" required>
									<input name="titulo" required className={attempted ? attemptedInputClass : inputClass} />
								</Field>
								<Field label="Tipo de artículo" required>
									<select name="tipoArticulo" required defaultValue="" className={attempted ? attemptedInputClass : inputClass}>
										<option value="" disabled>
											Seleccioná una opción
										</option>
										{TIPOS_ARTICULO.map((tipo) => (
											<option key={tipo} value={tipo}>
												{tipo}
											</option>
										))}
									</select>
								</Field>

								<div className="md:col-span-2">
									<Field label="Área temática" required>
										<select
											name="areaTematica"
											required
											value={areaTematica}
											onChange={(e) => setAreaTematica(e.target.value)}
											className={attempted ? attemptedInputClass : inputClass}
										>
											<option value="" disabled>
												Seleccioná una opción
											</option>
											{AREAS_TEMATICAS.map((area) => (
												<option key={area} value={area}>
													{area}
												</option>
											))}
										</select>
									</Field>
									{areaTematica === "Otra" && (
										<input
											name="areaTematicaOtra"
											required
											placeholder="Especificar área temática"
											value={areaOtra}
											onChange={(e) => setAreaOtra(e.target.value)}
											className={`${inputClass} mt-3`}
										/>
									)}
								</div>

								<div className="md:col-span-2">
									<Field label="Resumen">
										<textarea name="resumen" rows={5} className={attempted ? attemptedInputClass : inputClass} />
									</Field>
								</div>

								<Field label="Palabras clave (de 3 a 5)">
									<input
										name="palabrasClave"
										placeholder="separadas por coma"
										className={attempted ? attemptedInputClass : inputClass}
									/>
									{errors.palabrasClave && (
										<p className="text-sm text-red-600 mt-1">
											{errors.palabrasClave}
										</p>
									)}
								</Field>
								<Field label="Número de autores">
									<input
										name="numeroAutores"
										type="number"
										min={1}
										className={attempted ? attemptedInputClass : inputClass}
									/>
								</Field>
							</div>
						</section>

						<section>
							<h2 className="texto-cursiva text-4xl text-unag-dark-green mb-6">
								Carga de archivos
							</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
								<Field label="Manuscrito completo (.doc o .docx)" required>
									<label className="flex items-center gap-3 rounded-xl border border-dashed border-unag-green/60 bg-unag-overlay-green/40 px-4 py-4 cursor-pointer hover:bg-unag-overlay-green transition-colors">
										<FileUp className="w-5 h-5 text-unag-green shrink-0" />
										<span className="text-sm text-unag-gray truncate">
											{manuscritoNombre || "Adjuntar archivo Word"}
										</span>
										<input
											name="manuscrito"
											type="file"
											required
											accept=".doc,.docx"
											onChange={(e) => setManuscritoNombre(e.target.files?.[0]?.name ?? "")}
											className="sr-only"
										/>
									</label>
								</Field>
								<Field label="Carta de originalidad y cesión de derechos (PDF)" required>
									<label className="flex items-center gap-3 rounded-xl border border-dashed border-unag-green/60 bg-unag-overlay-green/40 px-4 py-4 cursor-pointer hover:bg-unag-overlay-green transition-colors">
										<Upload className="w-5 h-5 text-unag-green shrink-0" />
										<span className="text-sm text-unag-gray truncate">
											{cartaNombre || "Adjuntar PDF"}
										</span>
										<input
											name="cartaOriginalidad"
											type="file"
											required
											accept=".pdf"
											onChange={(e) => setCartaNombre(e.target.files?.[0]?.name ?? "")}
											className="sr-only"
										/>
									</label>
								</Field>
							</div>
						</section>

						<section>
							<h2 className="texto-cursiva text-4xl text-unag-dark-green mb-6">
								Declaraciones del autor
							</h2>
							<div className="space-y-3">
								{DECLARACIONES.map((texto, i) => (
									<label
										key={texto}
										className="flex items-start gap-3 cursor-pointer"
									>
										<input
											type="checkbox"
											required
											checked={declaraciones[i]}
											onChange={() => toggleDeclaracion(i)}
											className="mt-1 w-4 h-4 accent-unag-green shrink-0"
										/>
										<span className="text-unag-gray text-sm">{texto}</span>
									</label>
								))}
							</div>
							{errors.declaraciones && (
								<p className="text-sm text-red-600 mt-2">{errors.declaraciones}</p>
							)}
						</section>

						{errors.form && (
							<p className="text-sm text-red-600 -mt-8">{errors.form}</p>
						)}

						{serverError && (
							<p className="text-sm text-red-600 -mt-8">{serverError}</p>
						)}

						<button
							type="submit"
							disabled={loading}
							className="w-full md:w-auto inline-flex items-center justify-center bg-unag-green hover:bg-unag-yellow disabled:opacity-60 disabled:cursor-not-allowed text-white hover:text-unag-dark-green font-bold text-sm px-8 py-3 rounded-full transition-colors cursor-pointer"
						>
							{loading ? "Enviando..." : "Enviar artículo"}
						</button>
					</motion.form>
				)}
			</AnimatePresence>
		</div>
	);
}
