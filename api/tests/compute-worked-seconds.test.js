import test from 'node:test';
import assert from 'node:assert/strict';
import computeWorkedSeconds from '../services/shift/compute-worked-seconds.js';

const IN = '2026-11-02T12:00:00Z';
const OUT = '2026-11-02T20:00:00Z';

test('sin pausas devuelve la jornada completa', () => {
    assert.equal(computeWorkedSeconds(IN, OUT), 8 * 3600);
});

test('descuenta la duración de las pausas', () => {
    const breaks = [{ duration_seconds: 1800 }, { duration_seconds: 900 }];
    assert.equal(computeWorkedSeconds(IN, OUT, breaks), 8 * 3600 - 2700);
});

test('una pausa sin duración, todavía abierta, no descuenta', () => {
    assert.equal(computeWorkedSeconds(IN, OUT, [{ duration_seconds: null }]), 8 * 3600);
});

test('nunca devuelve un valor negativo', () => {
    assert.equal(computeWorkedSeconds(IN, IN, [{ duration_seconds: 60 }]), 0);
});
