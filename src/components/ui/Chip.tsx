import React from 'react';

export default function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white/80 text-sm">
      {children}
    </span>
  );
}
