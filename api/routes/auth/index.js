import { Router } from 'express';
import { login } from '../../controllers/auth/proxy.controllers.js';
import { setPin, loginPin, hasPin } from '../../controllers/auth/pin.controllers.js';
import validateToken from '../../middlewares/validate-token.js';
import employeePermission from '../../middlewares/employee-permission.js';

const auth = Router();

auth.post('/login', login);
auth.post('/login-pin', loginPin);
auth.get('/has-pin', hasPin);
auth.post('/set-pin', [validateToken, employeePermission], setPin);

export default auth;
