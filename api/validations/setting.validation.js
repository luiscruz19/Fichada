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
];
