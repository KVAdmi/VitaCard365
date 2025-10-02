import { startScan, stopScan, startNotify } from '@/ble/ble';
import type { LEScanResult, LENotification } from '@/ble/ble-types';

const FTMS = '1826';
const HRS  = '180D';
const CHARS_FTMS = ['2AD2', '2ACD', '2AD1', '2ACE'];

let lastFtms: any = {}, lastHr: any = {}, samples: any[] = [];
let tick: any, startTs = Date.now();

export async function scanFtmsHr(onDevice: (d: LEScanResult) => void) {
  await startScan([FTMS, HRS], onDevice, 25000);
}

export async function subscribeFtms(
  deviceId: string,
  onFtms: (buf: ArrayBuffer) => void
) {
  for (const ch of CHARS_FTMS) {
    try {
      await startNotify(deviceId, FTMS, ch, (n: LENotification) => {
        if (n?.value) onFtms(n.value);
      });
      break;
    } catch {}
  }
}

export async function subscribeHr(
  deviceId: string,
  onHr: (bpm: number) => void
) {
  await startNotify(deviceId, HRS, '2A37', (n: LENotification) => {
    if (!n?.value) return;
    const d = new DataView(n.value);
    const flags = d.getUint8(0);
    const hr = (flags & 0x01) ? d.getUint16(1, true) : d.getUint8(1);
    onHr(hr);
  });
}


export function parseHr(buf: ArrayBuffer) {
  const d = new DataView(buf);
  const flags = d.getUint8(0);
  const hrUint16 = (flags & 0x01) !== 0;
  return { hr_bpm: hrUint16 ? d.getUint16(1, true) : d.getUint8(1) };
}

export function parseFtms(buf: ArrayBuffer) {
  const d = new DataView(buf);
  let i = 0;
  const flags = d.getUint16(i, true); i += 2;
  const speed_m_s = d.getUint16(i, true) / 100; i += 2;
  const cadence_rpm = d.getUint16(i, true) / 2; i += 2;
  const power_w = d.getInt16(i, true); i += 2;
  const distance_m = d.getUint16(i, true) + d.getUint8(i + 2) * 65536; i += 3;
  return { speed_m_s, cadence_rpm, power_w, distance_m };
}

export function startBuffering1Hz(onSample:(s:any)=>void){
  stopBuffering();
  tick = setInterval(()=>{
    const s:any = { t: (Date.now()-startTs)/1000|0 };
    if (lastFtms.speed_m_s!=null) s.speed_kmh = lastFtms.speed_m_s * 3.6;
    if (s.speed_kmh!=null && s.speed_kmh>0) s.pace_s_per_km = Math.round(3600 / s.speed_kmh);
    if (lastFtms.cadence_rpm!=null) s.cadence_rpm = lastFtms.cadence_rpm;
    if (lastFtms.power_w!=null) s.power_w = lastFtms.power_w;
    if (lastFtms.distance_m!=null) s.distance_m = lastFtms.distance_m;
    if (lastFtms.cal_kcal!=null) s.cal_kcal = lastFtms.cal_kcal;
    if (lastFtms.incline_pct!=null) s.incline_pct = lastFtms.incline_pct;
    if (lastFtms.resistance_lvl!=null) s.resistance_lvl = lastFtms.resistance_lvl;
    if (lastHr.hr_bpm!=null) s.hr_bpm = lastHr.hr_bpm;
    if (s.hr_bpm!=null){
      const prev = samples.length? (samples[samples.length-1].hr_avg_bpm ?? s.hr_bpm) : s.hr_bpm;
      s.hr_avg_bpm = Math.round(prev*0.8 + s.hr_bpm*0.2);
    }
    samples.push(s);
    onSample(s);
  }, 1000);
}
export function stopBuffering(){ if (tick) clearInterval(tick); }

export async function withReconnect(connectFn:()=>Promise<void>){
  const delays = [500,1000,2000,5000];
  for (let i=0;i<delays.length;i++){
    try { await connectFn(); return; }
    catch { await new Promise(r=>setTimeout(r,delays[i])); }
  }
  throw new Error('ReconnectFailed');
}

export async function endSessionExport(sessionId:string, userId:string){
  const payload = {
    session_id: sessionId,
    user_id: userId,
    started_at: startTs,
    ended_at: Date.now(),
    samples,
    telemetry: {/* reconexiones, pérdida, latencias si las mides */}
  };
  await fetch('/api/sessions', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify(payload)
  });
}
