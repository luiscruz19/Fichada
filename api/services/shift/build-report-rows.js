import Shift from '../../models/Shift.js';
import Break from '../../models/Break.js';
import Employee from '../../models/Employee.js';
import checkInRange from './check-in-range.js';

export const TZ = 'America/Argentina/Buenos_Aires';

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
function fmtLocation(lat, lng) {
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

export default async function buildReportRows({ employee_id, status, from, to } = {}) {
    const where = { ...checkInRange(from, to) };
    if (employee_id) where.employee_id = employee_id;
    if (status) where.status = status;

    const shifts = await Shift.findAll({
        where,
        include: [
            { model: Employee, as: 'employee', attributes: ['id', 'first_name', 'last_name', 'email'] },
            { model: Break, as: 'breaks' },
        ],
        order: [['check_in', 'DESC']],
    });

    return shifts.map(shift => {
        const { employee } = shift;
        return {
            employee: employee ? `${employee.last_name}, ${employee.first_name}` : `#${shift.employee_id}`,
            email: employee?.email || '',
            date: fmtDate(shift.check_in),
            check_in: fmtTime(shift.check_in),
            check_out: fmtTime(shift.check_out) || '—',
            breaks: (shift.breaks || []).length,
            worked: secondsToHHMM(shift.worked_seconds) || '—',
            status: shift.status === 'open' ? 'Abierta' : 'Cerrada',
            check_in_location: fmtLocation(shift.check_in_lat, shift.check_in_lng) || '—',
            check_out_location: fmtLocation(shift.check_out_lat, shift.check_out_lng) || '—',
        };
    });
}
