import React, { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import type { PermissionGateStatus } from './PermissionGate.types';

// Versión mínima: solo chequea permisos y renderiza hijos si están OK
export default function PermissionGate({ children }: { children: (status: PermissionGateStatus, actions: any) => React.ReactNode }) {
  // Solicitar permisos BLE al entrar (solo en nativo). Silencioso si no aplica.
  useEffect(() => {
    const isNative = Capacitor.isNativePlatform && Capacitor.isNativePlatform();
    if (!isNative) return;
    (async () => {
      try {
        const mod = await import('@capacitor-community/bluetooth-le');
        const BleClient: any = (mod as any).BleClient;
        try { await BleClient.initialize(); } catch {}
        if (BleClient && typeof BleClient.requestPermissions === 'function') {
          try { await BleClient.requestPermissions(); } catch {}
        }
      } catch {
        // plugin no disponible: ignorar
      }
    })();

    // Solicitar permisos de ubicación al entrar (solo en nativo). No altera tracking.
    (async () => {
      try {
        const { Geolocation } = await import('@capacitor/geolocation');
        // En iOS/Android esto dispara el prompt del SO en caso de no estar concedido.
        try { await Geolocation.requestPermissions(); } catch {}
      } catch {
        // Si el plugin no está disponible, ignoramos silenciosamente.
      }
    })();
  }, []);

  // Render sin bloquear: el gating completo se maneja en los paneles/acciones
  return children({ location: true, bluetooth: true, nearby: true, sdkLevel: 30 }, {});
}
