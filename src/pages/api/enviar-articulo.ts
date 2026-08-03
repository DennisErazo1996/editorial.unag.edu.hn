export const prerender = false;

import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const POST: APIRoute = async ({ request }) => {
	const apiKey = import.meta.env.RESEND_API_KEY;
	const destinatario = import.meta.env.EDITORIAL_EMAIL ?? 'derazo@unag.edu.hn';

	if (!apiKey || apiKey === 're_xxxxxxxxxxxxxxxxxxxx') {
		return new Response(JSON.stringify({ ok: false, error: 'API key de Resend no configurada.' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	let formData: FormData;
	try {
		formData = await request.formData();
	} catch {
		return new Response(JSON.stringify({ ok: false, error: 'Error al procesar el formulario.' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const get = (name: string) => (formData.get(name) as string | null) ?? '';

	const nombre = get('nombre');
	const documento = get('documento');
	const correo = get('correo');
	const telefono = get('telefono');
	const institucion = get('institucion');
	const facultad = get('facultad');
	const cargo = get('cargo');
	const ciudad = get('ciudad');
	const pais = get('pais');
	const orcid = get('orcid');
	const googleScholar = get('googleScholar');
	const afiliacion = get('afiliacion');

	const titulo = get('titulo');
	const tipoArticulo = get('tipoArticulo');
	const areaTematica = get('areaTematica') === 'Otra' ? get('areaTematicaOtra') : get('areaTematica');
	const resumen = get('resumen');
	const palabrasClave = get('palabrasClave');
	const numeroAutores = get('numeroAutores');

	const attachments: { filename: string; content: string }[] = [];

	const manuscritoFile = formData.get('manuscrito') as File | null;
	if (manuscritoFile && manuscritoFile.size > 0) {
		const buffer = await manuscritoFile.arrayBuffer();
		attachments.push({
			filename: manuscritoFile.name,
			content: Buffer.from(buffer).toString('base64'),
		});
	}

	const cartaFile = formData.get('cartaOriginalidad') as File | null;
	if (cartaFile && cartaFile.size > 0) {
		const buffer = await cartaFile.arrayBuffer();
		attachments.push({
			filename: cartaFile.name,
			content: Buffer.from(buffer).toString('base64'),
		});
	}

	const row = (label: string, value: string) =>
		value
			? `<tr><td style="padding:6px 12px;font-weight:600;color:#1a3a2a;white-space:nowrap;vertical-align:top">${label}</td><td style="padding:6px 12px;color:#3a5a4a">${value}</td></tr>`
			: '';

	const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /><title>Nuevo artículo postulado</title></head>
<body style="margin:0;padding:0;background:#f4f7f4;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f4;padding:32px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #d0e4d8">
        <tr><td style="background:#1a3a2a;padding:24px 32px">
          <h1 style="margin:0;color:#ffffff;font-size:22px">Nuevo artículo postulado</h1>
          <p style="margin:6px 0 0;color:#a8c8b0;font-size:14px">Revista Científica UNAG — Formulario de envío</p>
        </td></tr>

        <tr><td style="padding:24px 32px">
          <h2 style="margin:0 0 12px;font-size:16px;color:#1a3a2a;border-bottom:2px solid #e0ede6;padding-bottom:8px">Información del autor responsable</h2>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fbf9;border-radius:8px">
            ${row('Nombre', nombre)}
            ${row('Documento', documento)}
            ${row('Correo', correo)}
            ${row('Teléfono', telefono)}
            ${row('Institución', institucion)}
            ${row('Facultad / Unidad', facultad)}
            ${row('Cargo / Profesión', cargo)}
            ${row('Ciudad', ciudad)}
            ${row('País', pais)}
            ${row('ORCID', orcid)}
            ${row('Google Scholar', googleScholar)}
            ${row('Afiliación', afiliacion)}
          </table>

          <h2 style="margin:24px 0 12px;font-size:16px;color:#1a3a2a;border-bottom:2px solid #e0ede6;padding-bottom:8px">Información del artículo</h2>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fbf9;border-radius:8px">
            ${row('Título', titulo)}
            ${row('Tipo', tipoArticulo)}
            ${row('Área temática', areaTematica)}
            ${row('Palabras clave', palabrasClave)}
            ${row('N.° de autores', numeroAutores)}
          </table>

          ${resumen ? `
          <h2 style="margin:24px 0 12px;font-size:16px;color:#1a3a2a;border-bottom:2px solid #e0ede6;padding-bottom:8px">Resumen</h2>
          <p style="background:#f8fbf9;border-radius:8px;padding:12px 16px;color:#3a5a4a;line-height:1.6;margin:0">${resumen.replace(/\n/g, '<br>')}</p>
          ` : ''}

          <h2 style="margin:24px 0 12px;font-size:16px;color:#1a3a2a;border-bottom:2px solid #e0ede6;padding-bottom:8px">Archivos adjuntos</h2>
          <p style="margin:0;color:#3a5a4a;font-size:14px">
            ${attachments.length > 0
				? attachments.map((a) => `• ${a.filename}`).join('<br>')
				: 'No se adjuntaron archivos.'}
          </p>
        </td></tr>

        <tr><td style="background:#f4f7f4;padding:16px 32px;text-align:center">
          <p style="margin:0;font-size:12px;color:#6a8a7a">Este correo fue generado automáticamente por el sistema de postulación de la Editorial Universitaria UNAG.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

	const resend = new Resend(apiKey);

	const { error } = await resend.emails.send({
		from: 'Revista Científica UNAG <noreply@editorial.unag.edu.hn>',
		to: destinatario,
		replyTo: correo || undefined,
		subject: `Nuevo artículo postulado: ${titulo || '(sin título)'}`,
		html,
		attachments: attachments.map((a) => ({
			filename: a.filename,
			content: a.content,
		})),
	});

	if (error) {
		console.error('[enviar-articulo]', error);
		return new Response(
			JSON.stringify({ ok: false, error: `Resend: ${error.message ?? JSON.stringify(error)}` }),
			{ status: 500, headers: { 'Content-Type': 'application/json' } },
		);
	}

	return new Response(JSON.stringify({ ok: true }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
};
