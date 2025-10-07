import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

// Helper para solicitar permiso de notificaciones en Android 13+
// No se usa aún directamente; disponible para cuando se inicie un servicio en foreground.
export async function ensureNotificationPermission() {
  if (Capacitor.getPlatform() !== 'android') return;
  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }
  } catch (e) {
    // No romper flujo si el plugin no está disponible o no aplica
    console.warn('[notifications] permission check skipped:', e);
  }
}
