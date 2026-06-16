import Shift from '../../models/Shift.js';
import recordAudit from '../audit-log/record-audit.js';
import computeWorkedSeconds from '../shift/compute-worked-seconds.js';

/**
 * Aplica una solicitud de corrección aprobada, dentro de la transacción dada.
 *  - type 'edit': ajusta la entrada/salida de una jornada existente.
 *  - type 'add':  crea una jornada faltante (origin 'correction', sin ubicación).
 * Deja registro en la auditoría con el valor anterior y el nuevo.
 */
export default async function applyCorrection(request, adminId, transaction) {
    if (request.type === 'add') {
        const checkIn = request.requested_check_in;
        const checkOut = request.requested_check_out ?? null;
        const worked = checkOut ? computeWorkedSeconds(checkIn, checkOut, []) : null;

        const shift = await Shift.create({
            employee_id: request.employee_id,
            check_in: checkIn,
            check_out: checkOut,
            worked_seconds: worked,
            status: checkOut ? 'closed' : 'open',
            origin: 'correction',
            created_by: adminId,
        }, { transaction });

        await recordAudit({
            entity: 'shift',
            entity_id: shift.id,
            admin_id: adminId,
            action: 'shift_created',
            old_values: null,
            new_values: { check_in: shift.check_in, check_out: shift.check_out },
            reason: request.reason,
            source: 'admin_panel',
        }, { transaction });

        return shift;
    }

    // type 'edit'
    const shift = await Shift.findByPk(request.shift_id, { transaction });
    if (!shift) {
        throw new Error('La jornada a corregir no existe');
    }

    const old_values = { check_in: shift.check_in, check_out: shift.check_out, worked_seconds: shift.worked_seconds };

    const updates = {};
    if (request.requested_check_in != null) updates.check_in = request.requested_check_in;
    if (request.requested_check_out != null) updates.check_out = request.requested_check_out;

    const newCheckIn = updates.check_in ?? shift.check_in;
    const newCheckOut = updates.check_out ?? shift.check_out;
    if (newCheckOut) {
        updates.worked_seconds = computeWorkedSeconds(newCheckIn, newCheckOut, []);
        updates.status = 'closed';
    }

    await shift.update(updates, { transaction });

    await recordAudit({
        entity: 'shift',
        entity_id: shift.id,
        admin_id: adminId,
        action: 'shift_updated',
        old_values,
        new_values: { check_in: shift.check_in, check_out: shift.check_out, worked_seconds: shift.worked_seconds },
        reason: request.reason,
        source: 'admin_panel',
    }, { transaction });

    return shift;
}
