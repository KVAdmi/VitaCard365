export function calculaTriage(medicion) {
  let riesgo = 'bajo';
  const recomendaciones = [];

  // Presión arterial
  if (medicion.sistolica && medicion.diastolica) {
    if (medicion.sistolica >= 180 || medicion.diastolica >= 120) {
      riesgo = 'alto';
      recomendaciones.push('Presión arterial muy elevada. Busque atención médica inmediata.');
    } else if (medicion.sistolica >= 140 || medicion.diastolica >= 90) {
      riesgo = Math.max(riesgo === 'bajo' ? 'medio' : riesgo);
      recomendaciones.push('Presión arterial elevada. Consulte con su médico.');
    }
  }

  // Frecuencia cardíaca
  if (medicion.pulsoBpm) {
    if (medicion.pulsoBpm > 120 || medicion.pulsoBpm < 50) {
      riesgo = Math.max(riesgo === 'bajo' ? 'medio' : riesgo);
      recomendaciones.push('Frecuencia cardíaca fuera de rango normal. Considere consultar a su médico.');
    }
  }

  return { riesgo, recomendaciones };
}