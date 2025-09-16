import { createClient } from '@supabase/supabase-js';

const url = 'https://ymwhgkeomyuevsckljdw.supabase.co';
const anon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inltd2hna2VvbXl1ZXZzY2tsamR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4NTg1NTEsImV4cCI6MjA3MjQzNDU1MX0.MGrQkn4-XQFCWD-RrKjLnAIQQNFvr8eVO8HeOfpWW7o';

const supabase = createClient(url, anon);

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