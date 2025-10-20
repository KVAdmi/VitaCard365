import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useEntitlements } from '@/hooks/useEntitlements';

type Props = { children: React.ReactNode };

export default function CheckoutGate({ children }: Props) {
  const { session } = useAuth();
  const { profile, loading } = useProfile();

  // verificación inmediata del flag (evita flashes)
  const kvGate = typeof window !== 'undefined' && sessionStorage.getItem('kv_gate') === '1';

  const { paywallEnabled } = useEntitlements(session, profile);

  // Mientras no hay perfil y no hay kv_gate -> espera silenciosa
  if (loading && !kvGate) return null;

  // Si el gate está activo (kv_gate) O el hook ya apagó el paywall, salimos del checkout
  if (kvGate || !paywallEnabled) {
    return <Navigate to="/mi-plan" replace />;
  }

  return <>{children}</>;
}