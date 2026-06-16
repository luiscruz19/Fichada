import { Router } from 'express';
import {
    listShifts,
    getShift,
    exportShifts
} from '../../controllers/shift/admin.controllers.js';
import { getShiftValidation } from '../../validations/shift.validation.js';
import { validate } from '../../utils/helpers.js';

const admin = Router();

admin.get('/', listShifts);
admin.get('/export', exportShifts);
admin.get('/:id', validate(getShiftValidation), getShift);

export default admin;
