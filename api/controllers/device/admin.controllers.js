import Device from '../../models/Device.js';
import Employee from '../../models/Employee.js';
import { successMessage, errorMessage } from '../../utils/messages.js';

const EMPLOYEE_ATTRS = ['id', 'first_name', 'last_name', 'email'];

// ==================== LISTAR DISPOSITIVOS ====================
export async function listDevices(req, res) {
    try {
        const { employee_id, status } = req.query;
        const where = {};
        if (employee_id) where.employee_id = employee_id;
        if (status) where.status = status;

        const devices = await Device.findAll({
            where,
            include: [{ model: Employee, as: 'employee', attributes: EMPLOYEE_ATTRS }],
            order: [['updatedAt', 'DESC']],
        });
        return res.status(200).json(successMessage({ extra: { data: devices } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al listar los dispositivos', extra: { error: error.message }
        }));
    }
}

// ==================== REVOCAR (kill switch del dispositivo) ====================
export async function revokeDevice(req, res) {
    try {
        const device = await Device.findByPk(req.params.id);
        if (!device) return res.status(404).json(errorMessage({ message: 'Dispositivo no encontrado' }));

        await device.update({
            status: 'revoked',
            revoked_at: new Date(),
            revoked_by: req.employee?.id ?? null,
        });
        return res.status(200).json(successMessage({ message: 'Dispositivo revocado', extra: { data: device } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al revocar el dispositivo', extra: { error: error.message }
        }));
    }
}

// ==================== REACTIVAR (permite re-vincular) ====================
export async function reactivateDevice(req, res) {
    try {
        const device = await Device.findByPk(req.params.id);
        if (!device) return res.status(404).json(errorMessage({ message: 'Dispositivo no encontrado' }));

        await device.update({ status: 'active', revoked_at: null, revoked_by: null, activated_at: new Date() });
        return res.status(200).json(successMessage({ message: 'Dispositivo reactivado', extra: { data: device } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al reactivar el dispositivo', extra: { error: error.message }
        }));
    }
}
