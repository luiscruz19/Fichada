import { Router } from 'express';
import { listMyNotifications, markRead } from '../../controllers/notification/employee.controllers.js';
import { validate } from '../../utils/helpers.js';
import { param } from 'express-validator';

const employee = Router();

employee.get('/', listMyNotifications);
employee.patch('/:id/read', validate([param('id').isInt().withMessage('ID no válido')]), markRead);

export default employee;
