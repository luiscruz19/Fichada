import CONFIG from '../../config/config.js';
import { errorMessage } from '../../utils/messages.js';

const { AUTH_API_URL, AUTHORIZATION } = CONFIG;
const BASIC = 'Basic ' + Buffer.from(`${AUTHORIZATION.USER}:${AUTHORIZATION.PASSWORD}`).toString('base64');

/**
 * Proxy de login: el cliente (app mobile) pega acá, y el api reenvía a auth con el Basic
 * servicio↔servicio. Así auth queda interno (sin Traefik) y el cliente no embebe credenciales.
 */
export async function login(req, res) {
    try {
        const r = await fetch(`${AUTH_API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: BASIC },
            body: JSON.stringify(req.body || {}),
        });
        const json = await r.json().catch(() => null);
        return res.status(r.status).json(json ?? errorMessage({ message: 'Error de autenticación' }));
    } catch (e) {
        return res.status(502).json(errorMessage({
            message: 'No se pudo contactar al servicio de autenticación',
            extra: { error: e.message },
        }));
    }
}
