import { DataTypes } from 'sequelize';
import messages from '../config/messages.js';
import sequelize from '../db/sequelize.js';

/**
 * Pausa dentro de una jornada (Salir a pausa / Volver). Una jornada puede tener varias.
 * El tiempo de las pausas se descuenta del total trabajado.
 */
const Break = sequelize.define('breaks', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    shift_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notNull: { msg: messages.error.break.fields_empty.shift_id },
        },
    },
    break_start: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
            notNull: { msg: messages.error.break.fields_empty.break_start },
        },
        comment: 'Sello del servidor al salir a pausa'
    },
    break_end: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Sello del servidor al volver. NULL = pausa en curso'
    },
    duration_seconds: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Duración calculada al volver'
    }
}, {
    tableName: 'breaks',
    timestamps: true,
    paranoid: true,
    indexes: [
        { fields: ['shift_id'] },
    ],
});

export default Break;
