import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env

// ----- CONFIG -----
const PORT = process.env.PORT || 3000;
const CONSUMER_KEY = process.env.CONSUMER_KEY;
const CONSUMER_SECRET = process.env.CONSUMER_SECRET;
const SHORTCODE = process.env.SHORTCODE; // Your individual till number
const PASSKEY = process.env.PASSKEY;
const ENVIRONMENT = process.env.ENVIRONMENT || 'sandbox'; // 'sandbox' or 'production'

// ----- EXPRESS APP -----
const app = express();
app.use(express.json());

// ----- GET ACCESS TOKEN -----
async function getToken() {
  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  const url = ENVIRONMENT === 'production'
    ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
    : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

  const res = await axios.get(url, { headers: { Authorization: `Basic ${auth}` } });
  return res.data.access_token;
}

// ----- STK PUSH ENDPOINT -----
app.post('/stk', async (req, res) => {
  try {
    const { phone, amount, accountReference, transactionDesc, tillNumber } = req.body;
    if (!phone || !amount || !tillNumber) {
      return res.status(400).json({ error: 'phone, amount, and tillNumber are required' });
    }

    const token = await getToken();

    // Timestamp format YYYYMMDDHHMMSS
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);

    // Use SHORTCODE + PASSKEY + TIMESTAMP to create password (base64)
    const password = Buffer.from(`${tillNumber}${PASSKEY}${timestamp}`).toString('base64');

    const url = ENVIRONMENT === 'production'
      ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
      : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

    const body = {
      BusinessShortCode: tillNumber,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone,
      PartyB: tillNumber,
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

// ----- CALLBACK ENDPOINT -----
app.post('/callback', (req, res) => {
  console.log('MPESA CALLBACK:', JSON.stringify(req.body, null, 2));
  // TODO: store callback to DB or verify transaction if needed
  res.status(200).send('OK');
});

// ----- SIMPLE STATUS -----
app.get('/', (req, res) => res.send({ ok: true, env: ENVIRONMENT }));

// ----- START SERVER -----
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
