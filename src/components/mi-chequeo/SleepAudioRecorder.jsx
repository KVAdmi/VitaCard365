import React, { useRef, useState } from "react";

// Componente para grabar audio localmente y analizar picos de volumen
export default function SleepAudioRecorder({ onAnalysis }) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [events, setEvents] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // Pedir permiso y comenzar grabación
  const startRecording = async () => {
    setEvents(0);
    setDuration(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new window.MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.onstop = () => {
        analyzeAudio();
        stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorderRef.current.start();
      setRecording(true);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (err) {
      alert("No se pudo acceder al micrófono: " + err.message);
    }
  };

  // Detener grabación
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      clearInterval(timerRef.current);
    }
  };

  // Análisis simple: contar picos de volumen (ronquidos)
  const analyzeAudio = () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
    const reader = new FileReader();
    reader.onload = (e) => {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctx.decodeAudioData(e.target.result, (buffer) => {
        const data = buffer.getChannelData(0);
        let peaks = 0;
        for (let i = 0; i < data.length; i += 2048) {
          const slice = data.slice(i, i + 2048);
          const max = Math.max(...slice);
          if (max > 0.4) peaks++;
        }
        setEvents(peaks);
        if (onAnalysis) onAnalysis({ duration, events: peaks });
        // Eliminar audio: no se guarda
      });
    };
    reader.readAsArrayBuffer(audioBlob);
  };

  return (
    <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 16, padding: 24, margin: 8, color: "#fff" }}>
      <h3>Monitoreo de Sueño (Audio)</h3>
      <p>Permite grabar el ambiente para analizar calidad de sueño (ronquidos, ruidos, etc). El audio NO se guarda, solo el análisis.</p>
      <div style={{ margin: "16px 0" }}>
        <button onClick={recording ? stopRecording : startRecording} style={{ background: recording ? "#f06340" : "#222", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 600 }}>
          {recording ? "Detener grabación" : "Iniciar grabación"}
        </button>
        <span style={{ marginLeft: 16 }}>{recording ? `Grabando... ${duration}s` : duration > 0 ? `Duración: ${duration}s` : null}</span>
      </div>
      {duration > 0 && !recording && (
        <div>
          <strong>Eventos detectados (ronquidos/picos):</strong> {events}
        </div>
      )}
    </div>
  );
}
