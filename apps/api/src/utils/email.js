import nodemailer from 'nodemailer';
import logger from './logger.js';

function createTransport() {
	if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;

	return nodemailer.createTransport({
		host: process.env.SMTP_HOST || 'smtp.hostinger.com',
		port: Number(process.env.SMTP_PORT) || 587,
		secure: Number(process.env.SMTP_PORT) === 465,
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASS,
		},
	});
}

function buildLeadEmail({ productName, data, leadsUrl }) {
	const rows = Object.entries(data)
		.map(([k, v]) => `
			<tr>
				<td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#6b7280;font-size:14px;white-space:nowrap">${k}</td>
				<td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#111827;font-size:14px">${v}</td>
			</tr>`)
		.join('');

	return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:system-ui,-apple-system,sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">
    <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:28px 32px">
      <p style="margin:0;color:rgba(255,255,255,.8);font-size:13px;text-transform:uppercase;letter-spacing:.05em">SellMind</p>
      <h1 style="margin:6px 0 0;color:#fff;font-size:22px;font-weight:700">Novo lead recebido</h1>
    </div>
    <div style="padding:28px 32px">
      <p style="margin:0 0 20px;color:#374151;font-size:15px">
        Alguém preencheu o formulário da sua página <strong>${productName}</strong>.
      </p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #f0f0f0;border-radius:8px;overflow:hidden">
        <thead>
          <tr style="background:#f9fafb">
            <th style="padding:8px 12px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#9ca3af;font-weight:600">Campo</th>
            <th style="padding:8px 12px;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#9ca3af;font-weight:600">Resposta</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="margin-top:24px;text-align:center">
        <a href="${leadsUrl}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">
          Ver todos os leads →
        </a>
      </div>
    </div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #f0f0f0">
      <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center">
        Você receberá este e-mail sempre que alguém preencher um formulário nas suas páginas públicas.
      </p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendLeadNotification({ to, productName, data, pageId }) {
	const transport = createTransport();
	if (!transport) return; // SMTP não configurado — silencioso

	const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
	const leadsUrl = `${frontendUrl}/leads/${pageId}`;

	try {
		await transport.sendMail({
			from: process.env.SMTP_FROM || process.env.SMTP_USER,
			to,
			subject: `Novo lead — ${productName}`,
			html: buildLeadEmail({ productName, data, leadsUrl }),
		});
		logger.info(`Lead notification sent to ${to} for page ${pageId}`);
	} catch (err) {
		logger.error(`Failed to send lead notification: ${err.message}`);
	}
}
