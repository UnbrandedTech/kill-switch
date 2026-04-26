
import { world } from '../world.js';
import {
  CANVAS_W, CANVAS_H, HOME_BASES,
  TILE_SIZE, PLAYFIELD_TOP, PLAYFIELD_BOTTOM
} from '../config.js';
import { drawHud } from '../ui/hud.js';
import {
  setStartButtonMode, refreshShopState, drawShopPanel,
  handleRuntimeClick, drawPendingTowerPreview
} from '../ui/shop-panel.js';
import { onClick, onPointerMove } from '../systems/input.js';
import { composeWave } from '../systems/waves.js';
import { createSpawner } from '../systems/spawner.js';
import { awardKill } from '../systems/economy.js';
import { playables } from '../playables.js';

let _spawner = null;

export const playingState = {
  enter() {
    world.wave += 1;
    const composition = composeWave(world.wave).composition;
    _spawner = createSpawner(composition);

    setStartButtonMode('pause');

    onPointerMove(p => {
      if (world.pendingTower) {
        world.pendingTower.x = p.x;
        world.pendingTower.y = p.y;
      }
    });

    onClick(p => handleRuntimeClick(p));
  },

  exit() {
    _spawner = null;
    onPointerMove(null);
    onClick(null);
  },

  update(dt) {
    refreshShopState();
    if (_spawner) _spawner.update(dt);
    world.camera?.tick?.(dt);

    for (const e of world.enemies) e.update(dt);
    for (const t of world.towers) t.update(dt);
    for (const p of world.projectiles) p.update(dt);

    const alive = [];
    for (const e of world.enemies) {
      if (e.escaped) continue;
      if (e.dead && !e._killAwarded) {
        awardKill(e.def);
        e._killAwarded = true;
      }
      if (e._fullyDead) continue;
      alive.push(e);
    }
    world.enemies.length = 0;
    for (const e of alive) world.enemies.push(e);

    const liveProj = [];
    for (const p of world.projectiles) if (!p.dead) liveProj.push(p);
    world.projectiles.length = 0;
    for (const p of liveProj) world.projectiles.push(p);

    if (_spawner) {
      let liveThreats = 0;
      for (const e of world.enemies) {
        if (!e.dead && !e.escaped) liveThreats += 1;
      }
      world.waveRemaining = (_spawner.total - _spawner.spawned) + liveThreats;
    }

    if (world.hp <= 0) {
      world.hp = 0;
      playables.sendScore(world.score);
      if (world.score > world.highScore) {
        world.highScore = world.score;
        playables.saveData(JSON.stringify(world.toSave())).catch(() => {});
      }
      world.fsm.transition('game-over');
      return;
    }
    if (_spawner.done && world.enemies.length === 0) {
      for (const t of world.towers) t.resetForWave();
      playables.saveData(JSON.stringify(world.toSave())).catch(() => {});
      world.fsm.transition('shop');
    }
  },

  render() {
    const ctx = world.context;
    drawPlayfieldBg(ctx);

    world.camera.draw(() => {
      drawPath(ctx, world.path);
      for (const t of world.towers) {
        t.render();
        if (world.selectedTower === t) t.renderRange();
      }
      for (const e of world.enemies) e.render();
      for (const p of world.projectiles) p.render();
    });

    drawPendingTowerPreview(ctx);

    drawHud(ctx);
    drawShopPanel(ctx, { selectedTower: world.selectedTower });

    if (import.meta.env.DEV && world.debug?.visible) {
      ctx.fillStyle = '#0f0';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      for (const e of world.enemies) {
        ctx.fillText(`t=${e._t.toFixed(2)}`, e.x + 14, e.y);
      }
    }

  }
};

export function drawPlayfieldBg(ctx) {
  ctx.fillStyle = '#0a0d14';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.strokeStyle = 'rgba(136,200,232,0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= CANVAS_W; x += TILE_SIZE) {
    ctx.moveTo(x + 0.5, PLAYFIELD_TOP);
    ctx.lineTo(x + 0.5, PLAYFIELD_BOTTOM);
  }
  for (let y = PLAYFIELD_TOP; y <= PLAYFIELD_BOTTOM; y += TILE_SIZE) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(CANVAS_W, y + 0.5);
  }
  ctx.stroke();

  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (let y = PLAYFIELD_TOP; y < PLAYFIELD_BOTTOM; y += 3) {
    ctx.fillRect(0, y, CANVAS_W, 1);
  }
}

export function drawPath(ctx, path) {
  if (!path) return;

  for (const base of HOME_BASES) {
    if (base.edge !== path.end.edge) drawHomeBase(ctx, base, false);
  }

  const lineCapPrev = ctx.lineCap;
  const lineJoinPrev = ctx.lineJoin;
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'miter';

  ctx.strokeStyle = 'rgba(136,200,232,0.10)';
  ctx.lineWidth = 28;
  ctx.beginPath();
  ctx.moveTo(path.waypoints[0].x, path.waypoints[0].y);
  for (let i = 1; i < path.waypoints.length; i++) {
    ctx.lineTo(path.waypoints[i].x, path.waypoints[i].y);
  }
  ctx.stroke();

  ctx.strokeStyle = 'rgba(136,200,232,0.35)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(path.waypoints[0].x, path.waypoints[0].y);
  for (let i = 1; i < path.waypoints.length; i++) {
    ctx.lineTo(path.waypoints[i].x, path.waypoints[i].y);
  }
  ctx.stroke();

  ctx.strokeStyle = '#88c8e8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(path.waypoints[0].x, path.waypoints[0].y);
  for (let i = 1; i < path.waypoints.length; i++) {
    ctx.lineTo(path.waypoints[i].x, path.waypoints[i].y);
  }
  ctx.stroke();

  ctx.lineCap = lineCapPrev;
  ctx.lineJoin = lineJoinPrev;

  ctx.fillStyle = '#88c8e8';
  ctx.fillRect(path.start.x - 5, path.start.y - 5, 10, 10);
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 1;
  ctx.strokeRect(path.start.x - 5 + 0.5, path.start.y - 5 + 0.5, 9, 9);

  drawHomeBase(ctx, path.end, true);
}

function drawHomeBase(ctx, end, active) {
  const w = active ? 84 : 60;
  const h = active ? 40 : 30;
  let inwardX = 0, inwardY = 0;
  switch (end.edge) {
    case 'bottom': inwardY = -1; break;
    case 'top':    inwardY = 1; break;
    case 'left':   inwardX = 1; break;
    case 'right':  inwardX = -1; break;
  }
  const halfAlong = (inwardX !== 0 ? w : h) / 2;
  const cx = end.x + inwardX * halfAlong;
  const cy = end.y + inwardY * halfAlong;

  const sprite = world.getSprite?.('base_slot');
  const prevSmoothing = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = active ? 1 : 0.35;
  if (sprite) {
    ctx.drawImage(sprite, cx - w / 2, cy - h / 2, w, h);
  } else {
    ctx.fillStyle = 'rgba(20,30,46,0.9)';
    ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
    ctx.strokeStyle = '#88c8e8';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - w / 2 + 0.5, cy - h / 2 + 0.5, w - 1, h - 1);
  }
  ctx.imageSmoothingEnabled = prevSmoothing;
  ctx.globalAlpha = 1;

  if (active) {
    ctx.fillStyle = '#88c8e8';
    ctx.font = 'bold 13px Cyberphont, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BASE', cx, cy);
  }
}
