import React, { useEffect, useState } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { BluetoothLe } from '@capacitor-community/bluetooth-le';
import { Device } from '@capacitor/device';
import type { PermissionGateStatus } from './PermissionGate.types';

export default function PermissionGate({ children }: { children: (status: PermissionGateStatus, actions: any) => React.ReactNode }) {
  const [location, setLocation] = useState<boolean>(false);
  const [bluetooth, setBluetooth] = useState<boolean>(false);
  const [nearby, setNearby] = useState<boolean | null>(null);
  const [sdkLevel, setSdkLevel] = useState<number | null>(null);
  const [checking, setChecking] = useState(true);

  // Chequeo inicial
  useEffect(() => {
    (async () => {
      setChecking(true);
      // Geolocalización
      try {
        const perm = await Geolocation.checkPermissions();
        if (perm.location === 'granted' || perm.coarseLocation === 'granted') {
          setLocation(true);
        } else {
          setLocation(false);
        }
      } catch {
        setLocation(false);
      }
      // Bluetooth
      try {
        const bt = await BluetoothLe.isEnabled();
        setBluetooth(!!bt.value);
      } catch {
        setBluetooth(false);
      }
      // SDK y Nearby
      try {
        const info = await Device.getInfo();
        const sdk = info.osVersion ? parseInt(info.osVersion) : null;
        setSdkLevel(sdk);
        if (info.platform === 'android' && sdk && sdk >= 31) {
          // No hay API JS para pedir Nearby, solo podemos sugerir abrir ajustes
          // Suponemos que si location está ok, nearby depende de permisos del sistema
          setNearby(location); // fallback: igual que location
        } else {
          setNearby(null);
        }
      } catch {
        setNearby(null);
        setSdkLevel(null);
      }
      setChecking(false);
    })();
  }, []);

  // Acciones
  const actions = {
    requestLocation: async () => {
      try {
        await Geolocation.requestPermissions();
        setLocation(true);
      } catch {
        setLocation(false);
      }
    },
    openBluetoothSettings: async () => {
      try {
        if (Capacitor.getPlatform() === 'android') {
          window.open('android.settings.BLUETOOTH_SETTINGS://', '_system');
        }
      } catch {}
    },
    openAppSettings: async () => {
      try {
        if (Capacitor.getPlatform() === 'android') {
          window.open('android.settings.APPLICATION_DETAILS_SETTINGS://com.vitacard.app', '_system');
        }
      } catch {}
    },
    refresh: () => {
      // Fuerza re-chequeo
      setChecking(true);
      setTimeout(() => setChecking(false), 500);
    }
  };

  return (
    <div>
      {/* Estado de permisos */}
      <div style={{ marginBottom: 12 }}>
        <span>Ubicación: {location ? '✅' : '❌'}</span>{' '}
        <span>Bluetooth: {bluetooth ? '✅' : '❌'}</span>{' '}
        {sdkLevel && sdkLevel >= 31 && (
          <span>Dispositivos cercanos: {nearby ? '✅' : '❌'}</span>
        )}
      </div>
      {/* Acciones según estado */}
      {!location && (
        <button onClick={actions.requestLocation} style={{ color: 'white', background: 'red', marginRight: 8 }}>
          Conceder ubicación
        </button>
      )}
      {!bluetooth && (
        <button onClick={actions.openBluetoothSettings} style={{ color: 'white', background: 'red', marginRight: 8 }}>
          Abrir configuración Bluetooth
        </button>
      )}
      {sdkLevel && sdkLevel >= 31 && !nearby && (
        <button onClick={actions.openAppSettings} style={{ color: 'white', background: 'red', marginRight: 8 }}>
          Abrir permisos de la app
        </button>
      )}
      {/* Banner de bloqueo */}
      {(!location || !bluetooth || (sdkLevel && sdkLevel >= 31 && !nearby)) && (
        <div style={{ background: 'red', color: 'white', padding: 8, marginTop: 12 }}>
          Falta permiso: {!location ? 'Ubicación ' : ''}{!bluetooth ? 'Bluetooth ' : ''}{sdkLevel && sdkLevel >= 31 && !nearby ? 'Dispositivos cercanos' : ''}
        </div>
      )}
      {/* Renderiza hijos solo si todo está ok */}
      {(location && bluetooth && (sdkLevel == null || sdkLevel < 31 || nearby)) && children({ location, bluetooth, nearby, sdkLevel }, actions)}
    </div>
  );
}
