export const wellnessData = {
  tips: {
    name: "Tips Rápidos",
    items: [
      { id: 'tip1', slug: 'hidratacion-inteligente', title: 'Hidratación Inteligente', summary: 'Bebe agua antes de tener sed.', duration: '1 min', content: 'Tu cuerpo ya está deshidratado cuando sientes sed. Intenta beber un vaso de agua cada hora para mantenerte en niveles óptimos. Esto mejora la concentración, la energía y la salud de tu piel.' },
      { id: 'tip2', slug: 'pausa-activa', title: 'La Pausa de 5 Minutos', summary: 'Levántate y estira cada hora.', duration: '5 min', content: 'Si trabajas sentado, pon una alarma cada hora. Levántate, camina un poco, y haz estiramientos simples de cuello, hombros y espalda. Esto previene la tensión muscular, mejora la circulación y resetea tu mente.' },
      { id: 'tip3', slug: 'snack-saludable', title: 'Snack de Media Tarde', summary: 'Cambia las galletas por una manzana.', duration: '2 min', content: 'Un snack que combine fibra y proteína (manzana con crema de cacahuate, yogurt griego con frutos rojos) te dará energía sostenida, a diferencia del pico de azúcar de los procesados. ¡Estabiliza tu energía!' },
      { id: 'tip4', slug: 'luz-solar', title: 'Dosis de Sol Matutino', summary: '10 minutos de luz solar al despertar.', duration: '10 min', content: 'Exponerte a la luz solar (sin gafas de sol) durante los primeros 30-60 minutos del día ayuda a regular tu ritmo circadiano. Esto mejora tu estado de ánimo, aumenta tu alerta y te ayuda a dormir mejor por la noche.'},
      { id: 'tip5', slug: 'mindful-eating', title: 'Come con Atención Plena', summary: 'Deja el celular y saborea tu comida.', duration: '15 min', content: 'Dedica al menos 15 minutos a comer sin distracciones. Mastica lentamente, percibe los sabores y texturas. Esto no solo mejora la digestión, sino que aumenta la saciedad y te ayuda a reconocer las señales de hambre y llenura de tu cuerpo.'},
      { id: 'tip6', slug: 'regla-20-20-20', title: 'Descansa tu Vista (20-20-20)', summary: 'Evita la fatiga visual digital.', duration: '20 seg', content: 'Cada 20 minutos que pases frente a una pantalla, mira algo que esté a 20 pies (unos 6 metros) de distancia durante al menos 20 segundos. Este simple hábito reduce la fatiga ocular, sequedad y dolores de cabeza.'}
    ]
  },
  respiracion: {
    name: "Respiración",
    items: [
      { id: 'resp1', slug: 'respiracion-cuadrada', title: 'Respiración Cuadrada (4-4-4-4)', summary: 'Calma instantánea en 16 segundos.', duration: '3 min', content: 'Perfecta para momentos de estrés. Sigue el ciclo:\n\n1. Inhala por la nariz contando hasta 4.\n2. Sostén la respiración contando hasta 4.\n3. Exhala por la boca contando hasta 4.\n4. Mantén los pulmones vacíos contando hasta 4.\n\nRepite 5-10 veces para centrar tu mente y calmar el sistema nervioso.', type: 'breathing', pattern: { inhale: 4, hold1: 4, exhale: 4, hold2: 4 } },
      { id: 'resp2', slug: 'respiracion-478', title: 'Respiración 4-7-8 para Dormir', summary: 'Relájate para un sueño profundo.', duration: '5 min', content: 'Diseñada por el Dr. Andrew Weil, esta técnica es un tranquilizante natural. Con la punta de la lengua tras los dientes frontales:\n\n1. Exhala completamente por la boca haciendo un silbido.\n2. Cierra la boca e inhala por la nariz contando hasta 4.\n3. Sostén la respiración contando hasta 7.\n4. Exhala ruidosamente por la boca contando hasta 8.\n\nRepite 3-4 veces antes de dormir.', type: 'breathing', pattern: { inhale: 4, hold1: 7, exhale: 8, hold2: 0 } },
      { id: 'resp3', slug: 'suspiro-fisiologico', title: 'El Suspiro Fisiológico', summary: 'Resetea el estrés en segundos.', duration: '1 min', content: 'Estudios de Stanford demuestran que es la forma más rápida de bajar el estrés. Consiste en:\n\n1. Una inhalación profunda por la nariz.\n2. Sin exhalar, realiza una segunda inhalación más corta y rápida para inflar los pulmones al máximo.\n3. Exhala lentamente y de forma prolongada por la boca.\n\nRepite 1-3 veces cuando sientas ansiedad o agobio.', type: 'breathing', pattern: { inhale: 3, hold1: 0, inhale2: 1, hold2:0, exhale: 6, hold3: 0} },
      { id: 'resp4', slug: 'respiracion-diafragmatica', title: 'Respiración Diafragmática (del Vientre)', summary: 'Reduce la ansiedad y fortalece el core.', duration: '5 min', content: 'La base de la relajación. Siéntate o acuéstate cómodamente:\n\n1. Pon una mano en tu pecho y la otra en tu abdomen.\n2. Inhala lentamente por la nariz, sintiendo cómo solo tu abdomen se expande (la mano del pecho debe moverse poco).\n3. Exhala lentamente por la boca, sintiendo cómo tu abdomen se contrae.\n\nPractícala a diario para entrenar a tu cuerpo a respirar de forma más eficiente.', type: 'breathing', pattern: { inhale: 4, hold1: 1, exhale: 6, hold2: 0 } }
    ]
  },
  meditacion: {
    name: "Meditación",
    items: [
      { id: 'med1', slug: 'atencion-plena-5-min', title: 'Atención Plena (5 Min)', summary: 'Enfoca tu mente y reduce el estrés.', duration: '5 min', content: 'Siéntate en un lugar tranquilo. Cierra los ojos y lleva tu atención a tu respiración. Nota cómo el aire entra y sale. Si tu mente se distrae, simplemente regresa tu atención a la respiración. Hazlo durante 5 minutos para empezar el día con claridad o para resetearte en un momento de estrés.', type: 'audio', audioSrc: '/audio/placeholder.mp3' },
      { id: 'med2', slug: 'escaneo-corporal-10-min', title: 'Escaneo Corporal (10 Min)', summary: 'Libera la tensión de tu cuerpo.', duration: '10 min', content: 'Acuéstate boca arriba. Lleva tu atención a los dedos de tus pies, notando cualquier sensación sin juzgar. Lentamente, sube por tus piernas, torso, brazos, hasta la cabeza. En cada parte, inhala y al exhalar, siente cómo se relaja la tensión. Ideal para antes de dormir.', type: 'audio', audioSrc: '/audio/placeholder.mp3' },
      { id: 'med3', slug: 'bondad-amorosa-7-min', title: 'Bondad Amorosa (7 Min)', summary: 'Cultiva la compasión hacia ti y otros.', duration: '7 min', content: 'Siéntate cómodamente. Repite mentalmente las frases: "Que yo esté a salvo. Que yo sea feliz. Que yo esté sano. Que yo viva con facilidad". Luego, piensa en un ser querido y repite: "Que estés a salvo...". Finalmente, expande este deseo a todas las personas. Una práctica poderosa para mejorar el estado de ánimo.', type: 'audio', audioSrc: '/audio/placeholder.mp3' },
      { id: 'med4', slug: 'observando-pensamientos-8-min', title: 'Observando Pensamientos (8 Min)', summary: 'Crea distancia de tus pensamientos ansiosos.', duration: '8 min', content: 'Imagina que estás sentado a la orilla de un río. Cada pensamiento que surge es una hoja que flota y se va por la corriente. No te subas a la hoja, no la analices, solo obsérvala pasar. Esta técnica te ayuda a entender que no eres tus pensamientos y a reducir su poder sobre ti.', type: 'audio', audioSrc: '/audio/placeholder.mp3' }
    ]
  },
  rutinas: {
    name: "Rutinas Express",
    items: [
      { id: 'rut1', slug: 'energia-mananera', title: 'Energía Mañanera (7 Minutos)', summary: 'Actívate en 7 minutos sin equipo.', duration: '7 min', content: 'Una rutina de cuerpo completo para despertar el cuerpo y la mente. Realiza cada ejercicio durante 45 segundos, con 15 segundos de descanso entre ellos:\n\n1. **Saltos de Tijera (Jumping Jacks):** De pie, salta abriendo piernas y brazos simultáneamente. Aterriza suavemente. Mantén un ritmo constante.\n\n2. **Sentadillas (Squats):** Con los pies al ancho de los hombros, baja la cadera como si te sentaras en una silla, manteniendo la espalda recta y el pecho erguido. Baja hasta que los muslos estén paralelos al suelo.\n\n3. **Flexiones de Rodilla (Knee Push-ups):** En posición de plancha, apoya las rodillas en el suelo. Baja el pecho hacia el suelo doblando los codos y manteniendo el cuerpo en línea recta desde la cabeza hasta las rodillas.\n\n4. **Zancadas Alternas (Alternating Lunges):** Da un paso grande hacia adelante y baja la cadera hasta que ambas rodillas formen ángulos de 90 grados. La rodilla de atrás casi debe tocar el suelo. Vuelve a la posición inicial y alterna la pierna.\n\n5. **Plancha (Plank):** Apoya los antebrazos y las puntas de los pies en el suelo. Mantén el cuerpo en una línea recta, contrayendo abdomen y glúteos. No dejes que la cadera se caiga.\n\n6. **Elevación de Rodillas (High Knees):** De pie, corre en el lugar llevando las rodillas lo más alto posible, como si quisieras tocar tu pecho. Usa los brazos para ayudarte.\n\n7. **Puente de Glúteos (Glute Bridge):** Acostado boca arriba con las rodillas dobladas, levanta la cadera del suelo hasta que tu cuerpo forme una línea recta desde los hombros hasta las rodillas. Aprieta los glúteos en la parte superior.' },
      { id: 'rut2', slug: 'estiramiento-oficina', title: 'Estiramiento de Escritorio (5 Min)', summary: 'Combate la rigidez de la silla.', duration: '5 min', content: 'Rutina suave para hacer en tu silla y liberar tensión:\n\n1. **Giro de torso sentado:** Siéntate derecho, gira tu torso hacia un lado, usando el respaldo para ayudarte. Mantén 30s y cambia de lado. Siente el estiramiento en la espalda baja.\n\n2. **Estiramiento de cuello:** Inclina suavemente la cabeza hacia un hombro, ayudándote ligeramente con la mano. Mantén 30s y cambia. No fuerces.\n\n3. **Gato-vaca sentado:** Sentado al borde de la silla, inhala y arquea la espalda (vaca), exhala y redondéala (gato). Moviliza tu columna.\n\n4. **Estiramiento de muñecas y dedos:** Extiende un brazo y con la otra mano, jala suavemente los dedos hacia atrás, luego hacia abajo. Ideal para prevenir el túnel carpiano.\n\n5. **Abrazo de rodilla al pecho:** Lleva una rodilla hacia tu pecho, abrázala y mantén 30s. Libera la tensión de la cadera y espalda baja. Alterna.' },
      { id: 'rut3', slug: 'core-express', title: 'Fortalecimiento de Core (4 Min)', summary: 'Una espalda fuerte y abdomen plano.', duration: '4 min', content: 'Un Tabata rápido para tu zona media. 2 rondas. 20 segundos de trabajo, 10 de descanso:\n\n1. **Plancha (Plank):** Cuerpo recto, abdomen contraído, mirada al suelo. La clave es la estabilidad.\n\n2. **Abdominales de Bicicleta (Bicycle Crunches):** Lleva el codo a la rodilla contraria, alternando. Mantén el movimiento controlado, no rápido.\n\n3. **Elevación de Piernas (Leg Raises):** Acostado boca arriba, levanta las piernas rectas hasta 90 grados y bájalas lentamente sin tocar el suelo. Siente el trabajo en el abdomen bajo.\n\n4. **Superman:** Boca abajo, levanta brazos y piernas simultáneamente, como si volaras. Fortalece toda la espalda.\n\n**Repite el circuito una vez más.**' },
      { id: 'rut4', slug: 'movilidad-articular', title: 'Despierta tus Articulaciones (5 Min)', summary: 'Lubrica tu cuerpo antes de empezar.', duration: '5 min', content: 'Ideal para antes de cualquier ejercicio o al despertar. Realiza 10 repeticiones lentas y controladas por movimiento:\n\n1. **Círculos de cuello:** Dibuja círculos lentos y amplios con tu cabeza, primero a un lado y luego al otro. Relaja la tensión.\n\n2. **Círculos de hombros:** Levanta los hombros y haz círculos grandes hacia atrás, y luego hacia adelante. Abre el pecho.\n\n3. **Círculos de cadera:** Con las manos en la cintura, dibuja círculos amplios con la cadera, como si tuvieras un hula-hula.\n\n4. **Círculos de rodillas:** Con los pies juntos, flexiona ligeramente las rodillas y haz círculos con ellas.\n\n5. **Círculos de tobillos:** Levanta un pie y dibuja círculos con el tobillo en ambas direcciones. Alterna.' },
    ]
  },
  sueno: {
    name: "Higiene del Sueño",
    items: [
      { id: 'sue1', slug: 'checklist-antes-de-dormir', title: 'Checklist para un Buen Descanso', summary: 'Prepara tu noche para dormir mejor.', duration: '10 min', content: 'Tu cerebro necesita señales para saber que es hora de dormir. Crea un ritual relajante:\n\n1. Apaga pantallas (TV, celular) 1h antes. La luz azul inhibe la melatonina.\n2. Baja la intensidad de las luces de casa.\n3. Toma una ducha o baño tibio.\n4. Lee un libro físico (no en pantalla).\n5. Asegura que tu cuarto esté oscuro, silencioso y fresco (idealmente 18-20°C).' },
      { id: 'sue2', slug: 'diario-de-gratitud', title: 'Diario de Gratitud Nocturno', summary: 'Calma tu mente antes de dormir.', duration: '5 min', content: 'Antes de apagar la luz, apunta 3 cosas específicas por las que estás agradecido hoy. Este simple acto cambia tu enfoque de los problemas a las bendiciones, reduce la rumiación y promueve un estado mental más tranquilo, ideal para conciliar el sueño.' },
      { id: 'sue3', slug: 'si-no-puedes-dormir', title: '¿No puedes dormir? ¡Levántate!', summary: 'Qué hacer cuando das vueltas en la cama.', duration: '15 min', content: 'Si llevas más de 20 minutos en la cama sin poder dormir, no te quedes frustrado. Levántate, ve a otra habitación con luz tenue y haz algo aburrido y relajante (leer un manual, escuchar música suave) hasta que sientas sueño. El objetivo es que tu cerebro asocie la cama solo con dormir, no con la ansiedad de no poder hacerlo.' },
      { id: 'sue4', slug: 'cafeina-alcohol', title: 'El Timing de la Cafeína y el Alcohol', summary: 'Tus bebidas y su impacto en el sueño.', duration: 'N/A', content: 'La cafeína tiene una vida media de 5-6 horas. Para no afectar tu sueño, evita consumirla después de las 2-3 PM. El alcohol puede ayudarte a conciliar el sueño más rápido, pero fragmenta el sueño en la segunda mitad de la noche, resultando en un descanso de peor calidad. Evítalo al menos 3 horas antes de acostarte.'}
    ]
  },
  nutricion: {
    name: "Nutrición Inteligente",
    items: [
      { 
        id: 'nut1',
        slug: 'plato-ideal', 
        title: 'Plato Ideal', 
        subtitle: 'Estructura tus comidas con el método ½–¼–¼.',
        horizons_tip: "El 'Plato Ideal' no es una dieta, es un mapa visual para balancear tus nutrientes en cada comida. Piensa en él como tu GPS personal hacia una mejor energía y salud digestiva, sin contar calorías. Es la forma más sencilla de asegurar que le das a tu cuerpo la variedad que necesita para funcionar al máximo.",
        sections: [
          { type: 'bullets', title: '½ Verduras y frutas', items: ['Al menos 3 colores/día', 'Crudas o cocidas al dente'] },
          { type: 'bullets', title: '¼ Granos integrales', items: ['Tortilla de maíz', 'Avena', 'Arroz integral', 'Quinoa', 'Pasta integral'] },
          { type: 'bullets', title: '¼ Proteína magra', items: ['Pollo/Pavo', 'Atún/Sardina', 'Huevo', 'Frijol/Lenteja', 'Tofu/Tempeh'] },
          { type: 'tips', title: 'Grasas buenas (extra)', items: ['1–2 cditas aceite de oliva', '¼ aguacate', '10–12 nueces/almendras'] },
          { type: 'tips', title: 'Agua', items: ['30–35 ml/kg/día. Prioriza agua simple o infusiones sin azúcar.'] },
          { type: 'tips', title: 'Método de porciones (mano)', items: ['Palma = proteína', 'Puño = carbos/grano', 'Dos puñados = verduras', 'Pulgar = grasa'] }
        ],
        cta: [{ label: 'Añadir a Favoritos', action: 'add_favorite' }],
        theme: { bg: '#0c1c3e', accent: '#f06340', text: '#ffffff' }
      },
      { 
        id: 'nut2',
        slug: 'azucar-oculto', 
        title: 'Azúcares Ocultos', 
        subtitle: 'Aprende a cazar azúcares en la etiqueta.',
        horizons_tip: "El azúcar es un maestro del disfraz. Aprender sus 'alias' (dextrosa, jarabe de maíz, etc.) te convierte en un detective de la nutrición. El verdadero poder no está en eliminar el azúcar por completo, sino en saber dónde se esconde para que TÚ decidas cuándo y cuánto consumes. Controlar el azúcar oculto es clave para evitar picos de energía y antojos.",
        sections: [
          { type: 'tips', title: 'Meta', items: ['Azúcares ≤5 g por porción.'] },
          { type: 'bullets', title: 'Alias de azúcar', items: ['Jarabe de maíz', 'Dextrosa', 'Maltosa', 'Sacarosa', 'Concentrado de jugo'] },
          { type: 'tips', title: 'Truco', items: ['Si "azúcar" va en los 3 primeros ingredientes → pásalo.'] },
          { type: 'tips', title: 'Bebidas', items: ['Jugos y refrescos son postre líquido.'] }
        ],
        cta: [{ label: 'Añadir a Favoritos', action: 'add_favorite' }],
        theme: { bg: '#0c1c3e', accent: '#f06340', text: '#ffffff' }
      },
      { 
        id: 'nut3',
        slug: 'ninez-bajo-peso', 
        title: 'Niñez Sana: Bajo Peso', 
        subtitle: 'Sube de forma saludable.',
        horizons_tip: "En niños con bajo peso, cada bocado cuenta. El objetivo no es 'llenar', sino 'nutrir'. Enfócate en 'densidad nutritiva': alimentos que en poco volumen ofrecen muchas calorías y nutrientes, como el aguacate, la crema de cacahuate o un smoothie con avena. Esto asegura un crecimiento sano sin recurrir a comida chatarra que solo aporta calorías vacías.",
        sections: [
          { type: 'bullets', title: 'Suma densidad nutritiva', items: ['Avena', 'Crema de cacahuate 100%', 'Plátano', 'Camote', 'Frijol/lenteja', 'Huevo', 'Pollo', 'Queso fresco', 'Yogurt natural', 'Aceite de oliva', 'Aguacate'] },
          { type: 'tips', title: 'Colaciones densas', items: ['Smoothie (leche/yogurt) + fruta + avena + chía/linaza.'] },
          { type: 'bullets', title: 'Evita vacíos', items: ['Refresco', 'Jugos', 'Frituras', 'Galletas "fit"'] }
        ],
        cta: [{ label: 'Añadir a Favoritos', action: 'add_favorite' }],
        theme: { bg: '#0c1c3e', accent: '#f06340', text: '#ffffff' }
      },
      { 
        id: 'nut4',
        slug: 'ninez-sobrepeso', 
        title: 'Niñez Sana: Sobrepeso', 
        subtitle: 'Hábitos y porciones para bajar grasa sin dramas.',
        horizons_tip: "El sobrepeso infantil rara vez se soluciona con 'dietas'. La clave es transformar el 'ambiente'. Platos más pequeños, jarras de agua siempre visibles y convertir el ejercicio en un juego familiar son más efectivos que cualquier restricción. Esto crea hábitos saludables que duran toda la vida, fortaleciendo su autoestima en lugar de dañarla con prohibiciones.",
        sections: [
          { type: 'bullets', title: 'Base', items: ['Verduras en cada comida', 'Fruta entera (no jugo)', 'Granos integrales', 'Proteína magra'] },
          { type: 'tips', title: 'Ambiente', items: ['Platos chicos', 'Agua visible', '60 min juego activo/día'] },
          { type: 'bullets', title: 'Evita', items: ['Cereales azucarados', 'Galletas', 'Bebidas azucaradas', 'Pan dulce'] }
        ],
        cta: [{ label: 'Añadir a Favoritos', action: 'add_favorite' }],
        theme: { bg: '#0c1c3e', accent: '#f06340', text: '#ffffff' }
      },
      { 
        id: 'nut5',
        slug: 'hipertension-dash', 
        title: 'Hipertensión (DASH)', 
        subtitle: 'Menos sodio, más potasio, presión bajo control.',
        horizons_tip: "La dieta DASH es más que solo 'bajar la sal'. Es un plan de 'subir lo bueno': potasio, magnesio y calcio, que ayudan a relajar los vasos sanguíneos. Un truco simple es buscar alimentos coloridos (frutas, verduras) y reemplazar los snacks salados por un puñado de nueces sin sal. Es una estrategia proactiva, no solo reactiva.",
        sections: [
          { type: 'bullets', title: 'Qué sí', items: ['5–7 porciones/día de verduras y frutas', 'Leguminosas', 'Lácteos bajos en grasa', 'Frutos secos sin sal'] },
          { type: 'bullets', title: 'Qué limitar/evitar', items: ['Embutidos', 'Sopas instantáneas', 'Enlatados salados', 'Aderezos/salsas saladas', 'Alcohol excesivo'] },
          { type: 'tips', title: 'Trucos prácticos', items: ['Sodio: <2,000 mg/día. En etiqueta: sodio/100 g <140 mg (bajo sodio).'] },
          { type: 'bullets', title: 'Potasio amigo', items: ['Plátano', 'Espinaca', 'Frijol/Lenteja', 'Aguacate', 'Jitomate', 'Naranja'] },
          { type: 'plan', title: 'Ejemplo 3 días "DASH"', days: [
              { day: 1, breakfast: 'Omelet de claras + espinaca', lunch: 'Pollo al horno + camote + ensalada', dinner: 'Pescado + arroz integral + ensalada', snack: 'Manzana' },
              { day: 2, breakfast: 'Yogurt + fruta + avena', lunch: 'Bowl de lentejas + muchas verduras', dinner: 'Pollo al horno + camote + ensalada', snack: 'Puñado de nueces sin sal' },
              { day: 3, breakfast: 'Tostadas integrales + aguacate + jitomate', lunch: 'Pescado + arroz integral + ensalada', dinner: 'Bowl de lentejas + muchas verduras', snack: 'Palitos de zanahoria' }
          ]}
        ],
        cta: [{ label: 'Añadir a Favoritos', action: 'add_favorite' }],
        theme: { bg: '#0c1c3e', accent: '#f06340', text: '#ffffff' }
      },
      { 
        id: 'nut6',
        slug: 'diabetes-bajo-ig', 
        title: 'Diabetes / Prediabetes', 
        subtitle: 'Carbo inteligente + fibra = glucosa estable.',
        horizons_tip: "Controlar la glucosa no es eliminar los carbohidratos, es elegirlos sabiamente. Los 'carbos inteligentes' (de bajo índice glucémico) como frijoles o avena, liberan energía lentamente, como un tronco en una fogata. Los refinados son como papel: una llamarada rápida y luego nada. La fibra es tu mejor aliada, ya que enlentece la absorción de azúcar.",
        sections: [
          { type: 'bullets', title: 'Plato base', items: ['Verdura sin almidón', 'Proteína magra', 'Carbo de IG bajo (tortilla de maíz, frijol/lenteja, avena, arroz integral, quinoa)'] },
          { type: 'tips', title: 'Fruta', items: ['1 porción por comida (entera)'] },
          { type: 'bullets', title: 'Aliados', items: ['Nopal', 'Chía/linaza hidratada', 'Canela ceylán', 'Vinagre en ensaladas'] },
          { type: 'bullets', title: 'Qué limitar/evitar', items: ['Jugos/refrescos', 'Pan dulce', 'Harinas refinadas', '“Granolas” azucaradas'] },
          { type: 'plan', title: 'Ejemplo 3 días "Bajo IG"', days: [
              { day: 1, breakfast: 'Huevos revueltos + nopal/tomate + 2 tortillas', lunch: 'Pechuga a la plancha + ensalada grande + ½ taza frijoles', dinner: 'Ensalada griega + atún en agua + galletas integrales', snack: 'Yogurt natural + chía + ½ manzana' },
              { day: 2, breakfast: 'Avena con leche + canela + nueces + ½ plátano', lunch: 'Fajitas de res con pimientos + arroz integral ½ taza', dinner: 'Caldo de verduras + quesadilla de maíz con queso panela', snack: 'Pepinos con limón' },
              { day: 3, breakfast: 'Smoothie (leche + fresas + avena + linaza)', lunch: 'Filete de pescado + quinoa ½ taza + brócoli al vapor', dinner: 'Ensalada de garbanzos con verduras y aceite de oliva', snack: 'Palomitas caseras' }
          ]}
        ],
        cta: [{ label: 'Añadir a Favoritos', action: 'add_favorite' }],
        theme: { bg: '#0c1c3e', accent: '#f06340', text: '#ffffff' }
      },
      { 
        id: 'nut7',
        slug: 'colesterol-trigliceridos', 
        title: 'Colesterol / Triglicéridos', 
        subtitle: 'Grasas buenas y fibra que sí ayudan.',
        horizons_tip: "Para el colesterol, no todas las grasas son villanas. Las grasas 'buenas' (aguacate, aceite de oliva) son como un equipo de limpieza para tus arterias. La fibra soluble (avena, manzanas) actúa como una esponja que atrapa el colesterol y lo elimina. Curiosamente, los triglicéridos altos a menudo responden más a reducir azúcares y harinas que a reducir grasas.",
        sections: [
          { type: 'bullets', title: 'Sube lo bueno', items: ['Aceite de oliva', 'Aguacate', 'Nueces/almendras', 'Pescado azul 2–3/sem (sardina top)'] },
          { type: 'bullets', title: 'Baja lo malo', items: ['Frituras', 'Mantecas', 'Embutidos', 'Bollería', 'Harinas + azúcar (suben TG)'] },
          { type: 'tips', title: 'Fibra meta', items: ['25–30 g/día (avena, legumbres, verduras, fruta con cáscara)'] }
        ],
        cta: [{ label: 'Añadir a Favoritos', action: 'add_favorite' }],
        theme: { bg: '#0c1c3e', accent: '#f06340', text: '#ffffff' }
      },
      { 
        id: 'nut8',
        slug: 'gastritis-reflujo', 
        title: 'Gastritis/Reflujo', 
        subtitle: 'Qué sí/qué no para calmar el fuego.',
        horizons_tip: "La gastritis y el reflujo no solo dependen de 'qué' comes, sino de 'cómo' y 'cuándo'. Comer porciones más pequeñas, cenar al menos 3 horas antes de acostarte y evitar irritantes comunes como el café en ayunas son cambios de hábito tan poderosos como la lista de alimentos permitidos. Es un enfoque 360° para apagar el fuego interno.",
        sections: [
          { type: 'bullets', title: 'Qué sí', items: ['Avena', 'Plátano', 'Manzana/pera', 'Arroz', 'Papa/camote', 'Pollo/pescado', 'Yogurt natural'] },
          { type: 'bullets', title: 'Qué limitar/evitar', items: ['Café en ayunas', 'Picante fuerte', 'Alcohol', 'Chocolate', 'Fritos', 'Menta', 'Cenas tardías'] },
          { type: 'tips', title: 'Hábitos', items: ['Porciones chicas', 'Cenar 3–4 h antes de dormir', 'Eleva cabecera 10–15 cm'] }
        ],
        cta: [{ label: 'Añadir a Favoritos', action: 'add_favorite' }],
        theme: { bg: '#0c1c3e', accent: '#f06340', text: '#ffffff' }
      },
      {
        id: 'nut9',
        slug: 'embarazo-lactancia',
        title: 'Embarazo/Lactancia',
        subtitle: 'Nutrición clave para ti y tu bebé.',
        horizons_tip: "Durante el embarazo y la lactancia, no 'comes por dos', sino que 'nutres para dos'. La calidad es más importante que la cantidad. Prioriza alimentos ricos en hierro (para prevenir anemia), calcio (para los huesos del bebé) y DHA (para su cerebro). Piensa en cada comida como una inversión directa en la salud futura de tu hijo.",
        sections: [
          { type: 'bullets', title: 'Claves', items: ['Proteína en cada comida', 'Calcio (lácteos/fortificados)', 'Hierro (legumbre, hojas verde oscuro + vit C)', 'Yodo (sal yodada)', 'DHA (pescado azul 1–2/sem)'] },
          { type: 'bullets', title: 'Qué limitar/evitar', items: ['Alcohol', 'Pescados con mercurio alto (pez espada, tiburón)', 'Quesos blandos no pasteurizados', 'Carnes crudas'] },
          { type: 'tips', title: 'Náusea', items: ['Jengibre', 'Comidas pequeñas', 'Galletas saladas'] }
        ],
        cta: [{ label: 'Añadir a Favoritos', action: 'add_favorite' }],
        theme: { bg: '#0c1c3e', accent: '#f06340', text: '#ffffff' }
      },
      {
        id: 'nut10',
        slug: 'adulto-mayor',
        title: 'Adulto Mayor',
        subtitle: 'Nutrición para vitalidad y fuerza.',
        horizons_tip: "Con la edad, la masa muscular (sarcopenia) tiende a disminuir. La proteína se vuelve el nutriente estrella para combatirlo. Asegurar una fuente de proteína en CADA comida (no solo en la cena) es crucial para mantener la fuerza y la independencia. Combinado con una buena hidratación y Vitamina D, es la fórmula para un envejecimiento activo y saludable.",
        sections: [
          { type: 'bullets', title: 'Prioriza', items: ['Proteína en todas las comidas (huevo, pescado, legumbre)', 'Vitamina D/calcio', 'Hidratación'] },
          { type: 'tips', title: 'Texturas amigables', items: ['Guisos suaves', 'Cremas', 'Smoothies proteicos'] }
        ],
        cta: [{ label: 'Añadir a Favoritos', action: 'add_favorite' }],
        theme: { bg: '#0c1c3e', accent: '#f06340', text: '#ffffff' }
      },
      {
        id: 'nut11',
        slug: 'veggie',
        title: 'Veggie / Vegano',
        subtitle: 'Guía para una dieta basada en plantas completa.',
        horizons_tip: "Una dieta vegana bien planificada puede ser increíblemente saludable, pero 'vegano' no es sinónimo automático de 'sano'. La clave es la planificación: asegurar proteína completa, suplementar B12 (no negociable), y vigilar el hierro y el calcio. Una dieta basada en plantas es un compromiso con la nutrición consciente, no solo con la exclusión de productos animales.",
        sections: [
          { type: 'bullets', title: 'Proteína veggie', items: ['Tofu/tempeh', 'Legumbres', 'Soya texturizada', 'Seitán'] },
          { type: 'bullets', title: 'Micros críticos', items: ['B12 suplementada', 'Hierro + vit C', 'Calcio (fortificados)', 'Omega-3 (chía/linaza/nuez, microalga DHA)'] }
        ],
        cta: [{ label: 'Añadir a Favoritos', action: 'add_favorite' }],
        theme: { bg: '#0c1c3e', accent: '#f06340', text: '#ffffff' }
      },
      { 
        id: 'nut12',
        slug: 'hidratacion', 
        title: 'Hidratación & Electrolitos', 
        subtitle: 'Cuánta agua y qué infusiones sí.',
        horizons_tip: "La sed es una señal tardía de deshidratación. El mejor indicador de una buena hidratación es el color de tu orina: debe ser amarillo pálido. Si hace mucho calor o haces ejercicio intenso, no solo pierdes agua, sino electrolitos. Un suero casero o un agua de coco pueden ser más efectivos que el agua sola para reponerte.",
        sections: [
          { type: 'tips', title: 'Meta diaria', items: ['30–35 ml/kg.'] },
          { type: 'tips', title: 'Caseros', items: ['Suero sencillo (1 L agua + ½ cdta sal + 6 cdtas azúcar + chorrito limón).'] },
          { type: 'bullets', title: 'Infusiones', items: ['Manzanilla', 'Jamaica (sin azúcar)', 'Toronjil', 'Jengibre'] }
        ],
        cta: [{ label: 'Añadir a Favoritos', action: 'add_favorite' }],
        theme: { bg: '#0c1c3e', accent: '#f06340', text: '#ffffff' }
      },
      { 
        id: 'nut13',
        slug: 'snacks', 
        title: 'Snacks Inteligentes', 
        subtitle: 'Opciones rápidas que sí cuentan.',
        horizons_tip: "Un 'snack inteligente' es un puente de energía entre comidas, no un capricho. La fórmula ganadora combina proteína y/o fibra (como yogurt con fruta, o manzana con crema de cacahuate). Esto estabiliza el azúcar en sangre, te mantiene satisfecho y evita que llegues a la siguiente comida con un hambre voraz. ¡Planifícalos!",
        sections: [
          { type: 'bullets', title: 'Ideas', items: ['Yogurt natural + fruta + chía', 'Verduras crudas + hummus', 'Manzana + crema de cacahuate 100%', 'Palomitas caseras', 'Puñado de nueces'] }
        ],
        cta: [{ label: 'Añadir a Favoritos', action: 'add_favorite' }],
        theme: { bg: '#0c1c3e', accent: '#f06340', text: '#ffffff' }
      },
      { 
        id: 'nut14',
        slug: 'herbolaria', 
        title: 'Tés & Herbolaria', 
        subtitle: 'Cuándo usar y cuándo no.',
        horizons_tip: "'Natural' no siempre significa 'inofensivo'. Las hierbas son medicina y deben usarse con respeto y conocimiento. Esta guía te ayuda a entender sus usos basados en evidencia y, más importante, sus precauciones. Son un complemento maravilloso a un estilo de vida saludable, no un sustituto de la atención médica.",
        sections: [
          { 
            type: 'herbal_item',
            slug: 'herbal-jamaica',
            title: 'Jamaica (Hibiscus sabdariffa)',
            summary: 'Ayuda a bajar levemente la presión y desinflamar. Sin azúcar.',
            detail: [
              { title: 'Qué hace (🔬 evidencia moderada)', items: ['Efecto antihipertensivo leve y diurético', 'Antioxidante'] },
              { title: 'Cómo tomar', items: ['1–2 tazas/día de infusión (10–15 min), sin azúcar.'] },
              { title: 'Ideal para', items: ['Apoyo en presión ligeramente elevada junto con dieta estilo DASH.'] },
              { title: 'Evita/Precauciones', items: ['Hipotensión', 'Gastritis/reflujo activo', 'Embarazo/lactancia (consultar)', 'Uso de diuréticos o antihipertensivos (puede potenciar efecto).'] },
              { title: 'Nota', items: ['No sustituye medicación; úsala como coadyuvante.'] }
            ]
          },
          { 
            type: 'herbal_item',
            slug: 'herbal-manzanilla',
            title: 'Manzanilla (Matricaria chamomilla)',
            summary: 'Calma el estómago y los espasmos. Suave y segura.',
            detail: [
              { title: 'Qué hace (🔬 evidencia moderada)', items: ['Antiespasmódico y calmante', 'Reduce gases y malestar.'] },
              { title: 'Cómo tomar', items: ['1–3 tazas/día; después de comidas o antes de dormir.'] },
              { title: 'Ideal para', items: ['Indigestión leve', 'Colon irritable leve', 'Sueño ligero.'] },
              { title: 'Evita/Precauciones', items: ['Alergia a Asteráceas (árnica/margaritas)', 'Uso de anticoagulantes (altas dosis pueden interferir).'] },
              { title: 'Tip', items: ['Dulce con canela ceylán o unas gotas de limón (sin azúcar).'] }
            ]
          },
          { 
            type: 'herbal_item',
            slug: 'herbal-jengibre',
            title: 'Jengibre (Zingiber officinale)',
            summary: 'Disminuye náusea y mareo; apoya digestión.',
            detail: [
              { title: 'Qué hace (🔬 evidencia buena)', items: ['Reduce náusea y mareo', 'Favorece motilidad gástrica.'] },
              { title: 'Cómo tomar', items: ['Infusión con 1–2 cm de raíz fresca o 1–2 g de polvo al día; también en comida.'] },
              { title: 'Ideal para', items: ['Mareo en viaje', 'Náusea leve (incluida la del embarazo, previo aval médico)', 'Indigestión.'] },
              { title: 'Evita/Precauciones', items: ['Anticoagulantes/antiagregantes', 'Cálculos biliares', 'Reflujo activo (puede arder).'] },
              { title: 'Tip', items: ['Combínalo con limón y menta (si no hay reflujo).'] }
            ]
          },
          { 
            type: 'herbal_item',
            slug: 'herbal-canela-ceylan',
            title: 'Canela ceylán (Cinnamomum verum)',
            summary: 'Mejora ligeramente la respuesta a la glucosa. Usa ceylán, no “cassia”.',
            detail: [
              { title: 'Qué hace (🔬 evidencia mixta)', items: ['Apoyo ligero en sensibilidad a la insulina y control posprandial.'] },
              { title: 'Cómo tomar', items: ['½ cucharadita al día en café/avena/yogurt; usar Ceylán (verum).'] },
              { title: 'Ideal para', items: ['Prediabetes/diabetes con plan bajo IG + ejercicio.'] },
              { title: 'Evita/Precauciones', items: ['Embarazo', 'Hígado graso o fármacos hepatotóxicos', 'Evita “cassia” (más cumarina → riesgo hepático).'] },
              { title: 'Nota', items: ['Es complemento, no reemplaza tratamiento.'] }
            ]
          },
          { 
            type: 'herbal_item',
            slug: 'herbal-menta',
            title: 'Menta / Hierbabuena (Mentha spp.)',
            summary: 'Antiespasmódica y refrescante. Útil tras comidas pesadas. Ojo: si tienes reflujo/hernia hiatal, evítala.',
            detail: [
              { title: 'Qué hace (🔬 evidencia moderada)', items: ['Antiespasmódica', 'Reduce gases y sensación de pesadez', 'Ayuda en digestión.'] },
              { title: 'Cómo tomar', items: ['1–2 tazas tras comida o en la tarde', 'También en infusión fría.'] },
              { title: 'Útil para', items: ['Indigestión', 'Distensión', 'Cólicos leves.'] },
              { title: 'Precauciones', items: ['Evitar si hay reflujo gastroesofágico o hernia hiatal (puede empeorar ardor)', 'Ojo con antiácidos justo antes (puede aumentar reflujo).'] },
              { title: 'Tip', items: ['Combínala con jengibre si no hay reflujo; con limón y hielo en días calurosos.'] }
            ]
          },
          { 
            type: 'herbal_item',
            slug: 'herbal-toronjil',
            title: 'Toronjil / Melisa (Melissa officinalis)',
            summary: 'Calma la ansiedad y apoya el sueño.',
            detail: [
              { title: 'Qué hace (🔬 evidencia moderada)', items: ['Efecto ansiolítico leve y sedante suave', 'Reduce tensión y facilita el inicio del sueño.'] },
              { title: 'Cómo tomar', items: ['1–3 tazas/día de infusión (5–10 min)', 'Por la noche, ideal.'] },
              { title: 'Útil para', items: ['Estrés leve', 'Irritabilidad', 'Problemas para conciliar el sueño.'] },
              { title: 'Precauciones', items: ['Puede dar somnolencia', 'No combinar con sedantes sin supervisión', 'Embarazo/lactancia: consultar', 'Hipotiroidismo: uso prudente (vigilar con médico).'] },
              { title: 'Tip', items: ['Mezcla con manzanilla si el estrés “pega” en estómago.'] }
            ]
          },
          { 
            type: 'herbal_warning',
            slug: 'herbal-desconocidas',
            title: 'Hierbas desconocidas',
            summary: 'Si no sabes qué es, no la tomes.',
            detail: [
              { title: 'Alerta', items: ['Si no puedes identificar la planta, origen y dosis, no la consumas. Riesgo de contaminación o interacciones.'] }
            ]
          },
          { 
            type: 'herbal_warning',
            slug: 'herbal-mezclas-milagrosas',
            title: 'Mezclas “milagrosas”',
            summary: 'Mucho marketing, poca evidencia. Evítalas.',
            detail: [
              { title: 'Alerta', items: ['Fórmulas con promesas extremas (desintoxicar, “curar” diabetes, “quemar” grasa) suelen carecer de evidencia y pueden interferir con tus medicamentos.'] }
            ]
          },
          { 
            type: 'herbal_warning',
            slug: 'herbal-altas-dosis',
            title: 'Altas dosis sin supervisión',
            summary: 'Lo natural también tiene efectos. No te excedas.',
            detail: [
              { title: 'Alerta', items: ['Lo natural también tiene efectos secundarios. Evita dosificar “a ojo” o duplicar preparados. Consulta si tomas anticoagulantes, antihipertensivos, hipoglucemiantes, ansiolíticos, antidepresivos.'] }
            ]
          }
        ],
        cta: [],
        theme: { bg: '#0c1c3e', accent: '#f06340', text: '#ffffff' }
      },
      { 
        id: 'nut15',
        slug: 'sustituciones', 
        title: 'Sustituciones Rápidas', 
        subtitle: 'Cuando no hay lo ideal.',
        horizons_tip: "La nutrición perfecta no existe, la nutrición real sí. Esta guía de sustituciones es tu 'plan B' para no abandonar tus metas cuando no encuentras un ingrediente. Entender que un camote puede reemplazar al arroz integral te da flexibilidad y poder, demostrando que comer sano es adaptable y no una lista rígida de reglas.",
        sections: [
            { type: "tips", title: "Arroz integral", items: ["Quinoa", "Papa/camote cocido"] },
            { type: "tips", title: "Pollo", items: ["Atún/sardina", "Huevo", "Tofu/legumbre"] },
            { type: "tips", title: "Aceite de oliva", items: ["Aguacate", "Nueces/almendras"] },
            { type: "tips", title: "Tortilla de maíz", items: ["Pan/grisín integral", "Avena salada"] }
        ],
        cta: [{ label: 'Añadir a Favoritos', action: 'add_favorite' }],
        theme: { bg: '#0c1c3e', accent: '#f06340', text: '#ffffff' }
      },
      { 
        id: 'nut16',
        slug: 'cocina-que-suma', 
        title: 'Cocina que Suma', 
        subtitle: 'Sin contar calorías.',
        horizons_tip: "Cocinar sano no tiene por qué ser complicado ni aburrido. Técnicas como hornear o usar la air-fryer realzan el sabor natural de los alimentos sin añadir grasas innecesarias. La 'Regla de 5 ingredientes' es un reto creativo que te obliga a enfocarte en la calidad y la simplicidad, demostrando que menos es más en la cocina saludable.",
        sections: [
            { type: "bullets", title: "Técnicas", items: ["Horneado", "Vapor", "Salteado corto", "Air-fryer"] },
            { type: "tips", title: "Regla 5-ingredientes", items: ["Proteína + verdura + grano + grasa buena + ácido (limón/vinagre)."] },
            { type: "bullets", title: "Salsas base (sin azúcar)", items: ["De jitomate natural", "De yogur + limón", "Pesto de espinaca"] }
        ],
        cta: [{ label: 'Añadir a Favoritos', action: 'add_favorite' }],
        theme: { bg: '#0c1c3e', accent: '#f06340', text: '#ffffff' }
      }
    ]
  },
  favoritos: {
    name: "Mis Favoritos",
    items: []
  }
};