// SW deshabilitado temporalmente para evitar cache viejo en nativo.
// Si quieres reactivarlo, renombra este archivo a service-worker.js y ajusta el registro.

self.addEventListener('push', function(event) {
  const data = event.data?.json() || {};
  const title = data.title || 'Vencimiento de tu plan';
  const options = {
    body: data.body || 'Tu plan está por vencer. Renueva para no perder la cobertura.',
    icon: 'assets/vita-icon-192.png',
    badge: 'assets/vita-icon-192.png'
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
