
import { world } from '../world.js';
import { CANVAS_W, homeBaseFor } from '../config.js';
import { drawHud } from '../ui/hud.js';
import {
  setStartButtonMode, refreshShopState, drawShopPanel,
  handleRuntimeClick, drawPendingTowerPreview
} from '../ui/shop-panel.js';
import { onClick, onPointerMove } from '../systems/input.js';
import { createPath } from '../systems/path.js';
import { drawPath, drawPlayfieldBg } from './playing.js';

export const shopState = {
  enter() {
    world.pendingTower = null;
    world.selectedTower = null;
    const upcomingWave = world.wave + 1;
    world.path = createPath({
      end: homeBaseFor(upcomingWave),
      avoid: world.towers
    });

    world.flags.paused = false;
    setStartButtonMode('start');

    onPointerMove(p => {
      if (world.pendingTower) {
        world.pendingTower.x = p.x;
        world.pendingTower.y = p.y;
      }
    });

    onClick(p => handleRuntimeClick(p));
  },

  exit() {
    onPointerMove(null);
    onClick(null);
  },

  update(_dt) {
    refreshShopState();
  },

  render() {
    const ctx = world.context;
    drawPlayfieldBg(ctx);

    if (world.path) drawPath(ctx, world.path);

    for (const t of world.towers) {
      t.render();
      if (world.selectedTower === t) t.renderRange();
    }

    drawPendingTowerPreview(ctx);

    drawHud(ctx);
    drawShopPanel(ctx, { selectedTower: world.selectedTower });

    if (world.pendingTower) {
      drawBanner(ctx, 'Click to place. Buy again to cancel.', '#fff');
    } else if (!world.selectedTower && world.towers.length === 0) {
      drawBanner(ctx, 'Buy a tower below, place it, then Start Wave.', '#bbb');
    }
  }
};

function drawBanner(ctx, msg, color) {
  ctx.font = '16px Cyberphont, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const w = ctx.measureText(msg).width;
  const padX = 14;
  const padY = 6;
  const cx = CANVAS_W / 2;
  const cy = 84;
  ctx.fillStyle = 'rgba(8, 10, 14, 0.92)';
  ctx.fillRect(cx - w / 2 - padX, cy - 11 - padY, w + padX * 2, 22 + padY * 2);
  ctx.strokeStyle = 'rgba(136, 200, 232, 0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - w / 2 - padX + 0.5, cy - 11 - padY + 0.5,
    w + padX * 2 - 1, 22 + padY * 2 - 1);
  ctx.fillStyle = color;
  ctx.fillText(msg, cx, cy);
}
