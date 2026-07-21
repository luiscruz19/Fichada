import Device from '../../models/Device.js';
import { successMessage, errorMessage } from '../../utils/messages.js';

// ==================== REGISTRAR / ACTIVAR DISPOSITIVO ====================
// Binding de "un dispositivo activo por cuenta", con RE-VINCULACIÓN AUTOMÁTICA:
// este endpoint solo se alcanza con un JWT válido (login con email + PIN correcto),
// así que la identidad ya está probada. Si el empleado entra desde un teléfono nuevo
// (p.ej. reinstaló la app → uuid nuevo), se revoca el dispositivo anterior y se activa
// el nuevo automáticamente, sin necesidad de que el admin intervenga. El único caso
// que sigue bloqueado es un uuid ya vinculado a OTRA cuenta.
export async function registerDevice(req, res) {
    try {
        const { device_uuid, platform, model, push_token } = req.body;
        const employeeId = req.employee.id;

        // ¿Ya existe este mismo dispositivo?
        const existing = await Device.findOne({ where: { device_uuid } });
        if (existing) {
            if (existing.employee_id !== employeeId) {
                return res.status(409).json(errorMessage({
                    message: 'Este dispositivo ya está vinculado a otra cuenta.'
                }));
            }
            // Mismo teléfono: lo reactivamos si estaba revocado y actualizamos sus datos.
            await existing.update({
                platform: platform ?? existing.platform,
                model: model ?? existing.model,
                push_token: push_token ?? existing.push_token,
                status: 'active',
                activated_at: existing.status === 'active' ? existing.activated_at : new Date(),
                revoked_at: null,
                revoked_by: null,
                last_seen_at: new Date(),
            });
            return res.status(200).json(successMessage({ message: 'Dispositivo vinculado', extra: { data: existing } }));
        }

        // Teléfono nuevo: revocamos cualquier dispositivo activo anterior de esta cuenta
        // (re-vinculación automática tras login válido) y activamos este.
        await Device.update(
            { status: 'revoked', revoked_at: new Date(), revoked_by: null },
            { where: { employee_id: employeeId, status: 'active' } }
        );

        const device = await Device.create({
            employee_id: employeeId,
            device_uuid,
            platform: platform ?? null,
            model: model ?? null,
            push_token: push_token ?? null,
            status: 'active',
            activated_at: new Date(),
            last_seen_at: new Date(),
        });

        return res.status(201).json(successMessage({ message: 'Dispositivo vinculado', extra: { data: device } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al registrar el dispositivo', extra: { error: error.message }
        }));
    }
}

// ==================== ACTUALIZAR PUSH TOKEN ====================
export async function updatePushToken(req, res) {
    try {
        const { device_uuid, push_token } = req.body;
        const device = await Device.findOne({
            where: { device_uuid, employee_id: req.employee.id, status: 'active' }
        });
        if (!device) return res.status(404).json(errorMessage({ message: 'Dispositivo activo no encontrado' }));

        await device.update({ push_token, last_seen_at: new Date() });
        return res.status(200).json(successMessage({ message: 'Token actualizado', extra: { data: device } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al actualizar el token', extra: { error: error.message }
        }));
    }
}

// ==================== MI DISPOSITIVO ====================
export async function getMyDevice(req, res) {
    try {
        const device = await Device.findOne({
            where: { employee_id: req.employee.id, status: 'active' }
        });
        return res.status(200).json(successMessage({ extra: { data: device } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al obtener el dispositivo', extra: { error: error.message }
        }));
    }
}
