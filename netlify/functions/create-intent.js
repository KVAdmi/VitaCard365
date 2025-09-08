
// Stripe removido. Stub temporal para pagos.
exports.handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ clientSecret: null, message: 'Pasarela de pago en migración. Mercado Pago próximamente.' }),
  };
};
