import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = "AgencyOS <hola@agenciesos.com>"

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY no definida — email de bienvenida omitido")
    return
  }

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [to],
    subject: "Bienvenido a AgencyOS 🚀",
    html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenido a AgencyOS</title>
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
                <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">AgencyOS</span>
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
                Tu cuenta en <strong style="color:#ffffff;">AgencyOS</strong> está lista. Ahora tienes acceso a las herramientas de marketing más potentes para hacer crecer tu agencia.
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
                Recibiste este email porque creaste una cuenta en AgencyOS.<br/>
                Si no fuiste tú, puedes ignorar este mensaje.
              </p>
              <p style="margin:12px 0 0;color:#3f3f46;font-size:12px;">
                © ${new Date().getFullYear()} AgencyOS · hola@agenciesos.com
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
  console.log("[email] Bienvenida enviada →", to, "| id:", data?.id)
}
