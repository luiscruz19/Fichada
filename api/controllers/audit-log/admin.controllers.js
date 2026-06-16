import AuditLog from '../../models/AuditLog.js';
import { successMessage, errorMessage } from '../../utils/messages.js';

// ==================== LISTAR AUDITORÍA (solo lectura) ====================
export async function listAuditLogs(req, res) {
    try {
        const { entity, entity_id, action } = req.query;
        const where = {};
        if (entity) where.entity = entity;
        if (entity_id) where.entity_id = entity_id;
        if (action) where.action = action;

        const logs = await AuditLog.findAll({
            where,
            order: [['created_at', 'DESC']],
            limit: 500,
        });

        return res.status(200).json(successMessage({ extra: { data: logs } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al listar la auditoría', extra: { error: error.message }
        }));
    }
}

// ==================== OBTENER UN REGISTRO ====================
export async function getAuditLog(req, res) {
    try {
        const log = await AuditLog.findByPk(req.params.id);
        if (!log) return res.status(404).json(errorMessage({ message: 'Registro de auditoría no encontrado' }));
        return res.status(200).json(successMessage({ extra: { data: log } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al obtener el registro de auditoría', extra: { error: error.message }
        }));
    }
}
