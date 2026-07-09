# Snapy Mini — one photo, one AI-written post

> **Interface language:** the app's UI (buttons, forms, chat, error messages) and the AI-generated product descriptions are in **French**, matching the target market (Senegal). This README stays in English for development purposes.

A minimal standalone demo of a multivendor marketplace: post a product with
just a **photo** and a **name**, and Claude (vision) writes a punchy,
Twitter-style description straight from the picture. Newest listings show up
in the grid below.

## What it uses

- Node.js + Express backend (single `server.js`, no build step)
- Plain HTML/CSS/JS frontend (`/public`) — dark, minimalist, ticket-stub styled cards
- `@anthropic-ai/sdk` calling **Claude Sonnet 5** with vision to generate the description
- `bcryptjs` for hashing seller PINs (pure JS — no native build step, Windows-friendly)
- Sellers, products, chats, and image files stored locally (`data/sellers.json`, `data/products.json`, `data/chats.json`, `/uploads`) — no database needed for this demo

## 1. Install dependencies

```bash
npm install
```

## 2. Add your Anthropic API key

Copy the example env file and paste in your key (get one at
https://console.anthropic.com/settings/keys):

```bash
cp .env.example .env
```

Then edit `.env`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

## 3. Run it

```bash
npm start
```

Open **http://localhost:3000**.

## How it works

1. **Sellers register or log in** with just a phone number and a 4–6 digit
   PIN (top-right "Sign in to sell"). The PIN is hashed with bcrypt before
   being stored — there's no plaintext password anywhere.
2. Once signed in, the composer unlocks: pick or take a product photo and
   type a product name. Contact info is no longer typed per-listing — it's
   pulled automatically from your seller account.
3. On submit, the backend sends the image (base64) + name to Claude Sonnet 5
   with a prompt asking for a short, punchy Twitter-style post (under ~220
   characters, plain text, up to 2 hashtags).
4. The generated description, photo, product name, and your seller identity
   are saved and the grid refreshes with the newest listing first.
5. Every card has a **💬 Chat with seller** button (in-app thread, polling
   every 2.5s) and a **🟢 WhatsApp** button that opens a pre-filled wa.me
   link straight to the seller's registered phone number.

## Notes for testing

- **Seller accounts are phone + PIN only** — no email, no OTP, no real SMS
  verification (this is a demo). Sessions are simple bearer tokens kept
  in-memory on the server and in `localStorage` on the client; restarting
  the server invalidates all sessions and sellers just log in again.
- **Buyers stay anonymous** — no account needed to browse, chat, or message
  a seller on WhatsApp. Each browser gets a lightweight `Buyer-XXXX` tag
  (localStorage) used only to tell "your" chat bubbles apart from the
  seller's.
- **Chat is a single thread per product** (a demo simplification, not
  per-buyer/seller pairs), stored in `data/chats.json`. To see both sides of
  a conversation, open the same product as the logged-in seller in one
  browser/profile and as a signed-out buyer in another.
- **Take a photo instead** opens a live camera (front/back switch) via
  `getUserMedia`; if the browser/device doesn't support it, it falls back to
  the device's native camera app.
- The WhatsApp button strips non-digits from the seller's registered phone
  and opens `wa.me/<number>?text=...` — register with the full number
  including country code (e.g. `+221771234567`).
- Delete `data/sellers.json`, `data/products.json`, and/or `data/chats.json`
  to reset the demo. Images live under `/uploads`.
- Max upload size is 8MB; only image files are accepted.
- If `ANTHROPIC_API_KEY` is missing or a request fails, the app still posts
  the product with a generic fallback caption instead of crashing.

## Project structure

```
snapy-mini/
├── server.js              Express API (seller auth + upload + Claude call + products + chat)
├── package.json
├── .env.example
├── data/
│   ├── sellers.json       Registered sellers (phone + bcrypt PIN hash)
│   ├── products.json      Local product "database"
│   └── chats.json         Local per-product chat threads
├── uploads/                Saved product photos
└── public/
    ├── index.html
    ├── style.css
    └── app.js
```
