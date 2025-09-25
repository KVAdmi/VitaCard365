import React, { useEffect, useRef, useState } from 'react';
import { GoogleMap } from '@capacitor/google-maps';

const mapId = 'native-map';

export default function NativeMap({ apiKey }: { apiKey: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<GoogleMap | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let map: GoogleMap | null = null;
    async function createMap() {
      try {
        console.log('[Maps] Iniciando creación del mapa...');
        if (!mapRef.current) {
          setError('No se encontró el elemento contenedor');
          console.error('[Maps] Error: No se encontró el elemento contenedor');
          return;
        }
        if (mapInstance.current) {
          console.log('[Maps] Mapa ya existe, no se crea de nuevo');
          return;
        }
        if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
          setError('No se proporcionó la API key de Google Maps.');
          console.error('[Maps] Error: No se proporcionó la API key');
          return;
        }
        console.log('[Maps] Creando mapa con key:', apiKey.substring(0, 8) + '...');
        map = await GoogleMap.create({
          id: mapId,
          element: mapRef.current,
          apiKey,
          config: {
            center: { lat: 19.4326, lng: -99.1332 }, // CDMX
            zoom: 14,
            androidLiteMode: false
          },
        });
        mapInstance.current = map;
        setError(null);
        console.log('[Maps] Mapa creado exitosamente');
      } catch (error) {
  const msg = typeof error === 'object' && error && 'message' in error ? (error as any).message : String(error);
  setError('Error al crear el mapa: ' + msg);
        console.error('[Maps] Error al crear el mapa:', error);
      }
    }
    createMap();
    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy();
        mapInstance.current = null;
      }
    };
  }, [apiKey]);

  return (
    <div
      ref={mapRef}
      id={mapId}
      style={{
        width: '100%',
        height: '100%',
        minHeight: 320,
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
        background: '#0b1626'
      }}
    >
      {error && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: 'white',
          fontSize: '14px',
          padding: '20px',
          textAlign: 'center',
          zIndex: 20
        }}>
          {error}
        </div>
      )}
      {/* Si no hay error y no hay mapa, mostrar mensaje */}
      {!error && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          opacity: 0.2,
          pointerEvents: 'none',
          fontSize: 18
        }}>
          Cargando mapa...
        </div>
      )}
    </div>
  );
}
