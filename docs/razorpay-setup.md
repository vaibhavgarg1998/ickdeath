# Razorpay payment setup (ICK DEATH)

Razorpay needs a **server** (API routes). It will not work on pure GitHub Pages static hosting.

## Recommended hosting

Use **Vercel** (or similar) for the Next.js app so `/api/razorpay/*` works.

- Local: `npm run dev` (API routes enabled)
- Production: deploy without `GITHUB_PAGES=true`
- GitHub Pages static export still builds marketing/checkout UI, but online payment APIs are stripped in CI

## 1. Razorpay Dashboard

1. Create an account at [razorpay.com](https://razorpay.com)
2. Settings → API Keys → generate **Test** keys first
3. Put in `.env.local`:

```bash
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=your_secret
```

## 2. Firebase Admin (mark orders paid)

After payment verify, the server updates Firestore with Admin SDK.

1. Firebase Console → Project settings → Service accounts → Generate new private key
2. Add to `.env.local`:

```bash
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-...@....iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Keep the `\n` escapes when pasting into `.env.local`.

## 3. Checkout flow

1. Customer completes quantity → contact → address → summary
2. Chooses **Pay online (Razorpay)**
3. App creates a pending Firestore order
4. `/api/razorpay/create-order` creates a Razorpay order (amount from server)
5. Razorpay Checkout modal (UPI / card / netbanking)
6. `/api/razorpay/verify` checks signature → marks order **paid**
7. Server sends WhatsApp **order confirmed** (if Cloud API is configured — see `docs/whatsapp-setup.md`)
8. Customer lands on `/checkout/success/`

## 4. Vercel env vars

Add the same keys in Vercel → Project → Settings → Environment Variables (including `FIREBASE_ADMIN_PRIVATE_KEY`).

## 5. Go live

Switch from `rzp_test_` to live keys in Razorpay and update env vars. Complete Razorpay KYC / activation for live settlements.
