# Vastraa upgraded setup

## What was added
1. One customer account page at `/user/login`: name + mobile first. Existing numbers go to password; new numbers go to account creation on the same page.
2. Phone/WhatsApp number is stored with the customer.
3. Protected admin login at `/admin/login` and dashboard at `/admin/dashboard`.
4. Admin can see customer, phone, items, order amount, order status, send a bill and send a custom status message.
5. Optional WhatsApp Cloud API integration for order bills/status updates.
6. AI shopping assistant at `/ai/chat`. It uses the live MongoDB product catalog. Without an AI key, basic product/price queries still work; with `OPENAI_API_KEY`, natural-language answers are enabled.
7. Navbar now includes AI Chat and Account.

## Setup
- Keep your existing `.env` file private. This project includes `.env.example` only.
- Copy the new files over the old project.
- Run `npm install` (no new npm package is required for these features).
- Add the variables from `.env.example` to your existing `.env`.
- Restart with `npm start`.

## Admin
Open `/admin/login` and use `ADMIN_USERNAME` / `ADMIN_PASSWORD`.

## WhatsApp
WhatsApp messages require a Meta WhatsApp Cloud API setup, an access token, a phone number ID, and the correct business messaging permissions/templates where required. Put those values in `.env`. The code will skip WhatsApp gracefully when they are not configured.

## AI
Set `OPENAI_API_KEY` and optionally `OPENAI_MODEL`. The AI endpoint uses OpenAI's Responses API and sends only the current store catalog plus the customer's question. Never put the API key in frontend JavaScript.

## Important security improvements before production
- Move existing plaintext passwords to hashed passwords (bcrypt/argon2).
- Use a real production session store instead of the default MemoryStore.
- Use HTTPS.
- Keep `.env` out of Git/ZIP sharing.
- Add CSRF protection, rate limiting and stronger admin authentication.
