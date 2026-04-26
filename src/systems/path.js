
import {
  CANVAS_W, PATH_PADDING, PATH_WAYPOINTS, TILE_SIZE,
  PLAYFIELD_TOP, PLAYFIELD_BOTTOM, PLAYFIELD_H,
  homeBaseFor
} from '../config.js';

function snap(v) {
  return Math.round(v / TILE_SIZE) * TILE_SIZE;
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

const ALL_EDGES = ['top', 'bottom', 'left', 'right'];

export const PATH_AVOID_RADIUS = 18 + 16 + 6;
const MAX_PATH_ATTEMPTS = 24;

function randEdgePoint(edge, rng = Math.random) {
  const pad = PATH_PADDING;
  switch (edge) {
    case 'top':    return { x: snap(pad + rng() * (CANVAS_W - 2 * pad)), y: PLAYFIELD_TOP, edge };
    case 'bottom': return { x: snap(pad + rng() * (CANVAS_W - 2 * pad)), y: PLAYFIELD_BOTTOM, edge };
    case 'left':   return { x: 0, y: snap(PLAYFIELD_TOP + pad + rng() * (PLAYFIELD_H - 2 * pad)), edge };
    case 'right':  return { x: CANVAS_W, y: snap(PLAYFIELD_TOP + pad + rng() * (PLAYFIELD_H - 2 * pad)), edge };
  }
  return { x: 0, y: 0, edge };
}

function pickStartEdge(rng, excludeEdge) {
  const candidates = ALL_EDGES.filter(e => e !== excludeEdge);
  return candidates[Math.floor(rng() * candidates.length)];
}

function buildWaypoints(start, end, count, rng = Math.random) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;          
  const ny = dx / len;
  const maxJitter = Math.min(CANVAS_W, PLAYFIELD_H) * 0.2;

  const intermediates = [];
  for (let i = 1; i <= count; i++) {
    const t = i / (count + 1);
    const lx = start.x + dx * t;
    const ly = start.y + dy * t;
    const taper = Math.sin(Math.PI * t);
    const j = (rng() * 2 - 1) * maxJitter * taper;
    const px = lx + nx * j;
    const py = ly + ny * j;
    const cx = clamp(px, PATH_PADDING, CANVAS_W - PATH_PADDING);
    const cy = clamp(py, PLAYFIELD_TOP + PATH_PADDING, PLAYFIELD_BOTTOM - PATH_PADDING);
    intermediates.push({ x: snap(cx), y: snap(cy) });
  }

  const points = [start];
  let prev = start;
  for (const next of [...intermediates, end]) {
    if (next.x !== prev.x && next.y !== prev.y) {
      const horizFirst = rng() < 0.5;
      const elbow = horizFirst
        ? { x: next.x, y: prev.y }
        : { x: prev.x, y: next.y };
      points.push(elbow);
    }
    points.push(next);
    prev = next;
  }
  return points;
}

function polylineLength(points) {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return total;
}

function pointToSegmentDistSq(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) {
    const ex = p.x - a.x;
    const ey = p.y - a.y;
    return ex * ex + ey * ey;
  }
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  if (t < 0) t = 0;
  else if (t > 1) t = 1;
  const cx = a.x + t * dx;
  const cy = a.y + t * dy;
  const ex = p.x - cx;
  const ey = p.y - cy;
  return ex * ex + ey * ey;
}

export function isPolylineClearOf(points, blockers, threshold = PATH_AVOID_RADIUS) {
  if (!blockers || !blockers.length) return true;
  const t2 = threshold * threshold;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    for (const blk of blockers) {
      if (pointToSegmentDistSq(blk, a, b) < t2) return false;
    }
  }
  return true;
}

function countBlockerViolations(points, blockers, threshold = PATH_AVOID_RADIUS) {
  if (!blockers || !blockers.length) return 0;
  const t2 = threshold * threshold;
  let n = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    for (const blk of blockers) {
      if (pointToSegmentDistSq(blk, a, b) < t2) n++;
    }
  }
  return n;
}

function segmentsCross(a, b, c, d) {
  const horizAB = a.y === b.y;
  const horizCD = c.y === d.y;

  if (horizAB === horizCD) {
    if (horizAB) {
      if (a.y !== c.y) return false;
      const aMin = Math.min(a.x, b.x), aMax = Math.max(a.x, b.x);
      const cMin = Math.min(c.x, d.x), cMax = Math.max(c.x, d.x);
      return Math.max(aMin, cMin) < Math.min(aMax, cMax);
    }
    if (a.x !== c.x) return false;
    const aMin = Math.min(a.y, b.y), aMax = Math.max(a.y, b.y);
    const cMin = Math.min(c.y, d.y), cMax = Math.max(c.y, d.y);
    return Math.max(aMin, cMin) < Math.min(aMax, cMax);
  }

  const h = horizAB ? [a, b] : [c, d];
  const v = horizAB ? [c, d] : [a, b];
  const hY = h[0].y;
  const hMinX = Math.min(h[0].x, h[1].x);
  const hMaxX = Math.max(h[0].x, h[1].x);
  const vX = v[0].x;
  const vMinY = Math.min(v[0].y, v[1].y);
  const vMaxY = Math.max(v[0].y, v[1].y);
  return vX > hMinX && vX < hMaxX && hY > vMinY && hY < vMaxY;
}

export function countSelfIntersections(points) {
  let n = 0;
  for (let i = 0; i < points.length - 1; i++) {
    for (let j = i + 2; j < points.length - 1; j++) {
      if (segmentsCross(points[i], points[i + 1], points[j], points[j + 1])) n++;
    }
  }
  return n;
}

function countNearParallel(points, minDist = PATH_AVOID_RADIUS + 4) {
  let n = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a1 = points[i], a2 = points[i + 1];
    const horizA = a1.y === a2.y;
    for (let j = i + 2; j < points.length - 1; j++) {
      const b1 = points[j], b2 = points[j + 1];
      const horizB = b1.y === b2.y;
      if (horizA !== horizB) continue;
      if (horizA) {
        if (Math.abs(a1.y - b1.y) >= minDist) continue;
        const aMin = Math.min(a1.x, a2.x), aMax = Math.max(a1.x, a2.x);
        const bMin = Math.min(b1.x, b2.x), bMax = Math.max(b1.x, b2.x);
        if (Math.max(aMin, bMin) < Math.min(aMax, bMax)) n++;
      } else {
        if (Math.abs(a1.x - b1.x) >= minDist) continue;
        const aMin = Math.min(a1.y, a2.y), aMax = Math.max(a1.y, a2.y);
        const bMin = Math.min(b1.y, b2.y), bMax = Math.max(b1.y, b2.y);
        if (Math.max(aMin, bMin) < Math.min(aMax, bMax)) n++;
      }
    }
  }
  return n;
}

export function createPath({
  rng = Math.random,
  waypoints = PATH_WAYPOINTS,
  end = homeBaseFor(1),
  avoid = []
} = {}) {
  const start = randEdgePoint(pickStartEdge(rng, end.edge), rng);

  let points;
  let bestPoints = null;
  let bestScore = Infinity;
  for (let attempt = 0; attempt < MAX_PATH_ATTEMPTS; attempt++) {
    points = buildWaypoints(start, end, waypoints, rng);
    const score = countSelfIntersections(points) * 100
                + countNearParallel(points) * 20
                + countBlockerViolations(points, avoid);
    if (score === 0) {
      bestPoints = points;
      break;
    }
    if (score < bestScore) {
      bestScore = score;
      bestPoints = points;
    }
  }
  points = bestPoints ?? points;
  const length = polylineLength(points);

  const cum = new Array(points.length);
  cum[0] = 0;
  for (let i = 1; i < points.length; i++) {
    cum[i] = cum[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }

  function sample(t) {
    if (t <= 0) return { x: points[0].x, y: points[0].y };
    if (t >= 1) return { x: points[points.length - 1].x, y: points[points.length - 1].y };
    const target = t * length;
    for (let i = 1; i < points.length; i++) {
      if (cum[i] >= target) {
        const seg = cum[i] - cum[i - 1];
        const local = (target - cum[i - 1]) / (seg || 1);
        const a = points[i - 1];
        const b = points[i];
        return { x: a.x + (b.x - a.x) * local, y: a.y + (b.y - a.y) * local };
      }
    }
    return { x: points[points.length - 1].x, y: points[points.length - 1].y };
  }

  return { start, end, waypoints: points, length, sample };
}
