import React, { useEffect, useRef, useState } from "react";

/** Frecuencia cardiaca por PPG con cámara + flash (si soportado). */
export default function PPGCameraHR({ onSave }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const trackRef = useRef(null);
  const [running, setRunning] = useState(false);
  const [bpm, setBpm] = useState(null);
  const [quality, setQuality] = useState("—");
  const [err, setErr] = useState("");

  useEffect(() => () => stop(), []);

  const start = async () => {
    try {
      setErr("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", frameRate: { ideal: 60 }, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      videoRef.current.srcObject = stream;
      const track = stream.getVideoTracks()[0];
      trackRef.current = track;

      // Intentar encender torch
      try {
        const caps = track.getCapabilities?.();
        if (caps?.torch) await track.applyConstraints({ advanced: [{ torch: true }] });
      } catch {}

      await videoRef.current.play();
      setRunning(true);
      loop();
    } catch (e) {
      setErr("No se pudo acceder a la cámara.");
    }
  };

  const stop = () => {
    setRunning(false);
    try {
      trackRef.current?.stop();
      videoRef.current.srcObject = null;
    } catch {}
  };

  // procesamiento simple: media del canal rojo -> filtro -> detección de picos
  let ts = [];
  let rs = [];
  const loop = () => {
    if (!running) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    const ctx = c.getContext("2d");
    c.width = 64; c.height = 64;
    ctx.drawImage(v, 0, 0, c.width, c.height);
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    let r = 0;
    for (let i = 0; i < data.length; i += 4) r += data[i];
    r /= (data.length / 4);

    const now = performance.now();
    ts.push(now); rs.push(r);
    // mantener ventana de 15s
    while (ts.length && now - ts[0] > 15000) { ts.shift(); rs.shift(); }

    // high-pass simple + smooth
    const mean = rs.reduce((a,b)=>a+b,0)/rs.length;
    const hp = rs.map(x => x - mean);
    for (let i = 1; i < hp.length; i++) hp[i] = 0.7*hp[i-1] + 0.3*hp[i];

    // detectar picos
    const thr = 0.6 * Math.max(...hp.map(Math.abs));
    let peaks = [];
    for (let i = 1; i < hp.length-1; i++) {
      if (hp[i] > thr && hp[i] > hp[i-1] && hp[i] > hp[i+1]) peaks.push(ts[i]);
    }
    // convertir a BPM (promedio de intervalos)
    if (peaks.length >= 3) {
      let iv = [];
      for (let i = 1; i < peaks.length; i++) iv.push((peaks[i]-peaks[i-1])/1000);
      const avg = iv.reduce((a,b)=>a+b,0)/iv.length;
      const bpmVal = Math.round(60/avg);
      setBpm(bpmVal);

      // calidad por varianza de intervalos
      const meanIv = avg;
      const sdnn = Math.sqrt(iv.reduce((a,x)=>a+(x-meanIv)**2,0)/iv.length);
      setQuality(sdnn < 0.05 ? "Alta" : sdnn < 0.12 ? "Media" : "Baja");
    }

    requestAnimationFrame(loop);
  };

  const save = () => {
    if (!bpm) return;
    onSave?.({
      type: "heart_rate",
      pulse_bpm: bpm,
      source: "ppg",
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-white">
      <div className="mb-2 font-semibold">Medir con tu cámara (PPG)</div>
      <p className="text-sm text-white/70 mb-3">
        Coloca la yema del dedo cubriendo la cámara trasera. Mantén presión leve; evita moverte.
      </p>

      {err && <div className="text-red-300 text-sm mb-2">{err}</div>}

      <div className="flex gap-3 items-center mb-3">
        {!running ? (
          <button onClick={start} className="bg-white text-[#0c1c3e] px-4 py-2 rounded-lg font-semibold">Iniciar</button>
        ) : (
          <button onClick={stop} className="bg-[#f06340] text-white px-4 py-2 rounded-lg font-semibold">Detener</button>
        )}
        <div className="text-sm text-white/80">
          BPM: <span className="font-bold">{bpm ?? "—"}</span> · Calidad: <span className="font-bold">{quality}</span>
        </div>
      </div>

      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} className="hidden" />

      <div className="text-xs text-white/60">
        Este resultado es **orientativo**. Para presión arterial usa un tensiómetro.
      </div>

      <div className="mt-3">
        <button onClick={save} disabled={!bpm} className="bg-[#f06340] text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50">Guardar</button>
      </div>
    </div>
  );
}