import { DataTypes } from 'sequelize';
import sequelize from '../db/sequelize.js';

/**
 * Ajustes globales del sistema. Fila única (single-row): se lee/edita el primer registro.
 * Sin horas extra en el MVP (queda fuera de alcance).
 */
const Setting = sequelize.define('settings', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    default_target_hours: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: true,
        comment: 'Jornada por defecto, en horas'
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
    timezone: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'America/Argentina/Buenos_Aires',
        comment: 'Zona horaria del sistema (Argentina, UTC−3)'
    },
    rounding_minutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Redondeo de fichadas al múltiplo de minutos. 0 = desactivado'
    },
    location_required: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Ubicación obligatoria para fichar (sin GPS no se ficha)'
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
    }
}, {
    tableName: 'settings',
    timestamps: true,
});

export default Setting;
