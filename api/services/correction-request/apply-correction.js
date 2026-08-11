import Shift from '../../models/Shift.js';
import Break from '../../models/Break.js';
import recordAudit from '../audit-log/record-audit.js';
import computeWorkedSeconds from '../shift/compute-worked-seconds.js';

/**
 * Aplica una solicitud de corrección aprobada, dentro de la transacción dada.
 *  - type 'edit': ajusta la entrada/salida de una jornada existente.
 *  - type 'add':  crea una jornada faltante (origin 'correction', sin ubicación).
 * Deja registro en la auditoría con el valor anterior y el nuevo.
 *
 * `ajustes` permite que el admin apruebe con una hora distinta a la que pidió el empleado:
 * la solicitud original NO se pisa (queda como registro de lo que se pidió) y la auditoría
 * guarda el valor que efectivamente se aplicó.
 */
export default async function applyCorrection(request, adminId, transaction, ajustes = {}) {
    // Motivo del empleado; si no escribió ninguno (ahora es opcional), dejamos rastro igual:
    // la auditoría no puede quedar sin el porqué de un cambio de horas.
    const motivo = (request.reason && request.reason.trim())
        || `Corrección aprobada sin motivo (solicitud #${request.id})`;

    if (request.type === 'add') {
        const checkIn = ajustes.check_in ?? request.requested_check_in;
        const checkOut = ajustes.check_out ?? request.requested_check_out ?? null;
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
            reason: motivo,
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
    const pedidoIn = ajustes.check_in ?? request.requested_check_in;
    const pedidoOut = ajustes.check_out ?? request.requested_check_out;
    if (pedidoIn != null) updates.check_in = pedidoIn;
    if (pedidoOut != null) updates.check_out = pedidoOut;

    const newCheckIn = updates.check_in ?? shift.check_in;
    const newCheckOut = updates.check_out ?? shift.check_out;
    if (newCheckOut) {
        // Las pausas de la jornada se descuentan igual que al fichar la salida: sin esto,
        // aprobar una corrección sobre una jornada con pausas infla las horas trabajadas.
        const breaks = await Break.findAll({ where: { shift_id: shift.id }, transaction });
        updates.worked_seconds = computeWorkedSeconds(newCheckIn, newCheckOut, breaks);
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
        reason: motivo,
        source: 'admin_panel',
    }, { transaction });

    return shift;
}
