import React, { useState } from 'react';

// Simulación de acceso a SQLite/AsyncStorage para audios locales
export default function AudioCleanupPanel() {
  const [hasLocalAudio, setHasLocalAudio] = useState(true); // Simulación: true si hay audios locales
  const [cleaning, setCleaning] = useState(false);
  const [message, setMessage] = useState('');

  // Simular limpieza de audios locales
  const handleCleanup = async () => {
    setCleaning(true);
    setTimeout(() => {
      setHasLocalAudio(false);
      setMessage('Todos los audios locales han sido eliminados.');
      setCleaning(false);
    }, 1200);
  };

  if (!hasLocalAudio && !message) return null;

  return (
    <div className="glass-card p-4 mb-6 flex flex-col items-start border border-vita-orange/30 bg-gradient-to-br from-vita-blue-light/60 to-vita-blue-dark/60">
      <span className="text-xs text-vita-muted-foreground mb-2">Privacidad: tus audios nunca salen del dispositivo.</span>
      {hasLocalAudio ? (
        <button
          className="bg-vita-orange text-white px-4 py-2 rounded-lg shadow hover:bg-vita-orange/90 transition-all text-sm font-semibold"
          onClick={handleCleanup}
          disabled={cleaning}
        >
          {cleaning ? 'Eliminando audios...' : 'Borrar todos los audios locales'}
        </button>
      ) : (
        <span className="text-green-400 font-semibold text-sm">{message}</span>
      )}
    </div>
  );
}
