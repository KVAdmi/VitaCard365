import React from 'react';
import { Navigate } from 'react-router-dom';

export default function KvGateHard({ children }: { children: React.ReactNode }) {
  const kv = typeof window !== 'undefined' && sessionStorage.getItem('kv_gate') === '1';
  // Log de verificación, bórralo después:
  console.info('[KV] kv_gate =', sessionStorage.getItem('kv_gate'));

  if (kv) return <Navigate to="/mi-plan" replace />; // si hay pase, NO hay pago
  return <>{children}</>;
}