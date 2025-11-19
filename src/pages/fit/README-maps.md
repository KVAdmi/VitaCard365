# Módulo de Mapas (Plan táctico)

Decisión ejecutiva:
- Android: usar Google Maps Web (JS) embebido en la app.
- iOS: mantener mapa nativo (@capacitor/google-maps).

No se elimina el mapa nativo Android; solo se desactiva detrás de flags.

## Flags de entorno

- VITE_MAP_PROVIDER_ANDROID=web|native  (default: web)
- VITE_MAP_PROVIDER_IOS=native|web      (default: native)
- VITE_MAPS_WEB_KEY=...    (clave de Google Maps JavaScript)
- VITE_MAPS_IOS_KEY=...    (clave de iOS nativo)

Opcionales/backups: VITE_MAPS_API_KEY, VITE_GOOGLE_MAPS_KEY

## Componentes

- MapView: selector por plataforma/flag. Usa WebMapAdapter (Android/Web) y NativeMap (iOS).
- adapters/MapAdapter.ts: interfaz común.
- adapters/WebMapAdapter.ts: implementación con Google Maps JS.
- NativeMap.tsx: existente, sin cambios.
- WebMap.jsx: existente (legacy), no requerido por el adapter.

## Estilo

- src/config/mapStyle.vita.json: estilo oscuro VitaCard aplicado en ambos providers.

## Cómo correr

- Android (Capacitor): setear VITE_MAP_PROVIDER_ANDROID=web y VITE_MAPS_WEB_KEY.
- iOS: VITE_MAP_PROVIDER_IOS=native y VITE_MAPS_IOS_KEY.

## Limitaciones actuales

- WebMapAdapter no implementa eventos avanzados ni clustering.
- Destroy en JS limpia referencias; Google Maps JS no expone método destroy.

## QA smoke

- Abrir/cerrar la vista 10 veces, navegar tabs. El mapa no debe parpadear.
- Render < 2s, estilo oscuro activo, cambios de centro/zoom <200ms percibidos.
