
import { world } from '../world.js';
import { CPlayer } from './player-small.js';
import { song } from './song.js';

import spawnUrl from './spawn.ogg?url';
import spawnDiedUrl from './spawn_died.ogg?url';
import autocannonFireUrl from './machine_gun_fire.ogg?url';
import autocannonReloadUrl from './machine_gun_reload.ogg?url';
import railgunFireUrl from './sniper_fire.ogg?url';
import railgunReloadUrl from './sniper_reload.ogg?url';
import shotgunFireUrl from './shotgun_fire.ogg?url';
import shotgunReloadUrl from './shotgun_reload.ogg?url';

function generateBgUrl() {
  const player = new CPlayer();
  player.init(song);
  for (let i = 0; i < song.numChannels; i++) player.generate();
  const wave = player.createWave();
  return URL.createObjectURL(new Blob([wave], { type: 'audio/wav' }));
}

const URLS = {
  spawn: spawnUrl,
  spawn_died: spawnDiedUrl,
  autocannon_fire: autocannonFireUrl,
  autocannon_reload: autocannonReloadUrl,
  railgun_fire: railgunFireUrl,
  railgun_reload: railgunReloadUrl,
  shotgun_fire: shotgunFireUrl,
  shotgun_reload: shotgunReloadUrl
};

const _elements = {};
let _loadingPromise = null;

function loadOne(name, url) {
  // Fetch as a full blob first so the audio element gets a blob: URL it can
  // load without Range requests — Wavedash's service worker (and others)
  // often mishandle ranged audio.
  const isBlob = url.startsWith('blob:');
  const blobUrl = isBlob ? Promise.resolve(url) : fetch(url).then(r => {
    if (!r.ok) throw Error(`audio "${name}" HTTP ${r.status}`);
    return r.blob().then(b => URL.createObjectURL(b));
  });
  return blobUrl.then(src => new Promise((resolve, reject) => {
    const el = new Audio();
    el.preload = 'auto';
    el.addEventListener('canplaythrough', () => {
      _elements[name] = el;
      resolve();
    }, { once: true });
    el.addEventListener('error', () => reject(Error(`audio "${name}" failed to load`)), { once: true });
    el.src = src;
    el.load();
  }));
}

export function loadAudio() {
  if (_loadingPromise) return _loadingPromise;
  if (!URLS.bg) URLS.bg = generateBgUrl();
  _loadingPromise = Promise.all(
    Object.entries(URLS).map(([name, url]) => loadOne(name, url))
  ).then(() => undefined);
  return _loadingPromise;
}

export function getAudio(name) {
  return _elements[name];
}

let _musicHandle = null;
let _currentTrack = null;

let _firstGesture = typeof document === 'undefined';
let _pendingMusic = null;
if (typeof document !== 'undefined') {
  const unlock = () => {
    _firstGesture = true;
    for (const el of Object.values(_elements)) {
      const p = el.play();
      if (p?.then) p.then(() => { el.pause(); el.currentTime = 0; }).catch(() => {});
    }
    if (_pendingMusic) {
      const { name, volume } = _pendingMusic;
      _pendingMusic = null;
      playMusic(name, volume);
    }
  };
  document.addEventListener('pointerdown', unlock, { once: true, capture: true });
  document.addEventListener('keydown', unlock, { once: true, capture: true });
  document.addEventListener('touchstart', unlock, { once: true, capture: true });
}

async function playMusic(name, volume) {
  if (!_firstGesture) {
    _pendingMusic = { name, volume };
    return;
  }
  try {
    await loadAudio();
  } catch (e) {
    console.warn(`playMusic(${name}): load failed`, e);
    return;
  }
  if (!world.mixer) return;
  if (_currentTrack === name && _musicHandle && !_musicHandle._stopped) return;
  stopMusic();
  _musicHandle = world.mixer.play(name, {
    channel: 'music',
    loop: true,
    volume
  });
  _currentTrack = name;
}

function stopMusic() {
  _musicHandle?.stop?.();
  _musicHandle = null;
  _currentTrack = null;
}

export const startBgMusic = () => playMusic('bg', 0.55);
export const startMenuMusic = () => playMusic('bg', 0.5);

export function playSfx(name, opts = {}) {
  if (!world.mixer) return;
  world.mixer.play(name, { channel: 'sfx', ...opts });
}
