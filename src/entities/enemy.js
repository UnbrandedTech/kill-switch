import { world } from '../world.js';
import { ENEMY_DESTROYED_SPRITE, ENEMY_DEATH_DURATION, ENEMY_DEATH_FPS } from '../data/enemies.js';

export function Enemy(def, path) {
  return {
    x: path.start.x,
    y: path.start.y,
    radius: def.radius,
    color: def.color,
    type: def.id,
    def,
    hp: def.hp,
    maxHp: def.hp,
    isEnemy: true,
    dead: false,
    escaped: false,

    _t: 0,
    _slowFactor: 1,
    _slowTimer: 0,

    _heading: Math.PI / 2,

    _walkFrame: 0,
    _walkTime: 0,

    _deathTimer: 0,
    get _fullyDead() { return this.dead && this._deathTimer >= ENEMY_DEATH_DURATION; },

    applySlow(factor, duration) {
      if (factor < this._slowFactor || this._slowTimer <= 0) {
        this._slowFactor = factor;
        this._slowTimer = duration;
      }
    },

    takeDamage(amount) {
      if (this.dead) return;
      this.hp -= amount;
      if (this.hp <= 0) {
        this.hp = 0;
        this.dead = true;
        world.playSfx('spawn_died', { volume: 0.4 });
      }
    },

    update(dt) {
      if (this.escaped) return;

      if (this.dead) {
        this._deathTimer += dt;
        return;
      }

      if (this._slowTimer > 0) {
        this._slowTimer -= dt;
        if (this._slowTimer <= 0) {
          this._slowFactor = 1;
          this._slowTimer = 0;
        }
      }

      const speed = this.def.speed * this._slowFactor;
      this._t += (speed * dt) / path.length;
      if (this._t >= 1) {
        this._t = 1;
        this.escaped = true;
        world.hp -= this.def.damageOnEscape;
        world.gold += this.def.gold;
        return;
      }

      const p = path.sample(this._t);
      const dxm = p.x - this.x;
      const dym = p.y - this.y;
      if (dxm * dxm + dym * dym > 0.0001) {
        this._heading = Math.atan2(dym, dxm);
      }
      this.x = p.x;
      this.y = p.y;

      const fps = this.def.walkFps ?? 8;
      this._walkTime += dt;
      const step = 1 / fps;
      while (this._walkTime >= step) {
        this._walkTime -= step;
        this._walkFrame += 1;
      }

      if (import.meta.env.DEV && world.debug?.visible && world.path !== path) {
        console.warn('enemy.path !== world.path — stale closure', {
          enemy: { x: this.x, y: this.y, t: this._t },
          enemyPath: { start: path.start, end: path.end, len: path.length },
          worldPath: world.path && {
            start: world.path.start,
            end: world.path.end,
            len: world.path.length
          }
        });
      }
    },

    render() {
      const ctx = world.context;

      if (this.dead) {
        const sheet = world.getSprite(ENEMY_DESTROYED_SPRITE);
        if (sheet) {
          const frameH = 32;
          const frames = Math.max(1, Math.floor(sheet.height / frameH));
          const idx = Math.min(
            Math.floor(this._deathTimer * ENEMY_DEATH_FPS),
            frames - 1
          );
          world.drawFrame(ctx, sheet, frameH, idx,
            this.x - 16, this.y - 16, 32, 32);
        } else {
          ctx.fillStyle = 'rgba(207,126,126,0.5)';
          ctx.fillRect(this.x - 16, this.y - 16, 32, 32);
        }
        return;
      }

      const sheet = world.getSprite(this.def.sprite);
      if (sheet) {
        const frameH = 32;
        const frames = Math.max(1, Math.floor(sheet.height / frameH));
        const idx = ((this._walkFrame % frames) + frames) % frames;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this._heading + Math.PI / 2);
        world.drawFrame(ctx, sheet, frameH, idx, -16, -16, 32, 32);
        ctx.restore();
      } else {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (this._slowTimer > 0) {
        ctx.strokeStyle = '#88c8e8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 2, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (this.hp < this.maxHp) {
        const w = this.radius * 2;
        const h = 3;
        const bx = this.x - this.radius;
        const by = this.y - this.radius - 6;
        ctx.fillStyle = '#222';
        ctx.fillRect(bx, by, w, h);
        ctx.fillStyle = '#7ec88a';
        ctx.fillRect(bx, by, w * (this.hp / this.maxHp), h);
      }
    }
  };
}
