import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SplashScreen } from '@capacitor/splash-screen';

export default function IntroVideo() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [showSkip, setShowSkip] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(()=>{ try{ console.log('[Intro] mounted'); }catch{} },[]);

  // Usar rutas absolutas desde public/ para Capacitor
  const primarySrc = '/landing-video.mp4';
  // Fallback por si el archivo aún tiene espacios en el nombre
  const legacySrc = '/Video%20intro.mp4';
  const poster = '/landing-poster.jpg';

  useEffect(() => {
    // Ocultar SplashScreen correctamente usando el plugin
    SplashScreen.hide().catch(() => {});

    const t = setTimeout(() => setShowSkip(true), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const setInlineAttrs = () => {
      try {
        v.setAttribute('muted', '');
        v.setAttribute('playsinline', '');
        v.setAttribute('webkit-playsinline', '');
      } catch {}
      v.muted = true;
      // eslint-disable-next-line no-unused-expressions
      v.playsInline = true;
    };

    const tryAutoplay = async () => {
      try {
        setInlineAttrs();
        v.load();
        // Algunos navegadores requieren play() explícito incluso con autoplay
        await v.play();
        setNeedsTap(false);
      } catch {
        // Autoplay bloqueado: mostramos botón, pero NO navegamos
        setNeedsTap(true);
      }
    };

    const onCanPlay = () => {
      setReady(true);
      // Intentar reproducción cuando esté listo
      tryAutoplay();
    };
  v.addEventListener('canplay', onCanPlay);

    // Eventos para entender el estado del video
    const onPlaying = () => {
      setStarting(false);
      setNeedsTap(false);
    };
    const onWaiting = () => {
      // está cargando/buffering; no navegar aún
      setStarting(true);
    };
    const onError = () => {
      setStarting(false);
      setNeedsTap(true);
    };
    v.addEventListener('playing', onPlaying);
    v.addEventListener('waiting', onWaiting);
    v.addEventListener('error', onError);

    // Si el video no avanza tras un breve lapso, mostramos tap
    let stallTimer;
    const onTimeUpdate = () => {
      // Si está reproduciendo, limpiamos cualquier stall
      if (v.currentTime > 0.3 && !v.paused) {
        if (stallTimer) { clearTimeout(stallTimer); stallTimer = null; }
      }
    };
    v.addEventListener('timeupdate', onTimeUpdate);

    // Segundo intento por si 'canplay' no dispara en algunos WebViews
    const fallbackTimer = setTimeout(() => {
      tryAutoplay();
      // Si ni así avanza en 1.5s, mostrar tap (sin navegar)
      stallTimer = setTimeout(() => {
        if (v.paused || v.currentTime < 0.2) {
          setNeedsTap(true);
        }
      }, 1500);
    }, 800);

    return () => {
      v.removeEventListener('canplay', onCanPlay);
      v.removeEventListener('timeupdate', onTimeUpdate);
      v.removeEventListener('playing', onPlaying);
      v.removeEventListener('waiting', onWaiting);
      v.removeEventListener('error', onError);
      clearTimeout(fallbackTimer);
      if (stallTimer) clearTimeout(stallTimer);
    };
  }, []);

  const goLoginWithFade = () => {
    if (isFading) return;
    setIsFading(true);
    setTimeout(() => navigate('/login', { replace: true }), 250);
  };

  const onTapToStart = async () => {
    const v = videoRef.current;
    if (!v) return; // si no hay video, no navegamos automáticamente
    try {
      v.setAttribute('muted', '');
      v.setAttribute('playsinline', '');
      v.setAttribute('webkit-playsinline', '');
      v.muted = true;
      // eslint-disable-next-line no-unused-expressions
      v.playsInline = true;
      setStarting(true);
      await v.play();
      setNeedsTap(false);
    } catch {
      // Si aún no se puede reproducir, mantenemos el botón para que el usuario vuelva a intentar
      setStarting(false);
      setNeedsTap(true);
    }
  };

  const handleError = (e) => {
    // Si falla la carga de landing-video.mp4, intentamos con el nombre antiguo con espacios
    const v = videoRef.current;
    if (!v) return;
    if (!v.dataset.fallbackTried) {
      v.dataset.fallbackTried = '1';
      v.src = legacySrc;
      v.load();
      setTimeout(() => {
        v.play().catch(() => setNeedsTap(true));
      }, 100);
    } else {
      setNeedsTap(true);
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black ${isFading ? 'opacity-0' : 'opacity-100'}`}
      style={{ transition: 'opacity 250ms ease-in-out' }}
    >
      <style>{`
        /* Oculta overlays de play en reproducción automática en WebView/nativo */
        video::-webkit-media-controls { display: none !important; }
        video::-webkit-media-controls-enclosure { display: none !important; }
        video::-webkit-media-controls-play-button { display: none !important; }
        video { -webkit-appearance: none; appearance: none; }
      `}</style>
      <video
        ref={videoRef}
        src={primarySrc}
        poster={poster}
        className={`w-full h-full object-cover transition-opacity duration-500 ${ready ? 'opacity-100' : 'opacity-0'}`}
        autoPlay
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        onEnded={goLoginWithFade}
        onError={handleError}
      />

      {/* Botón Omitir visible a los 3s */}
      {showSkip && (
        <button
          onClick={goLoginWithFade}
          className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-full text-white text-sm"
          style={{
            backgroundColor: 'rgba(240, 99, 64, 0.9)',
            border: '1px solid rgba(255,255,255,0.35)',
            paddingTop: `calc(1rem + env(safe-area-inset-top, 0px))`,
          }}
        >
          Omitir
        </button>
      )}

      {/* Fallback: Tocar para iniciar */}
      {needsTap && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={onTapToStart}
            className="px-6 py-3 rounded-full text-white font-semibold shadow-lg"
            style={{ backgroundColor: 'rgba(240, 99, 64, 0.95)' }}
          >
            {starting ? 'Iniciando…' : 'Tocar para iniciar'}
          </button>
        </div>
      )}

      {/* Safe area bottom padding para evitar solapes con gestos */}
      <div className="pointer-events-none" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />
    </div>
  );
}
