import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Tower } from '../src/entities/tower.js';
import { TOWERS, upgradeCost } from '../src/data/towers.js';

const MG = TOWERS.autocannon;
const MG_COST = MG.cost;
const FIRST_UPGRADE = upgradeCost(0);   

function ctx({ wave = 0, state = 'shop' } = {}) {
  return { wave, fsm: { current: state } };
}

test('refunds full price when tower is for the upcoming wave and shop is open', () => {
  const t = Tower({ x: 0, y: 0, type: 'autocannon', waveAdded: 1 });
  assert.equal(t.sellRefund(ctx({ wave: 0, state: 'shop' })), MG_COST);
});

test('refunds 75% once the wave is running', () => {
  const t = Tower({ x: 0, y: 0, type: 'autocannon', waveAdded: 1 });
  assert.equal(
    t.sellRefund(ctx({ wave: 1, state: 'playing' })),
    Math.floor(MG_COST * 0.75)
  );
});

test('refunds 75% when the prep round has moved on', () => {
  const t = Tower({ x: 0, y: 0, type: 'autocannon', waveAdded: 1 });
  assert.equal(
    t.sellRefund(ctx({ wave: 1, state: 'shop' })),
    Math.floor(MG_COST * 0.75)
  );
});

test('full refund includes upgrade cost when sold in same prep round', () => {
  const t = Tower({ x: 0, y: 0, type: 'autocannon', waveAdded: 1 });
  t.applyUpgrade('damage');
  const total = MG_COST + FIRST_UPGRADE;
  assert.equal(t.sellRefund(ctx({ wave: 0, state: 'shop' })), total);
});

test('locked refund includes mixed-path upgrade costs mid-wave', () => {
  const t = Tower({ x: 0, y: 0, type: 'autocannon', waveAdded: 1 });
  t.applyUpgrade('damage');     
  t.applyUpgrade('damage');     
  t.applyUpgrade('fireRate');   
  const total = MG_COST + upgradeCost(0) + upgradeCost(1) + upgradeCost(0);
  assert.equal(t._totalSpent, total);
  assert.equal(
    t.sellRefund(ctx({ wave: 1, state: 'playing' })),
    Math.floor(total * 0.75)
  );
});

test('mid-wave purchases (waveAdded === current wave) refund 75%', () => {
  const t = Tower({ x: 0, y: 0, type: 'autocannon', waveAdded: 2 });
  assert.equal(
    t.sellRefund(ctx({ wave: 2, state: 'playing' })),
    Math.floor(MG_COST * 0.75)
  );
});

test('upgrade tracks are independent and capped at MAX_TIER', () => {
  const t = Tower({ x: 0, y: 0, type: 'autocannon', waveAdded: 1 });
  for (let i = 0; i < 10; i++) t.applyUpgrade('damage');
  assert.equal(t.upgrades.damage, 5);
  assert.equal(t.upgrades.fireRate, 0);
  assert.equal(t.upgrades.reload, 0);
  assert.equal(t.canUpgrade('damage'), false);
  assert.equal(t.canUpgrade('fireRate'), true);
});

test('effective stats reflect each upgrade path', () => {
  const t = Tower({ x: 0, y: 0, type: 'autocannon', waveAdded: 1 });
  assert.equal(t.damage, 1);
  assert.equal(t.fireRate, 4);
  assert.ok(Math.abs(t.reloadTime - 1) < 1e-9);
  t.applyUpgrade('damage');
  assert.equal(t.damage, 2);
  t.applyUpgrade('fireRate');
  assert.equal(t.fireRate, 4.5);
  t.applyUpgrade('reload');
  assert.ok(Math.abs(t.reloadTime - 0.85) < 1e-9);
});
