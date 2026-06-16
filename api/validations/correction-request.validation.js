import { body, param } from 'express-validator';

export const createRequestValidation = [
    body('type').notEmpty().withMessage('El tipo es obligatorio').bail()
        .isIn(['edit', 'add']).withMessage('El tipo debe ser "edit" o "add"'),
    body('reason').notEmpty().withMessage('El motivo es obligatorio'),
    body('shift_id').optional().isInt().withMessage('shift_id debe ser un entero'),
    body('requested_check_in').optional().isISO8601().withMessage('Fecha de entrada no válida'),
    body('requested_check_out').optional().isISO8601().withMessage('Fecha de salida no válida'),
];

export const resolveValidation = [
    param('id').isInt().withMessage('El ID debe ser un número entero'),
    body('resolution_note').optional().isString().withMessage('La nota debe ser texto'),
];
