// Ejemplo de hook React para escanear y conectar BLE nativo (Capacitor)
import { useState, useCallback } from 'react';
import { BluetoothLe } from '@/native/bluetoothLe';

export function useNativeHeartRate() {
  const [status, setStatus] = useState('Listo');
  const [error, setError] = useState('');
  const [device, setDevice] = useState(null);
  const [hr, setHr] = useState(null);

  // Escanear y conectar
  const scanAndConnect = useCallback(async () => {
    setError('');
    setStatus('Escaneando...');
    setHr(null);
    try {
      // Solicita dispositivo con servicio de HR
      const result = await BluetoothLe.requestDevice({
        services: ['180D'],
        name: undefined,
        allowDuplicates: false,
      });
      setDevice(result.device);
      setStatus('Conectando...');
      // Conectar
      await BluetoothLe.connect({ deviceId: result.device.deviceId });
      setStatus('Conectado');
      // Suscribirse a notificaciones de HR
      await BluetoothLe.startNotifications({
        deviceId: result.device.deviceId,
        service: '180D',
        characteristic: '2A37',
      }, (notif) => {
        if (notif && notif.value) {
          // Decodifica el valor (Uint8Array)
          const v = new Uint8Array(notif.value);
          const flags = v[0];
          const hr = (flags & 0x01) ? (v[1] | (v[2] << 8)) : v[1];
          setHr(hr);
        }
      });
      setStatus('Recibiendo frecuencia cardiaca...');
    } catch (err) {
      setError(err.message || String(err));
      setStatus('Error');
    }
  }, []);

  // Desconectar
  const disconnect = useCallback(async () => {
    setError('');
    if (device) {
      try {
        await BluetoothLe.disconnect({ deviceId: device.deviceId });
        setStatus('Desconectado');
      } catch (err) {
        setError(err.message || String(err));
      }
    }
  }, [device]);

  return { status, error, hr, scanAndConnect, disconnect };
}
