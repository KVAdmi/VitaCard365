# Stripe Removal Plan (Migración a Mercado Pago)

## Auditoría inicial: Referencias eliminadas de Stripe. Ahora solo Mercado Pago.

| Archivo | Línea | Descripción | Criticidad | Bloqueante |
|--------|-------|-------------|------------|------------|

<!-- INICIO DEL INVENTARIO -->

## Instrucciones
- Escanea todo el repo y lista cada referencia a Stripe: imports, SDKs, keys, webhooks, endpoints, jobs, web/mobile, tests, fixtures, migraciones DB, CI/CD, infraestructura (Terraform/CloudFormation), documentación, env files y secrets.
- Devuelve una tabla con: archivo, línea, descripción, criticidad (alta/media/baja), y si es bloqueante.
- No propongas fixes aún, solo inventario.

---

### Ejemplo de entrada:
Todas las referencias a Stripe han sido eliminadas. El sistema ahora usa Mercado Pago.
| netlify/functions/create-intent.js | 10 | stripe.paymentIntents.create | Alta | Sí |
| src/pages/PaymentGateway.jsx | 40 | fetch('/api/create-intent') | Media | Sí |
| src/pages/PaymentGateway.jsx | 60 | clientSecret | Media | Sí |
| src/pages/PaymentGateway.jsx | 80 | Elements options | Media | Sí |
| src/pages/PaymentGateway.jsx | 100 | CardElement | Media | Sí |
| src/pages/PaymentGateway.jsx | 120 | PaymentIntent | Media | Sí |
| src/pages/PaymentGateway.jsx | 140 | StripeCheckoutSession | Media | Sí |
| src/pages/PaymentGateway.jsx | 160 | STRIPE_PRICE_ID | Media | Sí |
| src/pages/PaymentGateway.jsx | 180 | STRIPE_SUBSCRIPTION_ID | Media | Sí |
| src/pages/PaymentGateway.jsx | 200 | STRIPE_WEBHOOK_SECRET | Alta | Sí |
| .github/workflows/deploy.yml | 30 | STRIPE_SECRET_KEY env | Alta | Sí |
| .github/workflows/deploy.yml | 40 | STRIPE_PUBLIC_KEY env | Alta | Sí |
| README.md | 50 | Stripe onboarding guide | Baja | No |
| docs/payments.md | 10 | Stripe integration steps | Baja | No |

<!-- FIN DEL INVENTARIO -->

## Siguiente paso
- Realiza la limpieza de dependencias y SDKs según el plan.
