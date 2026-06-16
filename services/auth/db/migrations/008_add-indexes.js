export async function up(queryInterface) {
    // login_attempts: búsqueda por email+ip (login blocklist)
    await queryInterface.addIndex('login_attempts', ['email', 'ip'], {
        name: 'idx_login_attempts_email_ip', unique: false
    }).catch(() => {});
    // login_attempts: limpieza de registros expirados
    await queryInterface.addIndex('login_attempts', ['updated_at'], {
        name: 'idx_login_attempts_updated_at'
    }).catch(() => {});
    // login_logs: historial de un usuario
    await queryInterface.addIndex('login_logs', ['user_id'], {
        name: 'idx_login_logs_user_id'
    }).catch(() => {});
    await queryInterface.addIndex('login_logs', ['created_at'], {
        name: 'idx_login_logs_created_at'
    }).catch(() => {});
}
export async function down(queryInterface) {
    for (const idx of ['idx_login_attempts_email_ip','idx_login_attempts_updated_at','idx_login_logs_user_id','idx_login_logs_created_at']) {
        await queryInterface.removeIndex(idx.includes('login_attempts') ? 'login_attempts' : 'login_logs', idx).catch(() => {});
    }
}
