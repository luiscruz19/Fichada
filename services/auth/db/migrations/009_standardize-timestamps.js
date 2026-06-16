export default {
    async up(queryInterface, DataTypes) {
        const { sequelize } = queryInterface;

        const hasColumn = async (table, column) => {
            const [[row]] = await sequelize.query(
                `SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
                { replacements: [table, column] }
            );
            return Number(row.cnt) > 0;
        };

        const renameIfExists = async (table, oldName, newName, colDef) => {
            if (await hasColumn(table, oldName) && !(await hasColumn(table, newName))) {
                await sequelize.query(
                    `ALTER TABLE \`${table}\` CHANGE COLUMN \`${oldName}\` \`${newName}\` ${colDef}`
                );
            }
        };

        const addIfMissing = async (table, column, def) => {
            if (!(await hasColumn(table, column))) {
                await queryInterface.addColumn(table, column, def);
            }
        };

        // users
        await renameIfExists('users', 'createdAt', 'created_at', 'DATETIME NULL DEFAULT CURRENT_TIMESTAMP');
        await renameIfExists('users', 'updatedAt', 'updated_at', 'DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
        await addIfMissing('users', 'deleted_at', { type: DataTypes.DATE, allowNull: true, defaultValue: null });

        // login_attempts
        await renameIfExists('login_attempts', 'createdAt', 'created_at', 'DATETIME NULL DEFAULT CURRENT_TIMESTAMP');
        await renameIfExists('login_attempts', 'updatedAt', 'updated_at', 'DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
        await addIfMissing('login_attempts', 'deleted_at', { type: DataTypes.DATE, allowNull: true, defaultValue: null });

        // login_logs — puede no tener updated_at
        await renameIfExists('login_logs', 'createdAt', 'created_at', 'DATETIME NULL DEFAULT CURRENT_TIMESTAMP');
        await renameIfExists('login_logs', 'updatedAt', 'updated_at', 'DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
        await addIfMissing('login_logs', 'updated_at', { type: DataTypes.DATE, allowNull: true, defaultValue: null });
        await addIfMissing('login_logs', 'deleted_at', { type: DataTypes.DATE, allowNull: true, defaultValue: null });
    },

    async down(queryInterface) {
        for (const table of ['users', 'login_attempts', 'login_logs']) {
            await queryInterface.removeColumn(table, 'deleted_at').catch(() => {});
        }
        await queryInterface.removeColumn('login_logs', 'updated_at').catch(() => {});
    },
};
