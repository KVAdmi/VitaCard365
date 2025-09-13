import { useEffect, useState } from 'react';

export default function MPWallet({ plan='Individual', frequency='Mensual', amount=199 }) {
  const [reason, setReason] = useState(''); // si hay razón => fallback visible
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Acepta 1/true/yes (evita que la flag mal formateada te apague el brick)
        const rawFlag = import.meta.env.VITE_ENABLE_MP;
        const enabled = rawFlag === undefined ? true : /^(1|true|yes)$/i.test(String(rawFlag || '').trim());
        
        console.log('MP flag check:', { rawFlag, enabled });
        
        if (!enabled) throw new Error(`flag_off:${rawFlag}`);

        // Usar la URL de la API configurada para producción
        const api = String(import.meta.env.VITE_API_BASE_URL || 'http://54.175.250.15:3000').trim();
        console.log('MP API URL:', api);
        if (!api) throw new Error('no_api_env');
        
        // Guardar información de depuración
        setDebugInfo(prev => ({ ...prev, api, rawFlag, enabled }));

        // 1) preference
        const res = await fetch(`${api}/api/mercadopago/preference`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan, frequency, amount: Number(amount) })
        });
        if (!res.ok) throw new Error(`api_${res.status}`);
        const { preferenceId } = await res.json();
        if (!preferenceId) throw new Error('no_pref');

        // 2) SDK
          if (!window.MercadoPago) {
            throw new Error('sdk_not_loaded');
          }

        // 3) Contenedor presente
        const containerId = 'mp_wallet_container';
        if (!document.getElementById(containerId)) throw new Error('no_container');

        // 4) Montar brick
        const mp = new window.MercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY, { locale: 'es-MX' });
        await mp.bricks().create('wallet', containerId, { initialization: { preferenceId } });

        if (!cancelled) setReason(''); // todo OK
      } catch (e) {
        console.warn('MP fallback:', e?.message || e);
        if (!cancelled) setReason(String(e?.message || 'mp_error'));
      }
    })();

    return () => { cancelled = true; };
  }, [plan, frequency, amount]);

  // Fallback visible con motivo
  if (reason) {
    return (
      <div className="w-full">
        <button disabled className="w-full opacity-60 cursor-not-allowed">Pago deshabilitado</button>
        <p className="text-xs mt-1 opacity-70">Motivo: {reason}</p>
        {/* Información de diagnóstico para desarrolladores */}
        <details className="text-xs mt-1 text-gray-600">
          <summary>Información de diagnóstico</summary>
          <pre className="bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-40">
            {JSON.stringify({
              api: debugInfo.api,
              enabled: debugInfo.enabled,
              mpPublicKey: import.meta.env.VITE_MP_PUBLIC_KEY ? 'Presente' : 'Falta',
              error: reason
            }, null, 2)}
          </pre>
        </details>
      </div>
    );
  }
  return <div id="mp_wallet_container" className="w-full" />;
}
