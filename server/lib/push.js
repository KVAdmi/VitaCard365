// push.js: lógica para programar y enviar notificaciones push
const webpush = require('web-push');
const SUPABASE = require('../lib/supabase'); // asume que tienes lógica para obtener datos de usuario

// Configura tus claves VAPID
webpush.setVapidDetails(
  'mailto:soporte@vitacard365.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function schedulePushNotification({ userId, nextPaymentDate, subscription }) {
  // Calcula fecha de notificación (3 días antes)
  const notifyDate = new Date(nextPaymentDate);
  notifyDate.setDate(notifyDate.getDate() - 3);
  // Aquí deberías guardar en la base de datos la tarea programada
  // y tener un job que revise y envíe la notificación en el momento adecuado
  // Ejemplo directo (solo para demo):
  if (new Date() >= notifyDate) {
    await sendPushNotification(subscription, {
      title: '¡Tu plan está por vencer!',
      body: 'Renueva tu plan VitaCard365 para no perder la cobertura.'
    });
  }
}

async function sendPushNotification(subscription, payload) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (e) {
    console.error('Error enviando push:', e);
  }
}

module.exports = { schedulePushNotification, sendPushNotification };
