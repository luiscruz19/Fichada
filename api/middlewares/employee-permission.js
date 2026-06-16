import Employee from '../models/Employee.js';
import messages from '../config/messages.js';
import { errorMessage } from '../utils/messages.js';

/**
 * Exige que el usuario del token corresponda a un Employee activo (cualquier rol).
 * Es la puerta de las rutas del empleado (fichaje, historial propio).
 * Deja el registro en req.employee.
 */
export default async (req, res, next) => {
    try {
        const employee = await Employee.findOne({
            where: { user_id: req.user?.id, status: 'active' }
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
