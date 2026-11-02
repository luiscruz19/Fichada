import test from 'node:test';
import assert from 'node:assert/strict';
import { expectedCheckInMin, hhmmToMin, isPunctual } from '../lib/punctuality.ts';

const NINE = 9 * 60;

test('convierte HH:MM y HH:MM:SS a minutos', () => {
    assert.equal(hhmmToMin('09:30'), 570);
    assert.equal(hhmmToMin('09:30:00'), 570);
    assert.equal(hhmmToMin(null), null);
    assert.equal(hhmmToMin('sin hora'), null);
});

test('sin ajuste usa una tolerancia de 5 minutos', () => {
    assert.equal(isPunctual(NINE + 5, NINE, {}), true);
    assert.equal(isPunctual(NINE + 6, NINE, {}), false);
});

test('aplica la tolerancia configurada', () => {
    assert.equal(isPunctual(NINE + 15, NINE, { toleranceMinutes: 15 }), true);
    assert.equal(isPunctual(NINE + 16, NINE, { toleranceMinutes: 15 }), false);
});

test('una tolerancia de 0 se respeta', () => {
    assert.equal(isPunctual(NINE, NINE, { toleranceMinutes: 0 }), true);
    assert.equal(isPunctual(NINE + 1, NINE, { toleranceMinutes: 0 }), false);
});

test('la entrada propia manda sobre la de defecto', () => {
    const rules = { defaultExpectedCheckIn: '09:30:00' };
    assert.equal(expectedCheckInMin('08:00:00', rules), 480);
});

test('sin entrada propia usa la de defecto', () => {
    assert.equal(expectedCheckInMin(null, { defaultExpectedCheckIn: '09:30:00' }), 570);
});

test('sin ninguna entrada no hay valor esperado', () => {
    assert.equal(expectedCheckInMin(null, {}), null);
});
