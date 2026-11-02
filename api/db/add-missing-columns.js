import { DataTypes } from 'sequelize';
import sequelize from './sequelize.js';

// En producción sync no altera tablas existentes: las columnas nuevas se agregan acá.
export default async function addMissingColumns() {
    const queryInterface = sequelize.getQueryInterface();
    const columns = await queryInterface.describeTable('employees');
    if (!columns.tokens_valid_after) {
        await queryInterface.addColumn('employees', 'tokens_valid_after', {
            type: DataTypes.DATE,
            allowNull: true,
        });
    }
}
