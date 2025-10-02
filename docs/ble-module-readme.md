# BLE (Bluetooth Low Energy) - FTMS + HRM

## Contexto
- Plugin: `@capacitor-community/bluetooth-le` instalado y enlazado en Android e iOS.
- Manifest y permisos: El plugin gestiona los permisos requeridos automáticamente.
- permissions.ts y BLEConnect.tsx: Solicitan permisos en runtime según versión de Android.
- iOS: Info.plist actualizado con descripciones claras para App Store.

## Objetivo
- Conectar, leer y bufferizar datos FTMS (0x1826) y HR (0x180D) a ≥1 Hz.
- Reconexión automática <5 s.
- Exportar sesión (JSON) al backend al terminar.

## Flujo General
1. **Escaneo filtrado (20–30 s)**
   - Filtra por Service UUIDs: 0x1826 (FTMS) y 0x180D (HR).
   - Detiene scan al conectar.
   - UI: Lista de dispositivos con name, deviceId, RSSI, etiquetas [FTMS]/[HR].
2. **Conexión y suscripción**
   - Conecta y descubre servicios.
   - Suscribe a:
     - FTMS: 2AD2, 2ACD, 2AD1, 2ACE (según equipo)
     - HR: 2A37
   - Una sola suscripción por characteristic.
3. **Parsing**
   - FTMS: velocidad, cadencia, potencia, inclinación, distancia, calorías (según flags).
   - HR: bpm en primer byte (o 2 bytes si flag 0x01).
   - Endianness: Little Endian.
4. **Buffer 1 Hz y reconexión**
   - Emite y guarda un sample consolidado cada 1000 ms.
   - Reconexión automática con backoff: 0.5s → 1s → 2s → 5s.
5. **Export de sesión**
   - Al terminar, detiene notificaciones y exporta JSON vía POST al backend.
6. **Permisos en runtime**
   - Android 12+: BLUETOOTH_SCAN y BLUETOOTH_CONNECT.
   - Android ≤11: ACCESS_FINE_LOCATION.
   - iOS: Solo NSBluetoothAlwaysUsageDescription (y NSLocationWhenInUseUsageDescription si se usa geoloc).
7. **UI/Estados**
   - Idle → Scanning → Connecting → Streaming → Reconnecting → Finished/Error.
   - HUD con EMA corta para suavizar velocidad/potencia; HR en crudo a 1 Hz.

## Diferencias iOS
- MTU: iOS lo maneja internamente.
- Permisos: No requiere ubicación para BLE (a menos que uses geoloc).
- Reconexión: iOS más estable, pero se implementa backoff igual.
- Background: Desactivado.

## Criterios de aceptación (DoD)
- Conexión y stream a 1 Hz durante 30 min en 3 equipos FTMS + 2 bandas HR.
- Reconexión <5 s validada.
- Export JSON exitoso al backend.
- Cero crasheos/ANR; permisos correctos; sin logs verbosos en release.

## Qué NO hacer
- No usar Web Bluetooth.
- No duplicar suscripciones.
- No mezclar con mapas u otros módulos.
- No pedir permisos innecesarios.

## Endpoints
- POST `/api/sessions` (ver ejemplo en código principal)

---

Para detalles de flags/characteristics específicos, solicitar hexdump de notificaciones reales.
