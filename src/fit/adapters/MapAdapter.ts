// src/components/fit/adapters/MapAdapter.ts

export type LatLng = { lat: number; lng: number };
export type Marker = LatLng & { title?: string };

export interface MapAdapter {
  init(container: HTMLElement): Promise<void>;
  setStyle(styleJson: any): void;
  setCenter(lat: number, lng: number, zoom?: number): void;
  // Actualiza el "punto azul"/marcador vivo y opcionalmente agrega al path
  setLivePosition?(lat: number, lng: number, appendPath?: boolean): void;
  setPolyline(path: LatLng[]): void;
  setMarkers(list: Marker[]): void;
  destroy(): void | Promise<void>;
}
