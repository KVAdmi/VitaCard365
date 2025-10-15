// scripts/verify-android-assets.cjs
// Fails the process if the expected build stamp for FitSyncPage is not present in Android public assets
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'assets', 'public');
const NEEDLE = 'fit-sync-uso-accordion';

function scan(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) {
      scan(p);
    } else {
      try {
        const s = fs.readFileSync(p, 'utf8');
        if (s.includes(NEEDLE)) {
          console.log('OK sello encontrado en:', p);
          process.exit(0);
        }
      } catch (err) {
        // Ignore binary or unreadable files
      }
    }
  }
}

if (!fs.existsSync(ROOT)) {
  console.error('No existe assets/public en Android:', ROOT);
  process.exit(1);
}

scan(ROOT);
console.error('Sello no encontrado en assets/public. Buscado:', NEEDLE);
process.exit(1);
