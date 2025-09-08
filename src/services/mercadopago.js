// Frontend: llama a nuestro backend para crear/preparar suscripción
export async function mpStartSubscription(planId){ 
  const r = await fetch('/api/mp/subscriptions', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ planId }) })
  if(!r.ok) throw new Error('MP start failed')
  return r.json() // { subscriptionId, init_point | brickParams }
}
