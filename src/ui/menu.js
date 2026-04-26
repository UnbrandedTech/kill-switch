import { world } from '../world.js';
import { CANVAS_W, CANVAS_H } from '../config.js';
import { makeButton, makeText } from './buttons.js';
import { activateShop } from './shop-panel.js';
import { startBgMusic } from '../audio/index.js';

let _ui = null;

function build() {
  if (_ui) return _ui;
  const title = makeText({
    x: CANVAS_W / 2,
    y: CANVAS_H / 2 - 80,
    text: 'Kill Switch',
    font: 'bold 56px Cyberphont, system-ui, sans-serif',
    color: '#e8d488'
  });
  const subtitle = makeText({
    x: CANVAS_W / 2,
    y: CANVAS_H / 2 - 30,
    text: 'endless tower defense',
    font: '18px Cyberphont, system-ui, sans-serif',
    color: '#888'
  });
  const playBtn = makeButton({
    x: CANVAS_W / 2 - 120,                  
    y: CANVAS_H / 2 + 40,
    width: 240,
    height: 60,
    text: 'Play',
    font: 'bold 24px Cyberphont, system-ui, sans-serif',
    onDown: () => {
      world.resetRun();
      activateShop();
      startBgMusic();
      world.fsm.transition('shop');
    }
  });
  playBtn.disable();
  _ui = { title, subtitle, playBtn };
  return _ui;
}

export function activateMenu() {
  build().playBtn.enable();
}

export function deactivateMenu() {
  build().playBtn.disable();
}

export function drawMenu(_ctx) {
  const ui = build();
  ui.title.render();
  ui.subtitle.render();
  ui.playBtn.render();

  if (world.highScore > 0) {
    _ctx.fillStyle = '#888';
    _ctx.font = '14px Cyberphont, system-ui, sans-serif';
    _ctx.textAlign = 'center';
    _ctx.fillText(`best ${world.highScore}`, CANVAS_W / 2, CANVAS_H / 2 + 130);
  }
}
