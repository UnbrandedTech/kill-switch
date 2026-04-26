
import { ENEMY_ORDER } from '../data/enemies.js';
import { WAVE_BASE_COUNT, WAVE_STEP, WAVE_CAP } from '../config.js';

const RAMP_LENGTH = WAVE_CAP / WAVE_STEP; 

export function composeWave(waveNumber) {
  if (!Number.isFinite(waveNumber) || waveNumber < 1) {
    throw Error('composeWave: waveNumber must be >= 1');
  }
  const composition = [];

  for (let i = 0; i < ENEMY_ORDER.length; i++) {
    const id = ENEMY_ORDER[i];
    const rampStart = i * RAMP_LENGTH + 1;       
    const rampEnd = rampStart + RAMP_LENGTH - 1; 
    let count;
    if (waveNumber < rampStart) {
      count = 0;
    } else if (waveNumber > rampEnd) {
      count = WAVE_CAP;
    } else {
      const stepIndex = waveNumber - rampStart + 1;
      count = WAVE_BASE_COUNT + (stepIndex - 1) * WAVE_STEP;
    }
    if (count > 0) composition.push({ id, count });
  }

  const lastRampEnd = ENEMY_ORDER.length * RAMP_LENGTH;
  if (waveNumber > lastRampEnd) {
    const overflow = (waveNumber - lastRampEnd) * WAVE_STEP;
    const overflowId = ENEMY_ORDER[0];
    const stack = composition.find(c => c.id === overflowId);
    if (stack) stack.count += overflow;
    else composition.unshift({ id: overflowId, count: overflow });
  }

  return { wave: waveNumber, composition };
}

export function totalEnemies(composition) {
  let n = 0;
  for (const c of composition) n += c.count;
  return n;
}
