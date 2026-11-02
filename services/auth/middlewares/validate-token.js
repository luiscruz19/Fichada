import jwt from 'jsonwebtoken';
import { errorMessage } from '../utils/messages.js';
import getRequestToken from '../utils/request-token.js';
import CONFIG from '../config/config.js';
import messages from '../config/messages.js';

const { generic } = messages;
const { SECRET_KEY } = CONFIG;

export default (req, res, next) => {
    const token = getRequestToken(req);

    if (!token) {
        return res.status(401).json(errorMessage({ message: generic.token_not_found }));
    }

    try {
        const payload = jwt.verify(token, SECRET_KEY, { algorithms: ['HS256'] });

        // jwt.verify acepta tokens sin exp: acá se rechazan.
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = Number(payload.exp ?? payload.expire ?? payload.expiration ?? 0);
        if (!expiresAt || Number.isNaN(expiresAt) || expiresAt <= now) {
            return res.status(401).json(errorMessage({ message: generic.token_expirated }));
        }

        req.user = payload;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json(errorMessage({ message: generic.token_expirated }));
        }
        return res.status(401).json(errorMessage({ message: generic.token_invalid }));
    }
};
