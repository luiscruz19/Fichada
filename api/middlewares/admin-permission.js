import Employee from '../models/Employee.js';
import messages from '../config/messages.js';
import { errorMessage } from '../utils/messages.js';

/**
 * Exige que el usuario del token corresponda a un Employee activo con rol admin.
 * Resuelve contra la tabla local (no hay request inter-servicio en el monolito).
 * Deja el registro en req.employee.
 */
export default async (req, res, next) => {
    try {
        const employee = await Employee.findOne({
            where: { user_id: req.user?.id, role: 'admin', status: 'active' }
        });

        if (!employee) {
            return res.status(403).json(errorMessage({ message: messages.generic.autorization_required }));
        }

        req.employee = employee;
        next();
    } catch (e) {
        return res.status(401).json(errorMessage({ message: messages.generic.token_invalid }));
    }
};
