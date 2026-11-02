import scheduleAttendanceReminder from './attendance-reminder.js';

const ENABLE_JOBS = process.env.ENABLE_JOBS !== 'false';

if (ENABLE_JOBS) {
    scheduleAttendanceReminder();
    console.info('Jobs programados: attendance-reminder (recordatorios de entrada/salida)');
}
