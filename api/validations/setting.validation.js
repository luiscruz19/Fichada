import { body } from 'express-validator';

export const updateSettingsValidation = [
    body('default_target_hours').optional().isFloat({ min: 0, max: 24 }).withMessage('Horas objetivo no válidas'),
    body('late_tolerance_minutes').optional().isInt({ min: 0 }).withMessage('La tolerancia debe ser un entero positivo'),
    body('rounding_minutes').optional().isInt({ min: 0 }).withMessage('El redondeo debe ser un entero positivo'),
    body('timezone').optional().isString().withMessage('Zona horaria no válida'),
    body('location_required').optional().isBoolean().withMessage('location_required debe ser booleano'),
    body('allow_breaks').optional().isBoolean().withMessage('allow_breaks debe ser booleano'),
    body('allow_correction_requests').optional().isBoolean().withMessage('allow_correction_requests debe ser booleano'),
    body('work_days').optional().isArray().withMessage('work_days debe ser una lista'),
    body('reminders_enabled').optional().isBoolean().withMessage('reminders_enabled debe ser booleano'),
    body('reminder_checkin_start').optional().isInt({ min: 0, max: 23 }).withMessage('Hora de inicio de recordatorio de entrada no válida'),
    body('reminder_checkin_end').optional().isInt({ min: 0, max: 24 }).withMessage('Hora de fin de recordatorio de entrada no válida'),
    body('reminder_checkout_start').optional().isInt({ min: 0, max: 23 }).withMessage('Hora de inicio de recordatorio de salida no válida'),
    body('reminder_checkout_end').optional().isInt({ min: 0, max: 24 }).withMessage('Hora de fin de recordatorio de salida no válida'),
];
