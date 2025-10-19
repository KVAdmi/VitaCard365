import React, { useState } from 'react';

export default function NeonSelect({ value, onChange, options, placeholder, variant = 'violet', className = '' }){
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value) || null;
  const border = variant === 'cyan' ? 'border-cyan-300/30' : 'border-violet-300/30';
  const hover = variant === 'cyan' ? 'hover:bg-cyan-400/20' : 'hover:bg-violet-400/20';
  return (
    <div className={`relative ${className}`}>
      <button type="button" onClick={()=>setOpen(v=>!v)}
        className={`w-full px-3 py-2 rounded-xl bg-white/10 ${border} text-white text-left flex items-center justify-between transition-all`}
        style={{ boxShadow: variant==='cyan'?'0 0 0 1px rgba(0,255,231,0.28)':'0 0 0 1px rgba(179,136,255,0.28)', animation: 'neonPulse 2.4s ease-in-out infinite' }}
        aria-haspopup="listbox" aria-expanded={open}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <span className={`ml-2 transition-transform ${open?'rotate-180':''}`}>⌄</span>
      </button>
      {open && (
        <ul className={`absolute z-50 mt-2 w-full max-h-56 overflow-auto rounded-2xl ${border} bg-white/10 backdrop-blur-md shadow-[0_20px_40px_rgba(60,0,120,0.35)]`}>
          {options.map(opt => (
            <li key={opt.value}>
              <button type="button" onClick={()=>{ onChange({ target: { value: opt.value } }); setOpen(false); }}
                className={`w-full text-left px-3 py-2 transition-colors ${hover} ${value===opt.value?'bg-white/15':''}`}
              >{opt.label}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
