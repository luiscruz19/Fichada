import CONFIG from '../../config/config.js';
import { basicAuth } from '../../utils/basic-auth.js';
import genTempPassword from './temp-password.js';

const { AUTH_API_URL, AUTHORIZATION, SECRET_KEY } = CONFIG;
const authBasic = basicAuth(AUTHORIZATION);

export default async function resetAccess(userId) {
    const tempPassword = genTempPassword();
    const res = await fetch(`${AUTH_API_URL}/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: authBasic, token: SECRET_KEY },
        body: JSON.stringify({ user_id: userId, password: tempPassword }),
    });
    if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.message || 'No se pudo regenerar la contraseña');
    }
    return tempPassword;
}
