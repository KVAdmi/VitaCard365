// src/components/Modal.tsx
import React from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export default function Modal({ open, onClose, title, children }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg sm:rounded-2xl sm:mx-auto sm:my-8 bg-[color:var(--vc-card,rgba(20,20,28,0.9))] border border-white/10 shadow-2xl">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{title ?? 'Confirmar'}</h3>
            <button onClick={onClose} className="text-sm opacity-70">Cerrar</button>
          </div>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
