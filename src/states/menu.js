import { world } from '../world.js';
import { CANVAS_W, CANVAS_H } from '../config.js';
import { drawMenu, activateMenu, deactivateMenu } from '../ui/menu.js';
import { startMenuMusic } from '../audio/index.js';

export const menuState = {
  enter() {
    activateMenu();
    startMenuMusic();
  },

  exit() {
    deactivateMenu();
  },

  update(_dt) {},

  render() {
    const ctx = world.context;
    ctx.fillStyle = '#11141c';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    drawMenu(ctx);
  }
};
