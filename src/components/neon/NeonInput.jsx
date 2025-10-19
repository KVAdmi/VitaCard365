import React from 'react';

export default function NeonInput({ className = '', variant = 'violet', ...rest }) {
  const border = variant === 'cyan' ? 'border-cyan-300/25 focus:ring-cyan-300/60 focus:border-cyan-200/70' : 'border-violet-300/25 focus:ring-violet-300/60 focus:border-violet-200/70';
  return (
    <input {...rest} className={`px-3 py-2 rounded-xl bg-white/10 text-white placeholder-white/70 focus:outline-none focus:ring-2 transition-all ${border} ${className}`} />
  );
}
