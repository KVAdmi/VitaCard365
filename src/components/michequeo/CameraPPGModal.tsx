import { useRef, useState, useEffect } from 'react';

export default function CameraPPGModal({ open, onClose }:{
  open: boolean; onClose: ()=>void;
}) {
  const videoRef = useRef<HTMLVideoElement|null>(null);
  const [error, setError] = useState<string>('');
  const [stream, setStream] = useState<MediaStream|null>(null);

  useEffect(() => {
    if (!open) return;
    // al abrir, *no* pedimos cámara; se pide en el botón por requisito de gesto de usuario
    setError('');
    return () => {
      // cleanup por si cierran de golpe
      stopCamera();
    };
  }, [open]);

  const startCamera = async () => {
    setError('');
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Tu navegador no soporta cámara (getUserMedia). Usa Chrome/Edge o Safari actualizado.');
        return;
      }
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: 'environment' }, // trasera en móvil
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      const s = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        // play puede lanzar excepción si no hay autoplay; por eso muted y gesture
        await videoRef.current.play();
      }
    } catch (e: any) {
      const name = e?.name || '';
      if (name === 'NotAllowedError') setError('Permiso de cámara denegado. Habilítalo en el navegador y reintenta.');
      else if (name === 'NotFoundError') setError('No hay cámara disponible o está en uso por otra app.');
      else if (name === 'NotReadableError') setError('La cámara está siendo usada por otra app. Ciérrala e inténtalo de nuevo.');
      else setError(`No se pudo iniciar la cámara: ${e?.message || e}`);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const close = () => {
    stopCamera();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
      <div className="bg-[#0b1d33] w-full max-w-md rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">Medición con Cámara (PPG)</h3>
          <button onClick={close} className="text-white/80 hover:text-white">✕</button>
        </div>

        <div className="rounded-xl overflow-hidden bg-black mb-3" style={{aspectRatio:'16/9'}}>
          <video
            ref={videoRef}
            muted
            autoPlay
            playsInline
            style={{ width:'100%', height:'100%', objectFit:'cover' }}
          />
        </div>

        {error ? (
          <div className="text-red-300 text-sm mb-3">{error}</div>
        ) : null}

        <div className="flex gap-2">
          {!stream ? (
            <button onClick={startCamera} className="btn btn-primary flex-1">
              Iniciar Cámara
            </button>
          ) : (
            <button onClick={stopCamera} className="btn btn-secondary flex-1">
              Pausar
            </button>
          )}
          <button onClick={close} className="btn flex-1">Cerrar</button>
        </div>
      </div>
    </div>
  );
}