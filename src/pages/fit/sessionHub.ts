// Session Data Hub: 1 Hz emitter combining BLE (FTMS/HR) and GPS, with smoothing and staleness
// Minimal viable version to enrich HUD without touching Start/Pause/Stop handlers

import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

export type MetricName = 'time'|'distance_km'|'speed_kmh'|'pace_min_km'|'hr_bpm'|'hr_avg_bpm'|'cad_rpm'|'power_w'|'kcal'|'resistance'|'incline_pct'|'battery_pct';

export type Tick = {
  ts: number; // ms
  values: Partial<Record<MetricName, number>>;
  stale: Partial<Record<MetricName, boolean>>;
  source: Partial<Record<MetricName, 'FTMS'|'HR'|'GPS'>>;
  paused: boolean;
};

// EMA helper
function ema(prev: number|undefined, next: number, alpha=0.4) {
  if (prev == null) return next;
  return alpha*next + (1-alpha)*prev;
}

// Pace from speed in km/h
function paceFromKmh(kmh?: number) {
  if (!kmh || kmh<=0) return undefined;
  const minPerKm = 60 / kmh; // minutes per km
  return minPerKm; // UI formateará mm:ss
}

class SessionHub {
  private listeners: Array<(t: Tick)=>void> = [];
  private timer: any = null;
  private lastTick: Tick = { ts: Date.now(), values:{}, stale:{}, source:{}, paused:false };
  private lastSeenTs: Partial<Record<MetricName, number>> = {};
  private emaBuf: Partial<Record<MetricName, number>> = {};
  private hrWindow: Array<{ts:number, v:number}> = [];
  private reconAttempts = 0;

  // external feeds
  onFtms(sample: Partial<{ speed_kmh:number; distancia_m:number; pot_w:number; cad_rpm:number; res_nivel:number; inc_pct:number; kcal:number }>) {
    const now = Date.now();
    const values: Partial<Record<MetricName, number>> = {};
    if (typeof sample.speed_kmh === 'number') values.speed_kmh = sample.speed_kmh;
    if (typeof sample.distancia_m === 'number') values.distance_km = sample.distancia_m/1000;
    if (typeof sample.pot_w === 'number') values.power_w = sample.pot_w;
    if (typeof sample.cad_rpm === 'number') values.cad_rpm = sample.cad_rpm;
    if (typeof sample.res_nivel === 'number') values.resistance = sample.res_nivel;
    if (typeof sample.inc_pct === 'number') values.incline_pct = sample.inc_pct;
    if (typeof sample.kcal === 'number') values.kcal = sample.kcal;
    this.ingest(values, 'FTMS', now);
  }

  onHr(bpm: number) {
    const now = Date.now();
    if (typeof bpm === 'number' && bpm>0) {
      this.ingest({ hr_bpm: bpm }, 'HR', now);
      // 60s rolling
      this.hrWindow.push({ts:now,v:bpm});
      const cutoff = now - 60000;
      while (this.hrWindow.length && this.hrWindow[0].ts < cutoff) this.hrWindow.shift();
      const avg = this.hrWindow.reduce((a,b)=>a+b.v,0) / (this.hrWindow.length || 1);
      this.ingest({ hr_avg_bpm: avg }, 'HR', now);
    }
  }

  onBattery(pct: number) {
    if (typeof pct === 'number' && pct >= 0) {
      this.ingest({ battery_pct: pct }, 'HR', Date.now());
    }
  }

  async onGpsPosition() {
    try {
      const { coords } = await Geolocation.getCurrentPosition({ enableHighAccuracy:true, timeout:4000 });
      // Minimal: derivar speed si está disponible en coords.speed (m/s)
      const values: Partial<Record<MetricName, number>> = {};
      if (typeof coords.speed === 'number' && coords.speed>=0) {
        values.speed_kmh = coords.speed * 3.6;
      }
      // Distancia GPS real la maneja la app; aquí no duplicamos acumulado
      this.ingest(values, 'GPS', Date.now());
    } catch {}
  }

  private ingest(values: Partial<Record<MetricName, number>>, src: 'FTMS'|'HR'|'GPS', ts: number) {
    Object.entries(values).forEach(([k,v]) => {
      const key = k as MetricName;
      if (typeof v !== 'number' || !Number.isFinite(v)) return;
      // Smoothing para speed/cad/power
      if (key==='speed_kmh' || key==='cad_rpm' || key==='power_w') {
        this.emaBuf[key] = ema(this.emaBuf[key], v);
        v = this.emaBuf[key] as number;
      }
      this.lastTick.values[key] = v;
      this.lastTick.source[key] = src;
      this.lastSeenTs[key] = ts;
      // pace desde speed
      if (key==='speed_kmh') {
        const p = paceFromKmh(v);
        if (p!=null) {
          this.lastTick.values.pace_min_km = p;
          this.lastTick.source.pace_min_km = this.lastTick.source.speed_kmh;
          this.lastSeenTs.pace_min_km = ts;
        }
      }
    });
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      const now = Date.now();
      // staleness >3s
      (Object.keys(this.lastTick.values) as MetricName[]).forEach((k) => {
        const last = this.lastSeenTs[k] || 0;
        this.lastTick.stale[k] = now - last > 3000;
      });
      this.lastTick.ts = now;
      this.emit(this.lastTick);
    }, 1000);
  }

  stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  onTick(cb:(t:Tick)=>void) {
    this.listeners.push(cb);
    return () => { this.listeners = this.listeners.filter(x=>x!==cb); };
  }

  private emit(t: Tick) {
    for (const l of this.listeners) l(t);
  }
}

export const sessionHub = new SessionHub();
