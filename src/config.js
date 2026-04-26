
export const CANVAS_W = 1280;
export const CANVAS_H = 720;

export const PLAYER_HP = 20;

export const GOLD_START = 100;

export const WAVE_BASE_COUNT = 5;
export const WAVE_STEP = 5;
export const WAVE_CAP = 50;          

export const TILE_SIZE = 32;
export const TURRET_H = 64;     

export const HUD_H = 64;
export const PLAYFIELD_TOP = HUD_H;
export const PLAYFIELD_H = TILE_SIZE * 17;                     
export const PLAYFIELD_BOTTOM = PLAYFIELD_TOP + PLAYFIELD_H;   
export const PLAYFIELD_CENTER_Y = PLAYFIELD_TOP + PLAYFIELD_H / 2; 
export const SHOP_PANEL_H = CANVAS_H - PLAYFIELD_BOTTOM;       

export const PATH_PADDING = 64;       
export const PATH_WAYPOINTS = 4;      

export const HOME_BASES = [
  { x: CANVAS_W / 2,    y: PLAYFIELD_BOTTOM, edge: 'bottom' },
  { x: 0,               y: PLAYFIELD_CENTER_Y, edge: 'left' },
  { x: CANVAS_W / 2,    y: PLAYFIELD_TOP, edge: 'top' },
  { x: CANVAS_W,        y: PLAYFIELD_CENTER_Y, edge: 'right' }
];

export function homeBaseFor(waveNumber) {
  if (!Number.isFinite(waveNumber) || waveNumber < 1) {
    throw Error('homeBaseFor: waveNumber must be >= 1');
  }
  return HOME_BASES[(waveNumber - 1) % HOME_BASES.length];
}

export function snapToTile(x, y) {
  return {
    x: Math.floor(x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2,
    y: Math.floor(y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2
  };
}

