import { Router } from 'express';
import {
    currentStatus,
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    myHistory
} from '../../controllers/shift/employee.controllers.js';
import {
    clockInValidation,
    clockOutValidation
} from '../../validations/shift.validation.js';
import { validate } from '../../utils/helpers.js';

const employee = Router();

employee.get('/status', currentStatus);
employee.get('/history', myHistory);
employee.post('/clock-in', validate(clockInValidation), clockIn);
employee.post('/clock-out', validate(clockOutValidation), clockOut);
employee.post('/breaks/start', startBreak);
employee.post('/breaks/end', endBreak);

export default employee;
