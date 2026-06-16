import CONFIG from '../../config/config.js';

const { AUTH_API_URL, AUTHORIZATION, SECRET_KEY } = CONFIG;
const authBasic = 'Basic ' + Buffer.from(`${AUTHORIZATION.USER}:${AUTHORIZATION.PASSWORD}`).toString('base64');

// Contraseña temporal que cumple la política de auth.
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

/**
 * Regenera la contraseña del empleado en auth (endpoint interno protegido por SECRET_KEY)
 * y devuelve la nueva temporal para que el admin la comparta.
 */
export default async function resetAccess(userId) {
    const tempPassword = genTempPassword();
    const res = await fetch(`${AUTH_API_URL}/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authBasic, token: SECRET_KEY },
        body: JSON.stringify({ user_id: userId, password: tempPassword }),
    });
    if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.message || 'No se pudo regenerar la contraseña');
    }
    return tempPassword;
}
