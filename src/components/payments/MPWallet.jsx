import { useEffect, useState } from 'react';

export default function MPWallet({ plan='Individual', frequency='Mensual', amount=199 }) {
  const [reason, setReason] = useState(''); // si hay razón => fallback visible

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Acepta 1/true/yes (evita que la flag mal formateada te apague el brick)
        const enabled = /^(1|true|yes)$/i.test(String(import.meta.env.VITE_ENABLE_MP || '').trim());
        if (!enabled) throw new Error(`flag_off:${import.meta.env.VITE_ENABLE_MP}`);

        const api = String(import.meta.env.VITE_API_BASE_URL || '').trim();
        if (!api) throw new Error('no_api_env');

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
          await new Promise((ok, err) => {
            const s = document.createElement('script');
            s.src = 'https://sdk.mercadopago.com/js/v2';
            s.async = true;
            s.onload = ok;
            s.onerror = () => err(new Error('sdk_fail'));
            document.body.appendChild(s);
          });
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
      </div>
    );
  }
  return <div id="mp_wallet_container" className="w-full" />;
}
