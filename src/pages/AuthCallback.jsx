import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { fetchAccess } from '@/lib/access';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    (async () => {
      try {
        // Supabase detectSessionInUrl maneja parte de esto en web, pero por si acaso
        const code = params.get('code');
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        }
      } catch {}
      
      // Check if this is a password recovery callback
      const type = params.get('type');
      if (type === 'recovery') {
        // For password recovery, redirect to reset password page in update mode
        navigate('/reset-password?stage=update', { replace: true });
        return;
      }
      
      // Decide adónde ir: si no tiene acceso, a pasarela de pago; si ya está activo, al dashboard
      try {
        const { data } = await supabase.auth.getUser();
        const uid = data?.user?.id || null;
        if (!uid) { navigate('/login', { replace: true }); return; }
        const acc = await fetchAccess(uid);
        const next = params.get('next');
        if (acc?.acceso_activo) {
          navigate(next || '/dashboard', { replace: true });
        } else {
          navigate('/payment-gateway', { replace: true });
        }
      } catch {
        navigate('/login', { replace: true });
      }
    })();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      Procesando autenticación…
    </div>
  );
}
