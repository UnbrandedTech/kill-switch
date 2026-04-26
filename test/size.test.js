
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { statSync, existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const ZIP = join(ROOT, 'dist.zip');
const LIMIT = 4 * 1024 * 1024; 

let _buildErr = null;
let _zipErr = null;

function hasZipBinary() {
  try {
    execSync('command -v zip', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

before(() => {
  try {
    execSync('npm run build --silent', { cwd: ROOT, stdio: 'pipe' });
  } catch (e) {
    _buildErr = e;
    return;
  }

  if (!hasZipBinary()) {
    _zipErr = Error('`zip` binary not found on PATH');
    return;
  }

  rmSync(ZIP, { force: true });
  try {
    execSync('zip -r -q -X -9 ../dist.zip .', { cwd: DIST, stdio: 'pipe' });
  } catch (e) {
    _zipErr = e;
  }
});

test('production build succeeds', () => {
  assert.equal(_buildErr, null, _buildErr ? `build failed: ${_buildErr.message}` : '');
  assert.ok(existsSync(DIST), 'dist/ should exist after build');
});

test(`zip is at most ${LIMIT / 1024} KiB`, { skip: _zipErr ? `zip step failed: ${_zipErr.message}` : false }, () => {
  const size = statSync(ZIP).size;
  const pct = (size / LIMIT * 100).toFixed(1);
  assert.ok(
    size <= LIMIT,
    `dist.zip is ${size} bytes (${pct}% of ${LIMIT}); over budget by ${size - LIMIT} bytes`
  );
});

test('zip contains index.html at top level', { skip: _zipErr ? `zip step failed: ${_zipErr.message}` : false }, () => {
  const listing = execSync(`unzip -l "${ZIP}"`).toString();
  const lines = listing.split(/\n/).map(l => l.trim());
  const topLevelIndex = lines.some(l => /\s+index\.html$/.test(l));
  assert.ok(topLevelIndex, `index.html not at top level. Listing:\n${listing}`);
});
