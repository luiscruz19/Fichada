import { DataTypes } from 'sequelize';
import sequelize from '../db/sequelize.js';

// Fila única: se lee y se edita el primer registro.
const Setting = sequelize.define('settings', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    default_expected_check_in: {
        type: DataTypes.TIME,
        allowNull: true,
        comment: 'Hora de entrada esperada por defecto'
    },
    work_days: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Días laborales por defecto, ej: ['mon','tue','wed','thu','fri']"
    },
    late_tolerance_minutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Minutos de tolerancia para considerar una llegada como tarde'
    },
    allow_breaks: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Permite al empleado gestionar pausas'
    },
    allow_correction_requests: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Permite al empleado solicitar correcciones'
    },
    reminders_enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Activa los recordatorios push de fichada (entrada/salida)'
    },
    reminder_checkin_start: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 9,
        comment: 'Hora (local) desde la que se recuerda fichar la entrada'
    },
    reminder_checkin_end: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 13,
        comment: 'Hora (local) hasta la que se recuerda fichar la entrada'
    },
    reminder_checkout_start: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 18,
        comment: 'Hora (local) desde la que se recuerda fichar la salida'
    },
    reminder_checkout_end: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 20,
        comment: 'Hora (local) hasta la que se recuerda fichar la salida'
    }
}, {
    tableName: 'settings',
    timestamps: true,
});

export default Setting;
