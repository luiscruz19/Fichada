import CONFIG from '../../config/config.js';

const { AUTH_API_URL, MAILER_API_URL, AUTHORIZATION, MAILER_AUTH, WEB_URL, ADMIN } = CONFIG;
const authBasic = 'Basic ' + Buffer.from(`${AUTHORIZATION.USER}:${AUTHORIZATION.PASSWORD}`).toString('base64');
const mailerBasic = 'Basic ' + Buffer.from(`${MAILER_AUTH.USER}:${MAILER_AUTH.PASSWORD}`).toString('base64');

// Contraseña temporal que cumple la política de auth (mayúscula, minúscula, dígito, especial).
function genTempPassword() {
    const low = 'abcdefghijkmnpqrstuvwxyz';
    const up = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const dig = '23456789';
    const pick = (s) => s[Math.floor(Math.random() * s.length)];
    let s = pick(up);
    for (let i = 0; i < 5; i++) s += pick(low);
    s += pick(dig);
    return s + '!';
}

function inviteHtml({ firstName, email, tempPassword }) {
    return `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#181b1e">
      <h2 style="color:#26679e">Te invitaron a Fichada</h2>
      <p>Hola ${firstName || ''}, ya podés registrar tu horario con Fichada.</p>
      <p><b>Tus credenciales:</b></p>
      <ul>
        <li>Usuario: <b>${email}</b></li>
        <li>Contraseña temporal: <b>${tempPassword}</b></li>
      </ul>
      <p>Ingresá con esas credenciales y, al abrir la app, vas a crear tu PIN.</p>
      <p style="color:#787a7e;font-size:13px">Si no esperabas esta invitación, ignorá este mensaje.</p>
    </div>`;
}

// Si el mail falla el alta sigue: el admin recibe la contraseña temporal para compartirla.
export default async function inviteEmployee({ first_name, last_name, email }) {
    const tempPassword = genTempPassword();

    // welcome_email: 0 porque la invitación la manda este flujo, no auth.
    const signupRes = await fetch(`${AUTH_API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authBasic },
        body: JSON.stringify({ email, password: tempPassword, verify_password: tempPassword, welcome_email: 0 }),
    });
    const signupJson = await signupRes.json().catch(() => null);
    const userId = signupJson?.user?.id;
    const rememberToken = signupJson?.user?.remember_token;
    if (!signupRes.ok || !userId) {
        const e = new Error(signupJson?.message || 'No se pudo crear el acceso del empleado en auth');
        e.code = 'auth_signup';
        throw e;
    }

    if (rememberToken) {
        await fetch(`${AUTH_API_URL}/auth/validate-account`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: authBasic },
            body: JSON.stringify({ id: userId, token: rememberToken }),
        }).catch(() => { });
    }

    let emailSent = false;
    try {
        const res = await fetch(`${MAILER_API_URL}/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: mailerBasic },
            body: JSON.stringify({
                to: email,
                subject: 'Tu invitación a Fichada',
                content: inviteHtml({ firstName: first_name, email, tempPassword }),
            }),
        });
        emailSent = res.ok;
    } catch {
        emailSent = false;
    }

    return { userId, tempPassword, emailSent };
}
