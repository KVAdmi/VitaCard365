import React, { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { getMapProvider, getMapsApiKey } from '@/config/mapProvider';
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
};

export default function MapView({ initialCenter = { lat: 19.4326, lng: -99.1332 }, initialZoom = 15, testPolyline = [], className, style }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const adapterRef = useRef<WebMapAdapter | null>(null);

  const isNative = Capacitor.isNativePlatform && Capacitor.isNativePlatform();
  const platform: 'android' | 'ios' | 'web' = isNative ? (Capacitor.getPlatform() as any) : 'web';
  const provider = getMapProvider(platform);
  const apiKey = getMapsApiKey(provider, platform);

  // iOS nativo: usamos el componente existente sin tocar su implementación
  if (provider === 'native' && platform === 'ios') {
    return (
      <div className={className} style={style}>
        <NativeMap apiKey={apiKey || ''} />
      </div>
    );
  }

  // Web (Android plan B y Web)
  useEffect(() => {
    if (!containerRef.current) return;
    if (!apiKey) return;
    const adapter = new WebMapAdapter(apiKey);
    adapterRef.current = adapter;
    let cancelled = false;
    (async () => {
      try {
        await adapter.init(containerRef.current!);
        adapter.setStyle(styleJson as any);
        adapter.setCenter(initialCenter.lat, initialCenter.lng, initialZoom);
        if (testPolyline.length) adapter.setPolyline(testPolyline);
      } catch (e) { console.warn('[MapView] init error', e); }
    })();

    return () => {
      if (cancelled) return;
      cancelled = true;
      adapterRef.current?.destroy();
      adapterRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  return (
    <div ref={containerRef} className={className} style={style} />
  );
}
