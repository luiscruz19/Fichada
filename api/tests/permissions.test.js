import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import Employee from '../models/Employee.js';
import employeePermission from '../middlewares/employee-permission.js';
import adminPermission from '../middlewares/admin-permission.js';

const CUT = new Date('2026-11-02T12:00:00Z');
const BEFORE_CUT = Math.floor(CUT.getTime() / 1000) - 60;
const AFTER_CUT = Math.floor(CUT.getTime() / 1000) + 60;

function run(middleware, user) {
    return new Promise((resolve) => {
        const res = {
            status(code) {
                return { json: (body) => resolve({ code, body }) };
            },
        };
        const req = { user };
        middleware(req, res, () => resolve({ next: true, employee: req.employee }));
    });
}

for (const [name, middleware] of [['empleado', employeePermission], ['admin', adminPermission]]) {
    test(`${name}: rechaza con 401 un token emitido antes de revocar la sesión`, async (t) => {
        t.after(() => mock.restoreAll());
        mock.method(Employee, 'findOne', async () => ({ id: 1, tokens_valid_after: CUT }));

        const result = await run(middleware, { id: 7, iat: BEFORE_CUT });

        assert.equal(result.code, 401);
        assert.equal(result.next, undefined);
    });

    test(`${name}: deja pasar un token emitido después de revocar la sesión`, async (t) => {
        t.after(() => mock.restoreAll());
        const employee = { id: 1, tokens_valid_after: CUT };
        mock.method(Employee, 'findOne', async () => employee);

        const result = await run(middleware, { id: 7, iat: AFTER_CUT });

        assert.equal(result.next, true);
        assert.equal(result.employee, employee);
    });

    test(`${name}: rechaza con 403 si no encuentra al empleado activo`, async (t) => {
        t.after(() => mock.restoreAll());
        mock.method(Employee, 'findOne', async () => null);

        const result = await run(middleware, { id: 7, iat: AFTER_CUT });

        assert.equal(result.code, 403);
    });
}
