# HDFC SmartGateway setup (ICK DEATH)

Checkout uses [HDFC SmartGateway Hypercheckout](https://docs.hdfcbank.juspay.in/docs/hypercheckout-mobile-sdk) on the web. The customer leaves the site for HDFC’s payment page, then comes back. The server marks an order paid only after the Order Status API returns `CHARGED` for the same amount.

This needs a **server** (API routes). It will not work on pure GitHub Pages static hosting.

## Recommended hosting

Use **Vercel** (or similar) so `/api/hdfc/*` works.

- Local: `npm run dev`
- Production: deploy without `GITHUB_PAGES=true`
- GitHub Pages static export still builds the marketing site, but payment APIs are stripped in that build

## 1. SmartGateway credentials

From the HDFC SmartGateway dashboard (sandbox first):

1. Merchant ID
2. Payment page client ID
3. JWE keys: key UUID, HDFC’s public key, and your private key  
   If the dashboard gave you an API key instead, use `HDFC_API_KEY` and leave the JWE fields empty. JWE is used when both are set.

Put them in `.env.local`:

```bash
HDFC_ENV=sandbox
HDFC_MERCHANT_ID=
HDFC_PAYMENT_PAGE_CLIENT_ID=
HDFC_KEY_UUID=
HDFC_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----\n"
HDFC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
HDFC_API_KEY=
HDFC_WEBHOOK_USERNAME=
HDFC_WEBHOOK_PASSWORD=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Keep the `\n` escapes when pasting PEM keys into one line.

`NEXT_PUBLIC_SITE_URL` must be the public origin HDFC can redirect to. For local card testing, expose the app with a tunnel and set that HTTPS URL.

Sandbox base URL: `https://smartgateway.hdfcuat.bank.in`  
Production base URL: `https://smartgateway.hdfc.bank.in`

## 2. Webhook

In the dashboard: Payments → Settings → Webhooks.

- URL: `https://YOUR_DOMAIN/api/hdfc/webhook`
- Username and password: the same values as `HDFC_WEBHOOK_USERNAME` and `HDFC_WEBHOOK_PASSWORD`
- Enable order success and failure events

The handler checks Basic auth, then calls Order Status again before changing the order. Return-URL handling does the same, so a missed webhook still confirms the payment when the customer comes back.

## 3. Firebase Admin

Paid and failed updates are written with the Admin SDK. See `docs/firebase-setup.md`.

Republish `firestore.rules` so new guest orders can be created with `paymentMethod == 'hdfc'`.

## 4. Checkout flow

1. Customer completes quantity → contact → address → summary → payment
2. The app saves a pending Firestore order (`ICK-YYYYMMDD-NNNN`)
3. `/api/hdfc/session` creates a SmartGateway session for the server-side total
4. The browser opens HDFC’s payment page (UPI, cards, netbanking)
5. HDFC POSTs to `/api/hdfc/return`
6. The server checks order id and amount. `CHARGED` marks the order **paid** and sends the WhatsApp confirmation
7. The customer lands on `/checkout/success/`

Customer-facing order IDs keep their hyphens. SmartGateway gets a separate alphanumeric id (stored as `hdfcOrderId`).

## 5. Sandbox amounts

On the dummy gateway, amount rules from HDFC’s test page apply: under ₹500 tends to succeed, ₹500–₹699 fails, ₹700 and above can stay pending. See the [test resources](https://docs.hdfcbank.juspay.in/hypercheckout-mobile-sdk/web/resources/test-resources).

## 6. Go live

Set `HDFC_ENV=production` and replace the sandbox merchant id, client id, and keys. Complete HDFC activation before taking live payments.
