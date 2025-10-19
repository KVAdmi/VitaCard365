// Utilidades de fecha/horario sin romper almacenamiento en UTC
// toLocalDateISO: devuelve YYYY-MM-DD en horario local, evitando desfase por UTC
export function toLocalDateISO(date = new Date()) {
  const tzOffset = date.getTimezoneOffset() * 60000; // milisegundos
  return new Date(date.getTime() - tzOffset).toISOString().split('T')[0];
}

// toLocalDateTimeISO: devuelve YYYY-MM-DDTHH:mm en horario local (útil para inputs datetime-local)
export function toLocalDateTimeISO(date = new Date()) {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}
