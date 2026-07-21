import cron from 'node-cron';
import { Op } from 'sequelize';
import Employee from '../models/Employee.js';
import Shift from '../models/Shift.js';
import Setting from '../models/Setting.js';
import Notification from '../models/Notification.js';
import { sendPushToEmployee } from '../services/notification/send-push.js';

// Zona horaria de trabajo. Argentina = UTC−3 fijo (sin horario de verano).
const OFFSET_H = Number(process.env.REMINDER_UTC_OFFSET ?? -3);

// Ventanas horarias (hora local). Recordatorio de ENTRADA por la mañana y de
// SALIDA por la tarde. Configurables por env; defaults = requerimiento del negocio.
const CHECKIN_START = Number(process.env.CHECKIN_REMINDER_START ?? 9);   // 09:00
const CHECKIN_END = Number(process.env.CHECKIN_REMINDER_END ?? 13);      // 13:00
const CHECKOUT_START = Number(process.env.CHECKOUT_REMINDER_START ?? 18); // 18:00
const CHECKOUT_END = Number(process.env.CHECKOUT_REMINDER_END ?? 20);     // 20:00

// Evita reenviar el mismo aviso si el job corre dos veces dentro de la ventana de 30 min.
const DEDUPE_MINUTES = 25;

const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DEFAULT_WORK_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];

// "Reloj local": corre el instante actual al huso configurado y expone sus partes.
function localParts() {
    const shifted = new Date(Date.now() + OFFSET_H * 3600 * 1000);
    return {
        y: shifted.getUTCFullYear(),
        m: shifted.getUTCMonth(),
        d: shifted.getUTCDate(),
        hour: shifted.getUTCHours(),
        min: shifted.getUTCMinutes(),
        dow: shifted.getUTCDay(),
    };
}

// Rango [inicio, fin) del día local de hoy, expresado en UTC (para filtrar check_in).
function todayRangeUtc(p) {
    const startMs = Date.UTC(p.y, p.m, p.d, 0, 0, 0) - OFFSET_H * 3600 * 1000;
    return { start: new Date(startMs), end: new Date(startMs + 24 * 3600 * 1000) };
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

/**
 * Recordatorios de fichada (hora local AR), solo en días laborales:
 *  - ENTRADA  [09:00–13:00): si el empleado no fichó entrada hoy → aviso cada 30 min.
 *  - SALIDA   [18:00–20:00): si tiene una jornada abierta (entrada sin salida) → aviso cada 30 min.
 * En cuanto ficha, deja de recibir el aviso correspondiente.
 */
export async function runAttendanceReminder() {
    const p = localParts();
    const setting = await Setting.findOne();

    // Los horarios y el on/off se configuran en Ajustes; si no hay valor, usamos los
    // defaults del negocio (entrada 09–13, salida 18–20).
    if (setting && setting.reminders_enabled === false) return 0;
    const ciStart = setting?.reminder_checkin_start ?? CHECKIN_START;
    const ciEnd = setting?.reminder_checkin_end ?? CHECKIN_END;
    const coStart = setting?.reminder_checkout_start ?? CHECKOUT_START;
    const coEnd = setting?.reminder_checkout_end ?? CHECKOUT_END;

    const inCheckin = p.hour >= ciStart && p.hour < ciEnd;
    const inCheckout = p.hour >= coStart && p.hour < coEnd;
    if (!inCheckin && !inCheckout) return 0;

    const { start, end } = todayRangeUtc(p);

    const employees = await Employee.findAll({ where: { status: 'active', role: 'employee' } });
    let notified = 0;

    for (const emp of employees) {
        const workDays = emp.work_days || setting?.work_days || null;
        if (!isWorkDay(workDays, p.dow)) continue;

        // Jornadas de hoy de este empleado.
        const todayShifts = await Shift.findAll({
            where: { employee_id: emp.id, check_in: { [Op.gte]: start, [Op.lt]: end } },
        });

        if (inCheckin) {
            const hasCheckin = todayShifts.length > 0;
            if (!hasCheckin) {
                const sent = await notify(
                    emp.id, 'check_in_reminder',
                    'Recordá fichar tu entrada',
                    'Todavía no registraste tu ingreso de hoy.',
                );
                if (sent) notified++;
            }
        } else if (inCheckout) {
            const openShift = todayShifts.find((s) => s.status === 'open' && !s.check_out);
            if (openShift) {
                const sent = await notify(
                    emp.id, 'check_out_reminder',
                    'Recordá fichar tu salida',
                    'Tu jornada sigue abierta. No te olvides de registrar la salida.',
                    { shift_id: openShift.id },
                );
                if (sent) notified++;
            }
        }
    }

    if (notified > 0) console.info(`[attendance-reminder] ${notified} aviso(s) enviados (${p.hour}:${String(p.min).padStart(2, '0')} local)`);
    return notified;
}

export default function scheduleAttendanceReminder() {
    // Cada 30 minutos. La lógica interna decide a quién avisar según la hora local.
    cron.schedule('*/30 * * * *', () => {
        runAttendanceReminder().catch((e) => console.error('[attendance-reminder]', e.message));
    });
}
