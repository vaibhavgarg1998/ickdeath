# HDFC SmartGateway setup (ICK DEATH)

Checkout uses [HDFC SmartGateway Hypercheckout](https://docs.hdfcbank.juspay.in/docs/hypercheckout-mobile-sdk) on the web. The customer leaves the site for HDFC’s payment page, then comes back. The server marks an order paid only after the Order Status API returns `CHARGED` for the same amount.

This needs a **server** (API routes). It will not work on pure GitHub Pages static hosting.

## Recommended hosting

Use **Vercel** (or similar) so `/api/hdfc/*` works.

- Local: `npm run dev`
- Production: deploy without `GITHUB_PAGES=true`
- GitHub Pages static export still builds the marketing site, but payment APIs are stripped in that build

## 1. SmartGateway credentials

The basic-auth kit’s `config.json` maps like this:

| config.json | env |
| --- | --- |
| `MERCHANT_ID` | `HDFC_MERCHANT_ID` |
| `PAYMENT_PAGE_CLIENT_ID` | `HDFC_PAYMENT_PAGE_CLIENT_ID` |
| `API_KEY` | `HDFC_API_KEY` |
| `BASE_URL` | `HDFC_BASE_URL` |
| `RESPONSE_KEY` | `HDFC_RESPONSE_KEY` |
| `ENABLE_LOGGING` | `HDFC_ENABLE_LOGGING` |

Leave the JWE fields empty unless you have real PEM files. Placeholder keys are ignored so the API key is used.

```bash
HDFC_ENV=sandbox
HDFC_MERCHANT_ID=
HDFC_PAYMENT_PAGE_CLIENT_ID=
HDFC_API_KEY=
HDFC_BASE_URL=https://smartgateway.hdfcuat.bank.in
HDFC_RESPONSE_KEY=
HDFC_ENABLE_LOGGING=false
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`NEXT_PUBLIC_SITE_URL` must be the public origin HDFC can redirect to. For local card testing, expose the app with a tunnel and set that HTTPS URL.

Sandbox base URL: `https://smartgateway.hdfcuat.bank.in`  
Production base URL: `https://smartgateway.hdfc.bank.in`

## 2. Webhook (optional)

Checkout does not need this. The return URL already confirms the payment.

If you later enable webhooks in the dashboard (Payments → Settings → Webhooks), set `HDFC_WEBHOOK_USERNAME` and `HDFC_WEBHOOK_PASSWORD` to the same username and password, and point the URL at `https://YOUR_DOMAIN/api/hdfc/webhook`.

## 3. Firebase Admin

Paid and failed updates are written with the Admin SDK. See `docs/firebase-setup.md`.

Republish `firestore.rules` so new guest orders can be created with `paymentMethod == 'hdfc'`.

## 4. Checkout flow

1. Customer completes quantity → contact → address → summary → payment
2. The app saves a pending Firestore order (`ICK-YYYYMMDD-NNNN`)
3. `/api/hdfc/session` creates a SmartGateway session for the server-side total
4. The browser opens HDFC’s payment page (UPI, cards, netbanking)
5. HDFC POSTs to `/api/hdfc/return` on the registered site URL (`NEXT_PUBLIC_SITE_URL`)
6. The server calls the Order Status API and stores status, order id, amount, and transaction id. `CHARGED` marks the order **paid** only when those values match the pending order. A repeat transaction id does not create a second receipt.
7. The customer lands on `/checkout/response/`, which shows success or failure, the amount, and the transaction id. `/checkout/success/` uses the same page and will not show a receipt unless the stored response is paid.

Customer-facing order IDs keep their hyphens. SmartGateway gets a separate alphanumeric id (stored as `hdfcOrderId`).

## 5. Sandbox amounts

On the dummy gateway, amount rules from HDFC’s test page apply: under ₹500 tends to succeed, ₹500–₹699 fails, ₹700 and above can stay pending. See the [test resources](https://docs.hdfcbank.juspay.in/hypercheckout-mobile-sdk/web/resources/test-resources).

## 6. Go live

Set `HDFC_ENV=production` and `HDFC_BASE_URL=https://smartgateway.hdfc.bank.in`, then replace the sandbox merchant id, client id, and keys. `live` is treated as production. A production setting rejects the UAT host. `NEXT_PUBLIC_SITE_URL` must be `https://ickdeath.com` so HDFC returns to the registered URL.
