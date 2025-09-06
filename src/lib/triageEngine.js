
import { HeartPulse, Wind, BrainCircuit, Thermometer, CircleDashed as Dizzy, HeartCrack, Syringe, Bone, Baby, HeartHandshake } from 'lucide-react';

const triageTests = {
  chest_pain: {
    id: "chest_pain",
    title: "Dolor / palpitaciones",
    description: "Evalúa el dolor de pecho para descartar condiciones cardíacas urgentes.",
    icon: HeartPulse,
    fields: [
      { id: "age40", type: "bool", label: "¿Tienes 40+ años?" },
      { id: "sex_m", type: "bool", label: "¿Eres hombre?" },
      { id: "onset_min", type: "number", label: "¿Cuántos minutos llevas con el dolor?" },
      { id: "character", type: "choice", options: ["opresivo", "punzante", "urente", "desgarro"], label: "¿Cómo lo sientes?" },
      { id: "radiation", type: "bool", label: "¿Se corre a brazo, mandíbula o espalda?" },
      { id: "effort", type: "bool", label: "¿Aparece con el esfuerzo/subir escaleras?" },
      { id: "nausea_sweat", type: "bool", label: "¿Náusea/sudor frío?" },
      { id: "dyspnea", type: "bool", label: "¿Falta de aire importante?" },
      { id: "cocaine_recent", type: "bool", label: "¿Consumiste cocaína en 24h?" },
      { id: "known_cad", type: "bool", label: "¿Historia de infarto/angina?" },
      { id: "spo2_pct", type: "number", label: "SpO₂ (%) (si tienes)" },
      { id: "sbp_mmHg", type: "number", label: "PA sistólica (mmHg) (si tienes)" }
    ],
    rules: [
      { id: "A1", if: "character==='desgarro' || radiation || nausea_sweat || dyspnea || cocaine_recent || known_cad", and: "onset_min>=10", action: "A" },
      { id: "A2", if: "(spo2_pct && spo2_pct<=90) || (sbp_mmHg && (sbp_mmHg<90 || sbp_mmHg>180))", action: "A" },
      { id: "B1", if: "(age40?1:0)+(effort?1:0)+(onset_min>=20?1:0)+(radiation?1:0)+(sex_m?1:0)>=2", action: "B" },
      { id: "C1", if: "character==='punzante' && !radiation && !dyspnea && (spo2_pct?spo2_pct>=95:true) && (sbp_mmHg?(sbp_mmHg>=90 && sbp_mmHg<=160):true)", action: "C" },
      { id: "D1", if: "true", action: "D" }
    ],
    cta: {
      A: { label: "Pedir ambulancia ahora", route: "ambulance/start" },
      B: { label: "Ir a urgencias", route: "er/map" },
      C: { label: "Agendar cardiología/medicina", route: "care/schedule" },
      D: { label: "Plan en casa y re-test 12h", route: "selfcare/chestpain" }
    }
  },
  dyspnea: {
    id: "dyspnea",
    title: "Dificultad para respirar",
    description: "Analiza la falta de aire para identificar posibles problemas respiratorios o cardíacos.",
    icon: Wind,
    fields: [
      { id: "speak_phrases", type: "bool", label: "¿Puedes hablar frases completas? (NO = grave)", invertMeaning: true },
      { id: "wheeze", type: "bool", label: "¿Sibilancias o pitido al respirar?" },
      { id: "fever", type: "bool", label: "¿Fiebre?" },
      { id: "cough", type: "bool", label: "¿Tos importante?" },
      { id: "edema", type: "bool", label: "¿Tobillos/hinchazón reciente?" },
      { id: "chest_pain", type: "bool", label: "¿Dolor en el pecho?" },
      { id: "spo2_pct", type: "number", label: "SpO₂ (%) (si tienes)" },
      { id: "pregnancy", type: "bool", label: "¿Embarazo?" },
      { id: "known_copd_asthma", type: "bool", label: "¿EPOC/asma conocido?" }
    ],
    rules: [
      { id: "A1", if: "!speak_phrases || chest_pain", action: "A" },
      { id: "A2", if: "spo2_pct && spo2_pct<=90", action: "A" },
      { id: "B1", if: "(spo2_pct && spo2_pct>=91 && spo2_pct<=93) || (fever && cough) || edema || pregnancy", action: "B" },
      { id: "C1", if: "spo2_pct && spo2_pct>=94 && spo2_pct<=95", action: "C" },
      { id: "D1", if: "true", action: "D" }
    ],
    cta: {
      A: { label: "Pedir ambulancia", route: "ambulance/start" },
      B: { label: "Ir a urgencias", route: "er/map" },
      C: { label: "Consulta 24–72h", route: "care/schedule" },
      D: { label: "Autocuidado (vapor/hidratación)", route: "selfcare/dyspnea" }
    }
  },
  stroke_fast: {
    id: "stroke_fast",
    title: "Déficit neurológico",
    description: "Identifica rápidamente signos de un posible Accidente Cerebrovascular (ACV) usando el método FAST.",
    icon: BrainCircuit,
    fields: [
      { id: "face", type: "bool", label: "¿Cara desviada/sonrisa asimétrica?" },
      { id: "arm", type: "bool", label: "¿Debilidad en brazo o pierna?" },
      { id: "speech", type: "bool", label: "¿Habla rara/dificultad para hablar?" },
      { id: "onset_min", type: "number", label: "¿Hace cuántos minutos empezó?" },
      { id: "resolved", type: "bool", label: "¿Se resolvió por completo?" },
      { id: "seizure", type: "bool", label: "¿Convulsión?" },
      { id: "head_trauma", type: "bool", label: "¿Golpe fuerte en cabeza?" }
    ],
    rules: [
      { id: "A1", if: "(face||arm||speech) && !resolved && onset_min<=1440", action: "A" },
      { id: "A2", if: "seizure || head_trauma", action: "A" },
      { id: "B1", if: "resolved && onset_min<=1440", action: "B" },
      { id: "C1", if: "resolved && onset_min>1440", action: "C" },
      { id: "D1", if: "true", action: "D" }
    ],
    cta: {
      A: { label: "Emergencia ahora (ACV)", route: "ambulance/start" },
      B: { label: "Urgencias hoy (AIT)", route: "er/map" },
      C: { label: "Neurología 24–72h", route: "care/schedule" },
      D: { label: "Si reaparece, usa emergencia", route: "selfcare/stroke" }
    }
  },
  fever_sepsis: {
    id: "fever_sepsis",
    title: "Fiebre / Sospecha de infección",
    description: "Evalúa la fiebre y otros síntomas para detectar signos tempranos de sepsis o infecciones graves.",
    icon: Thermometer,
    fields: [
      { id: "temp_c", type: "number", label: "Temperatura (°C)" },
      { id: "rr_ge22", type: "bool", label: "¿Respiras muy rápido (≥22/min)?" },
      { id: "sbp_mmHg", type: "number", label: "PA sistólica (mmHg) (si tienes)" },
      { id: "mental_change", type: "bool", label: "¿Confusión o somnolencia inusual?" },
      { id: "immunosupp", type: "bool", label: "¿Inmunosuprimido (quimio, VIH sin control, trasplante)?" },
      { id: "focus", type: "choice", options: ["respiratorio", "urinario", "digestivo", "piel", "otro", "no_sabe"], label: "¿Dónde sientes el foco?" }
    ],
    rules: [
      { id: "A_qSOFA", if: "(rr_ge22?1:0) + (sbp_mmHg && sbp_mmHg<=100?1:0) + (mental_change?1:0) >= 2", action: "A" },
      { id: "B1", if: "temp_c && temp_c>=39.5", action: "B" },
      { id: "B2", if: "immunosupp && temp_c && temp_c>=38", action: "B" },
      { id: "C1", if: "temp_c && temp_c>=38 && temp_c<39.5", action: "C" },
      { id: "D1", if: "true", action: "D" }
    ],
    cta: {
      A: { label: "Urgencia vital", route: "ambulance/start" },
      B: { label: "Urgencias hoy", route: "er/map" },
      C: { label: "Consulta 24–72h", route: "care/schedule" },
      D: { label: "Autocuidado/antitérmicos", route: "selfcare/fever" }
    }
  },
  syncope: {
    id: "syncope",
    title: "Desmayo / mareo intenso",
    description: "Determina la causa probable y la gravedad de un desmayo o mareo severo.",
    icon: Dizzy,
    fields: [
      { id: "injury_head", type: "bool", label: "¿Te golpeaste la cabeza o te lesionaste?" },
      { id: "during_exertion", type: "bool", label: "¿Ocurrió durante el ejercicio?" },
      { id: "chest_pain", type: "bool", label: "¿Dolor en el pecho antes del desmayo?" },
      { id: "palpitations", type: "bool", label: "¿Palpitaciones fuertes?" },
      { id: "pregnancy20w", type: "bool", label: "¿Embarazo >20 semanas?" },
      { id: "sbp_mmHg", type: "number", label: "PA sistólica (mmHg) (si tienes)" },
      { id: "neuro_deficit", type: "bool", label: "¿Debilidad/dificultad para hablar al recuperar?" }
    ],
    rules: [
      { id: "A1", if: "injury_head || during_exertion || chest_pain || neuro_deficit || pregnancy20w", action: "A" },
      { id: "A2", if: "sbp_mmHg && (sbp_mmHg<90 || sbp_mmHg>180)", action: "A" },
      { id: "B1", if: "palpitations", action: "B" },
      { id: "C1", if: "true", action: "C" }
    ],
    cta: {
      A: { label: "Pedir ambulancia", route: "ambulance/start" },
      B: { label: "Urgencias hoy", route: "er/map" },
      C: { label: "Consulta 24–72h", route: "care/schedule" },
      D: { label: "Autocuidado", route: "selfcare/syncope" }
    }
  },
  abdominal_pain: {
    id: "abdominal_pain",
    title: "Dolor abdominal",
    description: "Orienta sobre las posibles causas de dolor abdominal y cuándo buscar atención urgente.",
    icon: HeartCrack,
    fields: [
      { id: "location", type: "choice", options: ["derecha_arriba", "derecha_abajo", "epigastrio", "general", "izquierda", "pelvico"], label: "¿Dónde duele más?" },
      { id: "sudden", type: "bool", label: "¿Fue súbito y muy intenso?" },
      { id: "guarding", type: "bool", label: "¿Vientre duro o dolor al soltar (rebote)?" },
      { id: "vomits", type: "bool", label: "¿Vómitos persistentes?" },
      { id: "blood", type: "bool", label: "¿Sangre en vómito o heces?" },
      { id: "fever", type: "bool", label: "¿Fiebre?" },
      { id: "pregnant", type: "bool", label: "¿Embarazo o posibilidad?" },
      { id: "jaundice", type: "bool", label: "¿Piel u ojos amarillos?" }
    ],
    rules: [
      { id: "A1", if: "sudden || guarding || blood || (pregnant && (location==='pelvico' || location==='derecha_abajo'))", action: "A" },
      { id: "B1", if: "fever || vomits || jaundice || location==='derecha_abajo'", action: "B" },
      { id: "C1", if: "true", action: "C" }
    ],
    cta: {
      A: { label: "Ambulancia", route: "ambulance/start" },
      B: { label: "Urgencias hoy", route: "er/map" },
      C: { label: "Consulta 24–72h", route: "care/schedule" },
      D: { label: "Autocuidado", route: "selfcare/abdomen" }
    }
  },
  anaphylaxis: {
    id: "anaphylaxis",
    title: "Alergia / Anafilaxia",
    description: "Identifica signos de una reacción alérgica grave (anafilaxia) que requiere atención inmediata.",
    icon: Syringe,
    fields: [
      { id: "exposure", type: "bool", label: "¿Contacto con alimento/medicamento/picadura?" },
      { id: "hives", type: "bool", label: "¿Ronchas generalizadas?" },
      { id: "facial_swelling", type: "bool", label: "¿Hinchazón de labios/lengua/cara?" },
      { id: "breath_diff", type: "bool", label: "¿Dificultad para respirar o voz ronca?" },
      { id: "sbp_mmHg", type: "number", label: "PA sistólica (si tienes)" },
      { id: "gi_sympt", type: "bool", label: "¿Vómito/diarrea/retortijón fuerte?" }
    ],
    rules: [
      { id: "A1", if: "(hives && (breath_diff || facial_swelling)) || breath_diff || facial_swelling || (sbp_mmHg && sbp_mmHg<90)", action: "A" },
      { id: "B1", if: "hives || gi_sympt || exposure", action: "B" },
      { id: "C1", if: "true", action: "C" }
    ],
    cta: {
      A: { label: "Ambulancia (posible anafilaxia)", route: "ambulance/start" },
      B: { label: "Urgencias hoy", route: "er/map" },
      C: { label: "Consulta 24–72h", route: "care/schedule" },
      D: { label: "Autocuidado", route: "selfcare/allergy" }
    }
  },
  trauma: {
    id: "trauma",
    title: "Trauma / caída",
    description: "Evalúa la gravedad de una lesión o caída para determinar si se necesita atención de emergencia.",
    icon: Bone,
    fields: [
      { id: "high_energy", type: "bool", label: "¿Accidente de alto impacto (auto/altura)?" },
      { id: "loss_conscious", type: "bool", label: "¿Perdiste el conocimiento?" },
      { id: "bleeding", type: "bool", label: "¿Sangrado que no cede?" },
      { id: "deformity", type: "bool", label: "¿Deformidad evidente/hueso expuesto?" },
      { id: "neck_pain", type: "bool", label: "¿Dolor en cuello o rigidez?" },
      { id: "neuro_deficit", type: "bool", label: "¿Adormecimiento/debilidad nueva?" }
    ],
    rules: [
      { id: "A1", if: "high_energy || loss_conscious || bleeding || deformity || neck_pain || neuro_deficit", action: "A" },
      { id: "B1", if: "true", action: "B" }
    ],
    cta: {
      A: { label: "Ambulancia", route: "ambulance/start" },
      B: { label: "Urgencias hoy", route: "er/map" },
      C: { label: "Consulta 24–72h", route: "care/schedule" },
      D: { label: "Autocuidado", route: "selfcare/trauma" }
    }
  },
  obstetrics: {
    id: "obstetrics",
    title: "Alerta obstétrica",
    description: "Monitoriza síntomas de riesgo durante el embarazo para una atención oportuna.",
    icon: Baby,
    fields: [
      { id: "gest_weeks", type: "number", label: "Semanas de embarazo" },
      { id: "bleeding", type: "bool", label: "¿Sangrado vaginal abundante?" },
      { id: "fluid", type: "bool", label: "¿Salida de líquido claro?" },
      { id: "fetal_moves_less", type: "bool", label: "¿Menos movimientos del bebé?" },
      { id: "headache_vision", type: "bool", label: "¿Cefalea intensa/visión borrosa?" },
      { id: "epigastric_pain", type: "bool", label: "¿Dolor fuerte en boca del estómago?" },
      { id: "sbp_mmHg", type: "number", label: "PA sistólica (mmHg) (si tienes)" },
      { id: "contractions5", type: "bool", label: "¿Contracciones cada <5 min por >1h (a término)?" }
    ],
    rules: [
      { id: "A1", if: "bleeding || fluid || fetal_moves_less || (headache_vision && (gest_weeks>=20)) || epigastric_pain || (sbp_mmHg && sbp_mmHg>=140)", action: "A" },
      { id: "B1", if: "contractions5", action: "B" },
      { id: "C1", if: "true", action: "C" }
    ],
    cta: {
      A: { label: "Obstétrica de urgencia", route: "er/ob" },
      B: { label: "Ir a evaluación hoy", route: "er/map" },
      C: { label: "Agenda obstetra", route: "care/schedule" },
      D: { label: "Autocuidado", route: "selfcare/ob" }
    }
  },
  mental_health_crisis: {
    id: "mental_health_crisis",
    title: "Salud mental — riesgo inmediato",
    description: "Evalúa el riesgo inmediato de autolesión o crisis de salud mental para buscar ayuda urgente.",
    icon: HeartHandshake,
    fields: [
      { id: "si_ideation", type: "bool", label: "En las últimas 4 semanas, ¿has tenido ideas de hacerte daño o morir?" },
      { id: "si_plan", type: "bool", label: "¿Tienes un plan específico para hacerlo?" },
      { id: "si_intent", type: "bool", label: "¿Tienes intención de hacerlo pronto?" },
      { id: "si_attempt3m", type: "bool", label: "¿Intento de autolesión en los últimos 3 meses?" },
      { id: "psychosis", type: "bool", label: "¿Escuchas voces/ves cosas o pensamientos muy extraños?" },
      { id: "substance_now", type: "bool", label: "¿Bajo efecto fuerte de alcohol/drogas?" },
      { id: "panic_now", type: "bool", label: "¿Ataque de pánico actual (palpitaciones, ahogo, hormigueo)?" },
      { id: "phq2_interest", type: "choice", options: ["0", "1", "2", "3"], label: "PHQ-2: Poco interés/disfrute (0–3)" },
      { id: "phq2_mood", type: "choice", options: ["0", "1", "2", "3"], label: "PHQ-2: Desánimo/depresión (0–3)" },
      { id: "support", type: "bool", label: "¿Hay alguien contigo o disponible para apoyarte ahora?" }
    ],
    rules: [
      { id: "A1", if: "si_intent || si_plan || si_attempt3m || psychosis || (!support && si_ideation)", action: "A" },
      { id: "B1", if: "si_ideation && !si_plan && !si_intent", action: "B" },
      { id: "B2", if: "panic_now", action: "B" },
      { id: "C1", if: "(parseInt(phq2_interest || '0') + parseInt(phq2_mood || '0')) >= 3", action: "C" },
      { id: "D1", if: "true", action: "D" }
    ],
    cta: {
      A: { label: "Emergencias / línea de crisis", route: "crisis/hotline" },
      B: { label: "Contactar en vivo ahora", route: "care/psych-live" },
      C: { label: "Agendar psicología/psi", route: "care/schedule" },
      D: { label: "Recursos y ejercicios", route: "selfcare/mental" }
    }
  }
};

const levelCopy = {
  A: {
    title: "Ambulancia inmediata",
    recommendation: "Tus respuestas indican alto riesgo. No te quedes sol@. Llama a emergencias o solicita ambulancia ahora."
  },
  B: {
    title: "Urgencias hoy",
    recommendation: "Necesitas valoración en urgencias hoy. Lleva identificación y lista de medicamentos."
  },
  C: {
    title: "Consulta 24–72 h",
    recommendation: "Programa consulta en 1–3 días. Si aparece un nuevo síntoma o empeora, repite el test o acude a urgencias."
  },
  D: {
    title: "Autocuidado",
    recommendation: "Puedes iniciar autocuidado y monitoreo. Te dejamos instrucciones y recordatorio de re-test."
  }
};

const evaluateCondition = (condition, answers) => {
  const fieldIds = Object.keys(answers);
  const funcBody = `
    const { ${fieldIds.join(', ')} } = answers;
    return ${condition};
  `;
  try {
    const func = new Function('answers', funcBody);
    return func(answers);
  } catch (error) {
    console.error("Error evaluating condition:", condition, error);
    return false;
  }
};

const evaluateTest = (test, answers) => {
  const triggeredRules = [];
  for (const rule of test.rules) {
    let mainConditionMet = false;
    if (rule.if) {
      mainConditionMet = evaluateCondition(rule.if, answers);
    }

    let andConditionMet = true;
    if (rule.and) {
      andConditionMet = evaluateCondition(rule.and, answers);
    }

    if (mainConditionMet && andConditionMet) {
      triggeredRules.push(rule.id);
      return {
        level: rule.action,
        rationale: triggeredRules,
      };
    }
  }

  return {
    level: 'D',
    rationale: ['default'],
  };
};

const getLevelCopy = (level) => {
  return levelCopy[level] || { title: "Recomendación", recommendation: "Sigue las indicaciones de tu médico." };
};

export { triageTests, evaluateTest, getLevelCopy, levelCopy };
