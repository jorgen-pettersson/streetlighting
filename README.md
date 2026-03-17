# Streetlighting map SPA

Single-page React app (Vite + TypeScript) wired to Firebase Auth (Google + anonymous) and Firestore. The UI centers on a Leaflet map with a side panel to create, update, and delete points tied to the signed-in user.

## Getting started

1) Install deps
```bash
npm install
```

2) Add env vars
```bash
cp .env.example .env.local
# Fill VITE_FIREBASE_* with your Firebase web app values
```

3) Run locally
```bash
npm run dev
```

## Deploying

```bash
npm run build
firebase deploy --only hosting,firestore
```

`firebase.json` is set to serve `dist` as a single-page app. Firestore rules: any signed-in user can read all locations; only admins can create/update/delete.

## Roles

Firestore rules look for `roles/{email}` (exact email string) with `{ role: 'admin' | 'viewer' }`.
- Admin: can create/update/delete locations, manage roles.
- Viewer (or missing doc): read-only.

Create the first admin doc in the console: collection `roles`, doc id = your exact sign-in email, field `role = admin`. Anonymous users (no email) are treated as viewers.
