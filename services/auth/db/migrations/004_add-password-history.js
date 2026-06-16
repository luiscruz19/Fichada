// Idempotent: adds previous_password column if it doesn't exist (for databases created before 001 included it)
export default {
    async up(queryInterface, DataTypes) {
        const table = await queryInterface.describeTable('users');
        if (table.previous_password) return;
        await queryInterface.addColumn('users', 'previous_password', {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null,
        });
    },
    async down(queryInterface) {
        await queryInterface.removeColumn('users', 'previous_password');
    },
};
