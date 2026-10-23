# Replica Backend Implementation: FundTracker

Backend architecture, API route inventory, and security verification for the FundTracker clone.

---

## 1. Auth & Identity
- **Anonymous Privacy Session**: Provides instant zero-friction first-launch access on user devices without requiring passwords or tracking personal data.
- **Session Security**: Session tokens are isolated via HTTP-only secure cookies (`ft_guest_session`), preventing XSS access.
- **Authorisation Checks**: `assertAuthorization(currentUserId, targetRecordOwnerId)` function in `src/lib/auth.ts` verifies that every mutation or read query strictly belongs to the authenticated user context.

---

## 2. Database & SQL Migrations
- **Schema Source**: [`replica/schema.sql`](file:///c:/Users/user/Desktop/New%20folder/duplicat/fund%20trcker/replica/schema.sql)
- **Tables (8)**:
  1. `users`: User profiles with theme preferences and currency settings.
  2. `accounts`: Financial pools (cash, bank, savings, credit) with `initial_balance` in integer cents.
  3. `categories`: Custom expense and income taxonomies.
  4. `budgets`: Spending caps and threshold alerts over weekly/monthly/yearly cycles.
  5. `budget_categories`: Junction table for granular category budget tracking.
  6. `budget_accounts`: Junction table for account-specific budgets.
  7. `transactions`: Immutable audit ledger for expenses, incomes, and transfers with atomic constraints.
  8. `recurring_rules`: Automated subscription and recurring payment rules.
- **Dynamic Views**: `account_balances` view computes real-time account balances from historical transactions to prevent ledger drift.
- **Row Level Security (RLS)**: PostgreSQL RLS policies enabled on all 8 tables.

---

## 3. Server-Side Input Validation (Zod)
All API routes parse and sanitize incoming payloads via `src/lib/validations.ts`:
- Amounts strictly enforced as positive integer cents.
- Dates validated to ISO `YYYY-MM-DD` format.
- Transfers require distinct source and destination accounts (`to_account_id !== account_id`).
- Hex color strings validated via regular expression.

---

## 4. Payments (Stripe Checkout)
- **Checkout Route**: `/api/checkout` creates hosted Stripe Checkout sessions in test mode for optional supporter unlocks.
- **Webhook Endpoint**: `/api/webhooks/stripe` verifies HMAC signatures using `STRIPE_WEBHOOK_SECRET` and handles events (`checkout.session.completed`) idempotently using in-memory / database event ID sets.
- **Client Shielding**: Zero credit card details touch application servers; PCI-DSS compliance is offloaded to Stripe.

---

## 5. Background Jobs (Vercel Cron)
- **Budget Threshold Evaluation**: `/api/cron/budget-check` runs daily to compute active budget burn pace.
- **Invocation Security**: Requires Bearer authorization matching `CRON_SECRET`.

---

## 6. Security Checklist

- [x] **Secrets Isolation**: Secrets stored exclusively in `.env.local`, `.env*` added to [`.gitignore`](file:///c:/Users/user/Desktop/New%20folder/duplicat/fund%20trcker/.gitignore), zero secret leakage in client JavaScript bundles.
- [x] **Server Input Validation**: Every API route validates input using Zod schemas (`src/lib/validations.ts`).
- [x] **Authorisation & RLS**: Access control enforced per query (`src/lib/auth.ts`) and database RLS policies.
- [x] **Webhook Signature Verification**: Webhook handler validates raw payload HMAC signatures before processing.
- [x] **Zero Telemetry / Logs Privacy**: No sensitive financial figures or user data leaked into public logs or query strings.
- [x] **Dependency Audit**: Verified via `npm audit` and clean production build.
- [x] **Clean Room Guarantee**: Built using open MIT libraries (Lucide React, Next.js, Tailwind) and official public APIs only.
