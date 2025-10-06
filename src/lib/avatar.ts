import { supabase } from './supabaseClient';

/**
 * Subir avatar del usuario de forma segura.
 * - Valida tamaño (<=1MB) y tipo (jpeg/png/webp)
 * - Redimensiona opcionalmente a 512x512 usando createImageBitmap/canvas cuando está en navegador
 * - Sube al bucket `avatars` con ruta `${uid}/${filename}`
 * - Marca ACL privada; devuelve signed URL corta (60 min) y la ruta almacenada
 */
export async function uploadUserAvatar(file: File, opts?: { table?: 'profiles'|'family_members'|'enterprise_employees', user_id?: string, record_id_column?: string }) {
  const user = (await supabase.auth.getUser()).data.user;
  const uid = opts?.user_id ?? user?.id;
  if (!uid) throw new Error('No hay sesión');

  // Validaciones básicas
  const allowed = ['image/jpeg','image/png','image/webp'];
  if (!allowed.includes(file.type)) throw new Error('Tipo no permitido');
  if (file.size > 1024*1024) throw new Error('Archivo >1MB');

  // Opcional: reescalar si el contexto lo permite
  let blob: Blob = file;
  try {
    if (typeof createImageBitmap !== 'undefined') {
      const bmp = await createImageBitmap(file);
      const max = 512;
      const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
      const w = Math.round(bmp.width * scale);
      const h = Math.round(bmp.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas no disponible');
      ctx.drawImage(bmp, 0, 0, w, h);
      const type = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';
      blob = await new Promise<Blob>((resolve) => canvas.toBlob(b => resolve(b!), type, 0.88)!);
    }
  } catch {
    // si falla, subimos el original
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const name = `avatar_${Date.now()}.${ext}`;
  const path = `${uid}/${name}`;

  const { error: upErr } = await supabase.storage.from('avatars').upload(path, blob, { upsert: false, contentType: file.type });
  if (upErr) throw upErr;

  // Guardar en tabla correspondiente
  const table = opts?.table ?? 'profiles';
  const recordIdColumn = opts?.record_id_column ?? (table === 'profiles' ? 'user_id' : 'user_id');
  const updates: any = { avatar_url: path };
  // Intentar update, y si no afecta filas, hacer upsert seguro
  const { data: updData, error: updErr, status } = await supabase.from(table).update(updates).eq(recordIdColumn, uid).select(recordIdColumn);
  if (updErr) throw updErr;
  if (!updData || updData.length === 0) {
    const payload: any = { [recordIdColumn]: uid, ...updates };
  const { error: upsertErr } = await supabase.from(table).upsert(payload, { onConflict: recordIdColumn });
    if (upsertErr) throw upsertErr;
  }

  // Generar signed URL
  const { data: signed, error: sErr } = await supabase.storage.from('avatars').createSignedUrl(path, 60*60);
  if (sErr) throw sErr;

  return { path, signedUrl: signed.signedUrl };
}

/**
 * Devuelve URL (signed) para un path guardado en avatar_url.
 */
export async function getAvatarUrl(path?: string | null) {
  if (!path) return null;
  const { data, error } = await supabase.storage.from('avatars').createSignedUrl(path, 60*60);
  if (error) return null;
  return data.signedUrl;
}
