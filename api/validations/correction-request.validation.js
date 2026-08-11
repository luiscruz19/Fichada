import { body, param } from 'express-validator';

export const createRequestValidation = [
    body('type').notEmpty().withMessage('El tipo es obligatorio').bail()
        .isIn(['edit', 'add']).withMessage('El tipo debe ser "edit" o "add"'),
    // El motivo es opcional. `optional({ values: 'falsy' })` y no `.optional()` a secas:
    // por defecto express-validator solo ignora undefined, y la app manda el campo
    // siempre (aunque sea ''), así que un motivo vacío seguiría dando 400.
    body('reason').optional({ values: 'falsy' })
        .isLength({ max: 500 }).withMessage('El motivo no puede superar los 500 caracteres'),
    body('shift_id').optional().isInt().withMessage('shift_id debe ser un entero'),
    // `values: 'null'` porque el cliente puede mandar la clave en null y la columna lo acepta.
    body('requested_check_in').optional({ values: 'null' }).isISO8601().withMessage('Fecha de entrada no válida'),
    body('requested_check_out').optional({ values: 'null' }).isISO8601().withMessage('Fecha de salida no válida'),
];

export const resolveValidation = [
    param('id').isInt().withMessage('El ID debe ser un número entero'),
    body('resolution_note').optional({ values: 'falsy' })
        .isLength({ max: 500 }).withMessage('La nota no puede superar los 500 caracteres'),
    // El admin puede aprobar con una hora distinta a la que pidió el empleado.
    body('requested_check_in').optional({ values: 'falsy' }).isISO8601().withMessage('Fecha de entrada no válida'),
    body('requested_check_out').optional({ values: 'falsy' }).isISO8601().withMessage('Fecha de salida no válida'),
];
