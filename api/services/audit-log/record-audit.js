import AuditLog from '../../models/AuditLog.js';

// Pasar { transaction } en options: el registro va en la misma transacción que lo auditado.
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
