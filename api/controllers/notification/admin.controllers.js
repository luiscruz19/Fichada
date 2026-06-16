import Notification from '../../models/Notification.js';
import Employee from '../../models/Employee.js';
import { successMessage, errorMessage } from '../../utils/messages.js';

const EMPLOYEE_ATTRS = ['id', 'first_name', 'last_name', 'email'];

// ==================== LISTAR NOTIFICACIONES ====================
export async function listNotifications(req, res) {
    try {
        const { employee_id, type, status } = req.query;
        const where = {};
        if (employee_id) where.employee_id = employee_id;
        if (type) where.type = type;
        if (status) where.status = status;

        const notifications = await Notification.findAll({
            where,
            include: [{ model: Employee, as: 'employee', attributes: EMPLOYEE_ATTRS }],
            order: [['createdAt', 'DESC']],
            limit: 300,
        });
        return res.status(200).json(successMessage({ extra: { data: notifications } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al listar las notificaciones', extra: { error: error.message }
        }));
    }
}
