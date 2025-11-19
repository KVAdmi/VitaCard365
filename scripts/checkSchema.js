import { supabase } from '@/lib/supabaseClient';

async function checkSchema() {
  try {
    // Primero, intentemos obtener la definición de la tabla
    const { data, error } = await supabase
      .from('mediciones')
      .select()
      .limit(1);

    if (error) {
      console.error('Error consultando mediciones:', error);
      return;
    }

    // Intentar obtener la definición de la tabla usando información del sistema
    const { data: schemaData, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'mediciones');

    if (schemaError) {
      console.error('Error obteniendo schema:', schemaError);
    } else {
      console.log('Estructura de la tabla mediciones:');
      console.table(schemaData);
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

checkSchema();