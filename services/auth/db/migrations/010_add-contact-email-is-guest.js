// Idempotent: adds contact_email and is_guest columns if missing (for databases created before 001 included them)
export default {
    async up(queryInterface, DataTypes) {
        const table = await queryInterface.describeTable('users');
        if (!table.contact_email) {
            await queryInterface.addColumn('users', 'contact_email', {
                type: DataTypes.STRING(255),
                allowNull: true,
                defaultValue: null,
            });
        }
        if (!table.is_guest) {
            await queryInterface.addColumn('users', 'is_guest', {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            });
        }
    },
    async down(queryInterface) {
        await queryInterface.removeColumn('users', 'contact_email');
        await queryInterface.removeColumn('users', 'is_guest');
    },
};
