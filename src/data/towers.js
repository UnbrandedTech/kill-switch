
const TURRET_ART = {
  frameH: 64,
  fps: 16
};

export const TOWERS = {
  autocannon: {
    id: 'autocannon',
    name: 'Autocannon',
    color: '#e8d488',
    cost: 30,
    base: {
      damage: 1,
      fireRate: 4,
      magSize: 8,
      reloadTime: 1,
      range: 140,
      projectileSpeed: 600
    },
    art: { sheets: ['autocannon_1', 'autocannon_2', 'autocannon_3'], ...TURRET_ART },
    projectileSprite: 'projectile_laser'
  },
  railgun: {
    id: 'railgun',
    name: 'Railgun',
    color: '#cf7e7e',
    cost: 60,
    base: {
      damage: 8,
      fireRate: 1,
      magSize: 1,
      reloadTime: 2,
      range: 320,
      projectileSpeed: 900
    },
    art: { sheets: ['railgun_1', 'railgun_2', 'railgun_3'], ...TURRET_ART, reverseAnimation: true },
    projectileSprite: 'projectile_railgun'
  },
  shotgun: {
    id: 'shotgun',
    name: 'Shotgun',
    color: '#7ea84a',
    cost: 50,
    base: {
      damage: 1,
      fireRate: 1,
      magSize: 6,
      reloadTime: 1.5,
      range: 110,
      projectileSpeed: 600,
      pellets: 5,
      spread: Math.PI / 5,
      pelletTtl: 0.4
    },
    art: { sheets: ['shotgun_1', 'shotgun_2', 'shotgun_3'], ...TURRET_ART },
    projectileSprite: 'projectile_shotgun'
  },
  rocket_launcher: {
    id: 'rocket_launcher',
    name: 'Rocket Launcher',
    color: '#d97a3a',
    cost: 80,
    base: {
      damage: 6,
      fireRate: 0.6,
      magSize: 3,
      reloadTime: 3,
      range: 220,
      projectileSpeed: 380,
      explosionRadius: 38
    },
    art: {
      sheets: ['rocket_launcher_1', 'rocket_launcher_2', 'rocket_launcher_3'],
      ...TURRET_ART,
      cycleAnimByMag: true
    },
    projectileSprite: 'projectile_rocket'
  }
};

export function pickArtTier(fireRateUpgrades) {
  if (fireRateUpgrades >= 4) return 2;
  if (fireRateUpgrades >= 2) return 1;
  return 0;
}

export const TOWER_ORDER = ['autocannon', 'railgun', 'shotgun', 'rocket_launcher'];

export const UPGRADE_MAX_TIER = 5;

const UPGRADE_COSTS = [40, 80, 160, 320, 640];
export function upgradeCost(currentTier) {
  return UPGRADE_COSTS[currentTier] ?? Infinity;
}

export function effectiveStats(base, upgrades) {
  const dT = upgrades.damage ?? 0;
  const rT = upgrades.fireRate ?? 0;
  const lT = upgrades.reload ?? 0;
  return {
    damage: base.damage + dT,
    fireRate: base.fireRate + rT * 0.5,
    reloadTime: base.reloadTime * Math.pow(0.85, lT),
    magSize: base.magSize,
    range: base.range,
    projectileSpeed: base.projectileSpeed,
    pellets: base.pellets ?? 1,
    spread: base.spread ?? 0,
    pelletTtl: base.pelletTtl ?? 0,
    explosionRadius: base.explosionRadius ?? 0,
    slow: base.slow ?? null
  };
}
