import { DataTypes } from 'sequelize';
import messages from '../config/messages.js';
import sequelize from '../db/sequelize.js';

// El admin nunca corrige de oficio: todo cambio nace de una solicitud del empleado.
const CorrectionRequest = sequelize.define('correction_requests', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notNull: { msg: messages.error.correction_request.fields_empty.employee_id },
        },
    },
    shift_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Jornada a corregir. NULL cuando es alta de una jornada faltante (type = add)'
    },
    type: {
        type: DataTypes.ENUM('edit', 'add'),
        allowNull: false,
        defaultValue: 'edit',
        validate: {
            notNull: { msg: messages.error.correction_request.fields_empty.type },
            isIn: {
                args: [['edit', 'add']],
                msg: messages.generic.invalid_enum_value,
            },
        },
        comment: 'edit = corregir jornada existente; add = alta de jornada faltante'
    },
    requested_check_in: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Hora de entrada solicitada'
    },
    requested_check_out: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Hora de salida solicitada'
    },
    reason: {
        type: DataTypes.STRING(500),
        // Opcional: el admin decide con la jornada y la hora pedidas.
        allowNull: true,
        validate: {
            // len hace que un texto largo salga como 400 y no como 500 desde MySQL.
            len: { args: [0, 500], msg: messages.error.correction_request.fields_empty.reason },
        },
        comment: 'Motivo que escribe el empleado (opcional)'
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
        validate: {
            notNull: { msg: messages.error.correction_request.fields_empty.status },
            isIn: {
                args: [['pending', 'approved', 'rejected']],
                msg: messages.generic.invalid_enum_value,
            },
        },
    },
    resolved_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Admin que aprobó/rechazó'
    },
    resolved_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    resolution_note: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'Nota del admin al resolver'
    }
}, {
    tableName: 'correction_requests',
    timestamps: true,
    paranoid: true,
    indexes: [
        { fields: ['employee_id'] },
        { fields: ['shift_id'] },
        { fields: ['status'] },
    ],
});

export default CorrectionRequest;
