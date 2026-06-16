import { Router } from 'express';
import { login } from '../../controllers/auth/proxy.controllers.js';
import { setPin, loginPin, hasPin } from '../../controllers/auth/pin.controllers.js';
import validateToken from '../../middlewares/validate-token.js';
import employeePermission from '../../middlewares/employee-permission.js';

const auth = Router();

// Públicos (sin token):
auth.post('/login', login);            // primer ingreso: email + contraseña temporal
auth.post('/login-pin', loginPin);     // ingresos siguientes: email + PIN
auth.get('/has-pin', hasPin);          // ¿el email ya tiene PIN? → la app elige pantalla

// Protegido (JWT del empleado): setear el PIN tras el primer ingreso.
auth.post('/set-pin', [validateToken, employeePermission], setPin);

export default auth;
