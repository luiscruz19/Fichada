import CorrectionRequest from '../../models/CorrectionRequest.js';
import Shift from '../../models/Shift.js';
import Setting from '../../models/Setting.js';
import { successMessage, errorMessage } from '../../utils/messages.js';

// ==================== CREAR SOLICITUD ====================
// El empleado solicita: 'edit' (corregir una jornada existente) o 'add' (alta de jornada faltante).
export async function createRequest(req, res) {
    try {
        const settings = await Setting.findOne({ order: [['id', 'ASC']] });
        if (settings && settings.allow_correction_requests === false) {
            return res.status(403).json(errorMessage({ message: 'Las solicitudes de corrección no están habilitadas.' }));
        }

        const { type, shift_id, requested_check_in, requested_check_out, reason } = req.body;

        if (type === 'edit') {
            if (!shift_id) {
                return res.status(400).json(errorMessage({ message: 'Para corregir hace falta indicar la jornada (shift_id).' }));
            }
            const shift = await Shift.findOne({ where: { id: shift_id, employee_id: req.employee.id } });
            if (!shift) {
                return res.status(404).json(errorMessage({ message: 'Jornada no encontrada o no pertenece al empleado.' }));
            }
            if (requested_check_in == null && requested_check_out == null) {
                return res.status(400).json(errorMessage({ message: 'Indicá al menos un horario a corregir.' }));
            }
        } else if (type === 'add') {
            if (requested_check_in == null) {
                return res.status(400).json(errorMessage({ message: 'Para dar de alta una jornada hace falta la hora de entrada.' }));
            }
        }

        const request = await CorrectionRequest.create({
            employee_id: req.employee.id,
            shift_id: type === 'edit' ? shift_id : null,
            type,
            requested_check_in: requested_check_in ?? null,
            requested_check_out: requested_check_out ?? null,
            reason,
            status: 'pending',
        });

        return res.status(201).json(successMessage({ message: 'Solicitud enviada', extra: { data: request } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al crear la solicitud', extra: { error: error.message }
        }));
    }
}

// ==================== MIS SOLICITUDES ====================
export async function listMyRequests(req, res) {
    try {
        const { status } = req.query;
        const where = { employee_id: req.employee.id };
        if (status) where.status = status;

        const requests = await CorrectionRequest.findAll({ where, order: [['createdAt', 'DESC']] });
        return res.status(200).json(successMessage({ extra: { data: requests } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al obtener las solicitudes', extra: { error: error.message }
        }));
    }
}
