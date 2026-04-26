import {
  TOWERS, UPGRADE_MAX_TIER, upgradeCost, effectiveStats, pickArtTier
} from '../data/towers.js';
import { TILE_SIZE, TURRET_H } from '../config.js';
import { world } from '../world.js';
import { Projectile } from './projectile.js';

export function Tower({ x, y, type, waveAdded = 0 }) {
  const def = TOWERS[type];
  if (!def) throw Error(`Tower: unknown type "${type}"`);

  return {
    x, y,
    type,
    def,
    waveAdded,
    upgrades: { damage: 0, fireRate: 0, reload: 0 },
    isTower: true,

    _totalSpent: def.cost,
    _mag: def.base.magSize,
    _reloading: false,
    _reloadElapsed: 0,
    _cooldown: 0,
    _aimAngle: -Math.PI / 2,
    _animFrame: 0,
    _animTime: 0,
    _animPlaying: false,
    _animSlot: null,

    get stats() { return effectiveStats(def.base, this.upgrades); },
    get damage()       { return this.stats.damage; },
    get fireRate()     { return this.stats.fireRate; },
    get reloadTime()   { return this.stats.reloadTime; },
    get magSize()      { return def.base.magSize; },
    get range()        { return def.base.range; },
    get color()        { return def.color; },

    totalLevel() {
      return this.upgrades.damage + this.upgrades.fireRate + this.upgrades.reload;
    },

    canUpgrade(path) {
      return (this.upgrades[path] ?? 0) < UPGRADE_MAX_TIER;
    },
    upgradeCost(path) {
      return upgradeCost(this.upgrades[path] ?? 0);
    },
    applyUpgrade(path) {
      if (!this.canUpgrade(path)) return false;
      this._totalSpent += this.upgradeCost(path);
      this.upgrades[path] = (this.upgrades[path] ?? 0) + 1;
      return true;
    },

    resetForWave() {
      this._mag = this.magSize;
      this._reloading = false;
      this._reloadElapsed = 0;
      this._cooldown = 0;
      this._animPlaying = false;
      this._animFrame = 0;
      this._animTime = 0;
      this._animSlot = null;
    },

    sellRefund(ctx = world) {
      const upcoming = ctx.wave + 1;
      const waveRunning = ctx.fsm?.current === 'playing';
      if (this.waveAdded === upcoming && !waveRunning) return this._totalSpent;
      return Math.floor(this._totalSpent * 0.75);
    },

    _sheet() {
      const tier = pickArtTier(this.upgrades.fireRate);
      const name = def.art?.sheets[tier];
      const img = name && world.getSprite(name);
      const frameH = def.art?.frameH ?? TURRET_H;
      const frameCount = img ? Math.max(1, Math.floor(img.height / frameH)) : 1;
      return { img, frameH, frameCount };
    },

    findTarget() {
      const r2 = this.range * this.range;
      let best = null;
      let bestDist = r2;
      for (const e of world.enemies) {
        if (e.dead || e.escaped) continue;
        const dx = e.x - this.x;
        const dy = e.y - this.y;
        const d = dx * dx + dy * dy;
        if (d <= bestDist) {
          best = e;
          bestDist = d;
        }
      }
      return best;
    },

    update(dt) {
      const target = this.findTarget();
      if (target) {
        this._aimAngle = Math.atan2(target.y - this.y, target.x - this.x);
      }

      if (this._animPlaying) {
        const { frameCount } = this._sheet();
        const step = 1 / (def.art?.fps ?? 16);
        this._animTime += dt;
        while (this._animTime >= step) {
          this._animTime -= step;
          this._animFrame += 1;
          if (this._animFrame >= frameCount) {
            this._animFrame = 0;
            this._animTime = 0;
            this._animPlaying = false;
            break;
          }
        }
      }

      if (this._reloading) {
        this._reloadElapsed += dt;
        if (this._reloadElapsed >= this.reloadTime) {
          this._mag = this.magSize;
          this._reloading = false;
          this._reloadElapsed = 0;
        }
        return;
      }

      if (this._cooldown > 0) {
        this._cooldown -= dt;
        return;
      }

      if (!target) return;

      this._cooldown = 1 / this.fireRate;
      this._mag -= 1;

      this._animPlaying = true;
      this._animFrame = 0;
      this._animTime = 0;
      this._animSlot = def.art?.cycleAnimByMag
        ? def.base.magSize - this._mag - 1
        : null;

      const s = this.stats;
      const spriteName = def.projectileSprite;
      if (s.pellets > 1) {
        for (let i = 0; i < s.pellets; i++) {
          const a = this._aimAngle + (Math.random() - 0.5) * s.spread;
          const speed = s.projectileSpeed;
          world.projectiles.push(Projectile({
            x: this.x,
            y: this.y,
            damage: s.damage,
            speed,
            dx: Math.cos(a) * speed,
            dy: Math.sin(a) * speed,
            ttl: s.pelletTtl,
            color: this.color,
            slow: s.slow,
            homing: false,
            spriteName
          }));
        }
      } else {
        world.projectiles.push(Projectile({
          x: this.x,
          y: this.y,
          target,
          damage: s.damage,
          speed: s.projectileSpeed,
          color: this.color,
          slow: s.slow,
          explosionRadius: s.explosionRadius,
          spriteName
        }));
      }

      world.playSfx(`${this.type}_fire`, { volume: 0.35 });

      if (this._mag <= 0) {
        this._reloading = true;
        this._reloadElapsed = 0;
        world.playSfx(`${this.type}_reload`, { volume: 0.4 });
      }
    },

    render() {
      const ctx = world.context;
      const half = TILE_SIZE / 2;

      const slot = world.getSprite('slot_empty');
      if (slot) {
        ctx.drawImage(slot, this.x - half, this.y - half, TILE_SIZE, TILE_SIZE);
      } else {
        ctx.fillStyle = '#1a1d28';
        ctx.fillRect(this.x - half, this.y - half, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x - half + 0.5, this.y - half + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
      }

      const { img: sheet, frameH, frameCount } = this._sheet();

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this._aimAngle + Math.PI / 2);
      if (sheet) {
        const reverse = !!def.art?.reverseAnimation;
        let idx;
        if (this._animPlaying && this._animSlot !== null && this._animSlot !== undefined) {
          const sliceLen = Math.max(1, Math.floor(frameCount / def.base.magSize));
          const local = this._animFrame % sliceLen;
          const display = reverse ? (sliceLen - 1) - local : local;
          idx = this._animSlot * sliceLen + display;
        } else if (this._animPlaying) {
          const f = ((this._animFrame % frameCount) + frameCount) % frameCount;
          idx = reverse ? (frameCount - 1) - f : f;
        } else {
          idx = reverse ? Math.max(0, frameCount - 3) : 0;
        }
        world.drawFrame(ctx, sheet, frameH, idx,
          -half, -TURRET_H + half, TILE_SIZE, TURRET_H);
      } else {
        ctx.fillStyle = this.color;
        ctx.fillRect(-half, -TURRET_H + half, TILE_SIZE, TURRET_H);
        ctx.strokeStyle = 'rgba(0,0,0,0.45)';
        ctx.lineWidth = 1;
        ctx.strokeRect(-half + 0.5, -TURRET_H + half + 0.5, TILE_SIZE - 1, TURRET_H - 1);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(-3, -TURRET_H + half, 6, 6);
      }
      ctx.restore();

      const total = this.totalLevel();
      for (let i = 0; i < Math.min(total, 5); i++) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x - 10 + i * 4, this.y + half - 4, 2, 2);
      }

      const bw = 28;
      const bh = 4;
      const bx = this.x - bw / 2;
      const by = this.y - half - 8;
      ctx.fillStyle = '#222';
      ctx.fillRect(bx, by, bw, bh);
      if (this._reloading) {
        const p = this._reloadElapsed / this.reloadTime;
        ctx.fillStyle = '#cf7e7e';
        ctx.fillRect(bx, by, bw * p, bh);
      } else {
        const p = this._mag / this.magSize;
        ctx.fillStyle = '#7ec88a';
        ctx.fillRect(bx, by, bw * p, bh);
      }
    },

    renderRange() {
      const ctx = world.context;
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
      ctx.stroke();
    }
  };
}
