
import { world } from '../world.js';
import { CANVAS_W } from '../config.js';

const PAUSE_BTN = { x: CANVAS_W / 2 - 70, y: 56, w: 140, h: 36 };
const STEP_BTN  = { x: CANVAS_W / 2 + 80, y: 56, w: 90, h: 36 };

let _lastLog = 0;
const LOG_INTERVAL_MS = 100;            
let _stepRequested = false;

function pointInRect(p, r) {
  return p.x >= r.x && p.y >= r.y && p.x <= r.x + r.w && p.y <= r.y + r.h;
}

export function debugControlsHandleClick(p) {
  if (!world.debug?.visible) return false;
  if (pointInRect(p, PAUSE_BTN)) {
    world.flags.paused = !world.flags.paused;
    return true;
  }
  if (pointInRect(p, STEP_BTN) && world.flags.paused) {
    _stepRequested = true;
    return true;
  }
  return false;
}

export function consumeStepRequest() {
  if (!_stepRequested) return false;
  _stepRequested = false;
  return true;
}

export function drawDebugControls(ctx) {
  if (!world.debug?.visible) return;

  ctx.fillStyle = world.flags.paused ? '#cf7e7e' : '#3a8d4e';
  ctx.fillRect(PAUSE_BTN.x, PAUSE_BTN.y, PAUSE_BTN.w, PAUSE_BTN.h);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.strokeRect(PAUSE_BTN.x, PAUSE_BTN.y, PAUSE_BTN.w, PAUSE_BTN.h);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    world.flags.paused ? 'RESUME ▶' : 'PAUSE ❚❚',
    PAUSE_BTN.x + PAUSE_BTN.w / 2,
    PAUSE_BTN.y + PAUSE_BTN.h / 2
  );

  if (world.flags.paused) {
    ctx.fillStyle = '#5b6a8c';
    ctx.fillRect(STEP_BTN.x, STEP_BTN.y, STEP_BTN.w, STEP_BTN.h);
    ctx.strokeRect(STEP_BTN.x, STEP_BTN.y, STEP_BTN.w, STEP_BTN.h);
    ctx.fillStyle = '#fff';
    ctx.fillText('STEP ⏭', STEP_BTN.x + STEP_BTN.w / 2, STEP_BTN.y + STEP_BTN.h / 2);
  }
}

export function logFrame() {
  if (!world.debug?.visible) return;
  const now = performance.now();
  if (now - _lastLog < LOG_INTERVAL_MS) return;
  _lastLog = now;

  console.groupCollapsed(`frame t=${now.toFixed(0)} state=${world.fsm?.current ?? '?'} wave=${world.wave} hp=${world.hp} gold=${world.gold} score=${world.score}`);

  if (world.path) {
    console.log(
      'path',
      `start=(${world.path.start.x.toFixed(0)},${world.path.start.y.toFixed(0)})`,
      `end=(${world.path.end.x.toFixed(0)},${world.path.end.y.toFixed(0)})`,
      `len=${world.path.length.toFixed(0)}`,
      `wp=${world.path.waypoints.length}`
    );
  } else {
    console.log('path: null');
  }

  if (world.enemies.length) {
    console.table(world.enemies.map((e, i) => ({
      idx: i,
      type: e.type,
      x: Math.round(e.x),
      y: Math.round(e.y),
      t: Number(e._t.toFixed(3)),
      hp: e.hp,
      dead: e.dead,
      escaped: e.escaped
    })));
  } else {
    console.log('enemies: 0');
  }

  if (world.towers.length) {
    console.table(world.towers.map((t, i) => ({
      idx: i,
      type: t.type,
      tier: t.tier,
      x: Math.round(t.x),
      y: Math.round(t.y),
      range: t.range,
      cooldown: Number(t.cooldown.toFixed(2))
    })));
  } else {
    console.log('towers: 0');
  }

  if (world.projectiles.length) {
    console.log(`projectiles: ${world.projectiles.length}`);
  }

  console.groupEnd();
}
