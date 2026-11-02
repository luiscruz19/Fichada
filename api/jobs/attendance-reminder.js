import cron from 'node-cron';
import { Op } from 'sequelize';
import Employee from '../models/Employee.js';
import Shift from '../models/Shift.js';
import Setting from '../models/Setting.js';
import Notification from '../models/Notification.js';
import { sendPushToEmployee } from '../services/notification/send-push.js';

// Argentina es UTC−3 fijo, sin horario de verano.
const OFFSET_H = Number(process.env.REMINDER_UTC_OFFSET ?? -3);

// Horas locales. Se usan solo si Ajustes no define la franja.
const CHECKIN_START = Number(process.env.CHECKIN_REMINDER_START ?? 9);
const CHECKIN_END = Number(process.env.CHECKIN_REMINDER_END ?? 13);
const CHECKOUT_START = Number(process.env.CHECKOUT_REMINDER_START ?? 18);
const CHECKOUT_END = Number(process.env.CHECKOUT_REMINDER_END ?? 20);

// Menor que el intervalo del cron (30 min): no duplica el aviso si el job corre dos veces.
const DEDUPE_MINUTES = 25;
const MS_PER_HOUR = 60 * 60 * 1000;

const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DEFAULT_WORK_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];

function localParts() {
    const shifted = new Date(Date.now() + OFFSET_H * MS_PER_HOUR);
    return {
        y: shifted.getUTCFullYear(),
        m: shifted.getUTCMonth(),
        d: shifted.getUTCDate(),
        hour: shifted.getUTCHours(),
        min: shifted.getUTCMinutes(),
        dow: shifted.getUTCDay(),
    };
}

function todayRangeUtc(local) {
    const startMs = Date.UTC(local.y, local.m, local.d, 0, 0, 0) - OFFSET_H * MS_PER_HOUR;
    return { start: new Date(startMs), end: new Date(startMs + 24 * MS_PER_HOUR) };
}

function isWorkDay(workDays, dow) {
    const days = Array.isArray(workDays) && workDays.length ? workDays : DEFAULT_WORK_DAYS;
    return days.includes(DOW[dow]);
}

async function alreadyNotified(employeeId, type) {
    const since = new Date(Date.now() - DEDUPE_MINUTES * 60 * 1000);
    const recent = await Notification.findOne({
        where: { employee_id: employeeId, type, createdAt: { [Op.gte]: since } },
    });
    return !!recent;
}

async function notify(employeeId, type, title, body, extra = {}) {
    if (await alreadyNotified(employeeId, type)) return false;
    const notif = await Notification.create({ employee_id: employeeId, type, title, body, status: 'pending' });
    const result = await sendPushToEmployee(employeeId, { title, body, data: { type, ...extra } });
    await notif.update({
        status: result.sent ? 'sent' : 'failed',
        sent_at: result.sent ? new Date() : null,
    });
    return true;
}

// Solo en días laborales. El aviso se repite en cada corrida hasta que el empleado ficha.
export async function runAttendanceReminder() {
    const local = localParts();
    const setting = await Setting.findOne();

    if (setting && setting.reminders_enabled === false) return 0;
    const checkinStart = setting?.reminder_checkin_start ?? CHECKIN_START;
    const checkinEnd = setting?.reminder_checkin_end ?? CHECKIN_END;
    const checkoutStart = setting?.reminder_checkout_start ?? CHECKOUT_START;
    const checkoutEnd = setting?.reminder_checkout_end ?? CHECKOUT_END;

    const inCheckin = local.hour >= checkinStart && local.hour < checkinEnd;
    const inCheckout = local.hour >= checkoutStart && local.hour < checkoutEnd;
    if (!inCheckin && !inCheckout) return 0;

    const { start, end } = todayRangeUtc(local);

    const employees = await Employee.findAll({ where: { status: 'active', role: 'employee' } });
    let notified = 0;

    for (const employee of employees) {
        const workDays = employee.work_days || setting?.work_days || null;
        if (!isWorkDay(workDays, local.dow)) continue;

        const todayShifts = await Shift.findAll({
            where: { employee_id: employee.id, check_in: { [Op.gte]: start, [Op.lt]: end } },
        });

        if (inCheckin) {
            if (todayShifts.length > 0) continue;
            const sent = await notify(
                employee.id, 'check_in_reminder',
                'Recordá fichar tu entrada',
                'Todavía no registraste tu ingreso de hoy.',
            );
            if (sent) notified++;
            continue;
        }

        const openShift = todayShifts.find((s) => s.status === 'open' && !s.check_out);
        if (!openShift) continue;
        const sent = await notify(
            employee.id, 'check_out_reminder',
            'Recordá fichar tu salida',
            'Tu jornada sigue abierta. No te olvides de registrar la salida.',
            { shift_id: openShift.id },
        );
        if (sent) notified++;
    }

    if (notified > 0) console.info(`[attendance-reminder] ${notified} aviso(s) enviados (${local.hour}:${String(local.min).padStart(2, '0')} local)`);
    return notified;
}

export default function scheduleAttendanceReminder() {
    cron.schedule('*/30 * * * *', () => {
        runAttendanceReminder().catch((e) => console.error('[attendance-reminder]', e.message));
    });
}
