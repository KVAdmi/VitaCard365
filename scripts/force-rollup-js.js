// Force Rollup to use the JS implementation by patching native loader safely
// This avoids CI failures looking for @rollup/rollup-<platform> optional deps.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

function patchNativeToJS(rootDir) {
  const distDir = join(rootDir, 'node_modules', 'rollup', 'dist');
  const nativePathCJS = join(distDir, 'native.js');
  const fallbackPath = join(distDir, 'rollup.js');

  if (!existsSync(fallbackPath)) {
    return; // Nothing to patch or rollup not installed yet
  }

  try {
    // Patch CJS native.js
    if (existsSync(nativePathCJS)) {
      const originalCJS = readFileSync(nativePathCJS, 'utf8');
      if (!originalCJS.includes("require('./rollup.js')")) {
        const patchedCJS = `"use strict";\nmodule.exports = require('./rollup.js');\n`;
        writeFileSync(nativePathCJS, patchedCJS, 'utf8');
        console.log('[force-rollup-js] Patched rollup/dist/native.js to use rollup.js');
      }
    }
    // No tocar ESM dist/es/native.js para preservar named exports parse/parseAsync
  } catch (err) {
    console.warn('[force-rollup-js] Failed to patch rollup native loader:', err?.message || err);
  }
}

// Run from repo root
patchNativeToJS(process.cwd());
