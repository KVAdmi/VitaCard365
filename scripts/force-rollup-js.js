// Force Rollup to use the JS implementation by patching native loader safely
// This avoids CI failures looking for @rollup/rollup-<platform> optional deps.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

function patchNativeToJS(rootDir) {
  const nativePath = join(rootDir, 'node_modules', 'rollup', 'dist', 'native.js');
  const fallbackPath = join(rootDir, 'node_modules', 'rollup', 'dist', 'rollup.js');

  if (!existsSync(nativePath) || !existsSync(fallbackPath)) {
    return; // Nothing to patch or rollup not installed yet
  }

  try {
    const original = readFileSync(nativePath, 'utf8');
    // If it already prefers JS, skip
    if (original.includes("require('./rollup.js')")) return;

    // Replace the native require logic with direct JS require
    const patched = `"use strict";\nmodule.exports = require('./rollup.js');\n`;
    writeFileSync(nativePath, patched, 'utf8');
    console.log('[force-rollup-js] Patched rollup/dist/native.js to use rollup.js');
  } catch (err) {
    console.warn('[force-rollup-js] Failed to patch rollup native loader:', err?.message || err);
  }
}

// Run from repo root
patchNativeToJS(process.cwd());
