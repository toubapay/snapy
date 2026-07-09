# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Snapy — a minimal single-vendor-per-seller marketplace. Sellers post a
product with just a photo and a name; Claude's vision API writes a punchy
Twitter-style French product description from the photo.

**The UI (buttons, forms, chat, error messages) and AI-generated descriptions
are in French**, matching the target market (Senegal). Keep new user-facing
strings in French; code/comments/docs stay in English.

**There are two parallel implementations in this repo** — know which one
you're touching:

| | Legacy demo (repo root) | Current stack |
|---|---|---|
| Backend | `server.js` (single file) | `backend/` (Express, modular routes) |
| Frontend | `public/` (static HTML/JS/CSS) | `web/` (React + Vite) + `mobile-rn/` (Expo/React Native) + `mobile-flutter/` (Flutter, scaffold only) |
| Storage | flat JSON files in `data/` | SQLite (`backend/data/snapy.db`) |
| Auth sessions | in-memory `Map`, wiped on restart | JWT, survives restarts |
| Port | 3000 (serves both API + frontend) | API on 4000, web app on 5173, mobile via Expo dev tools / `flutter run` |

The legacy demo still runs (`npm start` from the repo root) and is left
intact as a reference/fallback — it is not wired to the new stack in any way
(separate `uploads/`, separate data). New feature work should go into
`backend/` + `web/` (or `mobile-rn/`/`mobile-flutter/` for mobile-specific
work) unless the user asks specifically about the legacy demo.

`web/`, `mobile-rn/`, and `mobile-flutter/` are independent frontends
against the same `backend/` API — none wraps another. Each ships (or will
ship) its own API client and its own persistence for auth state; a feature
added to one does not exist on the others until ported over by hand.
`mobile-flutter/` is a bare `flutter create` scaffold as of 2026-07-09 — no
screens or API integration yet, just default counter-app boilerplate plus
dependencies (`http`, `shared_preferences`, `image_picker`, `provider`,
`url_launcher`) picked in anticipation of the same features `web/` and
`mobile-rn/` already have. Don't assume it has parity with the other two
frontends until it's actually built out.

## Commands

**Legacy demo** (repo root):
```bash
npm install && npm start     # http://localhost:3000
```

**Current stack** — run in separate terminals (mobile targets only if
you're touching them):
```bash
cd backend && npm install && npm run dev    # API on http://localhost:4000
cd web && npm install && npm run dev        # React app on http://localhost:5173
cd mobile-rn && npm install && npm start    # Expo dev tools (scan QR / press a / press i / press w)
cd mobile-flutter && flutter pub get && flutter run   # scaffold only, no backend wiring yet
```

`backend/` and `web/` need `.env` (copy from `.env.example` in each folder).
`backend/.env` needs `ANTHROPIC_API_KEY` (falls back to a generic caption if
missing/erroring) and `JWT_SECRET` (any random string — generate with
`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
`web/.env` just needs `VITE_API_BASE_URL` pointing at the backend.
`mobile-rn/.env` (optional) needs `EXPO_PUBLIC_API_BASE_URL` if the default
host resolution doesn't reach your backend — see "Architecture — mobile"
below. `mobile-flutter/` has no `.env` yet (nothing to configure until it
actually calls the API).

No test suite or linter is configured in any of the four JS/Dart projects.

## Architecture — legacy demo (`server.js` / `public/`)

**Backend**: everything lives in one file, `server.js` (Express, ESM). No
router modules, no ORM/DB layer.

- **Persistence is flat JSON files** in `data/` (`sellers.json`,
  `products.json`, `chats.json`), read/written in full on every request via
  `readX()`/`writeX()` helpers — no partial updates, no locking. Product
  photos are saved to `/uploads` by multer and served statically.
- **Auth**: sellers register/login with phone + PIN (bcrypt-hashed, no
  email/OTP). Successful auth returns a bearer token stored in an in-memory
  `Map` (`sessions`) — restarting the server invalidates all sessions.
  `requireSeller` middleware resolves `Authorization: Bearer <token>` →
  `req.sellerPhone`. Buyers are always anonymous (no auth), tagged client-side
  only via a `Buyer-XXXX` localStorage id for telling chat bubbles apart.
- **Claude vision call** (`generateTweetDescription`): reads the uploaded
  image as base64, sends it + the product name to `claude-sonnet-5` with a
  French prompt requesting a short (<220 char) plain-text post. Failures are
  caught and swallowed — product creation always succeeds, falling back to a
  generic French caption if Claude errors.
- **Chat is one thread per product**, not per buyer/seller pair (a deliberate
  demo simplification) — stored as `{ [productId]: Message[] }` in
  `chats.json`. A message's `role` (`"seller" | "buyer"`) is derived by
  comparing `senderId` against the product's `sellerPhone`, not stored
  per-session.
- A single Express error-handling middleware at the bottom of `server.js`
  turns multer/image errors into 400s and everything else into a generic 500
  with a French message.

**Frontend**: plain JS in `public/app.js`, no framework, no modules bundler —
loaded directly by `index.html`.

- Seller session (`token`/`phone`) persists in `localStorage` under
  `snapy_seller`; buyer id persists under `snapy_buyer_id`.
- Product grid is fetched on load (`GET /api/products`) and re-rendered after
  a successful post, newest first.
- Chat modal polls `GET /api/chats/:productId` every 2.5s
  (`setInterval`) while open rather than using websockets/SSE.
- Photo capture supports both file picker/drag-drop and a live camera modal
  via `getUserMedia` (front/back switch), falling back to the OS camera app
  if unsupported.
- The WhatsApp button strips non-digits from the seller's registered phone
  and opens a `wa.me/<number>?text=...` deep link — no backend involvement.

## Architecture — current stack (`backend/` / `web/`)

**Backend** (`backend/src/`): Express, ESM, split into `routes/` (sellers,
products, chats), `lib/` (jwt, anthropic, upload, category/phone helpers),
`middleware/requireSeller.js`, and `db.js` (better-sqlite3, schema created on
boot via `CREATE TABLE IF NOT EXISTS`).

- **Auth is JWT**, not sessions: `signSellerToken`/`verifySellerToken` in
  `lib/jwt.js` sign/verify `{ phone }` with `JWT_SECRET`, 30-day expiry.
  `requireSeller` middleware reads `Authorization: Bearer <token>` and sets
  `req.sellerPhone` — no server-side session store, so restarts don't log
  anyone out. "Logout" is a client-side no-op (`POST /api/sellers/logout`
  just returns 204; the client discards its token).
- **Cascading deletes are handled by SQLite**, not application code: `products`
  has `seller_phone REFERENCES sellers(phone) ON DELETE CASCADE`, and
  `chat_messages` has `product_id REFERENCES products(id) ON DELETE CASCADE`
  (`foreign_keys = ON` pragma is set per-connection in `db.js` — required by
  SQLite, easy to forget after touching `db.js`). Deleting a seller therefore
  deletes their products and those products' chat threads automatically;
  route handlers only need to clean up uploaded image files manually
  (`deleteUploadedFile`, since the filesystem isn't part of the DB).
- **Product listing enriches from `sellers` at read time** (`serializeProduct`
  in `routes/products.js` joins on `seller_phone`) rather than trusting a
  stored snapshot — so renaming a boutique (`storeName`) instantly updates
  the label (`vendorId`/`storeName`/`ownerLabel`) on every one of that
  seller's existing listings, with no migration or cascade-update needed.
- **`sort=top`** ranks by chat-message count (a `LEFT JOIN` subquery counting
  `chat_messages` per product) as a proxy for engagement/popularity — there's
  no view-tracking in this app.
- Categories are a fixed in-code list (`CATEGORIES` in `lib/helpers.js`), not
  a DB table — `GET /api/products/categories` returns live per-category
  counts computed from `products`.

**Frontend** (`web/src/`): React + Vite, no router (all view-switching is
local `useState` in `App.jsx` — `view` is one of
`"all" | "top" | "mine" | "categories" | "boutique" | "categoryFiltered"`),
no global state library (props drilled from `App.jsx`).

- `styles.css` is the legacy demo's `public/style.css` ported over. **Several
  selectors that were ID-based in the legacy app (`#postForm`, `#authForm`,
  `#editForm`, etc.) were converted to class selectors or scoped descendant
  selectors** (e.g. `.auth-panel form input`) since React components don't
  own fixed DOM ids the way static HTML did — check `styles.css` before
  assuming a legacy `#id` selector still applies here.
- `PhotoField.jsx` is a single shared component for photo capture (dropzone +
  drag/drop + live camera via `getUserMedia` with front/back switch) reused
  by both the composer and the edit modal; pass `existingImageUrl` +
  `dropzoneClassName="edit-dropzone"` for the edit-modal sizing/layout.
- `api.js` is the only place that talks to the backend (`fetch` wrapper +
  `ApiError` with `.status`) — components never call `fetch` directly.
- Seller auth persists in `localStorage` under `snapy_seller` (same key the
  legacy app uses for its own separate localStorage — harmless collision
  since the two apps run on different origins/ports, but don't assume they
  share a logged-in session).

## Architecture — mobile (`mobile-rn/`)

Expo/React Native app (Expo SDK 57, React Native 0.86, React 19) targeting
the same `backend/` API as `web/`. Not a wrapper around `web/` — a separate
React tree with its own screens, navigation, and API client.

- **Navigation**: `@react-navigation` bottom-tabs (Annonces / Top /
  Catégories / Mes annonces) nested inside a native-stack for modal-style
  screens (Compose, EditProduct, Chat, Auth, Account, Boutique,
  CategoryFeed) — see `App.js`. There's no router library equivalent to
  `web/`'s `App.jsx` view-switching; screens are real navigator routes with
  their own params instead of local `useState`.
- **`src/api.js`** mirrors `web/src/api.js`'s shape (`api.register`,
  `api.login`, `api.products`, `api.chat`, etc., same `ApiError` pattern)
  but is a separate file with separate base-URL logic — changes to one
  don't propagate to the other.
- **API base URL resolution is platform-aware**: defaults to
  `http://10.0.2.2:4000` on Android (the emulator's alias for the host
  machine's `localhost`) and `http://localhost:4000` on iOS
  simulator/web, overridable via `EXPO_PUBLIC_API_BASE_URL` in
  `mobile-rn/.env`. Physical devices need the host machine's LAN IP
  (printed in the backend's startup log) since neither `localhost` nor
  `10.0.2.2` resolves to the dev machine over a real network.
- **Auth persists via `@react-native-async-storage/async-storage`**
  (`src/context/AuthContext.js`), not `localStorage` (unavailable in RN) —
  same `snapy_seller` key name as `web/`/legacy for convention only, no
  actual storage is shared across apps. Buyer id (`snapy_buyer_id`) is
  generated and cached the same way as the other two frontends
  (`Acheteur-XXXX`, not `Buyer-XXXX` — check the prefix before assuming
  cross-app string matching).
- `AGENTS.md` in this folder is a pointer file (`@AGENTS.md`-style import
  in `mobile-rn/CLAUDE.md`) warning that Expo SDK docs move fast — check
  `https://docs.expo.dev/versions/v57.0.0/` for the pinned version before
  relying on remembered Expo APIs.

## Architecture — mobile, second attempt (`mobile-flutter/`)

A **bare `flutter create` scaffold**, not a built app — `lib/main.dart` is
still the default counter-app template, and there is no API client, no
screens, and no auth persistence wired up yet. Treat any work here as
greenfield, not "extend an existing feature."

- Package name is `snapy_mobile` (`pubspec.yaml`); targets Android, iOS,
  macOS, Linux, Windows, and web build folders were all generated (`flutter
  create` default), even though this app will likely only ship for
  Android/iOS in practice — don't assume every platform folder needs
  maintaining.
- `pubspec.yaml` already lists deps chosen ahead of any code that uses them:
  `http` (API calls), `shared_preferences` (likely auth token persistence,
  the Flutter analogue of `web/`'s `localStorage` and `mobile-rn/`'s
  AsyncStorage), `image_picker` (photo capture), `provider` (state
  management — no Redux/Riverpod), and `url_launcher` (presumably for the
  WhatsApp `wa.me` deep link, mirroring the other two frontends). No code
  currently uses any of them.
- No relationship to `mobile-rn/` beyond both targeting the same `backend/`
  API eventually — this is a second, independent mobile implementation, not
  a migration in progress. Confirm with the user which mobile app is meant
  before assuming intent when asked to "fix the mobile app."

## Working in this repo

- The legacy demo (`server.js`, `public/`) stays single-file-per-concern with
  flat JSON storage — don't refactor it toward the new stack's patterns
  unless asked; it's kept as-is intentionally.
- For the current stack, keep the route/lib/middleware split in `backend/`
  and the component-per-concern split in `web/src/components/` rather than
  collapsing back into fewer files.
- A backend API change (new field, new route, new validation rule) has two
  frontend consumers to update today: `web/src/api.js` **and**
  `mobile-rn/src/api.js` (`mobile-flutter/` has no API client yet, so
  nothing to update there until it's built out). Check both existing
  clients before calling an API change complete.
- Reset the legacy demo by deleting `data/sellers.json`, `data/products.json`,
  and/or `data/chats.json` (recreated empty on next start). Reset the current
  stack by deleting `backend/data/snapy.db*`.
