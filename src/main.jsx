
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import initReactFastclick from 'react-fastclick';
import { Capacitor } from '@capacitor/core';

initReactFastclick();

const isAndroid = Capacitor.getPlatform && Capacitor.getPlatform() === 'android';

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
