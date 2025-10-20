import { useMemo } from 'react';

/** Calcula flags de paywall basado en gate temporal y perfil del usuario. */
export function useEntitlements(session?: any, profile?: any) {
  // 1) Lee el flag del navegador puesto por /invita
  const kvGate = typeof window !== 'undefined' && sessionStorage.getItem('kv_gate') === '1';

  // 2) Señales “antiguas” (no las quitamos, solo las OR-eamos)
  const isKVTester =
    (profile?.tipo_vita === 'VITAKV') ||
    (Array.isArray(profile?.entitlements) && profile.entitlements.includes('KV_BETA'));

  // 3) Si CUALQUIERA de las señales está activa, el paywall debe estar apagado
  const paywallEnabled = useMemo(() => {
    const hasKV = kvGate || isKVTester;
    return !hasKV; // si hay KV, NO hay paywall
  }, [kvGate, isKVTester]);

  return { isKVTester, paywallEnabled };
}