# Sipes Family Budget

V1 of a "free" private, two-user envelope-style budget PWA. No bank connections, no public sign-up, no net-worth tracking — just two people tracking where their money goes against a monthly budget they define themselves. I didn't want a superfluous feature rich app to start. Perhaps I can add some other connections later. Just something fun to play around with different technologies.

**Stack:** React + Vite · React Router · Firebase (Auth + Firestore + Hosting) · Recharts · Tailwind. Installable to the home screen on iOS and Android.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in with Firebase web-app SDK values
npm run dev
```

The Firebase project is **`sipes-family-budget`** (already created). User accounts are created manually in Firebase Console → Authentication — no public registration.

## Deploy

```bash
npm run build
firebase deploy
```

Lives at `https://sipes-family-budget.web.app`. Firestore rules and hosting are both covered by that one command; re-run any time to ship updates.

## How it works

- **Envelopes** are monthly discretionary budgets (Groceries, Dining, Gas). They roll over each month with the prior month's allocation — you never have to rebuild the budget.
- **Fixed Income** (salary) and **Fixed Bills** (rent, utilities) live in Settings as household-level lists. On first view of a new month, they're auto-applied so your dashboard reflects committed money before you spend a dollar.
- **Side income** (side hustle, selling something) is added ad-hoc as it comes in.
- **Overflow**: an expense that exceeds an envelope prompts you to pull the overage from another envelope. Both envelopes update.
- **Captured margin**: the dashboard shows last month's surplus (or overspend) when this month begins, as a prompt to move it into savings.
- All dollar values are stored as **integer cents** to avoid floating-point error.

## Data model

```
/households/{householdId}/
  fixedIncome/{id}         — recurring income: name, amount, dayOfMonth
  fixedBills/{id}          — recurring bills: name, amount, dueDay
  months/{YYYY-MM}/
    (doc fields)           — initialized flags, legacy totalStartingValue
    categories/{id}        — envelopes: name, maxBudget, color
    transactions/{id}      — date, vendor, categoryId, amount, isFixed, pulls[]
    incomeEvents/{id}      — date, source, amount, isFixed
```

The `householdId` is hardcoded in [src/config.js](src/config.js). It's a document ID, not a secret.

## What it doesn't do

- Bank integrations or Plaid
- Net-worth or investment tracking
- Multi-household or public sign-up
- Push notifications
- CSV import/export
