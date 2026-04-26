import { world } from '../world.js';
import { CANVAS_W, CANVAS_H } from '../config.js';
import { makeButton, makeText } from '../ui/buttons.js';
import { deactivateShop } from '../ui/shop-panel.js';

let _ui = null;

function build() {
  if (_ui) return _ui;
  const title = makeText({
    x: CANVAS_W / 2,
    y: CANVAS_H / 2 - 80,
    text: 'Game Over',
    font: 'bold 48px Cyberphont, system-ui, sans-serif',
    color: '#cf7e7e'
  });
  const score = makeText({
    x: CANVAS_W / 2,
    y: CANVAS_H / 2 - 30,
    text: '',
    font: '24px Cyberphont, system-ui, sans-serif',
    color: '#fff'
  });
  const newBest = makeText({
    x: CANVAS_W / 2,
    y: CANVAS_H / 2 + 4,
    text: '',
    font: '18px Cyberphont, system-ui, sans-serif',
    color: '#e8d488'
  });
  const menuBtn = makeButton({
    x: CANVAS_W / 2 - 120,
    y: CANVAS_H / 2 + 40,
    width: 240,
    height: 60,
    text: 'Menu',
    font: 'bold 22px Cyberphont, system-ui, sans-serif',
    onDown: () => world.fsm.transition('menu')
  });
  menuBtn.disable();
  _ui = { title, score, newBest, menuBtn };
  return _ui;
}

export const gameOverState = {
  enter() {
    deactivateShop();
    const ui = build();
    ui.score.text = `Score ${world.score}`;
    ui.newBest.text = (world.highScore > 0 && world.score >= world.highScore) ? 'NEW BEST' : '';
    ui.menuBtn.enable();
  },

  exit() {
    if (_ui) _ui.menuBtn.disable();
  },

  update(_dt) {},

  render() {
    const ctx = world.context;
    ctx.fillStyle = 'rgba(8, 10, 14, 0.92)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    const ui = build();
    ui.title.render();
    ui.score.render();
    if (ui.newBest.text) ui.newBest.render();
    ui.menuBtn.render();
  }
};
