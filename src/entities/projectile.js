import { world } from '../world.js';

export function Projectile({
  x, y,
  target,
  damage,
  speed,
  color,
  slow,
  dx,
  dy,
  ttl = 2,
  homing,
  explosionRadius = 0,
  spriteName
}) {
  return {
    x, y,
    target,
    damage,
    speed,
    color,
    slow,
    dx,
    dy,
    ttl,
    homing: homing ?? !!target,
    explosionRadius,
    spriteName,
    dead: false,
    isProjectile: true,

    update(dt) {
      if (this.dead) return;

      if (this.homing) {
        const t = this.target;
        if (!t || t.dead || t.escaped) {
          this.dead = true;
          return;
        }
        const ddx = t.x - this.x;
        const ddy = t.y - this.y;
        const dist = Math.hypot(ddx, ddy) || 1;
        const step = this.speed * dt;
        if (step >= dist) {
          t.takeDamage(this.damage);
          if (this.slow) t.applySlow?.(this.slow.factor, this.slow.duration);
          this._explode(t.x, t.y, t);
          this.dead = true;
          return;
        }
        this.x += (ddx / dist) * step;
        this.y += (ddy / dist) * step;
        return;
      }

      this.x += this.dx * dt;
      this.y += this.dy * dt;
      this.ttl -= dt;
      if (this.ttl <= 0) { this.dead = true; return; }
      const list = world.enemies;
      for (let i = 0; i < list.length; i++) {
        const e = list[i];
        if (e.dead || e.escaped) continue;
        const ex = e.x - this.x;
        const ey = e.y - this.y;
        if (ex * ex + ey * ey <= e.radius * e.radius) {
          e.takeDamage(this.damage);
          if (this.slow) e.applySlow?.(this.slow.factor, this.slow.duration);
          this._explode(e.x, e.y, e);
          this.dead = true;
          return;
        }
      }
    },

    _explode(cx, cy, direct) {
      if (!this.explosionRadius) return;
      const r2 = this.explosionRadius * this.explosionRadius;
      for (const e of world.enemies) {
        if (e.dead || e.escaped || e === direct) continue;
        const dxe = e.x - cx;
        const dye = e.y - cy;
        if (dxe * dxe + dye * dye <= r2) {
          e.takeDamage(this.damage);
        }
      }
    },

    render() {
      const ctx = world.context;
      const sprite = this.spriteName && world.getSprite(this.spriteName);

      let angle;
      if (this.homing && this.target && !this.target.dead) {
        angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
      } else if (this.homing) {
        angle = 0;
      } else {
        angle = Math.atan2(this.dy, this.dx);
      }

      if (sprite) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);
        ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
        ctx.restore();
      } else {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };
}
