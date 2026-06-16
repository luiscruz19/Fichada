import CONFIG from '../config/config.js';

const { APP_NAME, LOGO_URL } = CONFIG;

const CURRENT_YEAR = new Date().getFullYear();
const PRIMARY = '#2563eb';
const LIGHT_BG = '#f8fafc';
const BORDER = '#e2e8f0';
const TEXT_MAIN = '#1e293b';
const TEXT_MUTED = '#64748b';

export default ({ email, link }) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f1f5f9">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;">

          <tr>
            <td bgcolor="${PRIMARY}" style="background-color:${PRIMARY};padding:32px 32px 24px;text-align:center;">
              ${LOGO_URL ? `<img src="${LOGO_URL}" alt="${APP_NAME}" height="44" style="display:block;margin:0 auto 14px;max-height:44px;object-fit:contain;" onerror="this.style.display='none'">` : ''}
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">Activá tu cuenta</h1>
              <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">Acceso al panel de administración de ${APP_NAME}</p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 32px 0;">
              <p style="margin:0 0 16px;font-size:15px;color:${TEXT_MAIN};">Hola,</p>
              <p style="margin:0 0 24px;font-size:14px;color:${TEXT_MUTED};line-height:1.6;">
                Se creó una cuenta de acceso para vos en <strong>${APP_NAME}</strong>.
                Hacé clic en el botón de abajo para activarla.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display:inline-table;">
                      <tr>
                        <td bgcolor="${PRIMARY}" style="background-color:${PRIMARY};border-radius:8px;mso-padding-alt:0;">
                          <a href="${link}" target="_blank" rel="noopener noreferrer"
                             style="display:inline-block;color:#ffffff;text-decoration:none;padding:12px 28px;font-size:14px;font-weight:600;font-family:-apple-system,Arial,sans-serif;">
                            Activar mi cuenta
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="font-size:12px;color:${TEXT_MUTED};text-align:center;margin:0 0 28px;padding-top:20px;border-top:1px solid ${BORDER};">
                Este enlace es válido por 48 horas. Si no esperabas este email, podés ignorarlo.<br>
                <a href="${link}" style="color:${PRIMARY};word-break:break-all;">${link}</a>
              </p>
            </td>
          </tr>

          <tr>
            <td bgcolor="${LIGHT_BG}" style="background-color:${LIGHT_BG};padding:20px;text-align:center;border-top:1px solid ${BORDER};">
              <p style="margin:0;font-size:12px;color:${TEXT_MUTED};">&copy; ${CURRENT_YEAR} ${APP_NAME}. Todos los derechos reservados.</p>
              <p style="margin:6px 0 0;font-size:11px;color:#94a3b8;">Este es un correo automático. Por favor no respondas a este mensaje.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
