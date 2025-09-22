// Sincronizar mi rutina (BLE FTMS/HRS + wearables)
import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../../utils/loadGoogle';

const FitSync = () => {
  const mapRef = useRef(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    let map;
    loadGoogleMaps(import.meta.env.VITE_MAPS_KEY)
      .then((googleMaps) => {
        if (mapRef.current && !map) {
          map = new googleMaps.Map(mapRef.current, {
            center: { lat: 19.4326, lng: -99.1332 },
            zoom: 13,
            disableDefaultUI: true,
            styles: [
              { elementType: 'geometry', stylers: [{ color: '#0E1A2B' }] },
              { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
              { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
            ],
          });
        }
      })
      .catch((e) => setError(e.message || 'Error cargando Google Maps'));
  }, []);
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Sincronizar mi rutina</h1>
      <div className="w-full max-w-2xl h-[400px] rounded-2xl overflow-hidden border border-white/10 shadow-lg mx-auto mb-4 bg-white/5">
        {error ? (
          <div className="text-red-400 p-4">{error}</div>
        ) : (
          <div ref={mapRef} className="w-full h-full" />
        )}
      </div>
    </div>
  );
};

export default FitSync;
