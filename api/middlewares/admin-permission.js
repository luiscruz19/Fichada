import Employee from '../models/Employee.js';
import messages from '../config/messages.js';
import { errorMessage } from '../utils/messages.js';
import isTokenRevoked from '../services/employee/is-token-revoked.js';

export default async (req, res, next) => {
    try {
        const employee = await Employee.findOne({
            where: { user_id: req.user?.id, role: 'admin', status: 'active' }
        });

        if (!employee) {
            return res.status(403).json(errorMessage({ message: messages.generic.autorization_required }));
        }

        if (isTokenRevoked(employee, req.user)) {
            return res.status(401).json(errorMessage({ message: messages.generic.token_invalid }));
        }

        req.employee = employee;
        next();
    } catch (e) {
        return res.status(401).json(errorMessage({ message: messages.generic.token_invalid }));
    }
};
