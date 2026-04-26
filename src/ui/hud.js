
import { world } from '../world.js';
import { CANVAS_W, HUD_H, PLAYER_HP } from '../config.js';

export function drawHud(ctx) {
  ctx.save();

  ctx.fillStyle = 'rgba(8, 10, 14, 0.85)';
  ctx.fillRect(0, 0, CANVAS_W, HUD_H);

  ctx.font = '20px Cyberphont, system-ui, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#d8d8d8';

  const y = HUD_H / 2;

  ctx.fillText('HP', 16, y);
  ctx.fillStyle = '#222';
  ctx.fillRect(46, y - 8, 160, 16);
  ctx.fillStyle = world.hp > 30 ? '#7ec88a' : '#cf7e7e';
  const hpPct = Math.max(0, world.hp / PLAYER_HP);
  ctx.fillRect(46, y - 8, 160 * hpPct, 16);
  ctx.fillStyle = '#fff';
  ctx.font = '14px Cyberphont, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${world.hp}/${PLAYER_HP}`, 46 + 80, y);

  ctx.font = '20px Cyberphont, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#e8d488';
  ctx.fillText(`Gold ${world.gold}`, 240, y);

  ctx.fillStyle = '#88c8e8';
  ctx.fillText(`Score ${world.score}`, 400, y);

  ctx.fillStyle = '#d8d8d8';
  ctx.textAlign = 'right';
  const label = world.waveRemaining > 0
    ? `Wave ${world.wave} · ${world.waveRemaining} left`
    : `Wave ${world.wave}`;
  ctx.fillText(label, CANVAS_W - 16, y);

  if (world.highScore > 0) {
    ctx.font = '12px Cyberphont, system-ui, sans-serif';
    ctx.fillStyle = '#888';
    ctx.fillText(`best ${world.highScore}`, CANVAS_W - 16, HUD_H - 10);
  }

  ctx.restore();
}
