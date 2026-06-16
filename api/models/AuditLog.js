import { DataTypes } from 'sequelize';
import messages from '../config/messages.js';
import sequelize from '../db/sequelize.js';

/**
 * Auditoría append-only de las correcciones. Cada cambio sobre una fichada (o la
 * resolución de una solicitud) deja un registro con el valor anterior y el nuevo.
 * Nunca se hace UPDATE/DELETE: sólo INSERT. Por eso paranoid:false y sin updatedAt.
 */
const AuditLog = sequelize.define('audit_logs', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
    },
    entity: {
        type: DataTypes.STRING(40),
        allowNull: false,
        validate: {
            notNull: { msg: messages.error.audit_log.fields_empty.entity },
        },
        comment: 'shift | employee | correction_request | device | site | setting'
    },
    entity_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        comment: 'ID de la fila afectada. NULL si la entidad fue hard-deleted antes del log'
    },
    admin_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        comment: 'Admin que ejecutó la acción. NULL si fue automática (cron, sistema)'
    },
    action: {
        type: DataTypes.STRING(40),
        allowNull: false,
        validate: {
            notNull: { msg: messages.error.audit_log.fields_empty.action },
        },
        comment: 'shift_created | shift_updated | shift_deleted | correction_approved | correction_rejected | ...'
    },
    old_values: {
        type: DataTypes.JSON,
        allowNull: true
    },
    new_values: {
        type: DataTypes.JSON,
        allowNull: true
    },
    reason: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    source: {
        type: DataTypes.STRING(40),
        allowNull: false,
        defaultValue: 'admin_panel',
        comment: 'admin_panel | mobile | cron | system'
    }
}, {
    tableName: 'audit_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    paranoid: false,
    indexes: [
        { fields: ['entity'] },
        { fields: ['entity_id'] },
        { fields: ['admin_id'] },
        { fields: ['action'] },
        { fields: ['created_at'] },
    ],
});

export default AuditLog;
