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
| Frontend | `public/` (static HTML/JS/CSS) | `web/` (React + Vite) + `mobile-rn/` (Expo/React Native) + `mobile-flutter/` (Flutter) |
| Storage | flat JSON files in `data/` | SQLite (`backend/data/snapy.db`) |
| Auth sessions | in-memory `Map`, wiped on restart | JWT, survives restarts |
| Port | 3000 (serves both API + frontend) | API on 4000, web app on 5173, mobile via Expo dev tools / `flutter run` |

The legacy demo still runs (`npm start` from the repo root) and is left
intact as a reference/fallback — it is not wired to the new stack in any way
(separate `uploads/`, separate data). New feature work should go into
`backend/` + `web/` (or `mobile-rn/`/`mobile-flutter/` for mobile-specific
work) unless the user asks specifically about the legacy demo.

`web/`, `mobile-rn/`, and `mobile-flutter/` are independent frontends
against the same `backend/` API — none wraps another. Each ships its own API
client and its own persistence for auth state; a feature added to one does
not exist on the others until ported over by hand. `mobile-flutter/` reached
feature parity with `mobile-rn/` (built out from a bare `flutter create`
scaffold) as of 2026-07-10 — see "Architecture — mobile, second attempt"
below before assuming it's still just boilerplate.

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
cd mobile-flutter && flutter pub get && flutter run   # Android emulator / iOS simulator / desktop
```

`backend/` and `web/` need `.env` (copy from `.env.example` in each folder).
`backend/.env` needs `ANTHROPIC_API_KEY` (falls back to a generic caption if
missing/erroring) and `JWT_SECRET` (any random string — generate with
`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
`web/.env` just needs `VITE_API_BASE_URL` pointing at the backend.
`mobile-rn/.env` (optional) needs `EXPO_PUBLIC_API_BASE_URL` if the default
host resolution doesn't reach your backend — see "Architecture — mobile"
below. `mobile-flutter/` has no `.env` file (Flutter has no built-in dotenv
support) — its base-URL override goes through `--dart-define=API_BASE_URL=...`
instead, see "Architecture — mobile, second attempt" below.

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
- **Voice notes are optional, post-time only**: `POST /api/products` accepts
  an optional `audio` multipart field alongside the required `image` one
  (`upload.fields([...])` in `routes/products.js`, `fileFilter` in
  `lib/upload.js` branches on `file.fieldname` to allow `audio/*` only for
  that field). Stored as `products.audio_url`, nullable, serialized as
  `audioUrl`. `PATCH /api/products/:id` has no audio parameter — editing a
  product's voice note isn't supported, only name/category/image. Because
  `products` predates this column, `db.js` has a `pragma_table_info` check
  that runs `ALTER TABLE products ADD COLUMN audio_url TEXT` on existing
  databases — `CREATE TABLE IF NOT EXISTS` alone doesn't add columns to a
  table that already exists, easy to forget on the next schema change too.

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
- `AudioField.jsx` is the optional voice-note recorder (`MediaRecorder` +
  `getUserMedia({ audio: true })`), used only by `Composer.jsx` — there's no
  equivalent in `EditModal.jsx`, voice notes are record-once-at-posting-time
  only. `ProductCard.jsx` renders a plain `<audio controls>` when
  `product.audioUrl` is present.
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
- **Voice notes use `expo-audio`** (not the deprecated `expo-av`):
  `AudioRecorderField.js` wraps `useAudioRecorder`/`useAudioRecorderState`
  for recording and `useAudioPlayer`/`useAudioPlayerStatus` for instant
  preview playback of the just-recorded clip, used only in
  `ComposeScreen.js` — no edit-time support. `ProductCard.js` plays back an
  existing product's `audioUrl` the same way. Recording requires
  `setAudioModeAsync({ allowsRecording: true })` before `record()` on iOS.

## Architecture — mobile, second attempt (`mobile-flutter/`)

A second, independent mobile implementation targeting the same `backend/`
API as `web/` and `mobile-rn/` — no relationship to `mobile-rn/` beyond
that, not a migration in progress. Confirm with the user which mobile app is
meant before assuming intent when asked to "fix the mobile app" (this
package went from a bare `flutter create` scaffold to full feature parity
with `mobile-rn/` in one pass on 2026-07-10, so don't assume it's still
boilerplate).

- Package name is `snapy_mobile` (`pubspec.yaml`); targets Android, iOS,
  macOS, Linux, Windows, and web build folders were all generated (`flutter
  create` default), even though the app only ships for Android/iOS in
  practice — the desktop/web platform folders are unmaintained boilerplate,
  don't assume they need updating alongside `lib/`.
- **State management is `provider`** (no Redux/Riverpod/Bloc): a single
  `AuthProvider` (`lib/auth.dart`, `ChangeNotifier`) holds the seller session
  and is installed once at the root in `lib/main.dart`
  (`ChangeNotifierProvider.value` above `MaterialApp`). Screens read it with
  `context.watch`/`context.read`.
- **`lib/api.dart`** mirrors `web/src/api.js`/`mobile-rn/src/api.js`'s shape
  (`Api.register`, `Api.login`, `Api.products`, `Api.chat`, etc., same
  `ApiError` with `.status`) but is a separate file with separate base-URL
  logic — changes to one don't propagate to the others. Typed models
  (`Product`, `Category`, `ChatMessage`, `ChatThread`, `AuthData`) wrap the
  raw JSON instead of passing `Map`s around.
- **API base URL resolution is platform-aware**, same intent as
  `mobile-rn/` but Flutter has no `.env`/dotenv support, so the override is
  a compile-time `--dart-define=API_BASE_URL=...` instead of an env file:
  defaults to `http://10.0.2.2:4000` on Android (the emulator's alias for
  the host machine's `localhost`) and `http://localhost:4000` everywhere
  else. Physical devices need the host machine's LAN IP (printed in the
  backend's startup log).
- **Auth persists via `shared_preferences`** (`AuthProvider.load`/`setAuth`
  in `lib/auth.dart`), not `localStorage`/AsyncStorage (unavailable in
  Flutter) — same `snapy_seller` key name as the other two frontends for
  convention only, no actual storage is shared across apps. Buyer id
  (`snapy_buyer_id`) is generated and cached the same way as the other two
  frontends (`Acheteur-XXXX`, matching `mobile-rn/`'s prefix, not
  `Buyer-XXXX` from the legacy app/`web/`).
- **Navigation has no nested tab+stack router** (Flutter has no
  `@react-navigation` equivalent wired up): `lib/screens/root_shell.dart` is
  a single `Scaffold` with a `BottomNavigationBar` switching an
  `IndexedStack` of the four tabs (Annonces / Top / Catégories / Mes
  annonces) so each tab keeps its own scroll/loading state across switches;
  modal-style screens (Compose, EditProduct, Chat, Auth, Account, Boutique,
  CategoryFeed) are pushed with `Navigator.push(MaterialPageRoute(...))`
  instead of being named routes.
- **`ProductListScreen` (`lib/screens/product_list_screen.dart`) is one
  generic, reusable screen** parameterized by a `ProductListMode` enum
  (`all`/`top`/`mine`/`boutique`/`categoryFiltered`) rather than four
  separate screens — same idea as `mobile-rn/`'s `ProductListScreen.js` and
  `web/`'s `view` state, ported to an enum instead of a string union.
- **No `useFocusEffect` equivalent**, since the tabs live in an
  `IndexedStack` and never actually lose focus when another tab is
  selected: a `ValueNotifier<int>` "refresh signal" is created in
  `RootShell` and threaded into the tabs and `CategoriesScreen`; posting a
  product (Compose) or editing the account bumps it, which triggers every
  listening screen to reload. Editing/deleting a single product instead
  calls the owning `ProductListScreenState`'s `load()` directly via a
  closure, since that's a same-subtree callback and doesn't need the
  broadcast signal.
- Camera/gallery access needed permission entries added by hand (not part
  of the default `flutter create` scaffold): `NSCameraUsageDescription` /
  `NSPhotoLibraryUsageDescription` in
  `ios/Runner/Info.plist`, and `android.permission.CAMERA` in
  `android/app/src/main/AndroidManifest.xml`. Same for microphone access:
  `NSMicrophoneUsageDescription` / `android.permission.RECORD_AUDIO`.
- **Voice notes use the `record` package for capture and `audioplayers` for
  playback** (plus `path_provider` to get a writable temp path for the
  recording, since `record` needs a file path up front on IO platforms) —
  no single package does both. `widgets/audio_recorder_field.dart` wraps
  both: `AudioRecorder` (`record`) for start/stop, `ap.AudioPlayer`
  (`audioplayers`, aliased `as ap` to avoid clashing with `record`'s own
  naming) for previewing the just-recorded clip. Used only in
  `ComposeScreen` — no edit-time support. `ProductCard`'s
  `_VoiceNoteButton` plays back an existing product's `audioUrl` with its
  own `ap.AudioPlayer` instance the same way.

## Working in this repo

- The legacy demo (`server.js`, `public/`) stays single-file-per-concern with
  flat JSON storage — don't refactor it toward the new stack's patterns
  unless asked; it's kept as-is intentionally.
- For the current stack, keep the route/lib/middleware split in `backend/`
  and the component-per-concern split in `web/src/components/` rather than
  collapsing back into fewer files.
- A backend API change (new field, new route, new validation rule) has
  three frontend consumers to update today: `web/src/api.js`,
  `mobile-rn/src/api.js`, **and** `mobile-flutter/lib/api.dart` (plus its
  typed models in the same file — a new field usually means updating a
  model's constructor/`fromJson` too). Check all three existing clients
  before calling an API change complete.
- Reset the legacy demo by deleting `data/sellers.json`, `data/products.json`,
  and/or `data/chats.json` (recreated empty on next start). Reset the current
  stack by deleting `backend/data/snapy.db*`.
