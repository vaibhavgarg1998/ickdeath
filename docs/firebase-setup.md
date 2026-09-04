# Firebase + Admin setup (ICK DEATH)

## 1. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a project (e.g. `ickdeath`)
3. Enable **Authentication → Email/Password**
4. Create **one** admin user under Authentication → Users (do not enable public registration)
5. Create a **Firestore** database (production mode)
6. Paste the rules from `firestore.rules` into Firestore → Rules → Publish

## 2. Web app config

Project settings → Your apps → Web app → copy config into `.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Optional:

```bash
NEXT_PUBLIC_WHATSAPP_NUMBER=9198XXXXXXXX
NEXT_PUBLIC_ORDERS_WEBHOOK_URL=
```

## 3. Use it

- Customers: **Buy Now** → `/checkout/` → order is written to Firestore `orders/{orderId}`
- Admin: open `/admin/` → sign in → list orders → change **Order status** / **Payment status**

## 4. Notes

- Firebase client SDK works with static GitHub Pages **and** Vercel.
- Razorpay payment APIs need a Node server — see `docs/razorpay-setup.md` (use Vercel for production payments).
- Anyone with a Firebase Auth account that can sign in can manage orders — only create trusted admin users.
