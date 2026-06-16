import { body, param } from 'express-validator';

export const createEmployeeValidation = [
    body('first_name').notEmpty().withMessage('El nombre es obligatorio'),
    body('last_name').notEmpty().withMessage('El apellido es obligatorio'),
    body('email').notEmpty().withMessage('El email es obligatorio').bail()
        .isEmail().withMessage('El email no es válido'),
    body('role').optional().isIn(['admin', 'employee']).withMessage('Rol no válido'),
    body('target_hours').optional().isFloat({ min: 0, max: 24 }).withMessage('Horas objetivo no válidas'),
    body('work_days').optional().isArray().withMessage('work_days debe ser una lista'),
];

export const updateEmployeeValidation = [
    param('id').isInt().withMessage('El ID debe ser un número entero'),
    body('email').optional().isEmail().withMessage('El email no es válido'),
    body('role').optional().isIn(['admin', 'employee']).withMessage('Rol no válido'),
    body('target_hours').optional().isFloat({ min: 0, max: 24 }).withMessage('Horas objetivo no válidas'),
    body('work_days').optional().isArray().withMessage('work_days debe ser una lista'),
];

export const idParamValidation = [
    param('id').isInt().withMessage('El ID debe ser un número entero'),
];
