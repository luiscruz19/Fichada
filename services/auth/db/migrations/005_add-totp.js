// Idempotent: adds TOTP columns if they don't exist (for databases created before 001 included them)
export default {
    async up(queryInterface, DataTypes) {
        const table = await queryInterface.describeTable('users');
        if (!table.totp_secret) {
            await queryInterface.addColumn('users', 'totp_secret', {
                type: DataTypes.STRING(255),
                allowNull: true,
                defaultValue: null,
            });
        }
        if (!table.totp_enabled) {
            await queryInterface.addColumn('users', 'totp_enabled', {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            });
        }
    },
    async down(queryInterface) {
        await queryInterface.removeColumn('users', 'totp_secret');
        await queryInterface.removeColumn('users', 'totp_enabled');
    },
};
