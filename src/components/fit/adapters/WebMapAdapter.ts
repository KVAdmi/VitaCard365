// src/components/fit/adapters/WebMapAdapter.ts
import type { MapAdapter, LatLng, Marker } from './MapAdapter';

export class WebMapAdapter implements MapAdapter {
  private apiKey: string;
  private map: any | null = null;
  private poly: any | null = null;
  private markers: any[] = [];
  private style: any = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async init(container: HTMLElement): Promise<void> {
    await this.ensureScript();
  const g = (window as any).google;
  this.map = new g.maps.Map(container, {
      center: { lat: 19.4326, lng: -99.1332 },
      zoom: 15,
      disableDefaultUI: true,
      clickableIcons: false,
      styles: this.style || undefined,
    });
  this.poly = new g.maps.Polyline({
      map: this.map, path: [], geodesic: true,
      strokeColor: '#5CE9E1', strokeWeight: 5, strokeOpacity: 0.95,
    });
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
    this.map = null;
  }

  private ensureScript(): Promise<void> {
  const g = (window as any).google;
  if (g?.maps) return Promise.resolve();
    const src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(this.apiKey)}&libraries=geometry`;
    const existing = document.querySelector(`script[src^="https://maps.googleapis.com/maps/api/js"],script[data-gmaps-loader="1"]`) as HTMLScriptElement | null;
    if (existing) {
      return new Promise((resolve, reject) => {
        if ((window as any).google?.maps) return resolve();
        existing.addEventListener('load', () => (window as any).google?.maps ? resolve() : reject(new Error('Google Maps failed to initialize')));
        existing.addEventListener('error', () => reject(new Error('Google Maps script error')));
      });
    }
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src; s.async = true; s.setAttribute('data-gmaps-loader', '1');
      s.onload = () => (window as any).google?.maps ? resolve() : reject(new Error('Google Maps failed to initialize'));
      s.onerror = () => reject(new Error('Google Maps script error'));
      document.head.appendChild(s);
    });
  }
}
