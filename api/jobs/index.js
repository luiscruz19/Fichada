import scheduleOpenShiftAlert from './open-shift-alert.js';

// Permite apagar los jobs (p.ej. en tests) con ENABLE_JOBS=false.
const ENABLE_JOBS = process.env.ENABLE_JOBS !== 'false';

if (ENABLE_JOBS) {
    scheduleOpenShiftAlert();
    console.info('Jobs programados: open-shift-alert (jornada abierta)');
}
