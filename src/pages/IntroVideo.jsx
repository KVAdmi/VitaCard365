import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function IntroVideo() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [showSkip, setShowSkip] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [ready, setReady] = useState(false);         // El video ya puede pintar
  const [posterVisible, setPosterVisible] = useState(true); // Poster visible hasta playing
  useEffect(()=>{ try{ console.log('[Intro] mounted'); }catch{} },[]);

  // Póster inmediato (ruta conocida en assets)
  const poster = '/assets/landing-poster.jpg';
  const srcCandidates = [
    '/landing-video.mp4',
    '/assets/landing-video.mp4',
    '/Video%20intro.mp4',
  ];

  useEffect(() => {
    // Mostramos 'Omitir' después de 3s. NO ocultamos el Splash aquí.
    const t = setTimeout(() => setShowSkip(true), 3000);
    return () => { clearTimeout(t); };
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
        // A) Empuja primer frame (~0.05s) para desbloquear pintura inicial en WebViews tercos
        if (!Number.isFinite(v.currentTime) || v.currentTime < 0.01) {
          try { v.currentTime = 0.05; } catch {}
        }
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
      // Ocultar Splash apenas el video puede pintar, con micro-retardo para estabilidad
      try {
        const cap = typeof window !== 'undefined' ? window.Capacitor : undefined;
        const hidePlugins = cap?.Plugins?.SplashScreen?.hide;
        const hideGlobal = cap?.SplashScreen?.hide;
        setTimeout(() => {
          if (typeof hidePlugins === 'function') hidePlugins();
          if (typeof hideGlobal === 'function') hideGlobal();
        }, 60);
      } catch {}
      // Intentar reproducción cuando esté listo
      tryAutoplay();
    };
  v.addEventListener('canplay', onCanPlay);

    // Eventos para entender el estado del video
    const onPlaying = () => {
      setStarting(false);
      setNeedsTap(false);
      // Ocultar SplashScreen justo cuando el video realmente empieza
      try {
        const cap = typeof window !== 'undefined' ? window.Capacitor : undefined;
        const hidePlugins = cap?.Plugins?.SplashScreen?.hide;
        if (typeof hidePlugins === 'function') hidePlugins();
        const hideGlobal = cap?.SplashScreen?.hide;
        if (typeof hideGlobal === 'function') hideGlobal();
      } catch {}
      // Dar un breve margen para asegurar primer frame estable antes de retirar el póster
      setTimeout(() => { if (posterVisible) setPosterVisible(false); }, 120);
    };
    const onWaiting = () => {
      // está cargando/buffering; no navegar aún
      setStarting(true);
    };
    const onError = () => {
      setStarting(false);
      // Intenta el siguiente source si el actual falla
      const idx = Number(v.dataset.idx || 0);
      const next = srcCandidates[idx + 1];
      if (next) {
        v.dataset.idx = String(idx + 1);
        v.src = next;
        v.load();
      } else {
        setNeedsTap(true);
      }
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
        if (posterVisible) setPosterVisible(false);
      }
    };
    v.addEventListener('timeupdate', onTimeUpdate);

    // Segundo intento por si 'canplay' no dispara en algunos WebViews
    const fallbackTimer = setTimeout(() => {
      // Si ni así avanza pronto, mostrar tap (sin navegar)
      stallTimer = setTimeout(() => {
        if (v.paused || v.currentTime < 0.2) {
          setNeedsTap(true);
        }
      }, 900);
    }, 500);

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
    // Asegura ocultar splash al salir hacia Login
    try {
      const cap = typeof window !== 'undefined' ? window.Capacitor : undefined;
      const hidePlugins = cap?.Plugins?.SplashScreen?.hide;
      if (typeof hidePlugins === 'function') hidePlugins();
      const hideGlobal = cap?.SplashScreen?.hide;
      if (typeof hideGlobal === 'function') hideGlobal();
    } catch {}
    // Forzar hash en nativo para evitar edge cases de Router en file://
    try {
      const protocol = (typeof window !== 'undefined' && window.location?.protocol) || '';
      const isNativeEnv = (typeof window !== 'undefined' && window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform()) || protocol === 'capacitor:' || protocol === 'file:';
      if (isNativeEnv) {
        // cinturón y tirantes: setear hash directamente
        if (typeof window !== 'undefined') {
          window.location.hash = '#/descubre';
        }
      }
    } catch {}
    setTimeout(() => navigate('/descubre', { replace: true }), 120);
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

  // Fallback duro: si tras 3.5s no arrancó, llevar a login
  useEffect(() => {
    const t = setTimeout(() => {
      const v = videoRef.current;
      const playing = v && !v.paused && v.currentTime > 0.2;
      if (!playing) {
        goLoginWithFade();
      }
    }, 3500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`fixed inset-0 ${isFading ? 'opacity-0' : 'opacity-100'}`}
      // Fondo azul corporativo para evitar "pantalla tinta"
      style={{ background: '#0c1c3e', transition: 'opacity 250ms ease-in-out' }}
    >
      <style>{`
        /* Oculta overlays de play en reproducción automática en WebView/nativo */
        video::-webkit-media-controls { display: none !important; }
        video::-webkit-media-controls-enclosure { display: none !important; }
        video::-webkit-media-controls-play-button { display: none !important; }
        video { -webkit-appearance: none; appearance: none; }
      `}</style>
      {/* Poster overlay: visible hasta que el video esté 'playing' */}
      <img
        src={poster}
        alt="Intro"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${posterVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: '#0c1c3e', zIndex: 2 }}
      />

      <video
        ref={videoRef}
        src={srcCandidates[0]}
        poster={poster}
        className={`w-full h-full object-cover transition-opacity duration-200 ${ready ? 'opacity-100' : 'opacity-0'}`}
        autoPlay
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        onEnded={goLoginWithFade}
        style={{ backgroundColor: 'transparent', zIndex: 1 }}
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
