export const runTriage = (type, data) => {
    switch (type) {
      case 'pressure':
        return triagePressure(data);
      // Add other triage types here
      default:
        return { risk: 'low', label: 'Datos no analizables', reasons: [] };
    }
  };
  
  const triagePressure = ({ systolic, diastolic, heartRate }) => {
    const s = parseInt(systolic, 10);
    const d = parseInt(diastolic, 10);
    const hr = parseInt(heartRate, 10);
    let risk = 'low';
    let label = 'Presión Normal';
    let reasons = [];
  
    // Systolic checks
    if (s >= 180) {
      risk = 'high';
      label = 'Crisis Hipertensiva';
      reasons.push('Presión sistólica muy elevada. Busque atención médica de inmediato.');
    } else if (s >= 140) {
      risk = 'high';
      label = 'Hipertensión Grado 2';
      reasons.push('Presión sistólica elevada.');
    } else if (s >= 130) {
      risk = 'medium';
      label = 'Hipertensión Grado 1';
      reasons.push('Presión sistólica moderadamente elevada.');
    } else if (s < 90) {
      risk = 'medium';
      label = 'Hipotensión';
      reasons.push('Presión sistólica baja.');
    }
  
    // Diastolic checks
    if (d >= 120 && risk !== 'high') {
      risk = 'high';
      label = 'Crisis Hipertensiva';
      reasons.push('Presión diastólica muy elevada. Busque atención médica de inmediato.');
    } else if (d >= 90 && risk !== 'high') {
      risk = risk === 'low' ? 'medium' : risk;
      label = 'Hipertensión';
      reasons.push('Presión diastólica elevada.');
    } else if (d < 60 && risk === 'low') {
      risk = 'medium';
      label = 'Hipotensión';
      reasons.push('Presión diastólica baja.');
    }
    
    // Heart Rate checks
    if(hr > 100 && risk === 'low') {
      risk = 'medium';
      label = 'Taquicardia Leve';
      reasons.push('Frecuencia cardíaca elevada en reposo.');
    } else if(hr < 60 && risk === 'low') {
        risk = 'medium';
        label = 'Bradicardia Leve';
        reasons.push('Frecuencia cardíaca baja en reposo.');
    }
  
    if(reasons.length === 0) {
      reasons.push('Sus valores se encuentran dentro del rango normal.');
    }
  
    return { risk, label, reasons };
  };