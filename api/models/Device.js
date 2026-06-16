import { DataTypes } from 'sequelize';
import messages from '../config/messages.js';
import sequelize from '../db/sequelize.js';

/**
 * Dispositivo vinculado al empleado (device-binding estricto). La cuenta queda atada
 * al teléfono donde se activó; desde otro requiere reactivación del admin.
 * status = revoked es el kill switch: fuerza el re-login en la próxima apertura.
 * Las credenciales/JWT viven en el servicio auth; acá vive la integridad del dispositivo.
 */
const Device = sequelize.define('devices', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notNull: { msg: messages.error.device.fields_empty.employee_id },
        },
    },
    device_uuid: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: { msg: messages.error.device.fields_empty.device_uuid },
        },
        comment: 'Identificador único del dispositivo'
    },
    platform: {
        type: DataTypes.ENUM('ios', 'android'),
        allowNull: true,
    },
    model: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Modelo del teléfono (informativo)'
    },
    push_token: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Expo push token para notificaciones'
    },
    status: {
        type: DataTypes.ENUM('active', 'revoked'),
        allowNull: false,
        defaultValue: 'active',
        validate: {
            notNull: { msg: messages.error.device.fields_empty.status },
            isIn: {
                args: [['active', 'revoked']],
                msg: messages.generic.invalid_enum_value,
            },
        },
        comment: 'revoked = kill switch del admin'
    },
    last_seen_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    activated_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    revoked_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    revoked_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Admin que ejecutó el kill switch'
    }
}, {
    tableName: 'devices',
    timestamps: true,
    paranoid: true,
    indexes: [
        { fields: ['employee_id'] },
        { unique: true, fields: ['device_uuid'], name: 'devices_device_uuid' },
    ],
});

export default Device;
