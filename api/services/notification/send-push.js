import Device from '../../models/Device.js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Envía una notificación push a un Expo push token.
 */
export async function sendExpoPush(token, { title, body, data = {} }) {
    if (!token) return { sent: false, reason: 'sin push token' };
    try {
        const res = await fetch(EXPO_PUSH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ to: token, title, body, data, sound: 'default' }),
        });
        const json = await res.json().catch(() => null);
        return { sent: res.ok, response: json };
    } catch (e) {
        return { sent: false, reason: e.message };
    }
}

/**
 * Resuelve el dispositivo activo del empleado y le manda la push.
 */
export async function sendPushToEmployee(employeeId, payload) {
    const device = await Device.findOne({ where: { employee_id: employeeId, status: 'active' } });
    if (!device?.push_token) return { sent: false, reason: 'sin dispositivo activo con token' };
    return sendExpoPush(device.push_token, payload);
}
