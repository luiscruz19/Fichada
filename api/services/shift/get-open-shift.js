import Shift from '../../models/Shift.js';

/**
 * Devuelve la jornada abierta (status open) del empleado, o null si no tiene.
 * Acepta opciones de Sequelize (include, transaction, etc.).
 */
export default async function getOpenShift(employeeId, options = {}) {
    return Shift.findOne({
        where: { employee_id: employeeId, status: 'open' },
        ...options,
    });
}
