
import { world } from '../world.js';

export function awardKill(enemyDef) {
  world.gold += enemyDef.gold;
  world.score += enemyDef.score;
}

export function spendGold(amount) {
  if (world.gold < amount) return false;
  world.gold -= amount;
  return true;
}

export function canAfford(amount) {
  return world.gold >= amount;
}
