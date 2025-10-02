// Loader singleton para Google Maps JS API
let mapsPromise: Promise<void> | null = null;
export function loadMapsOnce(): Promise<void> {
  if (typeof window !== 'undefined' && (window as any).google?.maps) {
    console.log('[Maps] loadMapsOnce(): reused=true');
    return Promise.resolve();
  }
  if (mapsPromise) {
    console.log('[Maps] loadMapsOnce(): reused=true');
    return mapsPromise;
  }
  console.log('[Maps] loadMapsOnce(): reused=false');
  mapsPromise = new Promise<void>((res, rej) => {
    const s = document.createElement('script');
    const key = getMapsWebKey('android');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=geometry&v=quarterly`;
    s.async = true; s.defer = true;
    s.onload = () => res();
    s.onerror = (e) => { console.error('maps load error', e); rej(e); };
    document.head.appendChild(s);
  });
  return mapsPromise;
}
// src/components/fit/adapters/WebMapAdapter.ts

/// <reference types="vite/client" />
import type { MapAdapter, LatLng, Marker } from './MapAdapter';
import styleJson from '@/config/mapStyle.vita.json';
import { getMapsWebKey } from '@/config/mapProvider';

export class WebMapAdapter implements MapAdapter {
  private apiKey: string;
  private map: any | null = null;
  private poly: any | null = null;
  private markers: any[] = [];
  private style: any = styleJson;
  private liveMarker: any = null;
  private livePath: { lat: number; lng: number }[] = [];
  private watchId: number | null = null;

  constructor() {
    this.apiKey = getMapsWebKey('android');
  }


  async init(container: HTMLElement): Promise<void> {
    // Loader singleton y mapa inmediato (no bloqueante)
    const showMapError = (code: string) => {
      if (container) {
        container.innerHTML = `<div style=\"display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#fff;background:#0b1626;padding:24px;text-align:center;border-radius:12px;\">`+
          `<div style='font-size:2em;margin-bottom:8px;'>🗺️</div>`+
          `<div style='font-size:1.2em;font-weight:bold;'>Mapa no disponible</div>`+
          `<div style='margin-top:8px;font-size:0.95em;opacity:0.7;'>Error: ${code}</div>`+
        `</div>`;
      }
    };
    (window as any).gm_authFailure = () => {
      console.error('gm_authFailure');
      showMapError('AuthFailure');
    };
    await loadMapsOnce();
    const g = (window as any).google;
    // Inicializa el mapa de inmediato (fallback CDMX)
    this.map = new g.maps.Map(container, {
      center: { lat: 19.4326, lng: -99.1332 },
      zoom: 15,
      disableDefaultUI: true,
      clickableIcons: false,
      styles: this.style || undefined,
    });
    this.setStyle(this.style);
    // Puntero naranja Vita
    const markerIcon = {
      path: g.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: '#FF7A00',
      fillOpacity: 1,
      strokeColor: '#fff',
      strokeWeight: 2,
    };
    this.liveMarker = new g.maps.Marker({
      position: { lat: 19.4326, lng: -99.1332 },
      map: this.map,
      icon: markerIcon,
      title: 'Ubicación actual',
    });
    this.livePath = [];
    this.poly = new g.maps.Polyline({
      map: this.map, path: this.livePath, geodesic: true,
      strokeColor: '#5CE9E1', strokeWeight: 5, strokeOpacity: 0.95,
    });
    // Geolocaliza en segundo plano, centra cuando esté lista
    const t0 = Date.now();
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const latlng = { lat: p.coords.latitude, lng: p.coords.longitude };
        this.map.setCenter(latlng);
        this.liveMarker.setPosition(latlng);
        this.livePath.push(latlng);
        this.poly.setPath(this.livePath);
        const dt = Date.now() - t0;
        console.log(`[Maps] Geolocalización: ${dt}ms`);
      },
      (err) => {
        const dt = Date.now() - t0;
        console.log(`[Maps] Geolocalización error: ${dt}ms`);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }

  setStyle(styleJson: any): void {
    this.style = styleJson;
    if (this.map) this.map.setOptions({ styles: styleJson });
  }

  setCenter(lat: number, lng: number, zoom?: number): void {
  if (!this.map) return;
  this.map.setCenter({ lat, lng });
  if (zoom) this.map.setZoom(zoom);
  }

  setPolyline(path: LatLng[]): void {
    if (!this.poly) return;
    const gPath = path.map(p => ({ lat: p.lat, lng: p.lng }));
    this.poly.setPath(gPath);
  }

  setMarkers(list: Marker[]): void {
    if (!this.map) return;
    // limpiar
    for (const m of this.markers) m.setMap(null);
    this.markers = [];
    const g = (window as any).google;
    for (const it of list) {
      const marker = new g.maps.Marker({
        position: { lat: it.lat, lng: it.lng },
        map: this.map,
        title: it.title,
      });
      this.markers.push(marker);
    }
  }

  destroy(): void {
    // Google Maps JS no expone destroy; limpiar referencias
    if (this.poly) { try { this.poly.setMap(null); } catch {} this.poly = null; }
    if (this.markers.length) {
      for (const m of this.markers) { try { m.setMap(null); } catch {} }
      this.markers = [];
    }
    if (this.liveMarker) { try { this.liveMarker.setMap(null); } catch {} this.liveMarker = null; }
    if (this.watchId) { navigator.geolocation.clearWatch(this.watchId); this.watchId = null; }
    this.livePath = [];
    this.map = null;
  }

  private ensureScript(showMapError: (code: string) => void): Promise<void> {
    const g = (window as any).google;
    if (g?.maps) return Promise.resolve();
  const src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(this.apiKey)}&libraries=geometry`;
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src^="https://maps.googleapis.com/maps/api/js"],script[data-gmaps-loader="1"]`) as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => (window as any).google?.maps ? resolve() : reject(new Error('Google Maps failed to initialize')));
        existing.addEventListener('error', (e) => { showMapError('LoadError'); reject(new Error('Google Maps script error')); });
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onerror = (e) => { showMapError('LoadError'); reject(new Error('Google Maps script error')); };
      s.onload = () => resolve();
      s.setAttribute('data-gmaps-loader', '1');
      document.head.appendChild(s);
    });
  }

// QA ONLY: Habilitar debugging de WebView en Android
// import { WebView } from '@capacitor-community/webview';
// if (window && window.cordova && window.cordova.platformId === 'android') {
//   WebView.setWebContentsDebuggingEnabled(true);
// }
}
