import { Router } from 'express';
import validateToken from '../../middlewares/validate-token.js';
import adminPermission from '../../middlewares/admin-permission.js';
import employeePermission from '../../middlewares/employee-permission.js';
import admin from './admin.routes.js';
import employee from './employee.routes.js';

const correctionRequest = Router();

correctionRequest.use('/admin', [validateToken, adminPermission], admin);
correctionRequest.use('/employee', [validateToken, employeePermission], employee);

export default correctionRequest;
