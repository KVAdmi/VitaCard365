import React from 'react';

const palettes = {
  violet: {
    border: 'border-violet-300/30',
    bg: 'bg-violet-400/15 hover:bg-violet-400/25',
    ring: 'shadow-[0_0_0_1px_rgba(179,136,255,0.38)]',
  },
  cyan: {
    border: 'border-cyan-300/30',
    bg: 'bg-cyan-400/15 hover:bg-cyan-400/25',
    ring: 'shadow-[0_0_0_1px_rgba(0,255,231,0.38)]',
  },
};

export default function NeonButton({ children, className = '', variant = 'violet', disabled, ...rest }) {
  const p = palettes[variant] || palettes.violet;
  return (
    <button
      {...rest}
      disabled={disabled}
      className={`px-4 py-2 rounded-2xl border ${p.border} ${p.bg} text-white/95 transition-all ${p.ring} ${disabled ? 'opacity-60 cursor-default' : ''} ${className}`}
      style={{ animation: disabled ? undefined : 'neonPulse 2.4s ease-in-out infinite' }}
    >
      <style>{`@keyframes neonPulse{0%,100%{filter:drop-shadow(0 0 8px rgba(179,136,255,0.18))}50%{filter:drop-shadow(0 0 14px rgba(179,136,255,0.35))}}`}</style>
      {children}
    </button>
  );
}
