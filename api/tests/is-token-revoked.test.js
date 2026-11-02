import test from 'node:test';
import assert from 'node:assert/strict';
import isTokenRevoked from '../services/employee/is-token-revoked.js';

const CUT = new Date('2026-11-02T12:00:00Z');
const seconds = (date) => Math.floor(date.getTime() / 1000);

test('sin corte, ningún token está revocado', () => {
    assert.equal(isTokenRevoked({ tokens_valid_after: null }, { iat: 1 }), false);
});

test('un token emitido antes del corte está revocado', () => {
    const iat = seconds(CUT) - 1;
    assert.equal(isTokenRevoked({ tokens_valid_after: CUT }, { iat }), true);
});

test('un token emitido en el segundo del corte sigue valiendo', () => {
    assert.equal(isTokenRevoked({ tokens_valid_after: CUT }, { iat: seconds(CUT) }), false);
});

test('un token posterior al corte sigue valiendo', () => {
    const iat = seconds(CUT) + 60;
    assert.equal(isTokenRevoked({ tokens_valid_after: CUT }, { iat }), false);
});

test('un token sin iat se considera revocado si hay corte', () => {
    assert.equal(isTokenRevoked({ tokens_valid_after: CUT }, {}), true);
});
