# Architecture: FundTracker (a rebuild of Cashew's core features)

## Stack

| layer | choice | why |
| --- | --- | --- |
| web app | Next.js 14+ (App Router) + TypeScript | Modern server-side rendering, instant server actions, React 18 concurrent UI transitions, and clean PWA capabilities for mobile-grade UX |
| styling | Tailwind CSS + CSS Variables | Dynamic runtime theming matching Cashew's 10-color reactive accent palette, dark/light modes, and exact token control from `replica-design` |
| charts | Recharts / SVG micro-visuals | Zero-dependency high-performance animated donut charts with embedded SVG slice icons and gradient time-series area charts |
| database | PostgreSQL (Supabase / Neon) + Local Storage Cache | Strict relational integrity with foreign keys, checks, and RLS, paired with IndexedDB client caching for privacy-first offline use |
| ORM | Drizzle ORM | Lightest type-safe ORM for Next.js, zero runtime bloat, automated SQL migrations matching `replica/schema.sql` |
| auth | Supabase Auth (Guest Anonymous + Email Magic Link) | Frictionless zero-login guest mode on first launch, optional email link backup to sync across phone and desktop |
| payments | Stripe Checkout | Optional supporter tip / pro lifetime unlock if monetized; zero ads or intrusive trackers |
| email | Resend | Fast transactional email delivery for passwordless magic links and optional weekly budget summaries |
| jobs | Vercel Cron | Lightweight serverless cron for recurring transaction generation and budget threshold evaluations |
| hosting | Vercel | Instant global edge CDN deployment, zero-config serverless API routes, and sub-second asset delivery |

---

## Schema

- **Tables**: 8 (`users`, `accounts`, `categories`, `budgets`, `budget_categories`, `budget_accounts`, `transactions`, `recurring_rules`)
- **Views**: 1 (`account_balances` - atomic dynamic aggregation)
- **Access rules**: PostgreSQL Row Level Security (RLS) on all tables + verified server action authorization per query.

### SQL Source
See complete migration file in [`replica/schema.sql`](file:///c:/Users/user/Desktop/New%20folder/duplicat/fund%20trcker/replica/schema.sql).

### Data Modeling Highlights
- **Integer Cents Representation**: All monetary values (`amount`, `initial_balance`, `amount_limit`) are stored as signed 64-bit integers in cents (e.g., `$14.50` -> `1450`). Completely eliminates floating-point rounding discrepancies.
- **Relational Integrity**:
  - `transactions.account_id` has `on delete restrict` to prevent accidental deletion of historical financial audits.
  - `transactions.to_account_id` enforces atomic transfer validations (`to_account_id != account_id`).
  - Junction tables `budget_categories` and `budget_accounts` allow granular sub-budgeting while an empty set defaults to tracking all spending.
- **Local Date Independence**: `transaction_date` is stored as an ISO `DATE` (`YYYY-MM-DD`) representing the user's local calendar day, while `created_at` records the UTC `timestamptz`. This avoids transactions flipping days across time zones or daylight saving transitions.

---

## API & Route Architecture

All endpoints enforce user authentication context (either registered user ID or signed guest device session ID).

### Flow Routes

| method & path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| `GET /api/accounts` | Fetch all active accounts with live computed balances and net worth | Authenticated user | None | `{ accounts: Account[], net_worth_cents: number }` | F04 |
| `POST /api/accounts` | Create new financial pool (Cash, Bank, Savings, Credit) | Authenticated user | `{ name, account_type, currency, initial_balance, color, icon }` | `{ account: Account }` | F04 |
| `PATCH /api/accounts/[id]` | Update account metadata or initial balance | Authenticated user | `{ name?, account_type?, initial_balance?, color?, icon? }` | `{ account: Account }` | F04 |
| `DELETE /api/accounts/[id]` | Archive or delete account (checks for existing transactions) | Authenticated user | `?reassign_to=UUID` | `{ success: true }` | F04 |
| `GET /api/transactions` | Search and filter transactions by date range, account, or category | Authenticated user | `?startDate=&endDate=&accountId=&categoryId=&query=&page=` | `{ transactions: Transaction[], total: number, page: number }` | F01, F03 |
| `POST /api/transactions` | Log new expense, income, or transfer | Authenticated user | `{ account_id, category_id?, amount, transaction_type, transaction_date, transaction_time?, notes?, to_account_id? }` | `{ transaction: Transaction, updated_balance: number }` | F01, F04 |
| `GET /api/transactions/[id]` | Fetch single transaction detail | Authenticated user | None | `{ transaction: Transaction }` | F01 |
| `PATCH /api/transactions/[id]` | Edit transaction details or re-categorize | Authenticated user | Partial transaction fields | `{ transaction: Transaction }` | F01 |
| `DELETE /api/transactions/[id]` | Delete transaction and restore balances | Authenticated user | None | `{ success: true }` | F01 |
| `GET /api/categories` | List user custom and default categories | Authenticated user | `?type=expense\|income` | `{ categories: Category[] }` | F01, F05 |
| `POST /api/categories` | Create custom category with color & icon | Authenticated user | `{ name, category_type, color, icon }` | `{ category: Category }` | F05 |
| `PATCH /api/categories/[id]` | Update category name, color, or icon | Authenticated user | `{ name?, color?, icon? }` | `{ category: Category }` | F05 |
| `DELETE /api/categories/[id]` | Remove category (reassigns linked transactions to uncategorized) | Authenticated user | None | `{ success: true }` | F05 |
| `GET /api/budgets` | Fetch active budgets with real-time spend progress and burn pace | Authenticated user | `?period_type=` | `{ budgets: (Budget & { spent_cents: number, remaining_cents: number, pace_pct: number })[] }` | F02 |
| `POST /api/budgets` | Create new budget cap with period and category scope | Authenticated user | `{ name, amount_limit, period_type, start_date, end_date?, category_ids?, account_ids?, notify_threshold? }` | `{ budget: Budget }` | F02 |
| `PATCH /api/budgets/[id]` | Modify budget thresholds or category allocations | Authenticated user | Partial budget fields + category/account ID arrays | `{ budget: Budget }` | F02 |
| `DELETE /api/budgets/[id]` | Delete or archive budget | Authenticated user | None | `{ success: true }` | F02 |
| `GET /api/budgets/[id]/summary` | Detailed budget diagnostic: burn rate, days remaining, category slices | Authenticated user | None | `{ budget: Budget, spent: number, allowance_per_day: number, breakdown: CategorySpend[] }` | F02 |
| `GET /api/analytics/categories` | Aggregated category spending breakdown for interactive donut chart | Authenticated user | `?startDate=&endDate=&accountId=` | `{ categories: { id, name, color, icon, total_cents, percentage }[] }` | F03 |
| `GET /api/analytics/trends` | Time-series daily spending and income curve for trend line graph | Authenticated user | `?startDate=&endDate=&interval=day\|week\|month` | `{ points: { date: string, expense_cents: number, income_cents: number }[] }` | F03 |
| `GET /api/analytics/comparison` | Period-over-period financial comparison (e.g. this month vs last month) | Authenticated user | `?currentStart=&currentEnd=&previousStart=&previousEnd=` | `{ current_cents: number, previous_cents: number, delta_pct: number }` | F03 |
| `GET /api/settings` | Get user preferences (theme mode, accent color, currency) | Authenticated user | None | `{ settings: UserSettings }` | F05 |
| `PATCH /api/settings` | Update visual theme, accent color, or currency settings | Authenticated user | `{ theme_mode?, accent_color?, default_currency?, first_day_of_week? }` | `{ settings: UserSettings }` | F05 |
| `POST /api/data/export` | Export full ledger, accounts, and budgets in JSON or CSV format | Authenticated user | `{ format: 'json' \| 'csv' }` | File download blob / stream | F05 |
| `POST /api/data/import` | Import transactions from CSV with column mapping | Authenticated user | `FormData` (CSV file + column mapping json) | `{ imported_count: number, skipped_count: number, errors: string[] }` | F05 |

### Webhooks & Jobs
- **Webhooks In**: `/api/webhooks/stripe` (Optional supporter verification; validates HMAC signature, updates user status).
- **Webhooks Out**: None (Zero telemetry or third-party ad beacons).
- **Background Jobs**:
  1. `daily_budget_check` (Vercel Cron: `0 8 * * *`): Evaluates active budgets for users approaching or breaching `notify_threshold` and generates in-app alert flags.
  2. `recurring_transactions_runner` (Vercel Cron: `1 0 * * *`): Queries active `recurring_rules` where `next_run_date <= CURRENT_DATE`, inserts ledger transactions, and advances `next_run_date`.

---

## The Parts That Bite

- **Time Zones & Calendar Alignments**:
  Transactions entered by users represent local real-world days. Recording a dinner at 11:30 PM on October 23 in UTC+5:30 could shift to October 24 in UTC if stored solely as a timestamp. By separating local `transaction_date` (`DATE`) from system `created_at` (`timestamptz`), daily budgets and chart buckets remain 100% faithful to the user's lived calendar day.
- **Atomic Balance & Transfer Consistency**:
  An account-to-account transfer involves two balance adjustments. In FundTracker, transfers are modeled either via the `transfer` transaction type with `account_id` and `to_account_id` or handled in a single SQL transaction block. The `account_balances` view dynamically calculates balances directly from transactions, eliminating state desynchronization.
- **Donut Chart Arc Icon Positioning**:
  Rendering category vector icons centered along the curved mid-angles of SVG donut slices requires trigonometry (`x = cx + r * cos(angle)`, `y = cy + r * sin(angle)`). Small slices (<4% of total spend) must gracefully suppress their icon or collapse into an "Other" category to prevent label collision.
- **Local-First & Offline Resilience**:
  Users frequently record expenses when offline (e.g. basements, subway stations, airplanes). The client application caches the active catalog in IndexedDB/LocalStorage, provides immediate optimistic UI feedback, and flushes mutations upon network reconnection.
- **Category Deletion Dependencies**:
  Deleting a category that has 500 historical transactions must not break historical ledger views. Foreign key is configured with `on delete set null`, preserving transaction history with a fallback "Uncategorized" label.

---

## Build Order

### Milestone 1: The Vertical Slice (Core Loop Proof)
- **Objective**: Prove the end-to-end stack from database to UI with instant real-time feedback.
- **Screens**:
  - `S01 Home Dashboard` (Basic shell with Net Worth header and recent transaction feed)
  - `S02 Add Transaction Modal` (Amount input, expense/income toggle, account selector, category selector, save button)
  - `S07 Accounts Manager` (Seed default Cash / Wallet account)
- **Tables**: `users`, `accounts`, `categories`, `transactions`
- **Routes**: `GET /api/accounts`, `POST /api/transactions`, `GET /api/transactions`
- **Verification**: User can launch app, record a $14.50 coffee, and immediately see the account balance drop by $14.50 on the dashboard.

### Milestone 2: Must-Haves (Complete Parity Core)
- **Budgets & Pace Gauges**:
  - `S04 Budgets Overview` + `S05 Create/Edit Budget`
  - Tables: `budgets`, `budget_categories`, `budget_accounts`
  - Routes: `GET /api/budgets`, `POST /api/budgets`, `GET /api/budgets/[id]/summary`
  - Dynamic pace math: Daily burn rate, projected end-of-month spend, alert thresholds.
- **Transaction Ledger**:
  - `S03 Transaction Ledger` with date grouping, search bar, and category filter chips.
- **Visual Analytics**:
  - `S06 Visual Analytics` with animated interactive SVG donut chart and spending trend line graph.
  - Routes: `GET /api/analytics/categories`, `GET /api/analytics/trends`
- **Theming & Taxonomy**:
  - `S08 Category Manager` (custom colors & vector icons).
  - `S09 Settings` (system/light/dark modes + 10-color reactive accent palette).

### Milestone 3: Should-Haves (Enhanced Utility)
- Account-to-account transfer transactions (`transaction_type = 'transfer'`).
- CSV and JSON data export & import engine for total user data portability.
- Period-over-period trend comparisons (`GET /api/analytics/comparison`).
- Multi-period budgets (Yearly, Weekly, Custom date spans).

### Milestone 4: Fixes & Delighters (Replica Entrepreneur Input)
- Incorporate pain-point resolutions identified in public user reviews (e.g., fast quick-log widget, smarter bulk re-categorization, clean zero-clutter receipt notes).
