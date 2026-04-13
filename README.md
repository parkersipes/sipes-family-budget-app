# Sipes Family Budget

V1 of a "free" private, two-user envelope-style budget PWA. No bank connections, no public sign-up, no net-worth tracking — just two people tracking where their money goes against a monthly budget they define themselves. I didn't want a superfluous feature rich app to start. Perhaps I can add some other connections later. Just something fun to play around with different technologies.

Built with **React + Vite**, **Firebase** (Auth + Firestore + Hosting), **Recharts**, and **Tailwind**. Installable to the home screen on iOS and Android.

## Setup

```bash
npm install
cp .env.example .env.local
# Fill in .env.local with the values from Firebase Console -> Project settings -> Web app
npm run dev
```

### Firebase project

The Firebase project is **`sipes-family-budget`** (already created). The two user accounts are created manually in the Firebase Console — there is no public registration flow.

1. In the Firebase console: **Authentication → Sign-in method → Email/Password**, enable it.
2. **Authentication → Users → Add user** for each of the two accounts.
3. **Firestore Database → Create database** in production mode.
4. Deploy the Firestore rules: `npx firebase deploy --only firestore:rules`

### Deploy to hosting

```bash
npm run build
npx firebase deploy --only hosting
```

The app will be served at `https://sipes-family-budget.web.app` with HTTPS and CDN, and installable as a PWA.

## Environment variables

All required keys are listed in [.env.example](.env.example). The file `.env.local` is gitignored and should never be committed.

The household ID (used to scope Firestore reads/writes to a single household) is hardcoded in [src/config.js](src/config.js). This is a document ID, not a secret.

## Data model

```
/households/{householdId}/
  fixedBills/{id}          — persistent monthly bills (name, amount, category, dueDay)
  months/{YYYY-MM}/
    (doc fields)           — totalStartingValue, fixedBillsApplied
    categories/{id}        — name, maxBudget, color
    transactions/{id}      — date, vendor, categoryId, amount, isFixed, pulledFromCategoryId
    incomeEvents/{id}      — date, source, amount
```

All dollar values are stored as **integer cents** to avoid a "floating-point" error. Formatting to dollars happens at the UI layer.

## How a month is initialized

When a new month is set up from Settings:

1. `months/{YYYY-MM}` doc is created with the starting balance.
2. Categories are written into `months/{YYYY-MM}/categories`.
3. Every document in `fixedBills` is written as a pre-logged transaction with `isFixed: true` and the month's meta flag `fixedBillsApplied: true` is set — so this never runs twice.

If a fixed bill's `categoryId` doesn't exist in the new month's categories, it is skipped and flagged in the Fixed Bills settings screen.

## What this app does not do

- No bank integrations or Plaid
- No net-worth or investment tracking
- No multi-household / public sign-up
- No push notifications
- No CSV import/export (v2 candidate)

## Icons

Source icon lives at [public/icon.svg](public/icon.svg). To regenerate PNGs for the PWA manifest, run `npx sharp-cli` or install `sharp` and run `node scripts/gen-icons.mjs`. PNG versions are expected at `public/icon-192.png`, `public/icon-512.png`, `public/icon-512-maskable.png`, and `public/apple-touch-icon.png`.
