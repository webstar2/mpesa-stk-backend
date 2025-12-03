import express from 'express';
async function getToken() {
const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
const url = ENVIRONMENT === 'production'
? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
: 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';


const res = await axios.get(url, { headers: { Authorization: `Basic ${auth}` } });
return res.data.access_token;
}


// STK Push endpoint
app.post('/stk', async (req, res) => {
try {
const { phone, amount, accountReference, transactionDesc } = req.body;
if (!phone || !amount) return res.status(400).json({ error: 'phone and amount are required' });


const token = await getToken();


// timestamp format YYYYMMDDHHMMSS
const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);


// Use SHORTCODE + PASSKEY + TIMESTAMP to create password (base64)
const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');


const url = ENVIRONMENT === 'production'
? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
: 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';


const body = {
BusinessShortCode: SHORTCODE,
Password: password,
Timestamp: timestamp,
TransactionType: 'CustomerPayBillOnline',
Amount: amount,
PartyA: phone,
PartyB: SHORTCODE,
PhoneNumber: phone,
CallBackURL: `${process.env.CALLBACK_URL || ''}/callback`,
AccountReference: accountReference || 'ACCOUNT_REF',
TransactionDesc: transactionDesc || 'Payment'
};


const response = await axios.post(url, body, { headers: { Authorization: `Bearer ${token}` } });
return res.json(response.data);
} catch (err) {
console.error('STK error', err.response?.data || err.message);
return res.status(500).json({ error: err.response?.data || err.message });
}
});


// Callback endpoint (Safaricom will POST here) — save/verify as needed
app.post('/callback', (req, res) => {
console.log('MPESA CALLBACK:', JSON.stringify(req.body, null, 2));
// TODO: store callback to DB or verify transaction if needed
res.status(200).send('OK');
});


// Simple statusmpesa-stk-backend
app.get('/', (req, res) => res.send({ ok: true, env: ENVIRONMENT }));


app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
