import { Router } from 'express';
import validateToken from '../../middlewares/validate-token.js';
import adminPermission from '../../middlewares/admin-permission.js';
import admin from './admin.routes.js';

const site = Router();

// Catálogo de sedes: solo administración.
site.use('/admin', [validateToken, adminPermission], admin);

export default site;
