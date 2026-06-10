const nodemailer = require('nodemailer');

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

let transporter = null;
if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  const puerto = parseInt(SMTP_PORT || '587', 10);
  transporter = nodemailer.createTransport({
    host:   SMTP_HOST,
    port:   puerto,
    secure: puerto === 465,
    auth:   { user: SMTP_USER, pass: SMTP_PASS },
  });
} else {
  console.warn('[mailer] SMTP no configurado — los emails se imprimen en consola (solo desarrollo)');
}

/**
 * Envía un email. Sin SMTP configurado (desarrollo) imprime el
 * contenido en consola para poder probar el flujo localmente.
 */
async function enviarEmail({ para, asunto, texto, html }) {
  if (!transporter) {
    console.log(`[mailer:DEV] Para: ${para} | Asunto: ${asunto}\n${texto}`);
    return;
  }
  await transporter.sendMail({
    from:    SMTP_FROM || SMTP_USER,
    to:      para,
    subject: asunto,
    text:    texto,
    html,
  });
}

module.exports = { enviarEmail };
