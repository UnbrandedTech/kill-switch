import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createPath, isPolylineClearOf, countSelfIntersections } from '../src/systems/path.js';
import {
  CANVAS_W, TILE_SIZE,
  PLAYFIELD_TOP, PLAYFIELD_BOTTOM, PLAYFIELD_CENTER_Y,
  HOME_BASES, homeBaseFor
} from '../src/config.js';

function rngFromSeed(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test('homeBaseFor cycles bottom → left → top → right', () => {
  assert.equal(homeBaseFor(1).edge, 'bottom');
  assert.equal(homeBaseFor(2).edge, 'left');
  assert.equal(homeBaseFor(3).edge, 'top');
  assert.equal(homeBaseFor(4).edge, 'right');
  assert.equal(homeBaseFor(5).edge, 'bottom');
  assert.equal(homeBaseFor(8).edge, 'right');
  assert.equal(homeBaseFor(9).edge, 'bottom');
});

test('homeBaseFor positions are at midpoints of each playfield edge', () => {
  assert.deepEqual(HOME_BASES.map(b => b.edge), ['bottom', 'left', 'top', 'right']);
  assert.equal(HOME_BASES[0].x, CANVAS_W / 2);
  assert.equal(HOME_BASES[0].y, PLAYFIELD_BOTTOM);
  assert.equal(HOME_BASES[1].x, 0);
  assert.equal(HOME_BASES[1].y, PLAYFIELD_CENTER_Y);
  assert.equal(HOME_BASES[2].x, CANVAS_W / 2);
  assert.equal(HOME_BASES[2].y, PLAYFIELD_TOP);
  assert.equal(HOME_BASES[3].x, CANVAS_W);
  assert.equal(HOME_BASES[3].y, PLAYFIELD_CENTER_Y);
});

test('end matches the supplied home base', () => {
  for (const base of HOME_BASES) {
    for (let i = 1; i < 10; i++) {
      const path = createPath({ rng: rngFromSeed(i), end: base });
      assert.equal(path.end.x, base.x);
      assert.equal(path.end.y, base.y);
      assert.equal(path.end.edge, base.edge);
    }
  }
});

test('start is on a different edge than the end', () => {
  for (const base of HOME_BASES) {
    for (let i = 1; i < 20; i++) {
      const path = createPath({ rng: rngFromSeed(i), end: base });
      assert.notEqual(path.start.edge, base.edge,
        `base=${base.edge} seed=${i}: start should not match`);
    }
  }
});

test('every endpoint and waypoint stays within the playfield', () => {
  for (let i = 1; i < 30; i++) {
    const path = createPath({ rng: rngFromSeed(i) });
    for (const p of path.waypoints) {
      assert.ok(p.x >= 0 && p.x <= CANVAS_W, `seed ${i}: x ${p.x} OOB`);
      assert.ok(p.y >= PLAYFIELD_TOP - 0.001 && p.y <= PLAYFIELD_BOTTOM + 0.001,
        `seed ${i}: y ${p.y} outside playfield [${PLAYFIELD_TOP},${PLAYFIELD_BOTTOM}]`);
    }
  }
});

test('intermediate waypoints stay inside the playfield', () => {
  for (let i = 1; i < 20; i++) {
    const path = createPath({ rng: rngFromSeed(i) });
    for (let j = 1; j < path.waypoints.length - 1; j++) {
      const p = path.waypoints[j];
      assert.ok(p.x >= 0 && p.x <= CANVAS_W);
      assert.ok(p.y >= PLAYFIELD_TOP && p.y <= PLAYFIELD_BOTTOM);
    }
  }
});

test('every waypoint snaps to the tile grid', () => {
  for (let i = 1; i < 20; i++) {
    const path = createPath({ rng: rngFromSeed(i) });
    for (const p of path.waypoints) {
      assert.equal(p.x % TILE_SIZE, 0, `seed ${i}: x ${p.x} not aligned`);
      assert.equal(p.y % TILE_SIZE, 0, `seed ${i}: y ${p.y} not aligned`);
    }
  }
});

test('every path segment is axis-aligned (blocky)', () => {
  for (let i = 1; i < 20; i++) {
    const path = createPath({ rng: rngFromSeed(i) });
    for (let j = 1; j < path.waypoints.length; j++) {
      const a = path.waypoints[j - 1];
      const b = path.waypoints[j];
      const horizontal = a.y === b.y;
      const vertical = a.x === b.x;
      assert.ok(horizontal || vertical,
        `seed ${i}, segment ${j}: not axis-aligned (${a.x},${a.y}) → (${b.x},${b.y})`);
    }
  }
});

test('sample(0) is start, sample(1) is end', () => {
  const path = createPath({ rng: rngFromSeed(42) });
  const a = path.sample(0);
  const b = path.sample(1);
  assert.equal(a.x, path.start.x);
  assert.equal(a.y, path.start.y);
  assert.equal(b.x, path.end.x);
  assert.equal(b.y, path.end.y);
});

test('sample(t) is monotonic in cumulative path distance', () => {
  const path = createPath({ rng: rngFromSeed(7) });
  let prev = path.sample(0);
  let traveled = 0;
  const steps = 200;
  for (let i = 1; i <= steps; i++) {
    const p = path.sample(i / steps);
    traveled += Math.hypot(p.x - prev.x, p.y - prev.y);
    prev = p;
  }
  const err = Math.abs(traveled - path.length) / path.length;
  assert.ok(err < 0.02, `traveled=${traveled} length=${path.length} err=${err}`);
});

test('determinism: same seed produces same path', () => {
  const a = createPath({ rng: rngFromSeed(99) });
  const b = createPath({ rng: rngFromSeed(99) });
  assert.deepEqual(a.waypoints, b.waypoints);
});

test('isPolylineClearOf detects blockers near a segment', () => {
  const points = [
    { x: 0, y: 100 },
    { x: 200, y: 100 }
  ];
  assert.equal(isPolylineClearOf(points, [{ x: 100, y: 500 }], 30), true);
  assert.equal(isPolylineClearOf(points, [{ x: 100, y: 100 }], 30), false);
  assert.equal(isPolylineClearOf(points, [{ x: 100, y: 140 }], 30), true);
  assert.equal(isPolylineClearOf(points, [{ x: 100, y: 120 }], 30), false);
  assert.equal(isPolylineClearOf(points, [], 30), true);
});

test('createPath avoids towers when room exists', () => {
  const tower = { x: PLAYFIELD_TOP + 200, y: PLAYFIELD_CENTER_Y };
  for (let seed = 1; seed < 30; seed++) {
    const path = createPath({ rng: rngFromSeed(seed), avoid: [tower] });
    assert.ok(
      isPolylineClearOf(path.waypoints, [tower]),
      `seed ${seed}: path crosses tower at (${tower.x}, ${tower.y})`
    );
  }
});

test('countSelfIntersections detects crossing segments', () => {
  assert.equal(countSelfIntersections([
    { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }
  ]), 0);
  assert.equal(countSelfIntersections([
    { x: -50, y: 0 }, { x: 50, y: 0 },        
    { x: 50, y: -50 }, { x: 0, y: -50 },      
    { x: 0, y: 50 }, { x: -50, y: 50 }        
  ]), 1);
});

test('countSelfIntersections detects collinear back-tracking', () => {
  const points = [
    { x: 0, y: 0 }, { x: 100, y: 0 },         
    { x: 100, y: -50 },                        
    { x: 50, y: -50 },                         
    { x: 50, y: 0 },                           
    { x: 200, y: 0 }                           
  ];
  assert.ok(countSelfIntersections(points) >= 1);
});

test('createPath does not route across itself', () => {
  for (let seed = 1; seed < 60; seed++) {
    const path = createPath({ rng: rngFromSeed(seed) });
    assert.equal(
      countSelfIntersections(path.waypoints), 0,
      `seed ${seed}: path crosses itself`
    );
  }
});

test('createPath returns least-bad path when avoidance is impossible', () => {
  const blockers = [];
  for (let x = 50; x < CANVAS_W; x += 60) {
    for (let y = PLAYFIELD_TOP + 50; y < PLAYFIELD_BOTTOM; y += 60) {
      blockers.push({ x, y });
    }
  }
  const path = createPath({ rng: rngFromSeed(1), avoid: blockers });
  assert.ok(path.waypoints.length >= 2);
  assert.ok(path.length > 0);
});
