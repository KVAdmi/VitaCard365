
import { useRef, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SplashScreen } from '@capacitor/splash-screen';

export default function IntroVideo() {
  const nav = useNavigate();
  const vref = useRef<HTMLVideoElement>(null);
  const fired = useRef(false);
  const [showSkip, setShowSkip] = useState(false);

  const go = useCallback(() => {
    if (fired.current) return;
    fired.current = true;
  nav('/descubre', { replace: true });
  }, [nav]);

  useEffect(() => {
    const v = vref.current;
    if (!v) return;

    // iOS exige muted + inline para autoplay
    v.muted = true;
    v.setAttribute('playsinline', 'true');
    v.setAttribute('webkit-playsinline', 'true');

    const tryPlay = () => v.play().catch(() => { /* iOS puede bloquear: reintento silencioso */ });

    const onReady = async () => {
      // El video ya puede correr fluido; quitamos el Splash y arrancamos
      try { await SplashScreen.hide(); } catch { /* no-op */ }
      tryPlay();
      // botón "Omitir" aparece a los 2s
      setTimeout(() => setShowSkip(true), 2000);
    };

    v.addEventListener('canplaythrough', onReady, { once: true });
    v.addEventListener('loadedmetadata', tryPlay, { once: true });

    // Bailout: si en 2s no arrancó, ocultamos splash y seguimos (no nos quedamos en azul)
    const bailout = setTimeout(async () => {
      try { await SplashScreen.hide(); } catch {}
      tryPlay();
      setShowSkip(true);
    }, 2000);

    return () => {
      clearTimeout(bailout);
      v.removeEventListener('canplaythrough', onReady);
      v.removeEventListener('loadedmetadata', tryPlay);
    };
  }, []);

  return (
    <div className="relative w-full h-full" style={{ backgroundColor: '#000' }}>
      <video
        ref={vref}
        src="/media/intro_fast.mp4"
        autoPlay
        muted
        playsInline
        controls={false}
        disablePictureInPicture
        onEnded={go}
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: 'contain' }}
        preload="auto"
        poster=""
      />
      {showSkip && (
        <button
          onClick={go}
          className="fixed z-50 text-white px-4 py-2 rounded-full font-semibold shadow"
          style={{
            top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
            right: 'calc(env(safe-area-inset-right, 0px) + 12px)',
            backgroundColor: '#ff7a00'
          }}
        >
          Omitir
        </button>
      )}
    </div>
  );
}
