import { Capacitor } from '@capacitor/core';
import { IVITA_URL } from './config';

let Http = null;
let usingCommunity = false;

try {
  // Capacitor v5 (core)
  // eslint-disable-next-line import/no-unresolved
  Http = require('@capacitor/core').CapacitorHttp;
} catch {
  usingCommunity = true;
}

export async function askIVita(message, history = []) {
  const payload = { input: message, history };
  const platform = Capacitor.getPlatform();
  const isNative = platform !== 'web';
  console.log('[i-Vita] platform=', platform, 'isNative=', isNative, 'usingCommunity=', usingCommunity);

  if (isNative) {
    if (usingCommunity) {
      const mod = '@capacitor-community/http';
      // @vite-ignore evita que Vite lo intente resolver en build
      const { Http: CommunityHttp } = await import(/* @vite-ignore */ mod);
      const res = await CommunityHttp.post({
        url: IVITA_URL,
        headers: { 'Content-Type': 'application/json' },
        data: payload,
      });
      console.log('[i-Vita] native(status)=', res.status);
      if (res.status < 200 || res.status >= 300) throw new Error(res?.data?.error || `HTTP ${res.status}`);
      return res.data?.output || res.data?.text || '…';
    } else {
      const res = await Http.post({
        url: IVITA_URL,
        headers: { 'Content-Type': 'application/json' },
        data: payload,
      });
      console.log('[i-Vita] native(status)=', res.status);
      if (res.status < 200 || res.status >= 300) throw new Error(res?.data?.error || `HTTP ${res.status}`);
      return res.data?.output || res.data?.text || '…';
    }
  }

  // Solo para navegador
  const r = await fetch(IVITA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
  return j.output || j.text || '…';
}
