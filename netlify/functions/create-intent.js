
// Solo Mercado Pago
exports.handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Pasarela de pago en migración. Mercado Pago próximamente.' }),
  };
};
