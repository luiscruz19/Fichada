import { Op } from 'sequelize';
import Shift from '../../models/Shift.js';
import Break from '../../models/Break.js';
import Employee from '../../models/Employee.js';
import { successMessage, errorMessage } from '../../utils/messages.js';
import buildReportRows from '../../services/shift/build-report-rows.js';
import { toCsv, toXlsx, toPdf } from '../../services/shift/exporters.js';

const EMPLOYEE_ATTRS = ['id', 'first_name', 'last_name', 'email', 'expected_check_in', 'target_hours'];

// ==================== LISTAR JORNADAS ====================
export async function listShifts(req, res) {
    try {
        const { employee_id, status, from, to } = req.query;
        const where = {};

        if (employee_id) where.employee_id = employee_id;
        if (status) where.status = status;
        if (from || to) {
            where.check_in = {};
            if (from) where.check_in[Op.gte] = new Date(from);
            if (to) where.check_in[Op.lte] = new Date(to);
        }

        const shifts = await Shift.findAll({
            where,
            include: [
                { model: Employee, as: 'employee', attributes: EMPLOYEE_ATTRS },
                { model: Break, as: 'breaks' },
            ],
            order: [['check_in', 'DESC']],
        });

        return res.status(200).json(successMessage({ extra: { data: shifts } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al listar las jornadas',
            extra: { error: error.message }
        }));
    }
}

// ==================== OBTENER UNA JORNADA ====================
export async function getShift(req, res) {
    try {
        const { id } = req.params;

        const shift = await Shift.findByPk(id, {
            include: [
                { model: Employee, as: 'employee', attributes: EMPLOYEE_ATTRS },
                { model: Break, as: 'breaks' },
            ],
        });

        if (!shift) {
            return res.status(404).json(errorMessage({ message: 'Jornada no encontrada' }));
        }

        return res.status(200).json(successMessage({ extra: { data: shift } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al obtener la jornada',
            extra: { error: error.message }
        }));
    }
}

// ==================== EXPORTAR (CSV / Excel / PDF) ====================
export async function exportShifts(req, res) {
    try {
        const { format = 'csv', employee_id, status, from, to } = req.query;
        const rows = await buildReportRows({ employee_id, status, from, to });
        const stamp = new Date().toISOString().slice(0, 10);

        if (format === 'xlsx' || format === 'excel') {
            const buffer = await toXlsx(rows);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="jornadas-${stamp}.xlsx"`);
            return res.status(200).send(Buffer.from(buffer));
        }

        if (format === 'pdf') {
            const buffer = await toPdf(rows);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="jornadas-${stamp}.pdf"`);
            return res.status(200).send(buffer);
        }

        // por defecto CSV
        const csv = toCsv(rows);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="jornadas-${stamp}.csv"`);
        return res.status(200).send(csv);
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al exportar las jornadas',
            extra: { error: error.message }
        }));
    }
}
