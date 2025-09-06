import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const BreathingPlayer = ({ pattern }) => {
  const { inhale, hold1, exhale, hold2 } = pattern;
  const totalCycleTime = inhale + hold1 + exhale + hold2;
  const [isBreathing, setIsBreathing] = useState(false);
  const [phase, setPhase] = useState('Inhala');
  const [phaseTime, setPhaseTime] = useState(inhale);

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
          className="absolute w-full h-full rounded-full bg-vita-orange/20"
          animate={{
            scale: isBreathing ? (phase === 'Inhala' ? 1 : 0.7) : 1,
          }}
          transition={{ duration: isBreathing ? phaseTime : 1, ease: 'easeInOut' }}
        />
        <motion.div
          className="w-32 h-32 bg-vita-orange rounded-full"
           animate={{
            scale: isBreathing ? (phase === 'Inhala' ? 1.2 : 1) : 1,
          }}
          transition={{ duration: isBreathing ? phaseTime : 1, ease: 'easeInOut' }}
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
    </div>
  );
};

export default BreathingPlayer;