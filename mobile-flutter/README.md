# snapy_mobile

Flutter client for Snapy, targeting the same `backend/` API as `web/` and
`mobile-rn/`. Not a wrapper around either — its own widget tree, navigation,
and API client (`lib/api.dart`).

## Running

```bash
flutter pub get
flutter run   # backend must already be running: cd ../backend && npm run dev
```

## API base URL

Defaults to `http://10.0.2.2:4000` on the Android emulator (its alias for the
host machine's `localhost`) and `http://localhost:4000` everywhere else.
Override with `--dart-define`, e.g. for a physical device on the same LAN as
the backend (LAN URL is printed in the backend's startup log):

```bash
flutter run --dart-define=API_BASE_URL=http://192.168.1.23:4000
```

## Structure

- `lib/api.dart` — HTTP client + `Product`/`Category`/`ChatMessage`/`AuthData`
  models, mirroring `web/src/api.js` and `mobile-rn/src/api.js`'s shape
  (`ApiError` with `.status`, same endpoints).
- `lib/auth.dart` — `AuthProvider` (ChangeNotifier), seller session persisted
  via `shared_preferences` under the `snapy_seller` key (same key name as the
  other two frontends, no storage actually shared), plus `getBuyerId()`
  (`Acheteur-XXXX`, cached under `snapy_buyer_id`).
- `lib/screens/` — one file per screen: product feed (generic
  `ProductListScreen` parameterized by `all`/`top`/`mine`/`boutique`/
  `categoryFiltered` mode, reused across four routes), categories grid,
  compose/edit (photo via `image_picker`), chat (2.5s polling, no
  websockets/SSE — same approach as the other two frontends), seller
  auth, account settings.
- `lib/screens/root_shell.dart` — bottom-nav shell (Annonces / Top /
  Catégories / Mes annonces) built on `IndexedStack` so each tab keeps its
  own scroll/loading state; modal screens (Compose, Edit, Chat, Auth,
  Account, Boutique, Category feed) are pushed via `Navigator`. A
  `ValueNotifier<int>` refresh signal is threaded into the tabs so posting a
  product or editing the account refreshes whichever list is currently
  visible, standing in for React Navigation's `useFocusEffect`.
- `lib/widgets/` — shared button/field styles and the product card /
  category tile, styled from `lib/theme.dart` (same palette as
  `web/src/styles.css` / `mobile-rn/src/theme.js` — keep in sync if the
  brand colors change).

No test suite beyond the default `flutter create` smoke test
(`test/widget_test.dart`), consistent with the rest of the repo.
