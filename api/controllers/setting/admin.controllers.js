import Setting from '../../models/Setting.js';
import { successMessage, errorMessage } from '../../utils/messages.js';

// Devuelve la fila única de ajustes, creándola con los valores por defecto si no existe.
async function getOrCreateSettings() {
    let settings = await Setting.findOne({ order: [['id', 'ASC']] });
    if (!settings) settings = await Setting.create({});
    return settings;
}

// ==================== OBTENER AJUSTES ====================
export async function getSettings(req, res) {
    try {
        const settings = await getOrCreateSettings();
        return res.status(200).json(successMessage({ extra: { data: settings } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al obtener los ajustes', extra: { error: error.message }
        }));
    }
}

// ==================== ACTUALIZAR AJUSTES ====================
export async function updateSettings(req, res) {
    try {
        const settings = await getOrCreateSettings();

        const fields = [
            'default_target_hours', 'default_expected_check_in', 'work_days',
            'late_tolerance_minutes', 'timezone', 'rounding_minutes',
            'location_required', 'allow_breaks', 'allow_correction_requests',
        ];
        const updates = {};
        for (const f of fields) {
            if (req.body[f] !== undefined) updates[f] = req.body[f];
        }

        await settings.update(updates);
        return res.status(200).json(successMessage({ message: 'Ajustes actualizados', extra: { data: settings } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al actualizar los ajustes', extra: { error: error.message }
        }));
    }
}
