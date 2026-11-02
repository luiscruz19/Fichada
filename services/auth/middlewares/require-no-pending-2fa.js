import jwt from 'jsonwebtoken';
import CONFIG from '../config/config.js';
import { errorMessage } from '../utils/messages.js';
import getRequestToken from '../utils/request-token.js';

const { SECRET_KEY } = CONFIG;

export default function requireNoPending2FA(req, res, next) {
    const token = getRequestToken(req);
    if (!token) return next();

    try {
        const decoded = jwt.verify(token, SECRET_KEY, { algorithms: ['HS256'] });
        if (decoded.pending_2fa) {
            return res.status(401).json(errorMessage({ message: 'Debés completar la verificación 2FA' }));
        }
    } catch {
        // Token inválido o vencido: lo resuelve validateToken.
    }

    next();
}
