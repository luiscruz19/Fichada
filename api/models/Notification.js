import { DataTypes } from 'sequelize';
import messages from '../config/messages.js';
import sequelize from '../db/sequelize.js';

/**
 * Notificación push al empleado. En el MVP: recordatorio de fichar y aviso de jornada
 * abierta (olvido de salida). Guarda el envío para tener historial e idempotencia.
 */
const Notification = sequelize.define('notifications', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notNull: { msg: messages.error.notification.fields_empty.employee_id },
        },
    },
    type: {
        type: DataTypes.ENUM('check_in_reminder', 'open_shift_alert'),
        allowNull: false,
        validate: {
            notNull: { msg: messages.error.notification.fields_empty.type },
            isIn: {
                args: [['check_in_reminder', 'open_shift_alert']],
                msg: messages.generic.invalid_enum_value,
            },
        },
        comment: 'check_in_reminder = recordatorio de fichar; open_shift_alert = olvido de salida'
    },
    title: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    body: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('pending', 'sent', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
        validate: {
            notNull: { msg: messages.error.notification.fields_empty.status },
            isIn: {
                args: [['pending', 'sent', 'failed']],
                msg: messages.generic.invalid_enum_value,
            },
        },
    },
    sent_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    read_at: {
        type: DataTypes.DATE,
        allowNull: true,
    }
}, {
    tableName: 'notifications',
    timestamps: true,
    paranoid: true,
    indexes: [
        { fields: ['employee_id'] },
        { fields: ['type'] },
        { fields: ['status'] },
    ],
});

export default Notification;
