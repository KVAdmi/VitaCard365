// Para evitar advertencias TS: window.Capacitor
declare global {
  interface Window {
    Capacitor?: any;
  }
}

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Removed shadcn Button for a native button in TopPortal to avoid style overrides

export default function IntroVideo() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showSkip, setShowSkip] = useState(false);
  const [needsTap, setNeedsTap] = useState(false); // iOS: deshabilitado (no mostrar nunca)
  const [isFading, setIsFading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [ready, setReady] = useState(false);         // El video ya puede pintar
  const [posterVisible, setPosterVisible] = useState(true); // Poster visible hasta playing
  const [showSplash, setShowSplash] = useState(true); // Splash visible al inicio
  useEffect(()=>{ try{ console.log('[Intro] mounted'); }catch{} },[]);

  // Póster inmediato (ruta conocida en assets)
  const poster = '/assets/landing-poster.jpg';
  // Splash gráfico (branding oficial)
  const splashImg = '/branding/splash.png';
  // Fuente única y oficial del video
  const videoSrc = '/videos/intro.mp4';

  // Mostramos splash durante 2s (alineado con plugin nativo), luego lo ocultamos y arranca el video
  useEffect(() => {
    const splashTimer = setTimeout(() => setShowSplash(false), 2000);
    return () => { clearTimeout(splashTimer); };
  }, []);

  // Mostramos 'Omitir' después de 2s tras montar (como en soporte)
  useEffect(() => {
    const t = setTimeout(() => setShowSkip(true), 2000);
    return () => { clearTimeout(t); };
  }, []);

  useEffect(() => {
  const v = videoRef.current;
  if (!v) return;

  const setInlineAttrs = () => {
      if (!v) return;
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
        // iOS: no queremos botón "Tocar para iniciar" en ningún caso
        setNeedsTap(false);
      }
    };

    let splashHidden = false;
    const onCanPlay = () => {
      console.log('[IntroVideo] EVENT: canplay');
      setReady(true);
      // Intentar reproducción cuando esté listo
      tryAutoplay();
    };
  v.addEventListener('canplay', onCanPlay);

    // Eventos para entender el estado del video
    const onPlaying = () => {
      console.log('[IntroVideo] EVENT: playing', videoRef.current?.currentTime);
      setStarting(false);
      setNeedsTap(false);
      // Ocultar SplashScreen justo cuando el video realmente empieza (solo una vez)
      if (!splashHidden) {
        try {
          const cap = typeof window !== 'undefined' ? (window as Window).Capacitor : undefined;
          const hidePlugins = cap?.Plugins?.SplashScreen?.hide;
          if (typeof hidePlugins === 'function') hidePlugins();
          const hideGlobal = cap?.SplashScreen?.hide;
          if (typeof hideGlobal === 'function') hideGlobal();
        } catch {}
        splashHidden = true;
      }
      // Dar un breve margen para asegurar primer frame estable antes de retirar el póster
  setTimeout(() => { if (posterVisible) setPosterVisible(false); }, 120);
    };
    const onWaiting = () => {
      console.log('[IntroVideo] EVENT: waiting');
      // está cargando/buffering; no navegar aún
      setStarting(false);
    };
    const onError = () => {
      console.log('[IntroVideo] EVENT: error');
      setStarting(false);
      setNeedsTap(false);
    };
  v.addEventListener('playing', onPlaying);
  v.addEventListener('waiting', onWaiting);
  v.addEventListener('error', onError);

    // Quitamos fallback agresivo; daremos un margen separado tras quitar el splash

    return () => {
  v.removeEventListener('canplay', onCanPlay);
  v.removeEventListener('playing', onPlaying);
  v.removeEventListener('waiting', onWaiting);
  v.removeEventListener('error', onError);
    };
  }, []);

  // iOS: Eliminamos fallback de "Tocar para iniciar" para evitar doble arranque visual

  const goLoginWithFade = () => {
    if (isFading) return;
    setIsFading(true);
    // Asegura ocultar splash al salir hacia Login
    try {
  const cap = typeof window !== 'undefined' ? (window as Window).Capacitor : undefined;
      const hidePlugins = cap?.Plugins?.SplashScreen?.hide;
      if (typeof hidePlugins === 'function') hidePlugins();
      const hideGlobal = cap?.SplashScreen?.hide;
      if (typeof hideGlobal === 'function') hideGlobal();
    } catch {}
    // Forzar hash en nativo para evitar edge cases de Router en file://
    try {
      const protocol = (typeof window !== 'undefined' && window.location?.protocol) || '';
  const isNativeEnv = (typeof window !== 'undefined' && (window as Window).Capacitor && typeof (window as Window).Capacitor.isNativePlatform === 'function' && (window as Window).Capacitor.isNativePlatform()) || protocol === 'capacitor:' || protocol === 'file:';
      if (isNativeEnv) {
        // cinturón y tirantes: setear hash directamente
        if (typeof window !== 'undefined') {
          window.location.hash = '#/descubre';
        }
      }
    } catch {}
    setTimeout(() => navigate('/descubre', { replace: true }), 120);
  };

  // iOS: removido handler de tap manual; no se usa



  return (
    <div
      className={`fixed inset-0 ${isFading ? 'opacity-0' : 'opacity-100'}`}
      style={{
        background: '#0c1c3e',
        transition: 'opacity 250ms ease-in-out',
        // Garantiza que no bloquee toques cuando estamos saliendo
        pointerEvents: isFading ? 'none' : 'auto',
        zIndex: 0,
      }}
    >
      <style>{`
        video::-webkit-media-controls { display: none !important; }
        video::-webkit-media-controls-enclosure { display: none !important; }
        video::-webkit-media-controls-play-button { display: none !important; }
        video { -webkit-appearance: none; appearance: none; }
      `}</style>

      {/* Splash gráfico centrado, cubre todo, fade-out suave */}
      {showSplash && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: '#0c1c3e', zIndex: 20, transition: 'opacity 350ms', opacity: showSplash ? 1 : 0 }}
        >
          <img
            src={splashImg}
            alt="Splash"
            style={{ maxWidth: '70%', maxHeight: '70%', objectFit: 'contain', transition: 'opacity 350ms', opacity: 1 }}
          />
        </div>
      )}

      {/* Poster overlay: visible hasta que el video esté 'playing' */}
      <img
        src={poster}
        alt="Intro"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${posterVisible && !showSplash ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: '#0c1c3e', zIndex: 2 }}
      />

      {/* Video: solo visible cuando no hay splash */}
      <video
        ref={videoRef}
        src={videoSrc}
        poster={poster}
        className={`w-full h-full object-cover transition-opacity duration-200 ${ready && !showSplash ? 'opacity-100' : 'opacity-0'}`}
        autoPlay
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
  onEnded={() => { console.log('[IntroVideo] EVENT: ended', videoRef.current?.currentTime); goLoginWithFade(); }}
        style={{ backgroundColor: 'transparent', zIndex: 1 }}
      />

      {/* Botón Omitir visible a los 2s */}
      {showSkip && !showSplash && (
        <button
          onClick={goLoginWithFade}
          aria-label="Omitir"
          className="fixed right-4 z-[1001] inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-[13px] font-semibold text-white shadow-md active:scale-95"
          style={{
            top: 'calc(12px + env(safe-area-inset-top, 0px))',
            backgroundColor: 'rgb(240,99,64)',
            border: '1px solid rgba(255,255,255,0.35)',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden'
          }}
        >
          Omitir
        </button>
      )}

      {/* iOS: Sin fallback de "Tocar para iniciar" */}

      {/* Safe area bottom padding para evitar solapes con gestos */}
      <div className="pointer-events-none" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />
    </div>
  );
}
