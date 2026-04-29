import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = "Agenciesos <agenciesosapp@gmail.com>"

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
}

export async function sendWelcomeEmail(to: string, rawName: string): Promise<void> {
  const name = escHtml(rawName)
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY no definida — email de bienvenida omitido")
    return
  }

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [to],
    subject: "Bienvenido a Agenciesos 🚀",
    headers: {
      'List-Unsubscribe': '<mailto:agenciesosapp@gmail.com?subject=unsubscribe>',
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
    html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenido a Agenciesos</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#111111;border-radius:16px;border:1px solid #1f1f1f;overflow:hidden;max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:40px 40px 32px;text-align:center;border-bottom:1px solid #1f1f1f;">
              <div style="display:inline-block;background:linear-gradient(135deg,#a855f7,#6366f1);border-radius:12px;padding:12px 24px;">
                <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Agenciesos</span>
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h1 style="margin:0 0 16px;color:#ffffff;font-size:28px;font-weight:700;line-height:1.2;">
                Hola, ${name} 👋
              </h1>
              <p style="margin:0 0 24px;color:#a1a1aa;font-size:16px;line-height:1.6;">
                Tu cuenta en <strong style="color:#ffffff;">Agenciesos</strong> está lista. Ahora tienes acceso a las herramientas de marketing más potentes para hacer crecer tu agencia.
              </p>

              <!-- Feature list -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:32px;">
                <tr>
                  <td style="padding:12px 16px;background:#1a1a1a;border-radius:8px;margin-bottom:8px;display:block;">
                    <span style="color:#a855f7;font-size:18px;margin-right:10px;">⚡</span>
                    <span style="color:#e4e4e7;font-size:14px;">Genera campañas de marketing completas con IA</span>
                  </td>
                </tr>
                <tr><td style="height:8px;"></td></tr>
                <tr>
                  <td style="padding:12px 16px;background:#1a1a1a;border-radius:8px;">
                    <span style="color:#a855f7;font-size:18px;margin-right:10px;">📊</span>
                    <span style="color:#e4e4e7;font-size:14px;">Análisis de mercado, competencia y estrategia de contenido</span>
                  </td>
                </tr>
                <tr><td style="height:8px;"></td></tr>
                <tr>
                  <td style="padding:12px 16px;background:#1a1a1a;border-radius:8px;">
                    <span style="color:#a855f7;font-size:18px;margin-right:10px;">🚀</span>
                    <span style="color:#e4e4e7;font-size:14px;">Roadmaps de escalado personalizados para tu negocio</span>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${process.env.FRONTEND_URL ?? "https://agenciesos.com"}/dashboard"
                       style="display:inline-block;background:linear-gradient(135deg,#a855f7,#6366f1);color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 36px;border-radius:10px;letter-spacing:0.2px;">
                      Ir a mi dashboard →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #1f1f1f;text-align:center;">
              <p style="margin:0;color:#52525b;font-size:13px;line-height:1.5;">
                Recibiste este email porque creaste una cuenta en Agenciesos.<br/>
                Si no fuiste tú, puedes ignorar este mensaje.
              </p>
              <p style="margin:12px 0 0;color:#3f3f46;font-size:12px;">
                © ${new Date().getFullYear()} Agenciesos · agenciesosapp@gmail.com
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  })

  if (error) {
    console.error("[email] Error enviando bienvenida a", to, "→", error)
    throw new Error(error.message)
  }
}

export async function sendPasswordResetEmail(to: string, rawName: string, resetUrl: string): Promise<void> {
  const name    = escHtml(rawName)
  const safeUrl = encodeURI(resetUrl)
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY no definida — email de reset omitido")
    return
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to: [to],
    subject: "Restablecer tu contraseña — Agenciesos",
    headers: {
      'List-Unsubscribe': '<mailto:agenciesosapp@gmail.com?subject=unsubscribe>',
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
    html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Restablecer contraseña</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#111111;border-radius:16px;border:1px solid #1f1f1f;overflow:hidden;max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:40px 40px 32px;text-align:center;border-bottom:1px solid #1f1f1f;">
              <div style="display:inline-block;background:linear-gradient(135deg,#a855f7,#6366f1);border-radius:12px;padding:12px 24px;">
                <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Agenciesos</span>
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h1 style="margin:0 0 16px;color:#ffffff;font-size:24px;font-weight:700;line-height:1.2;">
                Restablecer contraseña
              </h1>
              <p style="margin:0 0 24px;color:#a1a1aa;font-size:16px;line-height:1.6;">
                Hola, ${name}. Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.
                Si no fuiste tú, puedes ignorar este email con total seguridad.
              </p>
              <p style="margin:0 0 32px;color:#a1a1aa;font-size:14px;line-height:1.6;">
                Este enlace caduca en <strong style="color:#ffffff;">1 hora</strong>.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <a href="${safeUrl}"
                       style="display:inline-block;background:linear-gradient(135deg,#a855f7,#6366f1);color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 36px;border-radius:10px;letter-spacing:0.2px;">
                      Restablecer contraseña →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#52525b;font-size:13px;line-height:1.5;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:<br/>
                <span style="color:#6366f1;word-break:break-all;">${safeUrl}</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #1f1f1f;text-align:center;">
              <p style="margin:0;color:#52525b;font-size:13px;line-height:1.5;">
                Si no solicitaste este cambio, tu contraseña sigue siendo la misma.<br/>
                Puedes ignorar este mensaje con total seguridad.
              </p>
              <p style="margin:12px 0 0;color:#3f3f46;font-size:12px;">
                © ${new Date().getFullYear()} Agenciesos · agenciesosapp@gmail.com
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  })

  if (error) {
    console.error("[email] Error enviando reset a", to, "→", error)
    throw new Error(error.message)
  }
}
