import { Op } from 'sequelize';
import Shift from '../../models/Shift.js';
import Break from '../../models/Break.js';
import Employee from '../../models/Employee.js';

const TZ = 'America/Argentina/Buenos_Aires';

function fmtDate(d) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('es-AR', { timeZone: TZ });
}
function fmtTime(d) {
    if (!d) return '';
    return new Date(d).toLocaleTimeString('es-AR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
}
function secondsToHHMM(s) {
    if (s == null) return '';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
function loc(lat, lng) {
    if (lat == null || lng == null) return '';
    return `${lat}, ${lng}`;
}

export const REPORT_COLUMNS = [
    { key: 'employee', header: 'Empleado' },
    { key: 'email', header: 'Email' },
    { key: 'date', header: 'Fecha' },
    { key: 'check_in', header: 'Entrada' },
    { key: 'check_out', header: 'Salida' },
    { key: 'breaks', header: 'Pausas' },
    { key: 'worked', header: 'Trabajado' },
    { key: 'status', header: 'Estado' },
    { key: 'check_in_location', header: 'Ubicación entrada' },
    { key: 'check_out_location', header: 'Ubicación salida' },
];

/**
 * Arma las filas del reporte de jornadas según los filtros, listas para exportar.
 */
export default async function buildReportRows({ employee_id, status, from, to } = {}) {
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
            { model: Employee, as: 'employee', attributes: ['id', 'first_name', 'last_name', 'email'] },
            { model: Break, as: 'breaks' },
        ],
        order: [['check_in', 'DESC']],
    });

    return shifts.map(s => {
        const e = s.employee;
        return {
            employee: e ? `${e.last_name}, ${e.first_name}` : `#${s.employee_id}`,
            email: e?.email || '',
            date: fmtDate(s.check_in),
            check_in: fmtTime(s.check_in),
            check_out: fmtTime(s.check_out) || '—',
            breaks: (s.breaks || []).length,
            worked: secondsToHHMM(s.worked_seconds) || '—',
            status: s.status === 'open' ? 'Abierta' : 'Cerrada',
            check_in_location: loc(s.check_in_lat, s.check_in_lng) || '—',
            check_out_location: loc(s.check_out_lat, s.check_out_lng) || '—',
        };
    });
}
