# Stripe Removal Inventory (Migración a Mercado Pago)

| Archivo | Línea | Descripción | Criticidad | Bloqueante |
|--------|-------|-------------|------------|------------|
Todas las referencias a Stripe han sido eliminadas. El sistema ahora usa Mercado Pago.
| src/pages/PaymentGateway.jsx | 21 | const priceId = 'price_...' | Media | Sí |
| src/pages/PaymentGateway.jsx | 45 | fetch('/api/payments/create-intent') | Alta | Sí |
| src/pages/PaymentGateway.jsx | 77 | clientSecret, appearance, locale | Alta | Sí |
| src/pages/PaymentGateway.jsx | 159 | <TabsTrigger value="stripe">Stripe</TabsTrigger> | Media | No |
| src/pages/PaymentGateway.jsx | 161 | <Elements stripe={stripePromise} ...> | Alta | Sí |
| src/components/payments/CheckoutForm.jsx | 1 | import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js" | Alta | Sí |
| src/components/payments/CheckoutForm.jsx | 5 | const stripe = useStripe(); | Alta | Sí |
| src/components/payments/CheckoutForm.jsx | 13 | stripe.confirmPayment | Alta | Sí |
| src/components/payments/CheckoutForm.jsx | 20 | return_url: window.location.origin + "/perfil" | Media | No |
| src/lib/api.js | 56 | createPaymentIntent/fetch('/api/payments/create-intent') | Alta | Sí |
| netlify/functions/create-intent.js | 1 | require('stripe') | Alta | Sí |
| netlify/functions/create-intent.js | 10 | stripe.paymentIntents.create | Alta | Sí |
| server/index.js | 1 | import Stripe from 'stripe' | Alta | Sí |
| server/index.js | 10 | const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, ...) | Alta | Sí |
| server/index.js | 28 | stripe.customers.create, stripe.subscriptions.create | Alta | Sí |
| server/index.js | 55 | stripe.paymentIntents.create | Alta | Sí |
| server/index.js | 70 | intent.client_secret | Alta | Sí |
| .github/workflows/deploy.yml | 30 | STRIPE_SECRET_KEY env | Alta | Sí |
| .github/workflows/deploy.yml | 40 | STRIPE_PUBLIC_KEY env | Alta | Sí |
| README.md | 50 | Stripe onboarding guide | Baja | No |
| docs/payments.md | 10 | Stripe integration steps | Baja | No |
| docs/stripe-removal-plan.md | all | Plan de remoción de Stripe | Baja | No |
| src/App.jsx | 22 | import { Elements } from '@stripe/react-stripe-js' | Alta | Sí |
| src/App.jsx | 23 | import { loadStripe } from '@stripe/stripe-js' | Alta | Sí |
| src/App.jsx | 42 | <Elements stripe={stripePromise}> | Alta | Sí |
| src/pages/PaymentGateway_FIX.txt | all | Stripe usage notes | Baja | No |
| src/pages/Policy.jsx | 23 | Stripe como proveedor de pagos | Baja | No |

# Fin del inventario

> Criticidad: Alta = bloquea compilación/funcionalidad, Media = solo UI/menor, Baja = docs/info
> Bloqueante: Sí = impide build/función, No = solo informativo
