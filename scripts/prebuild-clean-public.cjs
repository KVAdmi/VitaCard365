const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 0) Limpieza fuerte de dist/ para evitar EBUSY (p. ej., dist/.htaccess bloqueado en Windows)
const distDir = path.resolve(__dirname, '..', 'dist');

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function safeRemoveDist(dir) {
  if (!fs.existsSync(dir)) return;
  const isWin = process.platform === 'win32';

  // Normaliza atributos en Windows (quita ReadOnly/Hidden/System) para todos los archivos dentro de dist
  if (isWin) {
    try {
      // Quita atributos recursivamente; ignora errores si no existe
      execSync(`attrib -r -h -s /s /d "${dir}\\*"`, { stdio: 'ignore' });
    } catch {}
  }

  // Reintentos para manejar EBUSY/EPERM transitorios
  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
      if (!fs.existsSync(dir)) {
        console.log(`[prebuild] Removed dist (attempt ${attempt})`);
        break;
      }
    } catch (e) {
      const code = e && e.code;
      if (code === 'EBUSY' || code === 'EPERM') {
        // En Windows intenta además desbloquear archivos puntuales problemáticos como .htaccess
        if (isWin) {
          try {
            const ht = path.join(dir, '.htaccess');
            if (fs.existsSync(ht)) {
              try { fs.chmodSync(ht, 0o666); } catch {}
              try { execSync(`attrib -r -h -s "${ht}"`, { stdio: 'ignore' }); } catch {}
              try { fs.unlinkSync(ht); } catch {}
            }
          } catch {}
        }
        console.warn(`[prebuild] dist removal busy (attempt ${attempt}), retrying...`);
        await sleep(200 * attempt);
        continue;
      }
      console.warn('[prebuild] Warning (dist):', e.message);
      break;
    }
  }
}

// Ejecuta limpieza de dist de forma sincrónica en el flujo (espera promesa)
(async () => {
  try {
    await safeRemoveDist(distDir);
  } catch (e) {
    console.warn('[prebuild] Warning removing dist:', e.message);
  }
})();

// 1) Limpieza defensiva: eliminar un public/index.html sospechoso
const publicDir = path.resolve(__dirname, '..', 'public');
const idxPublic = path.join(publicDir, 'index.html');
try {
  if (fs.existsSync(idxPublic)) {
    const content = fs.readFileSync(idxPublic, 'utf8');
    // Heurística: si el index contiene "Hostinger Horizons" o referencia directa a assets/index-*.js, borrarlo
    if (content.includes('Hostinger Horizons') || content.includes('assets/index-')) {
      fs.unlinkSync(idxPublic);
      console.log('[prebuild] Removed public/index.html (external template)');
    }
  }
} catch (e) {
  console.warn('[prebuild] Warning (public):', e.message);
}

// 2) Reparación: si el index.html de raíz fue reemplazado por una plantilla externa,
// reescribirlo con el HTML de entrada de Vite correcto.
const idxRoot = path.resolve(__dirname, '..', 'index.html');
try {
  if (fs.existsSync(idxRoot)) {
    const content = fs.readFileSync(idxRoot, 'utf8');
    const looksExternal =
      content.includes('Hostinger Horizons') ||
      content.includes('generator" content="Hostinger') ||
      // archivos ya empacados en ./assets/xxx durante desarrollo es una señal de index construido/subido
      content.includes('src="./assets/index-') ||
      content.includes('href="./assets/index-');

    if (looksExternal) {
  const viteIndex = `<!doctype html>\n<html lang="es">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>VitaCard 365</title>\n    <link rel="manifest" href="/manifest.json" />\n    <meta name="theme-color" content="#0d2041" />\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.jsx"></script>\n  </body>\n</html>\n`;
      fs.writeFileSync(idxRoot, viteIndex, 'utf8');
      console.log('[prebuild] Rewrote root index.html to Vite entry');
    }
  } else {
    // Si no existe por alguna razón, crear uno válido para Vite
  const viteIndex = `<!doctype html>\n<html lang="es">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>VitaCard 365</title>\n    <link rel="manifest" href="/manifest.json" />\n    <meta name="theme-color" content="#0d2041" />\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.jsx"></script>\n  </body>\n</html>\n`;
    fs.writeFileSync(idxRoot, viteIndex, 'utf8');
    console.log('[prebuild] Created missing root index.html (Vite entry)');
  }
} catch (e) {
  console.warn('[prebuild] Warning (root):', e.message);
}
