import test from 'node:test';
import assert from 'node:assert/strict';
import genTempPassword from '../services/employee/temp-password.js';

test('cumple la política de auth y no se repite', () => {
    const passwords = Array.from({ length: 500 }, genTempPassword);

    for (const password of passwords) {
        assert.match(password, /^[A-HJ-NP-Z][a-km-np-z]{5}[2-9]!$/);
    }
    assert.ok(new Set(passwords).size > 490);
});
