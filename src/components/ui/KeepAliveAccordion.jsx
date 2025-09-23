import React, { useRef, useState, useEffect } from 'react';

export default function KeepAliveAccordion({ title, defaultOpen=false, rightBadge=null, onExpand=null, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (open && typeof onExpand === 'function') onExpand();
  }, [open, onExpand]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 text-white shadow-lg">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3"
        onClick={() => setOpen(o => !o)}
      >
        <span className="font-semibold">{title}</span>
        <div className="flex items-center gap-3">
          {rightBadge}
          <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
        </div>
      </button>

      {/* El contenido permanece montado. Solo colapsamos altura/opacity */}
      <div
        ref={bodyRef}
        className={`grid transition-all duration-300 ease-in-out
          ${open ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
          overflow-hidden`}
      >
        <div className="px-4 pb-4">
          {children}
        </div>
      </div>
    </div>
  );
}
