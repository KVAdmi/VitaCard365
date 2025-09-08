// Netlify Function: update-profile
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método no permitido' })
    };
  }

  const body = JSON.parse(event.body);
  const {
    userId,
    nombres,
    apellido_paterno,
    apellido_materno,
    rfc,
    sexo,
    direccion,
    codigo_postal,
    phone,
    birthdate,
    origen,
    family_id
  } = body;

  // 1. Leer el perfil actual para saber si ya tiene codigo_vita
  const { data: perfil, error: errorPerfil } = await supabase
    .from('profiles')
    .select('codigo_vita')
    .eq('id', userId)
    .single();

  if (errorPerfil) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'No se pudo leer el perfil', details: errorPerfil.message })
    };
  }

  // 2. Preparar los campos para upsert/update
  const updateFields = {
    nombres,
    apellido_paterno,
    apellido_materno,
    rfc,
    sexo,
    direccion,
    codigo_postal,
    phone,
    birthdate,
    origen,
    family_id
  };

  // 3. Si ya existe codigo_vita, no lo tocamos
  if (perfil && perfil.codigo_vita) {
    delete updateFields.codigo_vita;
  }

  // 4. Ejecutar upsert/update en profiles
  const { error: errorUpdate } = await supabase
    .from('profiles')
    .update(updateFields)
    .eq('id', userId);

  if (errorUpdate) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'No se pudo actualizar el perfil', details: errorUpdate.message })
    };
  }

  // 5. Leer el registro desde la VIEW para entregar folio_vita
  const { data: certificado, error: errorCert } = await supabase
    .from('profiles_certificado_v')
    .select('*')
    .eq('id', userId)
    .single();

  if (errorCert) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'No se pudo obtener el certificado', details: errorCert.message })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(certificado)
  };
}
