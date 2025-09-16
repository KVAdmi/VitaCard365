import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

type Props = {
  sampleSeconds?: number;   // duración de la medición
  autoTorch?: boolean;      // intenta prender linterna en Android
  onSaved?: (bpm: number) => void; // callback tras guardar
};

export default function CameraPPG({ sampleSeconds = 30, autoTorch = true, onSaved }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const [running, setRunning] = useState(false);
  const [bpm, setBpm] = useState<number | null>(null);
  const [msg, setMsg] = useState<string>("");

  const valuesRef = useRef<number[]>([]);
  const timeRef   = useRef<number[]>([]);

  useEffect(() => () => stop(), []);

  const start = async () => {
    setMsg(""); setBpm(null);
    valuesRef.current = []; timeRef.current = [];
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          frameRate: { ideal: 30 },
          width: { ideal: 640 }, height: { ideal: 480 },
        },
      });
      streamRef.current = s;

      if (autoTorch) {
        const track = s.getVideoTracks()[0] as any;
        const caps = track.getCapabilities?.();
        if (caps?.torch) { try { await track.applyConstraints({ advanced: [{ torch: true }] }); } catch {} }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
      }

      setRunning(true);
      loop();

      setTimeout(async () => {
        stop();
        const est = computeBPM(valuesRef.current, timeRef.current);
        if (!est || !isFinite(est)) { setMsg("Señal insuficiente. Cubre bien cámara/flash y mantén firme."); return; }
        const rounded = Math.round(est);
        setBpm(rounded);

        // 👉 Guarda en Supabase aquí mismo
        const { data: auth } = await supabase.auth.getUser();
        const user = auth?.user;
        if (!user) { setMsg("No hay sesión. Inicia sesión para guardar."); return; }

        const { error } = await supabase.from("mediciones").insert([{
          usuario_id: user.id,
          ts: new Date().toISOString(),
          source: "ppg",            // usa 'ppg' para respetar el CHECK si existe
          pulso_bpm: rounded
        }]);

        if (error) {
          setMsg(`No se pudo guardar en DB: ${error.message}`);
        } else {
          onSaved?.(rounded);
          setMsg("Medición guardada ✅");
        }
      }, sampleSeconds * 1000);
    } catch (e: any) {
      setMsg(e?.message || "No se pudo iniciar cámara.");
    }
  };

  const stop = () => {
    setRunning(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
  };

  const loop = () => {
    if (!running) return;
    const v = videoRef.current, c = canvasRef.current; if (!v || !c) return;
    const w = 160, h = 120; c.width = w; c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true }); if (!ctx) return;
    ctx.drawImage(v, 0, 0, w, h);

    // ROI central
    const rx = Math.floor(w/3), ry = Math.floor(h/3), rw = Math.floor(w/3), rh = Math.floor(h/3);
    const img = ctx.getImageData(rx, ry, rw, rh).data;

    // canal rojo promedio
    let sum = 0; const px = rw*rh;
    for (let i=0; i<img.length; i+=4) sum += img[i];
    const meanR = sum / px;

    const t = performance.now()/1000;
    valuesRef.current.push(meanR); timeRef.current.push(t);

    // buffer ≤60s
    while (timeRef.current.length && t - timeRef.current[0] > Math.max(sampleSeconds, 60)) {
      timeRef.current.shift(); valuesRef.current.shift();
    }
    rafRef.current = requestAnimationFrame(loop);
  };

  // ===== señal -> BPM =====
  function computeBPM(vals: number[], times: number[]): number | null {
    if (vals.length < 30) return null;
    const detr = movingDetrend(vals, 15);
    const norm = standardize(detr);
    const smooth = movingAverage(norm, 3);
    const peaks = findPeaks(smooth, times, { minBpm: 40, maxBpm: 180, relThreshold: 0.2, refractoryMs: 300 });
    if (peaks.length < 2) return null;
    const intervals = peaks.slice(1).map((p,i)=> p - peaks[i]);
    const meanI = intervals.reduce((a,b)=>a+b,0)/intervals.length;
    return meanI > 0 ? 60/meanI : null;
  }
  function movingDetrend(x:number[], win:number){ const out=Array(x.length).fill(0);
    for(let i=0;i<x.length;i++){ let s=0,c=0; for(let k=-win;k<=win;k++){ const j=i+k; if(j>=0&&j<x.length){ s+=x[j]; c++; } }
      out[i]=x[i]-s/Math.max(c,1); } return out; }
  function standardize(x:number[]){ const m=x.reduce((a,b)=>a+b,0)/x.length;
    const v=x.reduce((a,b)=>a+(b-m)*(b-m),0)/Math.max(x.length-1,1); const sd=Math.sqrt(Math.max(v,1e-8)); return x.map(y=>(y-m)/sd); }
  function movingAverage(x:number[], win:number){ const out=Array(x.length).fill(0); let s=0;
    for(let i=0;i<x.length;i++){ s+=x[i]; if(i>=win) s-=x[i-win]; out[i]=s/Math.min(i+1,win);} return out; }
  function findPeaks(x:number[], t:number[], o:{minBpm:number;maxBpm:number;relThreshold:number;refractoryMs:number}) {
    const minDt=60/o.maxBpm, maxDt=60/o.minBpm, thr=o.relThreshold*Math.max(...x.map(v=>Math.abs(v))); const peaks:number[]=[]; let last=-1e9;
    for(let i=1;i<x.length-1;i++){ const isP = x[i]>thr && x[i]>x[i-1] && x[i]>=x[i+1]; const dt=t[i]-last;
      if(isP && dt>=minDt && dt<=maxDt && dt*1000>=o.refractoryMs){ peaks.push(t[i]); last=t[i]; } } return peaks;
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="rounded-xl overflow-hidden bg-black">
        <video ref={videoRef} muted playsInline autoPlay style={{ width:"100%", height:"auto", objectFit:"cover" }}/>
      </div>
      <canvas ref={canvasRef} hidden />
      <div className="mt-3 flex gap-2">
        {!running ? (
          <button className="btn btn-primary flex-1" onClick={start}>
            Iniciar medición ({sampleSeconds}s)
          </button>
        ) : (
          <button className="btn btn-secondary flex-1" onClick={stop}>Detener</button>
        )}
      </div>
      {bpm !== null && (
        <div className="mt-3 text-center text-white">
          <div className="text-3xl font-bold">{bpm} BPM</div>
          <div className="text-sm opacity-70">Guardado en historial (source=ppg)</div>
        </div>
      )}
      {msg && <div className="mt-2 text-amber-300 text-sm">{msg}</div>}
      <p className="mt-3 text-xs text-white/60">Experimental, no es diagnóstico médico.</p>
    </div>
  );
}