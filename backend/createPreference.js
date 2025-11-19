const preference = {
  back_urls: {
    success: process.env.NODE_ENV === 'production'
      ? 'https://vitacard365.com/payment-gateway?from=mp'
      : 'http://localhost:5173/payment-gateway?from=mp',
    failure: process.env.NODE_ENV === 'production'
      ? 'https://vitacard365.com/payment/failure'
      : 'http://localhost:5173/payment/failure',
    pending: process.env.NODE_ENV === 'production'
      ? 'https://vitacard365.com/payment/pending'
      : 'http://localhost:5173/payment/pending',
  },
};