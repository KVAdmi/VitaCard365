# Diagnóstico de Problemas - Integración Mercado Pago

## Problemas Identificados

### 1. **Múltiples Botones de Pago**
**Archivo:** `src/components/payments/MPWallet.jsx`
**Problema:** La variable global `mpInitialized` no se resetea correctamente, causando que se creen múltiples instancias del botón.
**Líneas:** 4, 10, 52

### 2. **Errores "Precio Inválido" y "no_preference_provided"**
**Archivos:** 
- `src/pages/PaymentGateway.jsx` (línea 48)
- `server-mp.js` (línea 69)
- `src/lib/api.js` (línea 6)

**Problemas:**
- Discrepancia en nombres de parámetros entre frontend y backend
- Frontend envía `amount`, backend espera `unit_price`
- Validación de monto inconsistente

### 3. **Monto Estático (199)**
**Archivo:** `server/api/payments/mercadopago/create-preference.js`
**Problema:** Valor por defecto hardcodeado en línea 9: `amount=199`

### 4. **Configuración Incorrecta del Brick Wallet**
**Archivo:** `src/components/payments/MPWallet.jsx`
**Problema:** El brick se inicializa sin `preferenceId`, causando errores en la renderización.

### 5. **Inconsistencia en Rutas de API**
**Problema:** Múltiples archivos de servidor con diferentes configuraciones:
- `server-mp.js` (principal)
- `server/api/payments/mercadopago/create-preference.js` (no utilizado)

## Errores de Consola Explicados

```
[API] Error creando preferencia: Error: Precio inválido
```
- Causado por la discrepancia de parámetros entre frontend y backend

```
[Gateway] preference error: Error: Precio inválido
```
- Resultado de la validación fallida en `api.js`

```
MP Error: {type: 'non_critical', cause: 'no_preference_provided'}
```
- El brick wallet se inicializa sin un `preferenceId` válido

## Flujo Actual Problemático

1. Usuario hace clic en botón MP
2. `onGenerate()` llama a `createPreference()` con `amount`
3. Backend recibe `amount` pero busca `unit_price`
4. Falla la validación, retorna error
5. MPWallet intenta crear brick sin preferenceId
6. Se genera error y se crea otro botón
7. Ciclo se repite infinitamente

## Soluciones Propuestas

1. **Corregir parámetros de API** - Unificar nombres entre frontend y backend
2. **Arreglar MPWallet** - Implementar manejo correcto de estado y cleanup
3. **Eliminar valores hardcodeados** - Usar valores dinámicos del frontend
4. **Simplificar arquitectura** - Usar un solo servidor de MP
5. **Mejorar manejo de errores** - Implementar retry logic y mejor UX
