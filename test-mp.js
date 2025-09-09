// Test script para MercadoPago endpoint
const url = 'http://localhost:3000/api/mercadopago/preference';
const data = {
    title: 'Vita Mensual',
    unit_price: 199,
    currency_id: 'MXN'
};

fetch(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
})
.then(response => {
    console.log('Status:', response.status);
    return response.json();
})
.then(data => {
    console.log('Response:', JSON.stringify(data, null, 2));
})
.catch(error => {
    console.error('Error:', error);
});

// También test health
fetch('http://localhost:3000/api/mercadopago/health')
.then(response => response.json())
.then(data => {
    console.log('Health:', JSON.stringify(data, null, 2));
})
.catch(error => {
    console.error('Health Error:', error);
});
