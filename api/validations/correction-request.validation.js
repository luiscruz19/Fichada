import { body, param } from 'express-validator';

export const createRequestValidation = [
    body('type').notEmpty().withMessage('El tipo es obligatorio').bail()
        .isIn(['edit', 'add']).withMessage('El tipo debe ser "edit" o "add"'),
    // 'falsy' y no .optional() a secas: la app manda siempre el campo y '' daría 400.
    body('reason').optional({ values: 'falsy' })
        .isLength({ max: 500 }).withMessage('El motivo no puede superar los 500 caracteres'),
    body('shift_id').optional().isInt().withMessage('shift_id debe ser un entero'),
    // 'null': el cliente puede mandar la clave en null y la columna lo acepta.
    body('requested_check_in').optional({ values: 'null' }).isISO8601().withMessage('Fecha de entrada no válida'),
    body('requested_check_out').optional({ values: 'null' }).isISO8601().withMessage('Fecha de salida no válida'),
];

export const resolveValidation = [
    param('id').isInt().withMessage('El ID debe ser un número entero'),
    body('resolution_note').optional({ values: 'falsy' })
        .isLength({ max: 500 }).withMessage('La nota no puede superar los 500 caracteres'),
    body('requested_check_in').optional({ values: 'falsy' }).isISO8601().withMessage('Fecha de entrada no válida'),
    body('requested_check_out').optional({ values: 'falsy' }).isISO8601().withMessage('Fecha de salida no válida'),
];
