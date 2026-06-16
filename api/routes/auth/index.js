import { Router } from 'express';
import { login } from '../../controllers/auth/proxy.controllers.js';

// Endpoint público (sin token): proxy de login hacia el servicio auth interno.
const auth = Router();

auth.post('/login', login);

export default auth;
