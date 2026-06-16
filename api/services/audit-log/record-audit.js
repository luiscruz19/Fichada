import AuditLog from '../../models/AuditLog.js';

/**
 * Registra una entrada de auditoría (append-only). Pensado para usarse dentro de la
 * misma transacción que la operación auditada: pasar { transaction } en options.
 */
export default async function recordAudit({
    entity,
    entity_id = null,
    admin_id = null,
    action,
    old_values = null,
    new_values = null,
    reason = null,
    source = 'admin_panel',
}, options = {}) {
    return AuditLog.create({
        entity, entity_id, admin_id, action, old_values, new_values, reason, source,
    }, options);
}
