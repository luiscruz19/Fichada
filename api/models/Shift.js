import { DataTypes } from 'sequelize';
import messages from '../config/messages.js';
import sequelize from '../db/sequelize.js';

/**
 * Jornada / fichada. Una entrada y (opcionalmente) una salida, con sus ubicaciones.
 * Turno partido = varias jornadas cerradas en el mismo día.
 * No se puede abrir una jornada nueva si hay otra abierta del mismo empleado.
 */
const Shift = sequelize.define('shifts', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notNull: { msg: messages.error.shift.fields_empty.employee_id },
        },
    },
    check_in: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
            notNull: { msg: messages.error.shift.fields_empty.check_in },
        },
        comment: 'Sello de tiempo del servidor al fichar entrada (hora oficial)'
    },
    check_out: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Sello del servidor al fichar salida. NULL = jornada abierta'
    },
    check_in_lat: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
        comment: 'Ubicación de la entrada. Obligatoria en el fichaje mobile (se valida en la ruta); NULL en correcciones manuales del admin'
    },
    check_in_lng: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
    },
    check_in_accuracy: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: 'Precisión del GPS en metros al fichar entrada'
    },
    check_out_lat: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
        comment: 'Ubicación de la salida (se completa al cerrar)'
    },
    check_out_lng: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
    },
    check_out_accuracy: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: 'Precisión del GPS en metros al fichar salida'
    },
    worked_seconds: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Tiempo trabajado calculado al cerrar = salida − entrada − suma de pausas'
    },
    note: {
        type: DataTypes.STRING(500),
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('open', 'closed'),
        allowNull: false,
        defaultValue: 'open',
        validate: {
            notNull: { msg: messages.error.shift.fields_empty.status },
            isIn: {
                args: [['open', 'closed']],
                msg: messages.generic.invalid_enum_value,
            },
        },
    },
    origin: {
        type: DataTypes.ENUM('mobile', 'correction'),
        allowNull: false,
        defaultValue: 'mobile',
        validate: {
            notNull: { msg: messages.error.shift.fields_empty.origin },
            isIn: {
                args: [['mobile', 'correction']],
                msg: messages.generic.invalid_enum_value,
            },
        },
        comment: 'mobile = fichaje del empleado; correction = creada/ajustada por una corrección aprobada'
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Admin que la generó cuando origin = correction'
    }
}, {
    tableName: 'shifts',
    timestamps: true,
    paranoid: true,
    indexes: [
        { fields: ['employee_id'] },
        { fields: ['status'] },
        { fields: ['check_in'] },
    ],
});

export default Shift;
