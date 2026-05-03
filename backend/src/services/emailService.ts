import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM ?? "Agenciesos <onboarding@resend.dev>"

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
}

export async function sendWelcomeEmail(to: string, rawName: string): Promise<void> {
  const name    = escHtml(rawName)
  const dashUrl = `${process.env.FRONTEND_URL ?? "https://agenciesos.com"}/dashboard`

  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY no definida — email de bienvenida omitido")
    return
  }

  const year = new Date().getFullYear()

  const { data, error } = await resend.emails.send({
    from:    FROM,
    to:      [to],
    replyTo: "agenciesosapp@gmail.com",
    subject: "Tu agencia acaba de subir de nivel ⚡",
    headers: {
      "X-Priority":       "1",
      "List-Unsubscribe": "<mailto:agenciesosapp@gmail.com?subject=unsubscribe>",
    },

    // ── Texto plano ───────────────────────────────────────────────────────────
    text: [
      `Hola, ${rawName},`,
      "",
      "Bienvenido a Agenciesos",
      "La IA que trabaja para tu agencia, 24/7",
      "",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "",
      "Empieza ahora mismo:",
      "",
      "⚡ Genera tu primera campaña con IA",
      "   Copy, hooks y guiones listos en menos de 2 minutos.",
      "",
      "📊 Analiza tu mercado y competencia",
      "   Análisis detallado de tu sector, oportunidades y posicionamiento.",
      "",
      "📅 Crea tu calendario de contenido",
      "   Planifica semanas de publicaciones en minutos.",
      "",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "",
      `Genera tu primera campaña gratis: ${dashUrl}`,
      "",
      "Tu primera campaña es completamente gratis. Sin tarjeta de crédito.",
      "",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "",
      `© ${year} Agenciesos · agenciesosapp@gmail.com`,
      "",
      "Recibiste este email porque creaste una cuenta en Agenciesos.",
      "Si no fuiste tú, puedes ignorar este mensaje.",
    ].join("\n"),

    // ── HTML ──────────────────────────────────────────────────────────────────
    html: `
<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Tu agencia acaba de subir de nivel</title>
</head>
<!--[if !mso]><!-->
<body style="margin:0;padding:0;background-color:#0f0f0f;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<!--<![endif]-->

<!-- Wrapper -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"
       style="background-color:#0f0f0f;min-width:320px;">
  <tr>
    <td align="center" style="padding:48px 20px;">

      <!-- Content column: 600px max -->
      <table width="600" cellpadding="0" cellspacing="0" border="0" role="presentation"
             style="max-width:600px;width:100%;">

        <!-- ── Logo row ─────────────────────────────────────────────────── -->
        <tr>
          <td style="padding:0 0 32px 0;">
            <span style="color:#7c3aed;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:20px;font-weight:700;letter-spacing:-0.5px;">Agenciesos</span>
          </td>
        </tr>

        <!-- ── Main card ─────────────────────────────────────────────────── -->
        <tr>
          <td style="background-color:#161616;border-radius:16px;border:1px solid #222222;overflow:hidden;">

            <!-- Purple top bar (gradient with solid fallback for Outlook) -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
              <tr>
                <td height="4" bgcolor="#7c3aed"
                    style="background-color:#7c3aed;background-image:linear-gradient(90deg,#7c3aed 0%,#6366f1 100%);font-size:0;line-height:0;">&nbsp;</td>
              </tr>
            </table>

            <!-- Card body -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
              <tr>
                <td style="padding:48px 48px 44px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

                  <!-- Greeting -->
                  <p style="margin:0 0 28px;color:#a1a1aa;font-size:16px;line-height:1.6;">
                    Hola, ${name},
                  </p>

                  <!-- Main headline -->
                  <h1 style="margin:0 0 10px;color:#ffffff;font-size:34px;font-weight:800;line-height:1.15;letter-spacing:-1px;">
                    Bienvenido a Agenciesos
                  </h1>

                  <!-- Subtitle -->
                  <p style="margin:0 0 40px;color:#71717a;font-size:18px;line-height:1.5;font-weight:400;">
                    La IA que trabaja para tu agencia, 24/7
                  </p>

                  <!-- Divider -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-bottom:32px;">
                    <tr><td height="1" bgcolor="#2a2a2a" style="background-color:#2a2a2a;font-size:0;line-height:0;">&nbsp;</td></tr>
                  </table>

                  <!-- Section label -->
                  <p style="margin:0 0 20px;color:#52525b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;">
                    Empieza ahora mismo
                  </p>

                  <!-- Bullet 1 -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-bottom:16px;">
                    <tr>
                      <td valign="top" width="40">
                        <table cellpadding="0" cellspacing="0" border="0" role="presentation">
                          <tr>
                            <td width="32" height="32" bgcolor="#1c0f40"
                                style="background-color:#1c0f40;border-radius:8px;border:1px solid #3b1f7a;text-align:center;vertical-align:middle;font-size:15px;line-height:32px;">
                              ⚡
                            </td>
                          </tr>
                        </table>
                      </td>
                      <td valign="top" style="padding-left:14px;">
                        <p style="margin:0 0 3px;color:#f4f4f5;font-size:15px;font-weight:600;line-height:1.4;">Genera tu primera campaña con IA</p>
                        <p style="margin:0;color:#71717a;font-size:13px;line-height:1.6;">Copy, hooks y guiones listos en menos de 2 minutos. Sin experiencia previa.</p>
                      </td>
                    </tr>
                  </table>

                  <!-- Bullet 2 -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-bottom:16px;">
                    <tr>
                      <td valign="top" width="40">
                        <table cellpadding="0" cellspacing="0" border="0" role="presentation">
                          <tr>
                            <td width="32" height="32" bgcolor="#1c0f40"
                                style="background-color:#1c0f40;border-radius:8px;border:1px solid #3b1f7a;text-align:center;vertical-align:middle;font-size:15px;line-height:32px;">
                              📊
                            </td>
                          </tr>
                        </table>
                      </td>
                      <td valign="top" style="padding-left:14px;">
                        <p style="margin:0 0 3px;color:#f4f4f5;font-size:15px;font-weight:600;line-height:1.4;">Analiza tu mercado y competencia</p>
                        <p style="margin:0;color:#71717a;font-size:13px;line-height:1.6;">Análisis detallado de tu sector, oportunidades y estrategia de posicionamiento.</p>
                      </td>
                    </tr>
                  </table>

                  <!-- Bullet 3 -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-bottom:44px;">
                    <tr>
                      <td valign="top" width="40">
                        <table cellpadding="0" cellspacing="0" border="0" role="presentation">
                          <tr>
                            <td width="32" height="32" bgcolor="#1c0f40"
                                style="background-color:#1c0f40;border-radius:8px;border:1px solid #3b1f7a;text-align:center;vertical-align:middle;font-size:15px;line-height:32px;">
                              📅
                            </td>
                          </tr>
                        </table>
                      </td>
                      <td valign="top" style="padding-left:14px;">
                        <p style="margin:0 0 3px;color:#f4f4f5;font-size:15px;font-weight:600;line-height:1.4;">Crea tu calendario de contenido</p>
                        <p style="margin:0;color:#71717a;font-size:13px;line-height:1.6;">Planifica semanas de publicaciones en minutos. Nunca más te quedes sin ideas.</p>
                      </td>
                    </tr>
                  </table>

                  <!-- CTA button (table method = max Outlook compat) -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-bottom:16px;">
                    <tr>
                      <td align="center" bgcolor="#7c3aed"
                          style="background-color:#7c3aed;background-image:linear-gradient(135deg,#7c3aed 0%,#6366f1 100%);border-radius:10px;">
                        <a href="${dashUrl}"
                           style="display:block;padding:17px 32px;color:#ffffff;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;font-weight:700;letter-spacing:0.1px;text-align:center;">
                          Genera tu primera campaña gratis &rarr;
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Urgency line -->
                  <p style="margin:0;text-align:center;color:#52525b;font-size:13px;line-height:1.5;">
                    Tu primera campaña es completamente gratis. Sin tarjeta de crédito.
                  </p>

                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- ── Footer ──────────────────────────────────────────────────────── -->
        <tr>
          <td style="padding:36px 0 0;text-align:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
            <p style="margin:0 0 8px;color:#3f3f46;font-size:13px;line-height:1.6;">
              &copy; ${year} Agenciesos &nbsp;&middot;&nbsp;
              <a href="mailto:agenciesosapp@gmail.com"
                 style="color:#52525b;text-decoration:underline;">agenciesosapp@gmail.com</a>
            </p>
            <p style="margin:0;color:#27272a;font-size:12px;line-height:1.6;">
              Recibiste este email porque creaste una cuenta en Agenciesos.<br />
              Si no fuiste tú, puedes ignorar este mensaje con total seguridad.
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

export async function sendSubscriptionConfirmationEmail(to: string, rawName: string, planLabel: string, priceLabel: string, renewalDate: string): Promise<void> {
  const name = escHtml(rawName)
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY no definida — email de confirmación omitido")
    return
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `Tu suscripción ${planLabel} está activa — Agenciesos`,
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
  <title>Suscripción confirmada</title>
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
                ¡Suscripción activada! 🎉
              </h1>
              <p style="margin:0 0 24px;color:#a1a1aa;font-size:16px;line-height:1.6;">
                Hola, ${name}. Tu suscripción al plan <strong style="color:#ffffff;">${escHtml(planLabel)}</strong> está activa. Ya tienes acceso completo a todas las herramientas de Agenciesos.
              </p>

              <!-- Summary box -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:32px;">
                <tr>
                  <td style="padding:20px 24px;background:#1a1a1a;border-radius:10px;border:1px solid #2a2a2a;">
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="color:#71717a;font-size:13px;padding-bottom:8px;">Plan</td>
                        <td style="color:#ffffff;font-size:14px;font-weight:600;text-align:right;padding-bottom:8px;">${escHtml(planLabel)}</td>
                      </tr>
                      <tr>
                        <td style="color:#71717a;font-size:13px;padding-bottom:8px;border-top:1px solid #2a2a2a;padding-top:8px;">Precio</td>
                        <td style="color:#ffffff;font-size:14px;font-weight:600;text-align:right;border-top:1px solid #2a2a2a;padding-top:8px;">${escHtml(priceLabel)}/mes</td>
                      </tr>
                      <tr>
                        <td style="color:#71717a;font-size:13px;padding-top:8px;border-top:1px solid #2a2a2a;">Próxima renovación</td>
                        <td style="color:#ffffff;font-size:14px;font-weight:600;text-align:right;padding-top:8px;border-top:1px solid #2a2a2a;">${escHtml(renewalDate)}</td>
                      </tr>
                    </table>
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
                Puedes gestionar tu suscripción en cualquier momento desde la configuración de tu cuenta.
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
    console.error("[email] Error enviando confirmación de suscripción a", to, "→", error)
    throw new Error(error.message)
  }
}

export async function sendCancellationEmail(to: string, rawName: string, periodEnd: string): Promise<void> {
  const name = escHtml(rawName)
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY no definida — email de cancelación omitido")
    return
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to: [to],
    subject: "Tu suscripción ha sido cancelada — Agenciesos",
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
  <title>Suscripción cancelada</title>
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
                Suscripción cancelada
              </h1>
              <p style="margin:0 0 24px;color:#a1a1aa;font-size:16px;line-height:1.6;">
                Hola, ${name}. Tu suscripción a Agenciesos ha sido cancelada. Lamentamos verte marchar.
              </p>
              <p style="margin:0 0 32px;color:#a1a1aa;font-size:15px;line-height:1.6;">
                Seguirás teniendo acceso hasta el <strong style="color:#ffffff;">${escHtml(periodEnd)}</strong>. Después de esa fecha tu cuenta pasará al plan gratuito.
              </p>

              <!-- CTA reactivar -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${process.env.FRONTEND_URL ?? "https://agenciesos.com"}/settings"
                       style="display:inline-block;background:linear-gradient(135deg,#a855f7,#6366f1);color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 36px;border-radius:10px;letter-spacing:0.2px;">
                      Reactivar suscripción →
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
                Si tienes alguna pregunta, contáctanos en agenciesosapp@gmail.com.
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
    console.error("[email] Error enviando cancelación a", to, "→", error)
    throw new Error(error.message)
  }
}

export async function sendPaymentFailedEmail(to: string, rawName: string, portalUrl: string): Promise<void> {
  const name    = escHtml(rawName)
  const safeUrl = encodeURI(portalUrl)
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY no definida — email de pago fallido omitido")
    return
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to: [to],
    subject: "Problema con tu pago — Agenciesos",
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
  <title>Problema con tu pago</title>
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
                No hemos podido procesar tu pago
              </h1>
              <p style="margin:0 0 24px;color:#a1a1aa;font-size:16px;line-height:1.6;">
                Hola, ${name}. Hemos intentado cobrar tu suscripción pero el pago no se ha podido completar. Para mantener el acceso a Agenciesos, actualiza tu método de pago lo antes posible.
              </p>

              <!-- Warning box -->
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:32px;">
                <tr>
                  <td style="padding:16px 20px;background:#2a1a1a;border-radius:8px;border-left:3px solid #ef4444;">
                    <span style="color:#fca5a5;font-size:14px;line-height:1.5;">
                      ⚠️ Si no actualizas el método de pago, tu suscripción puede quedar suspendida.
                    </span>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${safeUrl}"
                       style="display:inline-block;background:linear-gradient(135deg,#a855f7,#6366f1);color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 36px;border-radius:10px;letter-spacing:0.2px;">
                      Actualizar método de pago →
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
                Si tienes alguna pregunta, contáctanos en agenciesosapp@gmail.com.
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
    console.error("[email] Error enviando pago fallido a", to, "→", error)
    throw new Error(error.message)
  }
}

export async function sendRenewalReminderEmail(to: string, rawName: string, renewalDate: string, planLabel: string): Promise<void> {
  const name = escHtml(rawName)
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY no definida — email de renovación omitido")
    return
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to: [to],
    subject: "Tu suscripción se renueva en 3 días — Agenciesos",
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
  <title>Renovación próxima</title>
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
                Tu suscripción se renueva pronto
              </h1>
              <p style="margin:0 0 24px;color:#a1a1aa;font-size:16px;line-height:1.6;">
                Hola, ${name}. Te recordamos que tu plan <strong style="color:#ffffff;">${escHtml(planLabel)}</strong> se renovará automáticamente el <strong style="color:#ffffff;">${escHtml(renewalDate)}</strong>.
              </p>
              <p style="margin:0 0 32px;color:#a1a1aa;font-size:15px;line-height:1.6;">
                No necesitas hacer nada si todo está bien. Si deseas cancelar o cambiar tu plan, puedes hacerlo desde la configuración de tu cuenta antes de esa fecha.
              </p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${process.env.FRONTEND_URL ?? "https://agenciesos.com"}/settings"
                       style="display:inline-block;background:linear-gradient(135deg,#a855f7,#6366f1);color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 36px;border-radius:10px;letter-spacing:0.2px;">
                      Gestionar suscripción →
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
                Si tienes alguna pregunta, contáctanos en agenciesosapp@gmail.com.
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
    console.error("[email] Error enviando recordatorio de renovación a", to, "→", error)
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
