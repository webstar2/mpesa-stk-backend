# M-Pesa STK Push (Render-ready)


This repo provides a minimal Node.js (Express) server you can deploy to Render to perform Lipa Na M-Pesa STK Push requests.


## Features
- Get OAuth token from Daraja
- Send STK push to any phone number
- Receive callbacks from Safaricom
- Works with Sandbox & Production (switch via ENV)


## Files
- `index.js` - main server
- `package.json` - dependencies
- `.env.example` - environment variables


## Deploying to Render
1. Create a GitHub repo and push these files.
2. In Render dashboard create a **Web Service** → connect your repo.
3. Set Environment variables (in Render > Environment):
- CONSUMER_KEY
- CONSUMER_SECRET
- PASSKEY
- SHORTCODE
- CALLBACK_URL (your render app url)
- ENVIRONMENT (sandbox or production)
4. Deploy.


### Example frontend call
```html
fetch('https://yourapp.onrender.com/stk', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ phone: '2547XXXXXXXX', amount: 50 })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
