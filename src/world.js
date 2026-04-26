
import { PLAYER_HP, GOLD_START } from './config.js';

export const world = {
  canvas: null,
  context: null,
  fsm: null,
  mixer: null,
  particles: null,
  camera: null,

  hp: PLAYER_HP,
  gold: GOLD_START,
  score: 0,
  highScore: 0,
  wave: 0,

  waveRemaining: 0,

  enemies: [],
  towers: [],
  projectiles: [],

  path: null,                  

  pendingTower: null,          
  selectedTower: null,         

  debug: null,

  _uiConsumed: false,

  playSfx: () => {},
  getSprite: () => null,
  drawFrame: () => {},

  flags: {
    paused: false,
    audioEnabled: true         
  },

  resetRun() {
    this.hp = PLAYER_HP;
    this.gold = GOLD_START;
    this.score = 0;
    this.wave = 0;
    this.waveRemaining = 0;
    this.enemies.length = 0;
    this.towers.length = 0;
    this.projectiles.length = 0;
    this.path = null;
    this.pendingTower = null;
    this.selectedTower = null;
  },

  toSave() {
    return {
      v: 1,
      meta: {
        highScore: this.highScore
      }
    };
  },

  fromSave(state) {
    if (!state || typeof state !== 'object') return;
    if (state.meta && typeof state.meta.highScore === 'number') {
      this.highScore = state.meta.highScore;
    }
  }
};
