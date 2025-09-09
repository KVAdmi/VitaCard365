require('dotenv').config({ path: '.env.local' });

console.log('Environment check:');
console.log('MP_ACCESS_TOKEN:', process.env.MP_ACCESS_TOKEN ? 'PRESENT' : 'MISSING');
console.log('All env vars:', Object.keys(process.env).filter(k => k.includes('MP')));

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: [/^http:\/\/localhost:\d+$/], methods: ['GET','POST'], allowedHeaders: ['Content-Type'] }));
app.use(express.json());

app.get('/test', (req, res) => {
  res.json({ 
    message: 'Server working', 
    hasToken: !!process.env.MP_ACCESS_TOKEN,
    token: process.env.MP_ACCESS_TOKEN ? 'Present' : 'Missing'
  });
});

app.listen(3000, () => {
  console.log('🚀 Test server running on port 3000');
  console.log('🔑 MP token present:', !!process.env.MP_ACCESS_TOKEN);
});
