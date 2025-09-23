// Hook React para HR nativo: solo usa el bridge '@/lib/bleNative'
import { useState, useCallback, useRef } from 'react';
import { connect, disconnect, startHeartRate, stopHeartRate } from '../lib/bleNative';

export function useNativeHeartRate() {
  const [status, setStatus] = useState('Listo');
  const [error, setError] = useState('');
  const [hr, setHr] = useState(null);
  const startedRef = useRef(false);

  // Escanear y conectar usando el bridge
  const scanAndConnect = useCallback(async () => {
    setError('');
    setStatus('Escaneando...');
    setHr(null);
    try {
      console.log('[BLE] Using bridge only');
      await connect();
      setStatus('Conectado');
      await startHeartRate((bpm) => {
        setHr(bpm);
      });
      startedRef.current = true;
      setStatus('Recibiendo frecuencia cardiaca...');
    } catch (err) {
      setError(err.message || String(err));
      setStatus('Error');
    }
  }, []);

  // Desconectar y limpiar HR
  const disconnectAll = useCallback(async () => {
    setError('');
    try {
      if (startedRef.current) {
        await stopHeartRate();
        startedRef.current = false;
      }
      await disconnect();
      setStatus('Desconectado');
    } catch (err) {
      setError(err.message || String(err));
    }
  }, []);

  return { status, error, hr, scanAndConnect, disconnect: disconnectAll };
}
