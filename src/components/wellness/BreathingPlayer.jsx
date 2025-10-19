import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui/button';
import { motion, AnimatePresence } from 'framer-motion';

// variant: 'calma' (4-7-8), 'foco' (cuadrada), 'antiestres' (suspiro), 'sueño' (más exhala)
const BreathingPlayer = ({ pattern, variant = 'calma', withSound = false }) => {
  const { inhale, hold1, exhale, hold2 } = pattern;
  const totalCycleTime = inhale + hold1 + exhale + hold2;
  const [isBreathing, setIsBreathing] = useState(false);
  const [phase, setPhase] = useState('Inhala');
  const [phaseTime, setPhaseTime] = useState(inhale);
  const theme = useMemo(()=>{
    switch(variant){
      case 'foco': return { color: '#38bdf8', glow: 'rgba(56,189,248,0.25)' };
      case 'antiestres': return { color: '#34d399', glow: 'rgba(52,211,153,0.25)' };
      case 'sueño': return { color: '#818cf8', glow: 'rgba(129,140,248,0.25)' };
      default: return { color: '#f06340', glow: 'rgba(240,99,64,0.25)' };
    }
  }, [variant]);

  useEffect(() => {
    let timer;
    if (isBreathing) {
      const cycle = [
        { name: 'Inhala', time: inhale },
        { name: 'Sostén', time: hold1 },
        { name: 'Exhala', time: exhale },
        { name: 'Sostén', time: hold2 },
      ].filter(p => p.time > 0);

      let currentPhaseIndex = 0;

      const runCycle = () => {
        const current = cycle[currentPhaseIndex];
        setPhase(current.name);
        setPhaseTime(current.time);
        if (withSound) {
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            // tonos sutiles por fase
            osc.frequency.value = current.name === 'Inhala' ? 440 : current.name === 'Exhala' ? 329.6 : 392;
            gain.gain.value = 0.03;
            osc.connect(gain).connect(ctx.destination);
            osc.start();
            setTimeout(()=>{ try { osc.stop(); ctx.close(); } catch {} }, 200);
          } catch {}
        }
        // vibración sutil al cambio de fase (si está disponible)
        try { if (navigator?.vibrate) navigator.vibrate(40); } catch {}
        
        timer = setTimeout(() => {
          currentPhaseIndex = (currentPhaseIndex + 1) % cycle.length;
          runCycle();
        }, current.time * 1000);
      };

      runCycle();
    } else {
      setPhase('Inhala');
      setPhaseTime(inhale);
    }
    return () => clearTimeout(timer);
  }, [isBreathing, inhale, hold1, exhale, hold2]);
  
  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-lg glass-card text-center h-80">
      <div className="relative w-48 h-48 flex items-center justify-center mb-6">
        <motion.div
          className="absolute w-full h-full rounded-full"
          animate={{
            scale: isBreathing ? (phase === 'Inhala' ? 1 : 0.7) : 1,
          }}
          transition={{ duration: isBreathing ? phaseTime : 1, ease: 'easeInOut' }}
          style={{ background: theme.glow }}
        />
        <motion.div
          className="w-32 h-32 rounded-full"
           animate={{
            scale: isBreathing ? (phase === 'Inhala' ? 1.2 : 1) : 1,
          }}
          transition={{ duration: isBreathing ? phaseTime : 1, ease: 'easeInOut' }}
          style={{ backgroundColor: theme.color, boxShadow: `0 0 24px ${theme.glow}` }}
        />
      </div>
      <AnimatePresence mode="wait">
        <motion.h3
            key={phase}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.5 }}
            className="text-2xl font-bold text-vita-white mb-4"
        >
            {phase} ({phaseTime}s)
        </motion.h3>
      </AnimatePresence>
      <Button onClick={() => setIsBreathing(!isBreathing)} className="w-32">
        {isBreathing ? 'Detener' : 'Comenzar'}
      </Button>
      <div className="mt-3 text-xs text-white/60">{variant === 'foco' ? 'Cuadrada' : variant === 'sueño' ? 'Exhala más' : variant === 'antiestres' ? 'Suspiro fisiológico' : 'Calma 4-7-8'}</div>
    </div>
  );
};

export default BreathingPlayer;