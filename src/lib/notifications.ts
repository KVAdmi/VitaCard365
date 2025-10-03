// src/lib/notifications.ts
import {
  LocalNotifications,
  PendingLocalNotificationSchema,
  Channel,
} from '@capacitor/local-notifications';

const FITNESS_CHANNEL_ID = 'fitness_reminders';

// Pide permiso (solicita solo si hace falta)
export async function asegurarPermisoNotificaciones(): Promise<boolean> {
  const { display } = await LocalNotifications.checkPermissions();
  if (display === 'granted') return true;
  const { display: granted } = await LocalNotifications.requestPermissions();
  return granted === 'granted';
}

// Crea el canal (Android); en iOS se ignora sin fallar
export async function asegurarCanalFitness() {
  try {
    const canal: Channel = {
      id: FITNESS_CHANNEL_ID,
      name: 'Recordatorios de entrenamiento',
      description: 'Notifica tus sesiones y rutinas',
      importance: 4, // ALTA
      sound: 'default',
      visibility: 1, // PUBLIC
      lights: true,
      vibration: true,
  // Nota: algunos campos varían por versión; omitimos vibrationPattern para evitar errores de tipado
    };
    await LocalNotifications.createChannel(canal);
  } catch {}
}

// Limpia todo (útil en QA)
export async function cancelarTodasLasNotificaciones() {
  const { notifications } = await LocalNotifications.getPending();
  if (notifications?.length) {
    await LocalNotifications.cancel({ notifications });
  }
}

// Programa notificación simple en fecha/hora concretas (no repetitiva)
export async function programarUna(opts: {
  id: number;
  titulo: string;
  cuerpo: string;
  fecha: Date;
}) {
  const payload: PendingLocalNotificationSchema = {
    id: opts.id,
    title: opts.titulo,
    body: opts.cuerpo,
    schedule: { at: opts.fecha },
  // smallIcon solo aplica en Android; omitido para respetar tipos
  // channelId puede no estar tipado en esta versión; omitimos y usamos canal por defecto si aplica
  };
  await LocalNotifications.schedule({ notifications: [payload] });
}

// Programa recordatorios semanales (p.ej. L-Mi-V a las 07:30)
export async function programarSemanales(opts: {
  idBase: number;          // base para IDs, cada día suma +idx
  titulo: string;
  cuerpo: string;
  hora: number;            // 0..23
  minuto: number;          // 0..59
  diasSemana: number[];    // 1=Dom, 2=Lun, ... 7=Sáb (Capacitor)
}) {
  const notifications: PendingLocalNotificationSchema[] = opts.diasSemana.map((wd, i) => ({
    id: opts.idBase + i,
    title: opts.titulo,
    body: opts.cuerpo,
    schedule: {
      on: { weekday: wd, hour: opts.hora, minute: opts.minuto },
      allowWhileIdle: true,
      repeats: true,
    },
  // smallIcon/channelId omitidos para respetar tipos de la versión actual
  }));
  await LocalNotifications.schedule({ notifications });
}

// Reprograma set completo (cancela IDs previos y vuelve a crear)
export async function reprogSemanales(opts: {
  prefijoId: number;        // mismo prefijo anterior
  cantidad: number;         // cuántos programaste
  titulo: string;
  cuerpo: string;
  hora: number;
  minuto: number;
  diasSemana: number[];
}) {
  const aCancelar: PendingLocalNotificationSchema[] = Array.from({ length: opts.cantidad }, (_, i) => ({ id: opts.prefijoId + i } as any));
  await LocalNotifications.cancel({ notifications: aCancelar });
  await programarSemanales({
    idBase: opts.prefijoId,
    titulo: opts.titulo,
    cuerpo: opts.cuerpo,
    hora: opts.hora,
    minuto: opts.minuto,
    diasSemana: opts.diasSemana,
  });
}

// Utilidad: convierte "Lun..Dom" (1..7) desde JS (Mon..Sun)
export const DIA_SEMANA = {
  DOM: 1, LUN: 2, MAR: 3, MIE: 4, JUE: 5, VIE: 6, SAB: 7,
};
