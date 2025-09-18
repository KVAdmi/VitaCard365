import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../../components/ui/card';
// Si tienes Chart.js instalado, descomenta la siguiente línea y usa el componente adecuado
// import { Line } from 'react-chartjs-2';

/**
 * Tarjeta tipo NASA para historial de medidas.
 * - Glassmorphism, animaciones sutiles, sin emojis.
 * - Gráfica semanal (simulada), botón PDF, autolimpieza tras 7 días (solo UI).
 * - Profesional, impactante, siguiendo la línea visual de la app.
 */

const NASAHistoryCard = ({ title, subtitle, data, onDownloadPDF, multiLine }) => {
  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Si multiLine, data es un array de series: [{label, color, values:[]}, ...]
  // Si no, data es un array de valores
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card shadow-xl border border-vita-orange/30 rounded-2xl overflow-hidden"
    >
      <Card className="bg-gradient-to-br from-vita-blue-light/80 to-vita-blue-dark/80">
        <CardContent className="p-6 flex flex-col gap-3">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h3 className="text-lg font-bold text-vita-white drop-shadow">{title}</h3>
              {subtitle && <p className="text-xs text-vita-muted-foreground mt-1">{subtitle}</p>}
            </div>
            <button
              onClick={onDownloadPDF}
              className="px-3 py-1 bg-vita-orange/80 hover:bg-vita-orange text-white rounded-lg text-xs font-semibold shadow"
            >
              Descargar PDF
            </button>
          </div>
          {/* Gráfica semanal (simulada) */}
          <div className="w-full h-28 flex items-end gap-1 mt-2 relative">
            {multiLine ? (
              // Multi serie: cada serie es una línea/barra superpuesta
              data.map((serie, sidx) => (
                <React.Fragment key={serie.label}>
                  {serie.values.map((val, idx) => (
                    <div
                      key={idx + '-' + sidx}
                      className="absolute bottom-0"
                      style={{
                        left: `calc(${(idx / 7) * 100}% + ${sidx * 12}px)` ,
                        height: `${(val / (serie.label === 'Pulso' ? 150 : 200)) * 100}%`,
                        width: 10,
                        background: serie.color,
                        borderRadius: 6,
                        opacity: 0.7,
                        zIndex: sidx + 1,
                        transition: 'height 0.3s',
                      }}
                      title={val}
                    ></div>
                  ))}
                </React.Fragment>
              ))
            ) : (
              data.map((val, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1">
                  <div
                    className="bg-vita-orange/80 rounded-t-lg"
                    style={{ height: `${(val / 80) * 100}%`, minHeight: 8, width: 14 }}
                    title={val}
                  ></div>
                  <span className="text-[10px] text-vita-white/70 mt-1">{days[idx]}</span>
                </div>
              ))
            )}
            {/* Leyenda para multiLine */}
            {multiLine && (
              <div className="absolute right-2 top-2 flex gap-2 bg-black/30 px-2 py-1 rounded-lg text-xs">
                {data.map((serie) => (
                  <span key={serie.label} style={{ color: serie.color }}>{serie.label}</span>
                ))}
              </div>
            )}
          </div>
          {/* Historial textual */}
          <div className="mt-3 text-xs text-vita-white/90">
            <span className="font-semibold">Últimos 7 días:</span> {multiLine
              ? data.map(s => `${s.label}: ${s.values.join(' - ')}`).join(' | ')
              : data.join(' - ')}
          </div>
          {/* Nota de autolimpieza */}
          <div className="mt-2 text-[10px] text-vita-muted-foreground italic">
            * Este registro se eliminará automáticamente después de 7 días.
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default NASAHistoryCard;
