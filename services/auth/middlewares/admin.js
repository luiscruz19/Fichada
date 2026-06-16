import User from '../models/User.js';
import { errorMessage } from '../utils/messages.js';

export default async function requireAdmin(req, res, next) {
    try {
        const user = await User.findByPk(req.user?.id);
        if (!user?.is_admin) {
            return res.status(403).json(errorMessage({ message: 'Acceso denegado' }));
        }
        next();
    } catch {
        return res.status(403).json(errorMessage({ message: 'Acceso denegado' }));
    }
}
