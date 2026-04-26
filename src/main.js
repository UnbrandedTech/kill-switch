
import { init, GameLoop, initPointer } from 'kontra';
import { FSM, Mixer, Camera, Particles, Debug } from 'super-kontra';

import { CANVAS_W, CANVAS_H } from './config.js';
import { world } from './world.js';
import { playables } from './playables.js';
import { attachInput } from './systems/input.js';
import { drawDebugControls, logFrame, consumeStepRequest } from './systems/debug-controls.js';
import { loadAudio, getAudio, playSfx } from './audio/index.js';
import { loadAssets, getSprite, drawSpriteFrame } from './assets/index.js';

import { menuState } from './states/menu.js';
import { shopState } from './states/shop.js';
import { playingState } from './states/playing.js';
import { gameOverState } from './states/game-over.js';

const { canvas, context } = init('game');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;
initPointer({ canvas });

world.canvas = canvas;
world.context = context;

world.mixer = Mixer({ resolve: getAudio });
world.mixer.channel('music', { exclusive: true, volume: 0.7 });
world.mixer.channel('sfx', { volume: 0.8 });
world.playSfx = playSfx;
world.getSprite = getSprite;
world.drawFrame = drawSpriteFrame;

loadAudio().catch((e) => {
  console.warn('audio load failed', e);
  playables.logError();
});
loadAssets().catch((e) => {
  console.warn('asset load failed', e);
  playables.logError();
});

world.particles = Particles({ context, max: 200 });
world.camera = Camera({ context });

if (import.meta.env.DEV) {
  world.debug = Debug({ context, position: 'top-right', visible: false });
  window.addEventListener('keydown', (e) => {
    if (e.key === '`' || e.key === '~') world.debug.toggle();
  });
}

attachInput(canvas);

const fsm = FSM({
  initial: 'menu',
  states: {
    menu: menuState,
    shop: shopState,
    playing: playingState,
    'game-over': gameOverState
  }
});
world.fsm = fsm;
fsm.start();

let _firstFrameAnnounced = false;
let _gameReadyAnnounced = false;

playables.onPause(() => {
  world.flags.paused = true;
});

playables.onResume(() => {
  world.flags.paused = false;
});

playables.onAudioEnabledChange((enabled) => {
  world.flags.audioEnabled = enabled;
  if (enabled) {
    world.mixer.channel('music', { volume: 0.7 });
    world.mixer.channel('sfx', { volume: 0.8 });
  } else {
    world.mixer.channel('music', { volume: 0 });
    world.mixer.channel('sfx', { volume: 0 });
  }
});

playables.loadData().then((blob) => {
  if (!blob) return;
  try {
    world.fromSave(JSON.parse(blob));
  } catch (e) {
    console.warn('failed to parse save', e);
    playables.logError();
  }
}).catch((e) => {
  console.warn('playables.loadData failed', e);
});

const loop = GameLoop({
  update(dt) {
    if (world.flags.paused && (!import.meta.env.DEV || !consumeStepRequest())) return;
    if (import.meta.env.DEV) {
      world.debug.time('update', () => fsm.update(dt));
      logFrame();
    } else {
      fsm.update(dt);
    }
  },
  render() {
    if (import.meta.env.DEV) {
      world.debug.tick();
      world.debug.time('render', () => fsm.render());
      world.debug.count('state', fsm.current ?? '?');
      world.debug.count('enemies', world.enemies.length);
      world.debug.count('towers', world.towers.length);
      world.debug.count('proj', world.projectiles.length);
      world.debug.count('wave', world.wave);
      if (world.path) {
        world.debug.count('path',
          `(${world.path.start.x.toFixed(0)},${world.path.start.y.toFixed(0)})→` +
          `(${world.path.end.x.toFixed(0)},${world.path.end.y.toFixed(0)}) len=${world.path.length.toFixed(0)}`
        );
      }
      world.debug.render();
      drawDebugControls(context);
    } else {
      fsm.render();
    }
    if (!_firstFrameAnnounced) {
      _firstFrameAnnounced = true;
      requestAnimationFrame(() => {
        playables.firstFrameReady();
        if (!_gameReadyAnnounced) {
          _gameReadyAnnounced = true;
          playables.gameReady();
        }
      });
    }
  }
});

loop.start();

if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.__GAME__ = { world, fsm, loop, playables };
}
