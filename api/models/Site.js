import { DataTypes } from 'sequelize';
import messages from '../config/messages.js';
import sequelize from '../db/sequelize.js';

/**
 * Sede. Catálogo de referencia configurable desde el backoffice (para ubicar en el mapa).
 * En el MVP NO se asignan empleados a una sede ni se valida zona (sin geocerca).
 * radius_meters queda preparado para una eventual geocerca en Fase 2, sin uso actual.
 */
const Site = sequelize.define('sites', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: { msg: messages.error.site.fields_empty.name },
        },
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    lat: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
    },
    lng: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
    },
    radius_meters: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Fase 2 (geocerca). Sin uso en el MVP: no valida zona'
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
        validate: {
            notNull: { msg: messages.error.site.fields_empty.status },
            isIn: {
                args: [['active', 'inactive']],
                msg: messages.generic.invalid_enum_value,
            },
        },
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
    }
}, {
    tableName: 'sites',
    timestamps: true,
    paranoid: true,
});

export default Site;
