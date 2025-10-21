import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function NeonSelect({ value, onChange, options, placeholder, variant = 'violet', className = '' }){
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ left: 0, top: 0, width: 0 });
  const btnRef = useRef(null);
  const selected = options.find(o => o.value === value) || null;
  const border = variant === 'cyan' ? 'border-cyan-300/30' : 'border-violet-300/30';
  const hover = variant === 'cyan' ? 'hover:bg-cyan-400/20' : 'hover:bg-violet-400/20';

  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({ left: rect.left, top: rect.bottom + window.scrollY, width: rect.width });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (btnRef.current && !btnRef.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className={`relative ${className}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={()=>setOpen(v=>!v)}
        className={`w-full px-3 py-2 rounded-xl bg-white/10 ${border} text-white text-left flex items-center justify-between transition-all`}
        style={{ boxShadow: variant==='cyan'?'0 0 0 1px rgba(0,255,231,0.28)':'0 0 0 1px rgba(179,136,255,0.28)', animation: 'neonPulse 2.4s ease-in-out infinite' }}
        aria-haspopup="listbox" aria-expanded={open}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <span className={`ml-2 transition-transform ${open?'rotate-180':''}`}>⌄</span>
      </button>
      {open && createPortal(
        <ul
          className={`max-h-56 overflow-auto rounded-2xl ${border}`}
          style={{
            position: 'absolute',
            left: menuPos.left,
            top: menuPos.top,
            width: menuPos.width,
            background: 'rgba(21,32,68,0.99)',
            color: '#fff',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 20px 40px rgba(21,32,68,0.35)',
            zIndex: 99999,
            border: '1px solid rgba(255,255,255,0.12)'
          }}
        >
          {options.map(opt => (
            <li key={opt.value}>
              <button type="button" onClick={()=>{ onChange({ target: { value: opt.value } }); setOpen(false); }}
                className={`w-full text-left px-3 py-2 transition-colors ${hover} ${value===opt.value?'bg-white/15':''}`}
                style={{ color: '#fff' }}
              >{opt.label}</button>
            </li>
          ))}
        </ul>,
        document.body
      )}
    </div>
  );
}
