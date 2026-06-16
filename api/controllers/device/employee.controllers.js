import Device from '../../models/Device.js';
import { successMessage, errorMessage } from '../../utils/messages.js';

// ==================== REGISTRAR / ACTIVAR DISPOSITIVO ====================
// Device-binding estricto: la cuenta queda atada al teléfono donde se activó.
// Si hay otro dispositivo activo con distinto uuid, se requiere reactivación del admin.
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
            if (existing.status === 'revoked') {
                return res.status(403).json(errorMessage({
                    message: 'Este dispositivo fue revocado. Contactá al administrador para reactivarlo.'
                }));
            }
            await existing.update({
                platform: platform ?? existing.platform,
                model: model ?? existing.model,
                push_token: push_token ?? existing.push_token,
                last_seen_at: new Date(),
            });
            return res.status(200).json(successMessage({ message: 'Dispositivo ya vinculado', extra: { data: existing } }));
        }

        // ¿Tiene otro dispositivo activo? (binding estricto: uno a la vez)
        const otherActive = await Device.findOne({ where: { employee_id: employeeId, status: 'active' } });
        if (otherActive) {
            return res.status(409).json(errorMessage({
                message: 'Ya tenés un dispositivo vinculado. Requiere reactivación del administrador para cambiarlo.'
            }));
        }

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
