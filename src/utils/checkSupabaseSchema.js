import { supabase } from '../lib/supabaseClient';

async function checkSchema() {
  // Obtener la definición de la tabla
  const { data, error } = await supabase
    .from('mediciones')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error consultando schema:', error);
  } else {
    console.log('Columnas disponibles:', Object.keys(data[0] || {}));
  }
}

checkSchema();