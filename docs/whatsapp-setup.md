# WhatsApp Business Cloud API (ICK DEATH)

Order updates go out as **utility templates** after Razorpay payment and when an admin changes fulfillment status. Customers can also message the business number to look up an order.

This needs a **Node server** (same as Razorpay). GitHub Pages static export cannot send WhatsApp.

## 1. Meta setup

1. Create a [Meta developer app](https://developers.facebook.com/apps) → add **WhatsApp**
2. Complete WhatsApp Business Account (WABA) onboarding
3. WhatsApp → API Setup → copy:
   - **Temporary / permanent access token** → `WHATSAPP_TOKEN`
   - **Phone number ID** → `WHATSAPP_PHONE_NUMBER_ID`
4. App settings → Basic → **App secret** → `WHATSAPP_APP_SECRET`
5. Choose any verify string → `WHATSAPP_VERIFY_TOKEN` (you invent this)
6. Create a **system user** token in Business Manager for production (temporary tokens expire in 24h)

Add to `.env.local` and Vercel → Environment Variables:

```bash
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_APP_SECRET=
WHATSAPP_VERIFY_TOKEN=ickdeath-verify-change-me
NEXT_PUBLIC_SITE_URL=https://ickdeath.com
NEXT_PUBLIC_WHATSAPP_NUMBER=91XXXXXXXXXX
```

`NEXT_PUBLIC_WHATSAPP_NUMBER` is still the click-to-chat number on the success page. Cloud API sending uses `WHATSAPP_PHONE_NUMBER_ID`.

## 2. Webhook

In Meta → WhatsApp → Configuration → Webhook:

- Callback URL: `https://YOUR_DOMAIN/api/whatsapp/webhook`
- Verify token: same value as `WHATSAPP_VERIFY_TOKEN`
- Subscribe to **messages**

The route verifies `hub.challenge` on GET and checks `X-Hub-Signature-256` on POST when `WHATSAPP_APP_SECRET` is set.

## 3. Message templates (required)

Create these as **Utility** templates in WhatsApp Manager (English `en`). Names must match the env vars (defaults below). Body variables are positional `{{1}}`, `{{2}}`, …

| Event | Template name | Body |
|---|---|---|
| Payment captured | `ickdeath_order_confirmed` | `Hi {{1}}! Your ICK DEATH order {{2}} is confirmed. {{3}} — {{4}}. We'll notify you when it ships.` |
| Admin → packed | `ickdeath_order_packed` | `Hi {{1}}, your order {{2}} is packed and ready to ship.` |
| Admin → shipped | `ickdeath_order_shipped` | `Hi {{1}}, your order {{2}} is on the way! Track it here: {{3}}` |
| Admin → delivered | `ickdeath_order_delivered` | `Hi {{1}}, your ICK DEATH order {{2}} has been delivered. Hope you love Seat Safe Tabs. Reply here if you need help.` |
| Admin → cancelled | `ickdeath_order_cancelled` | `Hi {{1}}, your order {{2}} has been cancelled. If this is unexpected, reply here and we'll help.` |

Parameter mapping:

- `{{1}}` customer first name
- `{{2}}` order ID (`ICK-YYYYMMDD-1234`)
- confirmed `{{3}}` e.g. `2x Seat Safe Tabs`
- confirmed `{{4}}` amount e.g. `Rs 598`
- shipped `{{3}}` track URL (`https://ickdeath.com/track/?order=…`)

Wait for Meta to mark them **Approved** before live orders. Until then, checkout still succeeds; WhatsApp send is best-effort and the error is stored on the order.

Optional env overrides: `WHATSAPP_TEMPLATE_CONFIRMED`, `_PACKED`, `_SHIPPED`, `_DELIVERED`, `_CANCELLED`, `WHATSAPP_TEMPLATE_LANG`.

## 4. What the app sends

1. **Checkout** — `/api/razorpay/verify` succeeds → `ickdeath_order_confirmed`
2. **Admin** (`/admin/`) — order status change → matching template (once per event; **Resend WhatsApp update** forces another send)
3. **Inbound** — customer texts the business number:
   - Looks up orders for that WhatsApp number
   - Or an `ICK-…` order ID / 10-digit mobile in the message
   - Replies with status + `/track/` link
   - “Help” / “Talk to us” stops auto-replies so a person can take over

Delivery receipts (`sent` / `delivered` / `read` / `failed`) are written to `orders/{id}.whatsapp`.

## 5. Local test

1. Fill Cloud API env vars (use Meta’s test number first)
2. `npm run dev`
3. Expose the webhook (ngrok / Cloudflare tunnel) and paste `https://<tunnel>/api/whatsapp/webhook` in Meta
4. Send the default `hello_world` template from Meta’s API tester to confirm the token works
5. Place a test Razorpay order — customer should get `ickdeath_order_confirmed` after payment
6. In `/admin/`, change status to packed/shipped and confirm the matching template

Checkout never fails if WhatsApp is down or unconfigured.

## 6. Cost

Utility templates to India numbers are billed by Meta per delivered message (around ₹0.12). Session replies inside 24h of a customer message are typically cheaper / free until Meta’s service-message changeover. See current [WhatsApp pricing](https://developers.facebook.com/docs/whatsapp/pricing).
