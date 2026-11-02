import Shift from '../../models/Shift.js';

export default async function getOpenShift(employeeId, options = {}) {
    return Shift.findOne({
        where: { employee_id: employeeId, status: 'open' },
        ...options,
    });
}
