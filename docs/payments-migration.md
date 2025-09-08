# Payments Migration

## Estado actual
- Stripe removido completamente del proyecto.
- Variables de entorno, endpoints, SDKs y lógica de Stripe eliminados.
- No hay referencias activas que interfieran con Mercado Pago.

## Próximos pasos
- Configurar claves y endpoints de Mercado Pago en `.env.local` y backend.
- Implementar SDK y flujos de Mercado Pago.
- Actualizar UI y lógica de pagos.

## Checklist
- [x] Stripe removido (código, dependencias, env, endpoints)
- [x] Banner temporal en UI de pagos
- [x] Endpoints devuelven stub seguro
- [x] Listo para configuración de Mercado Pago

## Riesgos
- Ningún flujo de Stripe queda activo.
- No hay colisiones de variables ni endpoints.

## Nota
Puedes agregar aquí las claves y configuración de Mercado Pago cuando lo requieras.
