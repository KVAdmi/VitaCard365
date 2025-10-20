import { useState } from 'react';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { getDeviceId } from '@/utils/deviceId';
import { useNavigate } from 'react-router-dom';

export default function InvitePage() {
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const nav = useNavigate();

  async function redeem() {
    setErr('');
    try {
      const deviceId = await getDeviceId();
      const res = await fetchWithAuth(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/redeem_kv_code`, {
        method: 'POST',
        body: JSON.stringify({ code, deviceId }),
      });
      if (res.status === 401 || res.status === 403) {
        setErr('No autorizado. Inicia sesión o revisa el token'); return;
      }
      if (!res.ok) { setErr('Error de redención'); return; }

      // Pase temporal activo → set flag y redirigir a /mi-plan
      sessionStorage.setItem('kv_gate', '1');
      alert('Código redimido correctamente');
      nav('/mi-plan');
    } catch {
      setErr('Error de redención');
    }
  }

  return (
    <div className="p-6">
      <h1>Invitación Testers</h1>
      <input value={code} onChange={e => setCode(e.target.value)} placeholder="VITAKV-UNICO" />
      <button onClick={redeem}>Activar</button>
      {err && <p>{err}</p>}
    </div>
  );
}