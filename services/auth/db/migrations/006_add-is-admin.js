// Idempotent: adds is_admin column if it doesn't exist (for databases created before 001 included it)
export default {
    async up(queryInterface, DataTypes) {
        const table = await queryInterface.describeTable('users');
        if (table.is_admin) return;
        await queryInterface.addColumn('users', 'is_admin', {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        });
    },
    async down(queryInterface) {
        await queryInterface.removeColumn('users', 'is_admin');
    },
};
