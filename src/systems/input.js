
import { world } from '../world.js';
import { debugControlsHandleClick } from './debug-controls.js';

let _move = null;
let _click = null;

function canvasPointFromEvent(event) {
  const c = world.canvas;
  const sx = c.width / c.clientWidth;
  const sy = c.height / c.clientHeight;
  return {
    x: event.offsetX * sx,
    y: event.offsetY * sy
  };
}

export function onPointerMove(handler) { _move = handler; }
export function onClick(handler) { _click = handler; }

export function attachInput(canvas) {
  canvas.addEventListener('pointermove', e => {
    const p = canvasPointFromEvent(e);
    _move?.(p, e);
  });
  canvas.addEventListener('click', e => {
    if (world._uiConsumed) {
      world._uiConsumed = false;
      e.preventDefault();
      return;
    }
    const p = canvasPointFromEvent(e);
    if (import.meta.env.DEV && debugControlsHandleClick(p)) {
      e.preventDefault();
      return;
    }
    _click?.(p, e);
    e.preventDefault();
  });
}

export function pickTowerAt(point) {
  for (let i = world.towers.length - 1; i >= 0; i--) {
    const t = world.towers[i];
    const dx = t.x - point.x;
    const dy = t.y - point.y;
    if (dx * dx + dy * dy <= 24 * 24) return t;
  }
  return null;
}
