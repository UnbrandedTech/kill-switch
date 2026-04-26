
export const ENEMIES = {
  A1: {
    id: 'A1',
    name: 'Grunt I',
    family: 'ground',
    hp: 3,
    speed: 70,
    radius: 12,
    damageOnEscape: 1,
    score: 10,
    gold: 3,
    color: '#7ea4cf',
    sprite: 'enemy_ground_1',
    walkFps: 8
  },
  A2: {
    id: 'A2',
    name: 'Grunt II',
    family: 'ground',
    hp: 8,
    speed: 80,
    radius: 13,
    damageOnEscape: 2,
    score: 20,
    gold: 6,
    color: '#7ea4cf',
    sprite: 'enemy_ground_2',
    walkFps: 8
  },
  A3: {
    id: 'A3',
    name: 'Grunt III',
    family: 'ground',
    hp: 18,
    speed: 90,
    radius: 14,
    damageOnEscape: 3,
    score: 40,
    gold: 12,
    color: '#7ea4cf',
    sprite: 'enemy_ground_3',
    walkFps: 8
  },

  B1: {
    id: 'B1',
    name: 'Skiff I',
    family: 'flying',
    hp: 5,
    speed: 110,
    radius: 11,
    damageOnEscape: 2,
    score: 15,
    gold: 5,
    color: '#7ec88a',
    sprite: 'enemy_flight_1',
    walkFps: 12
  },
  B2: {
    id: 'B2',
    name: 'Skiff II',
    family: 'flying',
    hp: 10,
    speed: 130,
    radius: 12,
    damageOnEscape: 3,
    score: 30,
    gold: 10,
    color: '#7ec88a',
    sprite: 'enemy_flight_2',
    walkFps: 12
  },
  B3: {
    id: 'B3',
    name: 'Skiff III',
    family: 'flying',
    hp: 22,
    speed: 150,
    radius: 13,
    damageOnEscape: 4,
    score: 60,
    gold: 18,
    color: '#7ec88a',
    sprite: 'enemy_flight_3',
    walkFps: 12
  }
};

export const ENEMY_ORDER = ['A1', 'B1', 'A2', 'B2', 'A3', 'B3'];

export const ENEMY_DESTROYED_SPRITE = 'enemy_destroyed';
export const ENEMY_DEATH_DURATION = 0.5;     
export const ENEMY_DEATH_FPS = 12;
