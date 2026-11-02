import CONFIG from '../../config/config.js';
import { errorMessage } from '../../utils/messages.js';
import { basicAuth } from '../../utils/basic-auth.js';

const { AUTH_API_URL, AUTHORIZATION } = CONFIG;
const authBasic = basicAuth(AUTHORIZATION);

// auth no se expone: la app entra por acá y no necesita embeber el Basic Auth entre servicios.
export async function login(req, res) {
    try {
        const authRes = await fetch(`${AUTH_API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: authBasic },
            body: JSON.stringify(req.body || {}),
        });
        const json = await authRes.json().catch(() => null);
        return res.status(authRes.status).json(json ?? errorMessage({ message: 'Error de autenticación' }));
    } catch (e) {
        return res.status(502).json(errorMessage({
            message: 'No se pudo contactar al servicio de autenticación',
            extra: { error: e.message },
        }));
    }
}
