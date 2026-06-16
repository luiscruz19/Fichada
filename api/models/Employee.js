import { DataTypes } from 'sequelize';
import messages from '../config/messages.js';
import sequelize from '../db/sequelize.js';

const Employee = sequelize.define('employees', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'FK al usuario del servicio auth (credenciales/login). El dominio vive acá; las credenciales en auth'
    },
    first_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: { msg: messages.error.employee.fields_empty.first_name },
        },
    },
    last_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: { msg: messages.error.employee.fields_empty.last_name },
        },
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: { msg: messages.error.employee.fields_empty.email },
        },
    },
    role: {
        type: DataTypes.ENUM('admin', 'employee'),
        allowNull: false,
        defaultValue: 'employee',
        validate: {
            notNull: { msg: messages.error.employee.fields_empty.role },
            isIn: {
                args: [['admin', 'employee']],
                msg: messages.generic.invalid_enum_value,
            },
        },
    },
    expected_check_in: {
        type: DataTypes.TIME,
        allowNull: true,
        comment: 'Hora de entrada esperada de esta persona (base para calcular llegada tarde)'
    },
    target_hours: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: true,
        comment: 'Horas objetivo de la jornada de esta persona'
    },
    work_days: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Días laborales, ej: ['mon','tue','wed','thu','fri']"
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
        validate: {
            notNull: { msg: messages.error.employee.fields_empty.status },
            isIn: {
                args: [['active', 'inactive']],
                msg: messages.generic.invalid_enum_value,
            },
        },
        comment: 'active = operativo; inactive = baja'
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
    }
}, {
    tableName: 'employees',
    timestamps: true,
    paranoid: true,
    indexes: [
        { unique: true, fields: ['email'], name: 'employees_email' },
        { fields: ['status'] },
    ],
});

export default Employee;
