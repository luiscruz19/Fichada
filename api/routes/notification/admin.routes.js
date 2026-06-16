import { Router } from 'express';
import { listNotifications } from '../../controllers/notification/admin.controllers.js';

const admin = Router();

admin.get('/', listNotifications);

export default admin;
