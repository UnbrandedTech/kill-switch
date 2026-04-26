
const inEnv = typeof globalThis.ytgame !== 'undefined' && globalThis.ytgame.IN_PLAYABLES_ENV === true;

const LOCAL_KEY = 'kill-switch:save';

function localLoad() {
  try {
    return localStorage.getItem(LOCAL_KEY) ?? '';
  } catch {
    return '';
  }
}

function localSave(str) {
  try {
    localStorage.setItem(LOCAL_KEY, str);
  } catch {
  }
}

export const playables = {
  get inEnv() { return inEnv; },

  firstFrameReady() {
    if (inEnv) globalThis.ytgame.game.firstFrameReady();
  },
  gameReady() {
    if (inEnv) globalThis.ytgame.game.gameReady();
  },

  onPause(handler) {
    if (inEnv) return globalThis.ytgame.system.onPause(handler);
    const fn = () => { if (document.hidden) handler(); };
    document.addEventListener('visibilitychange', fn);
    return () => document.removeEventListener('visibilitychange', fn);
  },

  onResume(handler) {
    if (inEnv) return globalThis.ytgame.system.onResume(handler);
    const fn = () => { if (!document.hidden) handler(); };
    document.addEventListener('visibilitychange', fn);
    return () => document.removeEventListener('visibilitychange', fn);
  },

  onAudioEnabledChange(handler) {
    if (inEnv) return globalThis.ytgame.system.onAudioEnabledChange(handler);
    handler(true);
    return () => {};
  },

  async loadData() {
    if (inEnv) {
      try {
        return await globalThis.ytgame.game.loadData();
      } catch (e) {
        console.warn('playables.loadData failed', e);
        this.logError();
        return '';
      }
    }
    return localLoad();
  },

  async saveData(str) {
    if (typeof str !== 'string') throw Error('playables.saveData expects a string');
    if (inEnv) {
      try {
        await globalThis.ytgame.game.saveData(str);
      } catch (e) {
        console.warn('playables.saveData failed', e);
        this.logError();
      }
      return;
    }
    localSave(str);
  },

  sendScore(value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) return;
    if (inEnv) {
      try { globalThis.ytgame.engagement.sendScore({ value }); }
      catch (e) { console.warn('playables.sendScore failed', e); this.logError(); }
    }
  },

  requestInterstitial() {
    if (inEnv) {
      return globalThis.ytgame.ads.requestInterstitialAd().catch(() => undefined);
    }
    return Promise.resolve();
  },
  requestRewarded(rewardId) {
    if (inEnv) {
      return globalThis.ytgame.ads.requestRewardedAd(rewardId).catch(() => false);
    }
    return Promise.resolve(false);
  },

  async getLanguage() {
    if (inEnv) {
      try { return await globalThis.ytgame.system.getLanguage(); }
      catch { return navigator.language || 'en-US'; }
    }
    return navigator.language || 'en-US';
  },

  logError() {
    if (inEnv) globalThis.ytgame.health.logError();
  },
  logWarning() {
    if (inEnv) globalThis.ytgame.health.logWarning();
  }
};
