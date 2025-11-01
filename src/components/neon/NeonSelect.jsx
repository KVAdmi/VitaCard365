import React from 'react';

export default function NeonSelect({
  value,
  onValueChange,
  onChange,           // compat opcional
  options = [],
  placeholder = 'Selecciona…',
  variant = 'violet',
  className = '',
}) {
  const border = variant === 'cyan' ? 'border-cyan-300/30' : 'border-violet-300/30';
  const ring   = variant === 'cyan' ? 'focus:ring-2 focus:ring-cyan-300/40' : 'focus:ring-2 focus:ring-violet-300/40';

  const handleChange = (e) => {
    const val = e.target.value;
    if (typeof onValueChange === 'function') onValueChange(val);
    if (typeof onChange === 'function') onChange(e);
  };

  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={handleChange}
        className={`w-full px-3 py-2 rounded-xl bg-white/10 ${border} text-white transition-all ${ring} appearance-none`}
        style={{
          boxShadow: variant==='cyan'
            ? '0 0 0 1px rgba(0,255,231,0.28)'
            : '0 0 0 1px rgba(179,136,255,0.28)',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
        }}
      >
        {/* Placeholder visible solo si value no coincide con ninguna opción */}
        {!options.some(o => o.value === value) && (
          <option value="" disabled hidden>{placeholder}</option>
        )}
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-[rgba(21,32,68,0.98)] text-white">
            {opt.label}
          </option>
        ))}
      </select>
      {/* caret */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/80"
      >⌄</span>
    </div>
  );
}
