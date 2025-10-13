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

  // Reducción opcional: si la imagen es gigante, reducir a máx 2048px en el lado mayor (manteniendo proporción)
  // No recortamos a cuadrado; preservamos el encuadre del usuario.
  let blob: Blob = file;
  try {
    if (typeof createImageBitmap !== 'undefined') {
      const bmp = await createImageBitmap(file);
      const maxSide = 2048;
      const needResize = Math.max(bmp.width, bmp.height) > maxSide;
      if (needResize) {
        const scale = maxSide / Math.max(bmp.width, bmp.height);
        const w = Math.round(bmp.width * scale);
        const h = Math.round(bmp.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas no disponible');
        ctx.drawImage(bmp, 0, 0, w, h);
        const type = ['image/jpeg','image/png','image/webp'].includes(file.type) ? file.type : 'image/jpeg';
        const quality = type === 'image/jpeg' || type === 'image/webp' ? 0.9 : undefined;
        blob = await new Promise<Blob>((resolve) => canvas.toBlob(b => resolve(b!), type, quality as any)!);
      }
    }
  } catch {
    // si falla, subimos el original
  }

  // Usar extensión acorde al blob final (generalmente jpg)
  const ext = 'jpg';
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
  const { data: signed, error: sErr } = await supabase.storage.from('avatars').createSignedUrl(path, 60*60*24);
  if (sErr) throw sErr;
  try {
    // Cachear la URL firmada con su expiración
    const expiresAt = Date.now() + 60*60*24*1000; // 24h
    const key = `avatar_signed:${path}`;
    const payload = { url: signed.signedUrl, expiresAt };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {}

  return { path, signedUrl: signed.signedUrl };
}

/**
 * Devuelve URL (signed) para un path guardado en avatar_url.
 */
export async function getAvatarUrl(path?: string | null) {
  if (!path) return null;
  const { data, error } = await supabase.storage.from('avatars').createSignedUrl(path, 60*60*24);
  if (error) return null;
  return data.signedUrl;
}

/**
 * Devuelve URL (signed) para un path usando caché en localStorage cuando esté vigente.
 * Si la caché expiró o no existe, genera una nueva y la almacena.
 */
export async function getAvatarUrlCached(path?: string | null, ttlSeconds: number = 60*60*24) {
  if (!path) return null;
  const key = `avatar_signed:${path}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const obj = JSON.parse(raw) as { url: string; expiresAt: number };
      if (obj?.url && obj?.expiresAt && obj.expiresAt > Date.now() + 10_000) { // margen 10s
        return obj.url;
      }
    }
  } catch {}

  const { data, error } = await supabase.storage.from('avatars').createSignedUrl(path, ttlSeconds);
  if (error) return null;
  try {
    const payload = { url: data.signedUrl, expiresAt: Date.now() + ttlSeconds * 1000 };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {}
  return data.signedUrl;
}

/**
 * Limpia la caché para un path específico o toda la caché de avatares si no se especifica.
 */
export function clearAvatarUrlCache(path?: string) {
  try {
    if (path) {
      localStorage.removeItem(`avatar_signed:${path}`);
    } else {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('avatar_signed:')) localStorage.removeItem(k);
      });
    }
  } catch {}
}

/**
 * Sube un avatar desde un Blob (por ejemplo, recortado con un editor) preservando ajustes previos.
 */
export async function uploadAvatarBlob(blob: Blob, opts?: { filename?: string, table?: 'profiles'|'family_members'|'enterprise_employees', user_id?: string, record_id_column?: string }) {
  const user = (await supabase.auth.getUser()).data.user;
  const uid = opts?.user_id ?? user?.id;
  if (!uid) throw new Error('No hay sesión');

  const type = (blob as any).type || 'image/jpeg';
  const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';
  const name = (opts?.filename ?? `avatar_${Date.now()}`) + `.${ext}`;
  const path = `${uid}/${name}`;

  const { error: upErr } = await supabase.storage.from('avatars').upload(path, blob, { upsert: false, contentType: type });
  if (upErr) throw upErr;

  const table = opts?.table ?? 'profiles';
  const recordIdColumn = opts?.record_id_column ?? (table === 'profiles' ? 'user_id' : 'user_id');
  const updates: any = { avatar_url: path };
  const { data: updData, error: updErr, status } = await supabase.from(table).update(updates).eq(recordIdColumn, uid).select(recordIdColumn);
  if (updErr) throw updErr;
  if (!updData || updData.length === 0) {
    const payload: any = { [recordIdColumn]: uid, ...updates };
    const { error: upsertErr } = await supabase.from(table).upsert(payload, { onConflict: recordIdColumn });
    if (upsertErr) throw upsertErr;
  }

  const { data: signed, error: sErr } = await supabase.storage.from('avatars').createSignedUrl(path, 60*60*24);
  if (sErr) throw sErr;
  try {
    const expiresAt = Date.now() + 60*60*24*1000; // 24h
    const key = `avatar_signed:${path}`;
    const payload = { url: signed.signedUrl, expiresAt };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {}
  return { path, signedUrl: signed.signedUrl };
}
