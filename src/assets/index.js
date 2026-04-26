
import slotEmptyUrl from './Slot/EmptySlot.png?url';

import autocannon1Url from './TurretType/Autocannon/AutocannonAnimation_1.png?url';
import autocannon2Url from './TurretType/Autocannon/AutocannonAnimation_2.png?url';
import autocannon3Url from './TurretType/Autocannon/AutocannonAnimation_3.png?url';
import railgun1Url    from './TurretType/Railgun/RailgunAnimation_1.png?url';
import railgun2Url    from './TurretType/Railgun/RailgunAnimation_2.png?url';
import railgun3Url    from './TurretType/Railgun/RailgunAnimation_3.png?url';
import shotgun1Url    from './TurretType/Shotgun/ShotgunAnimation_1.png?url';
import shotgun2Url    from './TurretType/Shotgun/ShotgunAnimation_2.png?url';
import shotgun3Url    from './TurretType/Shotgun/ShotgunAnimation_3.png?url';
import rocket1Url     from './TurretType/RocketLauncher/RocketLauncherAnimation_1.png?url';
import rocket2Url     from './TurretType/RocketLauncher/RocketLauncherAnimation_2.png?url';
import rocket3Url     from './TurretType/RocketLauncher/RocketLauncherAnimation_3.png?url';

import projLaserUrl    from './Projectiles/LaserProjectile.png?url';
import projRailgunUrl  from './Projectiles/RailgunProjectile.png?url';
import projShotgunUrl  from './Projectiles/ShotgunProjectile.png?url';
import projRocketUrl   from './Projectiles/RocketProjectile.png?url';

import cyberphontUrl from './cyberphont.woff2?url';

import btnBlueUrl   from './UI/Menu buttons v2/Blue/menu_button01.png?url';
import btnRedUrl    from './UI/Menu buttons v2/red/menu_button01-red.png?url';
import btnYellowUrl from './UI/Menu buttons v2/yellow/menu_button01-yellow.png?url';

import baseSlotUrl from './UI/Inventory Pack/blue/slot_2_UI.png?url';

import enemyGround1Url  from './Enemy/EnemyGround_1.png?url';
import enemyGround2Url  from './Enemy/EnemyGround_3.png?url';
import enemyGround3Url  from './Enemy/EnemyGround_2.png?url';
import enemyFlight1Url  from './Enemy/EnemyFlight_2.png?url';
import enemyFlight2Url  from './Enemy/EnemyFlight_1.png?url';
import enemyFlight3Url  from './Enemy/EnemyFlight_3.png?url';
import enemyDestroyedUrl from './Enemy/EnemyDestroyed.png?url';

const URLS = {
  slot_empty: slotEmptyUrl,

  autocannon_1: autocannon1Url,
  autocannon_2: autocannon2Url,
  autocannon_3: autocannon3Url,
  railgun_1:    railgun1Url,
  railgun_2:    railgun2Url,
  railgun_3:    railgun3Url,
  shotgun_1:    shotgun1Url,
  shotgun_2:    shotgun2Url,
  shotgun_3:    shotgun3Url,
  rocket_launcher_1: rocket1Url,
  rocket_launcher_2: rocket2Url,
  rocket_launcher_3: rocket3Url,

  btn_blue:   btnBlueUrl,
  btn_red:    btnRedUrl,
  btn_yellow: btnYellowUrl,
  base_slot:  baseSlotUrl,

  projectile_laser:   projLaserUrl,
  projectile_railgun: projRailgunUrl,
  projectile_shotgun: projShotgunUrl,
  projectile_rocket:  projRocketUrl,

  enemy_ground_1:  enemyGround1Url,
  enemy_ground_2:  enemyGround2Url,
  enemy_ground_3:  enemyGround3Url,
  enemy_flight_1:  enemyFlight1Url,
  enemy_flight_2:  enemyFlight2Url,
  enemy_flight_3:  enemyFlight3Url,
  enemy_destroyed: enemyDestroyedUrl
};

const _images = {};
let _loadingPromise = null;

function loadOne(name, url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => {
      _images[name] = img;
      resolve();
    }, { once: true });
    img.addEventListener('error', () => {
      reject(Error(`sprite "${name}" failed to load (${url})`));
    }, { once: true });
    img.src = url;
  });
}

function loadFont() {
  const FF = globalThis.FontFace;
  if (!FF || typeof document === 'undefined') {
    return Promise.resolve();
  }
  const face = new FF('Cyberphont', `url(${cyberphontUrl})`);
  return face.load().then(f => {
    document.fonts.add(f);
  }).catch(e => {
    console.warn('Cyberphont font failed to load', e);
  });
}

export function loadAssets() {
  if (_loadingPromise) return _loadingPromise;
  _loadingPromise = Promise.all([
    ...Object.entries(URLS).map(([name, url]) => loadOne(name, url)),
    loadFont()
  ]).then(() => undefined);
  return _loadingPromise;
}

export function getSprite(name) {
  return _images[name];
}

export function drawSpriteFrame(ctx, image, frameH, frameIdx, dx, dy, dw, dh) {
  if (!image) return;
  const w = image.width;
  ctx.drawImage(
    image,
    0, frameIdx * frameH, w, frameH,
    dx, dy,
    dw ?? w, dh ?? frameH
  );
}
