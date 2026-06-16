import cron from 'node-cron';
import { Op } from 'sequelize';
import Shift from '../models/Shift.js';
import Notification from '../models/Notification.js';
import { sendPushToEmployee } from '../services/notification/send-push.js';

// Horas desde la entrada para considerar la jornada "olvidada".
const OPEN_SHIFT_HOURS = Number(process.env.OPEN_SHIFT_ALERT_HOURS || 12);

/**
 * Busca jornadas abiertas cuya entrada fue hace más de OPEN_SHIFT_HOURS y avisa
 * al empleado (push + registro). Idempotente por ~20h para no repetir el aviso.
 */
export async function runOpenShiftAlert() {
    const threshold = new Date(Date.now() - OPEN_SHIFT_HOURS * 3600 * 1000);
    const openShifts = await Shift.findAll({
        where: { status: 'open', check_in: { [Op.lte]: threshold } },
    });

    let notified = 0;
    for (const shift of openShifts) {
        const since = new Date(Date.now() - 20 * 3600 * 1000);
        const already = await Notification.findOne({
            where: {
                employee_id: shift.employee_id,
                type: 'open_shift_alert',
                createdAt: { [Op.gte]: since },
            },
        });
        if (already) continue;

        const notif = await Notification.create({
            employee_id: shift.employee_id,
            type: 'open_shift_alert',
            title: 'Jornada abierta',
            body: 'Te olvidaste de fichar la salida.',
            status: 'pending',
        });

        const result = await sendPushToEmployee(shift.employee_id, {
            title: notif.title,
            body: notif.body,
            data: { type: 'open_shift_alert', shift_id: shift.id },
        });

        await notif.update({
            status: result.sent ? 'sent' : 'failed',
            sent_at: result.sent ? new Date() : null,
        });
        notified++;
    }

    if (notified > 0) console.info(`[open-shift-alert] ${notified} aviso(s) enviados`);
    return notified;
}

export default function scheduleOpenShiftAlert() {
    // Cada 30 minutos.
    cron.schedule('*/30 * * * *', () => {
        runOpenShiftAlert().catch(e => console.error('[open-shift-alert]', e.message));
    });
}
