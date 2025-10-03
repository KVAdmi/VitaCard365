// src/components/useToast.ts
import { useCallback } from 'react';
export function useToast() {
  const success = useCallback((msg: string) => {
    const el = document.createElement('div');
    el.textContent = msg;
    el.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-[color:var(--vc-primary,#66f)] text-white shadow-lg z-50';
    document.body.appendChild(el);
    setTimeout(()=>el.remove(), 1800);
  }, []);
  const error = useCallback((msg: string) => {
    const el = document.createElement('div');
    el.textContent = msg;
    el.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-red-600 text-white shadow-lg z-50';
    document.body.appendChild(el);
    setTimeout(()=>el.remove(), 2200);
  }, []);
  return { success, error };
}
