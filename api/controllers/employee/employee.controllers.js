import { successMessage, errorMessage } from '../../utils/messages.js';

// ==================== MI PERFIL (solo lectura) ====================
// El middleware employee-permission ya dejó el registro en req.employee.
export async function getMyProfile(req, res) {
    try {
        return res.status(200).json(successMessage({ extra: { data: req.employee } }));
    } catch (error) {
        return res.status(500).json(errorMessage({
            message: 'Error al obtener el perfil', extra: { error: error.message }
        }));
    }
}
