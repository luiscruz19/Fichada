// Idempotent: adds remember_token column if missing (for databases created before 001 included it)
export default {
    async up(queryInterface, DataTypes) {
        const table = await queryInterface.describeTable('users');
        if (!table.remember_token) {
            await queryInterface.addColumn('users', 'remember_token', {
                type: DataTypes.STRING(255),
                allowNull: true,
            });
        }
    },
    async down(queryInterface) {
        await queryInterface.removeColumn('users', 'remember_token');
    },
};
