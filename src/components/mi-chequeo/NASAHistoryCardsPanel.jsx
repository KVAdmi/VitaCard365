import React from 'react';
import NASAHistoryCard from './NASAHistoryCard';

/**
 * Tarjetas NASA para la página de entrada a Mi Chequeo.
 * Incluye: presión arterial, glucosa, SpO2, sueño, peso, talla y test de alertas.
 * Gráficas semanales simuladas, botón PDF, glass, sin emojis.
 */

const NASAHistoryCardsPanel = () => {
  return (
    <div className="grid md:grid-cols-2 gap-6 mb-8">
      <NASAHistoryCard
        title="Presión arterial"
        subtitle="Sistólica, diastólica y pulso (últimos 7 días)"
        data={[
          { label: 'Sistólica', color: '#f06340', values: [120, 125, 118, 122, 130, 128, 124] },
          { label: 'Diastólica', color: '#4ade80', values: [80, 82, 78, 79, 85, 83, 81] },
          { label: 'Pulso', color: '#3b82f6', values: [72, 75, 70, 68, 74, 73, 71] },
        ]}
        multiLine
        onDownloadPDF={() => alert('Descarga de PDF próximamente')}
      />
      <NASAHistoryCard
        title="Glucosa"
        subtitle="Historial semanal de glucosa"
        data={[95, 100, 92, 110, 105, 98, 97]}
        onDownloadPDF={() => alert('Descarga de PDF próximamente')}
      />
      <NASAHistoryCard
        title="SpO₂"
        subtitle="Historial semanal de saturación de oxígeno"
        data={[98, 97, 99, 98, 96, 97, 98]}
        onDownloadPDF={() => alert('Descarga de PDF próximamente')}
      />
      <NASAHistoryCard
        title="Peso y Talla"
        subtitle="Peso (kg) y talla (cm) últimos 7 días"
        data={[
          { label: 'Peso', color: '#f06340', values: [70, 70.2, 70.1, 70, 69.9, 70, 70.1] },
          { label: 'Talla', color: '#4ade80', values: [170, 170, 170, 170, 170, 170, 170] },
        ]}
        multiLine
        onDownloadPDF={() => alert('Descarga de PDF próximamente')}
      />
      <NASAHistoryCard
        title="Test de Alertas"
        subtitle="Resultados recientes del test"
        data={[1, 0, 1, 1, 0, 1, 1]}
        onDownloadPDF={() => alert('Descarga de PDF próximamente')}
      />
      <NASAHistoryCard
        title="Calidad de Sueño"
        subtitle="Horas de sueño por noche"
        data={[7, 6.5, 8, 7.5, 6, 7, 7.2]}
        onDownloadPDF={() => alert('Descarga de PDF próximamente')}
      />
    </div>
  );
};

export default NASAHistoryCardsPanel;
