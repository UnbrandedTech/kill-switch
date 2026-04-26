
import { ENEMIES } from '../data/enemies.js';
import { Enemy } from '../entities/enemy.js';
import { world } from '../world.js';

const SPAWN_INTERVAL = 0.6; 

function interleave(composition) {
  const queues = composition.map(c => Array(c.count).fill(c.id));
  const out = [];
  let added = true;
  while (added) {
    added = false;
    for (const q of queues) {
      if (q.length) {
        out.push(q.pop());
        added = true;
      }
    }
  }
  return out;
}

export function createSpawner(composition) {
  const queue = interleave(composition);
  let timer = 0;
  let spawned = 0;
  const total = queue.length;

  return {
    get done() { return queue.length === 0; },
    get total() { return total; },
    get spawned() { return spawned; },

    update(dt) {
      if (!queue.length) return;
      timer += dt;
      while (timer >= SPAWN_INTERVAL && queue.length) {
        timer -= SPAWN_INTERVAL;
        const id = queue.shift();
        const def = ENEMIES[id];
        if (!def) continue;
        world.enemies.push(Enemy(def, world.path));
        world.playSfx('spawn');
        spawned++;
      }
    }
  };
}
