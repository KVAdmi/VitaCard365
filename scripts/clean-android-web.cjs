const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Elimina android/app/src/main/assets/public para forzar una copia fresca de dist/
const assetsPublic = path.resolve(__dirname, '..', 'android', 'app', 'src', 'main', 'assets', 'public');

function rimrafWinAttributes(dir) {
  if (process.platform !== 'win32') return;
  try {
    execSync(`attrib -r -h -s /s /d "${dir}\\*"`, { stdio: 'ignore' });
  } catch {}
}

function removeDir(dir) {
  if (!fs.existsSync(dir)) return false;
  try {
    rimrafWinAttributes(dir);
    fs.rmSync(dir, { recursive: true, force: true });
    return !fs.existsSync(dir);
  } catch (e) {
    console.warn('[clean-android-web] Error removing dir:', e.message);
    return false;
  }
}

const removed = removeDir(assetsPublic);
console.log(`[clean-android-web] assets/public removed: ${removed}`);
