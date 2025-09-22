# Mapeo de Funcionalidades y Conexiones — VitaCard365

## 1. Autenticación y Usuarios
- Registro de usuario (correo, contraseña, datos personales)
	- **Proveedor:** Supabase Auth
	- **Almacenamiento:** Tabla `auth.users` y `profiles` en Supabase
- Login de usuario
	- **Proveedor:** Supabase Auth
	- **Almacenamiento:** Sesión JWT gestionada por Supabase
- Recuperación de contraseña (enlace por email)
	- **Proveedor:** Supabase Auth (SMTP configurado)
- Edición de perfil
	- **Proveedor:** Supabase (tabla `profiles`)
- Persistencia de sesión
	- **Proveedor:** Supabase Auth (JWT, refresh tokens)
- **Login/Registro con Google**
	- **Estado:** Implementado y funcional
	- **Proveedor:** Supabase Auth (OAuth Google)
	- **Flujo:**
		- El usuario puede iniciar sesión o registrarse usando su cuenta de Google.
		- Se usa el botón de Google (OAuth) y se redirige a Google para autenticación.
		- Al autenticarse, se crea/actualiza el perfil en la tabla `profiles` de Supabase.
		- Se almacena el usuario en `auth.users` y los datos extendidos en `profiles` (nombre, avatar, etc.).
	- **Limitaciones:**
		- Solo Google está implementado como proveedor social (no hay Facebook, Apple, etc.).
		- No se permite vincular múltiples proveedores a una misma cuenta.
		- El flujo depende de la configuración de OAuth en Supabase y Google Cloud Console.
		- No hay soporte para login social en modo offline/demo.
	- **Archivos relevantes:**
		- `src/components/ui/GoogleLoginButton.jsx`
		- `src/contexts/AuthContext.jsx` (función `signInWithGoogle`)
		- `src/pages/Login.jsx` y `src/pages/Register.jsx` (uso del botón y flujo)

## 2. Medición y Salud
	- **Proveedor:** Manual (usuario), almacenamiento en Supabase (`measurements`)
	- **Pendiente:** Integración automática con dispositivos Bluetooth (actualmente solo manual)
	- **Proveedor:** Lógica local, almacenamiento en Supabase
	- **Pendiente:** Mejorar lógica de recomendaciones automáticas
	- **Proveedor:** Manual, almacenamiento en Supabase
	- **Proveedor:** Simulación local, almacenamiento en Supabase
	- **Limitaciones actuales:**
		- No solicita permisos de micrófono
		- No graba ni analiza audio real
		- No detecta ronquidos ni eventos reales
		- No hay advertencia de privacidad ni consentimiento de audio
	- **Pendiente:**
		- Solicitar permiso de micrófono al usuario
		- Grabar audio real durante la sesión
		- Analizar el audio para detectar ronquidos, picos, eventos de voz, etc.
		- Guardar el audio o los resultados reales
		- Mostrar advertencia de privacidad y pedir consentimiento explícito
	- **Proveedor:** Supabase (tabla `measurements`), almacenamiento local para offline
## 2. Mi Chequeo (Medición y Salud)

### Submódulos principales:
- **Signos Vitales**
	- ¿Qué mide?: Presión arterial, pulso, SpO₂ (oxigenación), temperatura corporal.
	- ¿Cómo?: El usuario ingresa manualmente los valores. Hay pantallas específicas para cada signo.
	- ¿Almacenamiento?: Supabase (tabla `measurements`), historial local para offline.
	- Limitaciones: No hay integración automática con dispositivos Bluetooth. No hay validación avanzada de rangos anormales.
	- Pendientes: Integración Bluetooth, alertas automáticas por valores críticos.

- **Test de Alertas**
	- ¿Qué es?: Cuestionarios de síntomas (triage digital) para detectar riesgos.
	- ¿Cómo?: El usuario responde preguntas, la lógica local evalúa el nivel de alerta y recomienda acción.
	- ¿Almacenamiento?: Supabase (tabla `triage_results`), historial local.
	- Limitaciones: Lógica de recomendaciones básica, no personalizada.
	- Pendientes: Mejorar lógica, personalización por perfil, integración con IA.

- **Peso y Talla (IMC)**
	- ¿Qué mide?: Peso, talla, calcula IMC automáticamente.
	- ¿Cómo?: El usuario ingresa peso y talla, la app calcula IMC y muestra historial.
	- ¿Almacenamiento?: Supabase (tabla `measurements`), historial local.
	- Limitaciones: No hay integración con básculas inteligentes.
	- Pendientes: Integración con dispositivos, alertas por cambios bruscos.

- **Calidad del Sueño**
	- ¿Qué hace?: Simula monitoreo de sueño (score, ronquidos, picos de ruido, duración).
	- ¿Cómo?: El usuario inicia un temporizador, al finalizar se genera un resumen ficticio (no graba audio real).
	- ¿Almacenamiento?: Supabase (tabla `sleep_sessions`), historial local.
	- Limitaciones: No solicita permisos de micrófono, no graba ni analiza audio real, no detecta eventos reales, no hay consentimiento de audio.
	- Pendientes: Solicitar permiso de micrófono, grabar y analizar audio real, advertencia de privacidad, exportar PDF real.

- **Historial de Mediciones**
	- ¿Qué hace?: Muestra todos los registros de signos, peso, sueño y test.
	- ¿Almacenamiento?: Supabase (tablas `measurements`, `sleep_sessions`, `triage_results`), almacenamiento local para offline.

---

## 3. Bienestar

### Secciones principales:
- **Tips Rápidos**
	- ¿Qué hay?: Consejos breves de salud, hidratación, pausas activas, snacks saludables, luz solar, mindful eating, descanso visual.
	- ¿Cómo funciona?: Texto educativo, sin interacción avanzada.
	- ¿Almacenamiento?: Solo lectura, no almacena progreso.

- **Respiración**
	- ¿Qué hay?: Ejercicios guiados de respiración (cuadrada, 4-7-8, suspiro fisiológico, diafragmática).
	- ¿Cómo funciona?: Animaciones y temporizadores, algunos con reproductor interactivo.
	- ¿Almacenamiento?: Permite marcar como favorito o completado (localStorage `vita365_wellness_favorites`, `vita365_wellness_completed`).

- **Meditación**
	- ¿Qué hay?: Audios guiados (atención plena, escaneo corporal, bondad amorosa, observando pensamientos).
	- ¿Cómo funciona?: Reproductor de audio integrado, permite marcar como favorito o completado.
	- ¿Almacenamiento?: Favoritos y completados en localStorage.

- **Rutinas Express**
	- ¿Qué hay?: Rutinas de ejercicio rápido (energía mañanera, estiramiento de oficina, core express, movilidad articular).
	- ¿Cómo funciona?: Texto con instrucciones paso a paso, sin temporizador integrado.
	- ¿Almacenamiento?: Solo favoritos/completados en localStorage.

- **Higiene del Sueño**
	- ¿Qué hay?: Consejos y checklist para mejorar el sueño, diario de gratitud, manejo de insomnio, timing de cafeína/alcohol.
	- ¿Cómo funciona?: Texto educativo, sin interacción avanzada.
	- ¿Almacenamiento?: Solo favoritos/completados en localStorage.

- **Nutrición Inteligente**
	- ¿Qué hay?: Guías visuales (plato ideal), tips para detectar azúcares ocultos, planes de comida, herbolaria.
	- ¿Cómo funciona?: Texto, listas, algunos con tabs y secciones interactivas, permite guardar favoritos.
	- ¿Almacenamiento?: Favoritos en localStorage, no hay seguimiento de progreso.

- **Favoritos de Bienestar**
	- ¿Qué hace?: Permite guardar cualquier tip, rutina, meditación, receta, etc. en una lista personal.
	- ¿Almacenamiento?: localStorage (`vita365_wellness_favorites`).

---

## 4. Agenda
- ¿Qué permite?:
	- Agregar, editar y eliminar medicamentos (nombre, dosis, hora, repetición).
	- Agregar, editar y eliminar citas médicas (título, fecha/hora, lugar, notas, repetición).
	- Recordatorios automáticos (alerta en la app a la hora de la medicina y 4h antes de la cita).
	- Exportar agenda a archivo JSON.
- ¿Almacenamiento?: localStorage (`vita365_medicines`, `vita365_appointments`).
- Limitaciones: No hay sincronización en la nube, no hay integración con calendarios externos, no hay notificaciones push reales.

---

## 5. Favoritos y Completados
- ¿Qué hace?: Permite guardar cualquier contenido de Bienestar como favorito y marcarlo como completado.
- ¿Almacenamiento?: localStorage (`vita365_wellness_favorites`, `vita365_wellness_completed`).
- Limitaciones: No se sincroniza entre dispositivos, solo local.

---

## 6. Otros módulos y detalles
- **Perfil de usuario:** Edición de nombre, email, avatar. Almacenado en Supabase (`profiles`).
- **Soporte IA (i-Vita):** Chat médico, responde dudas, guía sobre síntomas, ayuda con pagos y uso de la app. Proveedor: AWS Lambda (IVITA_URL).
- **Pagos y planes:** MercadoPago/Stripe, historial en Supabase (`payments`, `subscriptions`).
- **Notificaciones push:** No implementadas aún.
- **Archivos adjuntos:** No hay gestión avanzada, pendiente exportar PDF de sueño.
- **Integraciones nativas:** Bluetooth/cámara/micrófono no implementados real, solo placeholders.

## 3. Asistente Médico (i-Vita)
- Chat asistente médico IA
	- **Proveedor:** AWS Lambda (IVITA_URL)
	- **Estado:** Funcional y bien configurado
	- **Pendiente:** Mejorar logs de errores para debugging avanzado (opcional)

## 4. Pagos y Planes
- Gestión de planes y suscripciones
	- **Proveedor:** MercadoPago, Stripe (según país)
	- **Almacenamiento:** Supabase (tabla `payments` y `subscriptions`)
	- **Estado:** Funcional y probado
	- **Pendiente:** Mejorar feedback de errores de pago y validación de estados de suscripción

## 5. Notificaciones y Email
- Recuperación de contraseña por email
	- **Proveedor:** Supabase Auth (SMTP)
	- **Pendiente:** Confirmar que el email de recuperación llega correctamente (revisar SMTP en Supabase)
- Notificaciones push
	- **Proveedor:** No implementadas aún
	- **Pendiente:** Agregar con Capacitor Push si se requiere

## 6. Almacenamiento de Archivos
- PDFs, imágenes, documentos
	- **Proveedor:** Supabase Storage
	- **Pendiente:** Mejorar gestión de archivos adjuntos y descargas (por ejemplo, exportar PDF de sueño aún no implementado)

## 7. Integraciones Nativas
- Bluetooth LE (mediciones automáticas)
	- **Proveedor:** Capacitor Community BLE (no implementado real)
	- **Pendiente:** Integración real, actualmente solo placeholder/manual
- Cámara, micrófono (para módulos de salud)
	- **Proveedor:** Capacitor Plugins (no implementado real)
	- **Pendiente:** Solicitar permisos y usar hardware en módulos que lo requieran (ej. sueño, PPG)

## 8. Seguridad y Sesión
- Tokens JWT gestionados por Supabase
- Almacenamiento seguro en móvil (Secure Storage/LocalStorage)
- **Pendiente:** Revisar expiración de sesión y manejo de refresh tokens

## 9. Infraestructura
- **Frontend:** React + Vite
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Asistente IA:** AWS Lambda (IVITA_URL)
- **Pasarelas de pago:** MercadoPago, Stripe
- **Nativo:** Capacitor (Android/iOS)

---

## Resumen de Conexiones
- **Supabase:** Usuarios, autenticación, base de datos, archivos, emails
- **AWS Lambda (IVITA):** Asistente médico IA
- **MercadoPago/Stripe:** Pagos y suscripciones
- **Plugins Capacitor/Cordova:** Bluetooth, cámara, micrófono, notificaciones

---

## Limitaciones y pendientes por módulo (detalle para desarrollo)

### Medición de Sueño
- No solicita permisos de micrófono.
- No graba ni analiza audio real.
- El score, ronquidos y picos son simulados (random).
- Falta advertencia de privacidad y consentimiento.
- Falta exportar PDF real.

### Signos Vitales
- Solo ingreso manual, falta integración automática con dispositivos Bluetooth.

### Test de Alertas
- Lógica de recomendaciones básica, se puede mejorar.

### Pagos
- Falta feedback de errores de pago más claro.
- Validación de estados de suscripción puede mejorarse.

### Recuperación de Contraseña
- Confirmar que el email llega correctamente (SMTP Supabase).

### Notificaciones Push
- No implementadas aún.

### Archivos Adjuntos
- Falta gestión avanzada de archivos y descargas (PDFs, imágenes).

### Seguridad
- Revisar expiración de sesión y refresh tokens.

### Integraciones Nativas
- Falta integración real de Bluetooth y uso de hardware en módulos que lo requieran.

---

**Este documento detalla lo que hace y lo que falta en cada módulo. Úsalo como checklist para desarrollo y QA.**

---

## Pendientes o para revisar
- Confirmar funcionamiento de email de recuperación (SMTP en Supabase)
- (Opcional) Notificaciones push
- (Opcional) Integración automática con dispositivos Bluetooth
- (Opcional) Mejorar verificación de email en registro

---

Este documento es un mapeo funcional y de integración, sin código, para tener claro qué módulos existen, cómo se comunican y qué proveedores usan.
