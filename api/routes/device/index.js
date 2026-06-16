import { Router } from 'express';
import validateToken from '../../middlewares/validate-token.js';
import adminPermission from '../../middlewares/admin-permission.js';
import employeePermission from '../../middlewares/employee-permission.js';
import admin from './admin.routes.js';
import employee from './employee.routes.js';

const device = Router();

device.use('/admin', [validateToken, adminPermission], admin);
device.use('/employee', [validateToken, employeePermission], employee);

export default device;
