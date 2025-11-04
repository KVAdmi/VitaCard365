// iOS detection for safe-area utility classes
if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
  document.documentElement.classList.add('ios');
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './styles/layers.css';
import initReactFastclick from 'react-fastclick';
import { Capacitor } from '@capacitor/core';
import { enableHitTestDebug } from './utils/hitTestDebug';

initReactFastclick();

// Solo en desarrollo: habilita utilidades de debug para hit-testing
try { if (import.meta && import.meta.env && import.meta.env.DEV) enableHitTestDebug(); } catch {}

const isAndroid = Capacitor.getPlatform && Capacitor.getPlatform() === 'android';
const protocol = (typeof window !== 'undefined' && window.location?.protocol) || '';
const isNativeEnv = (Capacitor?.isNativePlatform?.() === true) || protocol === 'capacitor:' || protocol === 'file:';

// En nativo: limpiar CacheStorage siempre y desregistrar SW si existe soporte
try {
  if (typeof window !== 'undefined' && isNativeEnv) {
    // Intentar desregistrar SW si el WebView lo soporta
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        const count = regs?.length || 0;
        regs.forEach((r) => r.unregister().catch(() => {}));
        try { console.log('[Init] SW unregistered count=', count); } catch {}
      }).catch(() => {});
    }
    // Limpiar CacheStorage en nativo, independientemente de SW
    if (typeof caches !== 'undefined' && caches.keys) {
      caches.keys().then((keys) => {
        Promise.all(keys.map((k) => caches.delete(k))).then(()=>{
          try { console.log('[Init] CacheStorage cleared'); } catch {}
        });
      }).catch(() => {});
    }
    // Best-effort: limpiar localStorage clave de versión para forzar recarga si se usa
    try {
      localStorage.removeItem('app_build_version');
    } catch {}
  }
} catch {}

// Fuerza ruta de inicio a Intro en nativo (HashRouter)
try {
  if (typeof window !== 'undefined' && isNativeEnv) {
    const hash = window.location.hash || '';
    const path = window.location.pathname || '';
    if (!hash || hash === '#' || hash === '#/index.html' || path.endsWith('/index.html')) {
      window.location.hash = '#/';
      try { console.log('[Init] set hash', window.location.hash); } catch {}
    }
  }
} catch {}

// Silenciar logs huérfanos "undefined" que ensucian logcat
const origLog = console.log;
console.log = (...args) => {
  if (args.length === 1 && args[0] === undefined) return;
  return origLog(...args);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  isAndroid ? (<App />) : (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
);
