import { Op } from 'sequelize';
import sequelize from '../../db/sequelize.js';
import Shift from '../../models/Shift.js';
import Break from '../../models/Break.js';
import Setting from '../../models/Setting.js';
import { successMessage, errorMessage } from '../../utils/messages.js';
import getOpenShift from '../../services/shift/get-open-shift.js';
import computeWorkedSeconds from '../../services/shift/compute-worked-seconds.js';

// Ajustes globales (fila única). Devuelve null si todavía no se configuró.
async function getSettings(options = {}) {
    return Setting.findOne({ order: [['id', 'ASC']], ...options });
}

// ==================== ESTADO ACTUAL ====================
export async function currentStatus(req, res) {
    try {
        const open = await getOpenShift(req.employee.id, {
            include: [{ model: Break, as: 'breaks' }],
        });

        if (!open) {
            return res.status(200).json(successMessage({
                extra: { data: { status: 'out', shift: null } }
            }));
        }

        const onBreak = (open.breaks || []).some(b => !b.break_end);
        return res.status(200).json(successMessage({
            extra: { data: { status: onBreak ? 'on_break' : 'in', shift: open } }
        }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al obtener el estado actual',
            extra: { error: error.message }
        }));
    }
}

// ==================== FICHAR ENTRADA ====================
export async function clockIn(req, res) {
    const transaction = await sequelize.transaction();
    try {
        // No se puede abrir una jornada nueva si ya hay otra abierta.
        const open = await getOpenShift(req.employee.id, { transaction });
        if (open) {
            await transaction.rollback();
            return res.status(409).json(errorMessage({
                message: 'Ya tenés una jornada abierta. Cerrala antes de fichar una nueva entrada.'
            }));
        }

        const { lat, lng, accuracy } = req.body;

        const shift = await Shift.create({
            employee_id: req.employee.id,
            check_in: new Date(),            // hora oficial del servidor
            check_in_lat: lat,
            check_in_lng: lng,
            check_in_accuracy: accuracy ?? null,
            status: 'open',
            origin: 'mobile',
        }, { transaction });

        await transaction.commit();
        return res.status(201).json(successMessage({
            message: 'Entrada registrada',
            extra: { data: shift }
        }));
    } catch (error) {
        await transaction.rollback();
        return res.status(500).json(errorMessage({
            message: 'Error al fichar entrada',
            extra: { error: error.message }
        }));
    }
}

// ==================== FICHAR SALIDA ====================
export async function clockOut(req, res) {
    const transaction = await sequelize.transaction();
    try {
        const open = await getOpenShift(req.employee.id, {
            include: [{ model: Break, as: 'breaks' }],
            transaction,
        });
        if (!open) {
            await transaction.rollback();
            return res.status(409).json(errorMessage({
                message: 'No tenés ninguna jornada abierta.'
            }));
        }

        const onBreak = (open.breaks || []).some(b => !b.break_end);
        if (onBreak) {
            await transaction.rollback();
            return res.status(409).json(errorMessage({
                message: 'Tenés una pausa en curso. Volvé de la pausa antes de fichar salida.'
            }));
        }

        const { lat, lng, accuracy } = req.body;
        const checkOut = new Date();
        const worked = computeWorkedSeconds(open.check_in, checkOut, open.breaks || []);

        await open.update({
            check_out: checkOut,
            check_out_lat: lat,
            check_out_lng: lng,
            check_out_accuracy: accuracy ?? null,
            worked_seconds: worked,
            status: 'closed',
        }, { transaction });

        await transaction.commit();
        return res.status(200).json(successMessage({
            message: 'Salida registrada',
            extra: { data: open }
        }));
    } catch (error) {
        await transaction.rollback();
        return res.status(500).json(errorMessage({
            message: 'Error al fichar salida',
            extra: { error: error.message }
        }));
    }
}

// ==================== SALIR A PAUSA ====================
export async function startBreak(req, res) {
    const transaction = await sequelize.transaction();
    try {
        const settings = await getSettings({ transaction });
        if (settings && settings.allow_breaks === false) {
            await transaction.rollback();
            return res.status(403).json(errorMessage({
                message: 'Las pausas no están habilitadas.'
            }));
        }

        const open = await getOpenShift(req.employee.id, {
            include: [{ model: Break, as: 'breaks' }],
            transaction,
        });
        if (!open) {
            await transaction.rollback();
            return res.status(409).json(errorMessage({
                message: 'No tenés ninguna jornada abierta.'
            }));
        }

        const onBreak = (open.breaks || []).some(b => !b.break_end);
        if (onBreak) {
            await transaction.rollback();
            return res.status(409).json(errorMessage({
                message: 'Ya tenés una pausa en curso.'
            }));
        }

        const br = await Break.create({
            shift_id: open.id,
            break_start: new Date(),
        }, { transaction });

        await transaction.commit();
        return res.status(201).json(successMessage({
            message: 'Pausa iniciada',
            extra: { data: br }
        }));
    } catch (error) {
        await transaction.rollback();
        return res.status(500).json(errorMessage({
            message: 'Error al iniciar la pausa',
            extra: { error: error.message }
        }));
    }
}

// ==================== VOLVER DE PAUSA ====================
export async function endBreak(req, res) {
    const transaction = await sequelize.transaction();
    try {
        const open = await getOpenShift(req.employee.id, { transaction });
        if (!open) {
            await transaction.rollback();
            return res.status(409).json(errorMessage({
                message: 'No tenés ninguna jornada abierta.'
            }));
        }

        const br = await Break.findOne({
            where: { shift_id: open.id, break_end: null },
            transaction,
        });
        if (!br) {
            await transaction.rollback();
            return res.status(409).json(errorMessage({
                message: 'No tenés ninguna pausa en curso.'
            }));
        }

        const end = new Date();
        const duration = Math.max(0, Math.floor((end - new Date(br.break_start)) / 1000));

        await br.update({ break_end: end, duration_seconds: duration }, { transaction });

        await transaction.commit();
        return res.status(200).json(successMessage({
            message: 'Pausa finalizada',
            extra: { data: br }
        }));
    } catch (error) {
        await transaction.rollback();
        return res.status(500).json(errorMessage({
            message: 'Error al finalizar la pausa',
            extra: { error: error.message }
        }));
    }
}

// ==================== MI HISTORIAL (solo lectura) ====================
export async function myHistory(req, res) {
    try {
        const { from, to } = req.query;
        const where = { employee_id: req.employee.id };

        if (from || to) {
            where.check_in = {};
            if (from) where.check_in[Op.gte] = new Date(from);
            if (to) where.check_in[Op.lte] = new Date(to);
        }

        const shifts = await Shift.findAll({
            where,
            include: [{ model: Break, as: 'breaks' }],
            order: [['check_in', 'DESC']],
        });

        return res.status(200).json(successMessage({ extra: { data: shifts } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al obtener el historial',
            extra: { error: error.message }
        }));
    }
}
