import React, { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { getMapProvider, getMapsWebKey } from '@/config/mapProvider';
import styleJson from '@/config/mapStyle.vita.json';
import type { LatLng } from './adapters/MapAdapter';
import { WebMapAdapter } from './adapters/WebMapAdapter';
import NativeMap from './NativeMap';

type Props = {
  initialCenter?: LatLng;
  initialZoom?: number;
  testPolyline?: LatLng[];
  className?: string;
  style?: React.CSSProperties;
  onMapError?: (msg: string) => void;
};

export default function MapView({ initialCenter = { lat: 19.4326, lng: -99.1332 }, initialZoom = 15, testPolyline = [], className, style, onMapError }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const adapterRef = useRef<WebMapAdapter | null>(null);

  const isNative = Capacitor.isNativePlatform && Capacitor.isNativePlatform();
  const platform: 'android' | 'ios' | 'web' = isNative ? (Capacitor.getPlatform() as any) : 'web';
  const provider = getMapProvider(platform);
  const apiKey = getMapsWebKey('android');

  // iOS nativo: usamos el componente existente sin tocar su implementación
  if (provider === 'native' && platform === 'ios') {
    return (
      <div className={className} style={style}>
        <NativeMap apiKey={apiKey || ''} />
      </div>
    );
  }

  // Web (Android plan B y Web)
  // Montar el adapter solo una vez (no remounts)
  useEffect(() => {
    if (!containerRef.current) return;
    const adapter = new WebMapAdapter();
    adapterRef.current = adapter;
    adapter.init(containerRef.current).then(() => {
      // Aplicar estilo si existe
      if (styleJson) adapter.setStyle(styleJson as any);
      // Aplicar centro/zoom iniciales
      if (initialCenter) adapter.setCenter(initialCenter.lat, initialCenter.lng, initialZoom);
    }).catch((e) => {
      console.warn('[MapView] init error', e);
      onMapError?.('Error al inicializar el mapa: ' + (typeof e === 'object' && e && 'message' in e ? (e as any).message : String(e)));
    });
    return () => {
      adapterRef.current?.destroy();
      adapterRef.current = null;
    };
  }, []);

  // Si cambia el initialCenter/Zoom desde props, actualizar mapa
  useEffect(() => {
    const a = adapterRef.current;
    if (!a || !initialCenter) return;
    // Centra la cámara y actualiza el marcador vivo + path
    a.setCenter(initialCenter.lat, initialCenter.lng, initialZoom);
    if (typeof (a as any).setLivePosition === 'function') {
      (a as any).setLivePosition(initialCenter.lat, initialCenter.lng, true);
    }
  }, [initialCenter?.lat, initialCenter?.lng, initialZoom]);

  return (
    <div ref={containerRef} className={className} style={style} />
  );
}
