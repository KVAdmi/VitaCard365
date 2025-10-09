
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import initReactFastclick from 'react-fastclick';
import { Capacitor } from '@capacitor/core';

initReactFastclick();

const isAndroid = Capacitor.getPlatform && Capacitor.getPlatform() === 'android';

// En nativo: desregistrar cualquier Service Worker previo y limpiar CacheStorage
try {
  if (typeof window !== 'undefined' && window.Capacitor && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      const count = regs?.length || 0;
      regs.forEach((r) => r.unregister().catch(() => {}));
      try { console.log('[Init] SW unregistered count=', count); } catch {}
    }).catch(() => {});
    if (typeof caches !== 'undefined' && caches.keys) {
      caches.keys().then((keys) => {
        Promise.all(keys.map((k) => caches.delete(k))).then(()=>{
          try { console.log('[Init] CacheStorage cleared'); } catch {}
        });
      }).catch(() => {});
    }
  }
} catch {}

// Fuerza ruta de inicio a Intro en nativo (HashRouter)
try {
  if (typeof window !== 'undefined' && window.Capacitor) {
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
  isAndroid ? (
    <App />
  ) : (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
);
