import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { usePayment } from '@/hooks/usePayment';
import {
  Ambulance,
  Stethoscope,
  Brain,
  Salad,
  Activity,
  HeartPulse,
  Scale,
  ShieldCheck,
  Wallet,
  ChevronDown,
  ChevronRight,
  Bot
} from 'lucide-react';

// Pequeño stub de analítica (se puede reemplazar por un tracker real)
const track = (event, payload = {}) => {
  try { console.log(`[onboarding] ${event}`, payload); } catch {}
};

const cardsData = [
  {
    id: 'ambulancias',
    icon: Ambulance,
    title: 'Ambulancias 24/7 ilimitado',
    badge: '24/7',
    summary: 'Traslado y asistencia en emergencias, siempre que lo necesites.',
    detail: 'Coordinamos traslado y atención en casos de emergencia. Acceso inmediato.',
  },
  {
    id: 'medico-general',
    icon: Stethoscope,
    title: 'Médico General 24/7',
    badge: '24/7',
    summary: 'Orientación médica inmediata para síntomas, dudas y seguimiento.',
    detail: 'Consulta médica remota y/o a domicilio. Medicina general y especialistas.',
  },
  {
    id: 'psicologia',
    icon: Brain,
    title: 'Psicólogo 24/7',
    badge: '24/7',
    summary: 'Acompañamiento emocional en momentos clave, sin esperas.',
    detail: 'Primer contacto y contención emocional, con escalamiento a sesiones programadas si es necesario. Enfoque humano y confidencial.',
  },
  {
    id: 'nutriologia',
    icon: Salad,
    title: 'Nutriólogo a tu lado 24/7',
    badge: 'Seguimiento',
    summary: 'Plan de alimentación y control de peso con metas reales.',
    detail: 'Evaluación inicial, recomendaciones personalizadas y seguimiento en tu progreso de peso, hábitos y mediciones.',
  },
  {
    id: 'chequeo',
    icon: HeartPulse,
    title: 'Mi Chequeo: signos vitales',
    badge: 'Monitoreo',
    summary: 'Registra presión, pulso y más. Recibe alertas inteligentes.',
    detail: 'Guarda tus mediciones, observa tendencias y recibe recordatorios. Comparte con tu médico cuando lo requieras.',
  },
  {
    id: 'peso',
    icon: Scale,
    title: 'Registro y control de peso',
    badge: 'Progreso',
    summary: 'Objetivos claros y apoyo del nutriólogo para mantenerte al día.',
    detail: 'Define metas, registra avances con gráficas sencillas y obtén ajustes de plan cuando lo necesites.',
  },
  {
    id: 'fitness',
    icon: Activity,
    title: 'Módulo Fitness y Bienestar',
    badge: 'Rutinas',
    summary: 'Rutinas, planes y retos; bienestar integral en un solo lugar.',
    detail: 'Entrenamientos guiados, seguimiento de actividad y contenido de bienestar y nutrición validados por expertos.',
  },
  {
    id: 'ivita',
    icon: Bot,
    title: 'i‑Vita: tu asistente',
    badge: 'Asistencia',
    summary: 'Asistente tipo robot que te guía y resuelve dudas al instante.',
    detail: 'i‑Vita es tu asistente inteligente (robot) que te orienta sobre coberturas, beneficios y próximos pasos, siempre disponible.',
  },
  {
    id: 'wallet',
    icon: Wallet,
    title: 'Wallet segura',
    badge: 'Privado',
    summary: 'Guarda de forma segura tus datos y documentos (póliza, ID, etc.).',
    detail: 'Organiza y protege información importante como número de póliza, identificaciones y notas médicas; todo cifrado en tu app.',
  },
];

export default function OnboardingShowcase() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(null);
  const [current, setCurrent] = useState(0);
  const { individualPrice } = usePayment();
  const scrollRef = useRef(null);
  const dailyPrice = useMemo(() => {
    const perDay = Number(individualPrice) / 30; // aproximado sobre mensual
    if (!isFinite(perDay)) return 8;
    return Math.round(perDay); // mostrar entero: p.ej. 8
  }, [individualPrice]);

  useEffect(() => { track('view'); }, []);

  const onToggle = (id) => {
    setExpanded(prev => prev === id ? null : id);
    track('card_toggle', { id, expanded: expanded !== id });
  };

  const items = useMemo(() => cardsData, []);

  // Track scroll to highlight the current card and enable dot navigation
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const computeCurrent = () => {
      const { scrollLeft, clientWidth } = scroller;
      const cards = scroller.querySelectorAll('[data-card]');
      if (!cards || cards.length === 0) return;
      let bestIdx = 0; let bestDist = Infinity;
      const viewportCenter = scrollLeft + clientWidth / 2;
      cards.forEach((el, idx) => {
        const center = el.offsetLeft + el.offsetWidth / 2;
        const dist = Math.abs(center - viewportCenter);
        if (dist < bestDist) { bestDist = dist; bestIdx = idx; }
      });
      setCurrent(bestIdx);
    };
    computeCurrent();
    const onScroll = () => computeCurrent();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    const ro = new ResizeObserver(computeCurrent);
    ro.observe(scroller);
    return () => { scroller.removeEventListener('scroll', onScroll); ro.disconnect(); };
  }, []);

  const scrollToIndex = (idx) => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const cards = scroller.querySelectorAll('[data-card]');
    const target = cards[idx];
    if (!target) return;
    const left = target.offsetLeft - (scroller.clientWidth - target.offsetWidth) / 2;
    scroller.scrollTo({ left, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0d2041] relative overflow-hidden" style={{ backgroundColor: '#0d2041' }}>
      {/* Fondo animado: halos + círculos/olas flotantes (más naranja y visible) */}
      <style>{`
        @keyframes floaty {
          0% { transform: translateY(0) translateX(0) scale(1); }
          50% { transform: translateY(-42px) translateX(18px) scale(1.06); }
          100% { transform: translateY(0) translateX(0) scale(1); }
        }
      `}</style>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        {/* Halos principales (naranja Vita más visible) */}
        <div
          className="absolute -top-40 -right-24 w-[34rem] h-[34rem] rounded-full blur-2xl"
          style={{
            background:
              'radial-gradient(35% 35% at 50% 50%, rgba(240,99,64,0.45) 0%, rgba(12,28,62,0) 72%)',
          }}
        />
        <div
          className="absolute -bottom-36 -left-24 w-[40rem] h-[40rem] rounded-full blur-2xl"
          style={{
            background:
              'radial-gradient(35% 35% at 50% 50%, rgba(240,99,64,0.30) 0%, rgba(12,28,62,0) 70%)',
          }}
        />
        {/* Olas/ellipses suaves adicionales para dar sensación de movimiento */}
        <div
          className="absolute right-[10%] top-[20%] w-[28rem] h-[10rem] rounded-full blur-[40px] rotate-[-8deg]"
          style={{
            background:
              'radial-gradient(60% 60% at 50% 50%, rgba(240,99,64,0.22) 0%, rgba(12,28,62,0) 80%)',
          }}
        />
        <div
          className="absolute left-[8%] bottom-[18%] w-[24rem] h-[9rem] rounded-full blur-[36px] rotate-[9deg]"
          style={{
            background:
              'radial-gradient(60% 60% at 50% 50%, rgba(240,99,64,0.20) 0%, rgba(12,28,62,0) 80%)',
          }}
        />

        {/* Círculos/olas flotantes: más cantidad, más chicos y más naranja */}
        {[...Array(24)].map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${60 + (i % 5) * 24}px`,
              height: `${60 + (i % 5) * 24}px`,
              left: `${(i * 13) % 95}%`,
              top: `${(i * 19) % 95}%`,
              background:
                i % 3 === 0
                  ? 'radial-gradient(circle at 50% 50%, rgba(240,99,64,0.60), rgba(13,32,65,0))'
                  : i % 3 === 1
                  ? 'radial-gradient(circle at 40% 40%, rgba(240,99,64,0.42), rgba(13,32,65,0))'
                  : 'radial-gradient(circle at 60% 60%, rgba(255,200,180,0.22), rgba(13,32,65,0))',
              opacity: 0.55,
              filter: 'blur(10px)',
              willChange: 'transform',
              animation: `floaty ${5 + (i % 4)}s ease-in-out ${i * 0.25}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Header (logo centrado y grande) */}
      <header className="max-w-6xl mx-auto px-5 pt-6 pb-4 flex items-center justify-center" style={{ position: 'relative', zIndex: 1 }}>
        <img
          src="/branding/Logo%202%20Vita.png"
          alt="VitaCard 365"
          className="h-[12.5rem] w-auto object-contain mx-auto select-none pointer-events-none"
          draggable={false}
        />
      </header>

      {/* Encabezado/hero: SOLO el título, sin tarjeta, entre el logo y el carrusel */}
      <section className="max-w-6xl mx-auto px-5 mt-1 mb-12 md:mb-20" style={{ position: 'relative', zIndex: 1 }}>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="text-white text-3xl md:text-5xl font-extrabold tracking-tight text-center"
        >
          Tu app integral de salud y bienestar.
        </motion.h2>
      </section>

      {/* Tarjetero: scroll-snap horizontal */}
      <section className="mt-0" style={{ position: 'relative', zIndex: 1 }}>
        <div className="max-w-6xl mx-auto px-4">
          <div ref={scrollRef} className="overflow-x-auto pb-3 -mx-2 px-2 snap-x snap-mandatory">
            <div className="flex gap-4 min-w-full">
              {items.map((item) => {
                const Icon = item.icon;
                const isOpen = expanded === item.id;
                return (
                  <motion.div
                    key={item.id}
                    layout
                    onClick={() => onToggle(item.id)}
                    className="snap-center w-[380px] flex-shrink-0 cursor-pointer"
                    data-card
                  >
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35 }}
                      className="glass-card rounded-3xl p-5 md:p-6 border border-white/25 shadow-[0_18px_50px_rgba(0,0,0,0.45)] h-[260px] flex flex-col overflow-hidden"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-white/10 border border-white/15 text-white">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-white font-semibold text-lg">{item.title}</h3>
                            {item.badge && (
                              <span className="text-[10px] uppercase tracking-wide bg-vita-orange text-white/95 px-2 py-0.5 rounded-full border border-white/30">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-white/70 text-sm mt-0.5">{item.summary}</p>
                        </div>
                        <div className="text-white/70">
                          {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                        </div>
                      </div>

                      <div className="mt-4 text-white/80 text-sm" style={{ maxHeight: 76, overflow: 'hidden' }}>
                        {isOpen ? item.detail : item.summary}
                      </div>
                      {/* Mantener altura consistente; se elimina animación colapsable para uniformidad */}
                      {/*
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            key="detail"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                            className="mt-4 text-white/80 text-sm"
                          >
                            {item.detail}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      */}
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </div>
          {/* Dots de paginación (3D naranja) */}
          <div className="flex items-center justify-center gap-2 mt-3 select-none">
            {items.map((_, idx) => {
              const active = idx === current;
              return (
                <button
                  key={idx}
                  aria-label={`Ir a la tarjeta ${idx + 1}`}
                  onClick={() => scrollToIndex(idx)}
                  className="rounded-full focus:outline-none focus:ring-2 focus:ring-vita-orange/60"
                  style={{
                    width: active ? 14 : 10,
                    height: active ? 14 : 10,
                    background: active
                      ? 'linear-gradient(180deg, rgba(255,155,100,1) 0%, rgba(232,102,20,1) 100%)'
                      : 'linear-gradient(180deg, rgba(255,155,100,0.45) 0%, rgba(232,102,20,0.45) 100%)',
                    boxShadow: active
                      ? '0 6px 14px rgba(232,102,20,0.55), inset 0 1px 0 rgba(255,255,255,0.5)'
                      : '0 2px 6px rgba(232,102,20,0.35), inset 0 1px 0 rgba(255,255,255,0.3)',
                    transform: active ? 'translateY(-1px)' : 'none',
                    transition: 'all 220ms ease',
                  }}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* Tarjeta informativa con más profundidad, debajo del carrusel (sin título para evitar duplicado) */}
      <section className="max-w-4xl mx-auto px-5 mt-8" style={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="glass-card rounded-3xl p-6 md:p-8 border border-white/25 shadow-[0_22px_60px_rgba(0,0,0,0.5)]"
        >
          <p className="text-white/85 text-base md:text-lg">
            Activa tu plan y protégete con asistencias reales: médico general, psicología, nutrición, fitness, registro de signos vitales y más.
          </p>
          <p className="text-white/85 mt-2 text-base md:text-lg">
            Descúbrelo aquí y siéntete seguro con VitaCard 365.
          </p>
        </motion.div>
      </section>

      {/* Se elimina la tarjeta informativa debajo del carrusel según solicitud */}

      {/* CTAs debajo de la tarjeta, con espacio */}
      <section className="max-w-4xl mx-auto px-5 mt-5 mb-12" style={{ position: 'relative', zIndex: 1 }}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <Button
            size="lg"
            className="w-full sm:w-auto bg-vita-orange text-white font-bold"
            onClick={() => { track('cta_comenzar'); navigate('/register'); }}
          >
            Comenzar ahora
          </Button>
          <Button
            className="w-full sm:w-auto border border-vita-orange text-vita-orange bg-transparent hover:bg-vita-orange/15 font-bold"
            onClick={() => { track('cta_login'); navigate('/login'); }}
          >
            Ya tengo cuenta
          </Button>
        </div>
      </section>
    </div>
  );
}
