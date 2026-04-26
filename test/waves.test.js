import { test } from 'node:test';
import assert from 'node:assert/strict';

import { composeWave, totalEnemies } from '../src/systems/waves.js';

test('wave 1: 5 of A1 only', () => {
  const w = composeWave(1);
  assert.deepEqual(w.composition, [{ id: 'A1', count: 5 }]);
  assert.equal(totalEnemies(w.composition), 5);
});

test('wave 10: 50 of A1 only (first cap)', () => {
  const w = composeWave(10);
  assert.deepEqual(w.composition, [{ id: 'A1', count: 50 }]);
});

test('wave 11: 50 A1 + 5 B1 (flying t1 begins)', () => {
  const w = composeWave(11);
  assert.deepEqual(w.composition, [
    { id: 'A1', count: 50 },
    { id: 'B1', count: 5 }
  ]);
});

test('wave 20: 50 A1 + 50 B1', () => {
  const w = composeWave(20);
  assert.deepEqual(w.composition, [
    { id: 'A1', count: 50 },
    { id: 'B1', count: 50 }
  ]);
});

test('wave 21: 50 A1 + 50 B1 + 5 A2 (ground t2 ramps)', () => {
  const w = composeWave(21);
  assert.deepEqual(w.composition, [
    { id: 'A1', count: 50 },
    { id: 'B1', count: 50 },
    { id: 'A2', count: 5 }
  ]);
});

test('wave 31: ground caps + flying t2 begins', () => {
  const w = composeWave(31);
  assert.deepEqual(w.composition, [
    { id: 'A1', count: 50 },
    { id: 'B1', count: 50 },
    { id: 'A2', count: 50 },
    { id: 'B2', count: 5 }
  ]);
});

test('wave 41: ground t3 begins ramp', () => {
  const w = composeWave(41);
  assert.deepEqual(w.composition, [
    { id: 'A1', count: 50 },
    { id: 'B1', count: 50 },
    { id: 'A2', count: 50 },
    { id: 'B2', count: 50 },
    { id: 'A3', count: 5 }
  ]);
});

test('wave 60: every variant capped (last fresh ramp)', () => {
  const w = composeWave(60);
  assert.deepEqual(w.composition, [
    { id: 'A1', count: 50 },
    { id: 'B1', count: 50 },
    { id: 'A2', count: 50 },
    { id: 'B2', count: 50 },
    { id: 'A3', count: 50 },
    { id: 'B3', count: 50 }
  ]);
});

test('wave 61: overflow stacks +5 A1 on top of full caps', () => {
  const w = composeWave(61);
  assert.deepEqual(w.composition, [
    { id: 'A1', count: 55 },
    { id: 'B1', count: 50 },
    { id: 'A2', count: 50 },
    { id: 'B2', count: 50 },
    { id: 'A3', count: 50 },
    { id: 'B3', count: 50 }
  ]);
});

test('wave 65: overflow stacks +25 A1', () => {
  const w = composeWave(65);
  const a1 = w.composition.find(c => c.id === 'A1');
  assert.equal(a1.count, 75);
});

test('counts increase monotonically across the full progression', () => {
  let prev = 0;
  for (let n = 1; n <= 70; n++) {
    const w = composeWave(n);
    const total = totalEnemies(w.composition);
    assert.ok(total >= prev, `wave ${n} total ${total} should be >= ${prev}`);
    prev = total;
  }
});

test('throws on invalid wave number', () => {
  assert.throws(() => composeWave(0));
  assert.throws(() => composeWave(-1));
  assert.throws(() => composeWave(NaN));
});
