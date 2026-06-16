import sequelize from '../../db/sequelize.js';
import CorrectionRequest from '../../models/CorrectionRequest.js';
import Employee from '../../models/Employee.js';
import Shift from '../../models/Shift.js';
import { successMessage, errorMessage } from '../../utils/messages.js';
import applyCorrection from '../../services/correction-request/apply-correction.js';

const EMPLOYEE_ATTRS = ['id', 'first_name', 'last_name', 'email'];

// ==================== LISTAR SOLICITUDES ====================
export async function listRequests(req, res) {
    try {
        const { status, employee_id } = req.query;
        const where = {};
        if (status) where.status = status;
        if (employee_id) where.employee_id = employee_id;

        const requests = await CorrectionRequest.findAll({
            where,
            include: [
                { model: Employee, as: 'employee', attributes: EMPLOYEE_ATTRS },
                { model: Shift, as: 'shift' },
            ],
            order: [['createdAt', 'DESC']],
        });
        return res.status(200).json(successMessage({ extra: { data: requests } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al listar las solicitudes', extra: { error: error.message }
        }));
    }
}

// ==================== APROBAR ====================
export async function approveRequest(req, res) {
    const transaction = await sequelize.transaction();
    try {
        const request = await CorrectionRequest.findByPk(req.params.id, { transaction });
        if (!request) {
            await transaction.rollback();
            return res.status(404).json(errorMessage({ message: 'Solicitud no encontrada' }));
        }
        if (request.status !== 'pending') {
            await transaction.rollback();
            return res.status(409).json(errorMessage({ message: 'La solicitud ya fue resuelta.' }));
        }

        // Aplica el cambio a la jornada y deja la auditoría, en la misma transacción.
        await applyCorrection(request, req.employee?.id ?? null, transaction);

        await request.update({
            status: 'approved',
            resolved_by: req.employee?.id ?? null,
            resolved_at: new Date(),
            resolution_note: req.body?.resolution_note ?? null,
        }, { transaction });

        await transaction.commit();
        return res.status(200).json(successMessage({ message: 'Solicitud aprobada y aplicada', extra: { data: request } }));
    } catch (error) {
        await transaction.rollback();
        return res.status(500).json(errorMessage({
            message: 'Error al aprobar la solicitud', extra: { error: error.message }
        }));
    }
}

// ==================== RECHAZAR ====================
export async function rejectRequest(req, res) {
    try {
        const request = await CorrectionRequest.findByPk(req.params.id);
        if (!request) return res.status(404).json(errorMessage({ message: 'Solicitud no encontrada' }));
        if (request.status !== 'pending') {
            return res.status(409).json(errorMessage({ message: 'La solicitud ya fue resuelta.' }));
        }

        await request.update({
            status: 'rejected',
            resolved_by: req.employee?.id ?? null,
            resolved_at: new Date(),
            resolution_note: req.body?.resolution_note ?? null,
        });

        return res.status(200).json(successMessage({ message: 'Solicitud rechazada', extra: { data: request } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al rechazar la solicitud', extra: { error: error.message }
        }));
    }
}
