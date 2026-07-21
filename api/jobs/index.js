import scheduleAttendanceReminder from './attendance-reminder.js';

// Permite apagar los jobs (p.ej. en tests) con ENABLE_JOBS=false.
const ENABLE_JOBS = process.env.ENABLE_JOBS !== 'false';

if (ENABLE_JOBS) {
    scheduleAttendanceReminder();
    console.info('Jobs programados: attendance-reminder (recordatorios de entrada/salida)');
}
