import { Router } from 'express';
import validateToken from '../../middlewares/validate-token.js';
import adminPermission from '../../middlewares/admin-permission.js';
import employeePermission from '../../middlewares/employee-permission.js';
import admin from './admin.routes.js';
import employee from './employee.routes.js';

const employeeRouter = Router();

employeeRouter.use('/admin', [validateToken, adminPermission], admin);
employeeRouter.use('/employee', [validateToken, employeePermission], employee);

export default employeeRouter;
