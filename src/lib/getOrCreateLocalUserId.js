import { v4 as uuidv4 } from 'uuid';

// Devuelve un UUID persistente para el usuario local (para usar como usuario_id en Supabase)
export function getOrCreateLocalUserId() {
  let id = localStorage.getItem('vita_local_user_id');
  if (!id) {
    id = uuidv4();
    localStorage.setItem('vita_local_user_id', id);
  }
  return id;
}