#!/usr/bin/env node
// Bundle size report. Drives a "report mode" build (sourcemap on, visualizer
// plugin enabled), prints a file-by-file breakdown of `dist/`, repacks the
// shipping zip, and shows headroom against the JS13kGames 13 KiB budget.
//
// Usage: `npm run report`

import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync, rmSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const DIST = join(ROOT, 'dist');
const ZIP = join(ROOT, 'dist.zip');
const STATS = join(DIST, 'stats.html');
const LIMIT = 5 * 1024 * 1024; // soft budget; matches test/size.test.js
const JS13K = 13 * 1024;       // JS13kGames cap, kept for reference only

console.log('building with bundle visualizer...');
execSync('npm run build --silent', {
  cwd: ROOT,
  stdio: 'inherit',
  env: { ...process.env, BUNDLE_REPORT: '1' }
});

const files = walk(DIST).map((p) => {
  const rel = relative(DIST, p);
  // Treemap HTML is dev-only output, not part of the shipping bundle.
  if (rel === 'stats.html') return null;
  // Source maps are enabled in report mode but never shipped.
  if (rel.endsWith('.map')) return null;
  const buf = readFileSync(p);
  return {
    file: rel,
    raw: buf.length,
    gzip: gzipSync(buf, { level: 9 }).length
  };
}).filter(Boolean);

const totalRaw = files.reduce((s, f) => s + f.raw, 0);
const totalGzip = files.reduce((s, f) => s + f.gzip, 0);

console.log('\nshippable file breakdown:');
console.log('  ' + 'file'.padEnd(38) + '  ' + 'raw'.padStart(10) + '  ' + 'gzip-9'.padStart(10));
console.log('  ' + '-'.repeat(38) + '  ' + '-'.repeat(10) + '  ' + '-'.repeat(10));
for (const f of files.sort((a, b) => b.raw - a.raw)) {
  console.log(
    '  ' + f.file.padEnd(38) +
    '  ' + bytes(f.raw).padStart(10) +
    '  ' + bytes(f.gzip).padStart(10)
  );
}
console.log('  ' + '-'.repeat(38) + '  ' + '-'.repeat(10) + '  ' + '-'.repeat(10));
console.log('  ' + 'TOTAL'.padEnd(38) +
  '  ' + bytes(totalRaw).padStart(10) +
  '  ' + bytes(totalGzip).padStart(10));

// Build the shipping zip (no .map, no stats.html).
console.log('\npacking shipping zip...');
rmSync(ZIP, { force: true });
execSync(
  'zip -r -q -X -9 ../dist.zip . -x "*.map" -x "stats.html"',
  { cwd: DIST }
);
const zipSize = statSync(ZIP).size;
const pct = (zipSize / LIMIT) * 100;
const headroom = LIMIT - zipSize;
const status = zipSize <= LIMIT ? 'OK' : 'OVER';
const bar = renderBar(zipSize, LIMIT, 40);

console.log('\nsize budget:');
console.log(`  zip   ${bytes(zipSize).padStart(8)} / ${bytes(LIMIT)}  (${pct.toFixed(1)}%)  ${status}`);
console.log('  ' + bar);
if (headroom >= 0) {
  console.log(`  headroom: ${bytes(headroom)} (${(headroom / LIMIT * 100).toFixed(1)}% free)`);
} else {
  console.log(`  over by:  ${bytes(-headroom)}`);
}

// Reference line for what the zip would look like under JS13kGames.
const js13kPct = (zipSize / JS13K * 100).toFixed(1);
const js13kStatus = zipSize <= JS13K ? 'fits' : 'OVER';
console.log(`  vs JS13k cap (13 KiB): ${js13kPct}%  (${js13kStatus})`);

if (existsSync(STATS)) {
  console.log(`\ntreemap: open ${relative(ROOT, STATS)}`);
}

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function bytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(2)} KiB`;
  return `${(n / 1024 / 1024).toFixed(2)} MiB`;
}

function renderBar(value, max, width) {
  const filled = Math.min(width, Math.round((value / max) * width));
  const over = value > max;
  const ch = over ? '!' : '#';
  return '[' + ch.repeat(filled) + '.'.repeat(Math.max(0, width - filled)) + ']';
}
