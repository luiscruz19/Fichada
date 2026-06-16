// Idempotent: adds verified column if missing (for databases created before 001 included it)
export default {
    async up(queryInterface, DataTypes) {
        const table = await queryInterface.describeTable('users');
        if (!table.verified) {
            await queryInterface.addColumn('users', 'verified', {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            });
        }
    },
    async down(queryInterface) {
        await queryInterface.removeColumn('users', 'verified');
    },
};
