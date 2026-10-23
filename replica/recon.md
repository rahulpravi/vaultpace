# Recon map: Cashew (Mobile App - Android & iOS Cross-Platform)

Scope: Core Budgeting Slice: Transactions (Expense/Income), Multi-Period Budgets (Weekly/Monthly), Custom Categories, Accounts & Visual Charts
For: Modern personal finance tracker for individual users (clean, privacy-focused, zero ads)
Date: 2026-10-22

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | Google Play Store Listing | `https://play.google.com/store/apps/details?id=com.budget.tracker_app` | Feature descriptions, verified reviews (4.9 rating / 27.5k reviews), and app capability summary |
| 2 | High-Resolution App Screenshots | `replica/screens/screenshot_*.png` | 12 high-resolution UI screen captures showing layout, dashboard widgets, donut charts, line graphs, budget progress bars, light/dark themes, color swatches |
| 3 | Public Community & Release Discussions | `https://github.com/jameskokoska/Cashew` | Information on cross-platform Flutter + Drift (SQLite) architecture, local-first database models, and feature roadmap |

## Core loop

Frictionless logging of daily expenses and income, instantly visualized against flexible weekly/monthly budget thresholds and category distributions to prevent overspending without sharing personal financial data.

## Screens

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Home Dashboard | Primary bottom nav tab (`/home`) | Instant overview of financial health, account balances, active budget pace, and recent activity | `AccountCarousel`, `BudgetProgressCard`, `QuickStatRow`, `TransactionFeed`, `FloatingActionButton` | empty (first launch prompts to add account/transaction), filled, filtered by account |
| S02 | Add / Edit Transaction | Tap '+' FAB on any screen or tap existing transaction row | Fast recording of income or expense with category and account assignment | `TypeToggle` (Expense/Income), `LargeAmountInput`, `AccountPickerDropdown`, `CategoryIconSelector`, `DatePicker`, `NotesField`, `SaveButton` | default (expense mode, today's date), filled, validation error (zero amount) |
| S03 | Transaction Ledger | Primary bottom nav tab (`/transactions`) | Comprehensive search, filter, and audit log of all financial movements | `SearchBar`, `DateRangeFilter`, `CategoryFilterChips`, `DateGroupHeader`, `TransactionRowItem` | empty (no matching transactions), filled, searching/filtered |
| S04 | Budgets Overview | Primary bottom nav tab (`/budgets`) | Monitor active budget consumption, cycle duration, and category allocations | `PeriodSummaryCard` (with circular gauge %), `CategoryDonutChart` (icons embedded in slices), `CategoryBudgetList` (progress bar & overspend indicator) | empty (no active budget), active on-track (green), near limit (yellow), overspent (red) |
| S05 | Create / Edit Budget | Tap 'Add Budget' or 'Edit' on S04 | Configure spending caps, recurrence cycle, and category inclusions | `AmountInput`, `PeriodSegmentControl` (Weekly, Monthly, Yearly, Custom), `StartDatePicker`, `CategoryMultiSelect`, `AlertThresholdInput` | default, populated, error (zero limit) |
| S06 | Visual Analytics | Primary bottom nav tab (`/analytics`) | In-depth trend visualization, category breakdowns, and velocity metrics | `TimeRangeSelector` (Month/Year), `SpendingTrendLineGraph`, `InteractiveDonutChart`, `TopCategoriesRankList` | empty (insufficient data), populated with historical curves |
| S07 | Accounts Manager | Settings -> Accounts (`/accounts`) | Create and organize distinct financial pools (Wallet, Checking, Savings, Credit Card) | `AccountListItem`, `BalanceDisplay`, `CurrencyBadge`, `AddAccountModal` (Name, Initial Balance, Currency, Color) | empty (prompt to add first wallet), populated, negative balance (credit) |
| S08 | Category Manager | Settings -> Categories (`/categories`) | Personalize taxonomy with distinct icons and theme colors | `CategoryGrid`, `CategoryChip`, `IconPickerSheet`, `ColorPalettePicker`, `NewCategoryDialog` | default system categories, user-customized |
| S09 | Settings & Preferences | More -> Settings (`/settings`) | Manage visual themes, local backups, export, and regional preferences | `ThemeModeToggle` (System/Light/Dark), `AccentColorPicker` (10 swatches), `CurrencySelector`, `ExportCSVButton`, `ImportCSVButton`, `AppInfoCard` | default, active custom theme |

## Flows

```
F01 Quick Expense Logging
    S01 Home -> Tap '+' FAB -> S02 Add Transaction -> Enter Amount ($14.50) -> Tap Category ("Dining") -> Tap Save -> S01 Home updated
    happy path clicks: 4
    edge: zero or negative amount, expense exceeds account balance, decimal entry precision, missing category selection

F02 Create Monthly Budget
    S01 Home -> S04 Budgets -> Tap 'Create Budget' -> S05 Budget Form -> Enter Cap ($500) -> Select Period ("Monthly") -> Pick Start Date ("1st") -> Select Categories ("All") -> Tap Save -> S04 Budgets updated
    happy path clicks: 5
    edge: budget amount lower than already-spent month-to-date total (triggers immediate overspend state), overlapping custom date periods

F03 Inspect Category Spending via Interactive Chart
    S01 Home -> S06 Analytics -> Tap Donut Slice ("Groceries") -> View category total & transaction count -> Tap 'View Transactions' -> S03 Ledger filtered to Groceries
    happy path clicks: 3
    edge: empty timeframe with 0 transactions, category with single large outlier transaction

F04 Add New Account & Reconcile Balances
    S01 Home -> S07 Accounts -> Tap 'New Account' -> Enter Name ("Emergency Fund"), Initial Balance ($2,500), Pick Currency & Color -> Tap Save -> S01 Carousel shows updated Net Worth
    happy path clicks: 4
    edge: multi-currency without manual exchange rate, deleting account with linked transaction history (prompts to archive vs reassign)

F05 Theme & Color Customization
    S01 Home -> S09 Settings -> Tap Accent Color Swatch (e.g. Emerald Green #10B981) -> Instant reactive palette shift across all components and navigation bars
    happy path clicks: 3
    edge: high-contrast legibility in both dark and light background modes
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| `AccountCard` | compact, expanded, horizontal carousel item | default, active/selected, negative balance | S01, S07 |
| `BudgetProgressCard` | monthly, weekly, custom period | healthy (<80%), warning (80-99%), overspent (>=100%) | S01, S04 |
| `CategoryDonutChart` | interactive, static preview | default, slice hovered/tapped, empty | S04, S06 |
| `SpendingLineGraph` | filled gradient area, step line | default, point tooltip active, empty | S01, S06 |
| `CategoryBudgetItem` | expense category row with mini bar | healthy (green), overspent (red), zero spend | S04, S05 |
| `TransactionRow` | expense (neutral/red), income (green), transfer (blue) | default, tapped/expanded, swipe-to-delete | S01, S03 |
| `NumericAmountInput` | oversized display with custom keypad | unfocused, editing, formatted with currency symbol | S02, S05, S07 |
| `PillSegmentedControl` | 2-item, 3-item, scrollable | default, active pill, disabled | S02, S05, S06 |
| `ColorSwatchPicker` | 10 curated HSL vibrant swatches | unselected, selected (ring indicator) | S06, S08, S09 |
| `FloatingActionButton` | fixed bottom-right circular action | default, pressed, hidden on scroll | S01, S03, S04 |
| `CategoryIconAvatar` | 40px circular container with custom SVG/emoji icon | default, selected border, disabled | S01, S02, S03, S04, S08 |
| `NavigationShell` | bottom navigation bar (mobile), side rail (tablet/desktop) | active tab, inactive tab | all primary views |

## Inferred data model

```
Account
  id: string (UUID, primary key)
  name: string (e.g. "Wallet", "Savings", "Checking")
  account_type: enum ("cash", "bank", "credit", "savings", "investment")
  currency: string (ISO 4217, default "USD")
  initial_balance: decimal (precision 12, scale 2)
  color: string (HEX color code)
  icon: string (icon key)
  is_archived: boolean (default false)
  created_at: timestamp
  evidence: S01 account carousel, S07 account list, Play Store multi-currency description
  confidence: high

Category
  id: string (UUID, primary key)
  name: string (e.g. "Groceries", "Dining", "Shopping", "Entertainment", "Salary")
  category_type: enum ("expense", "income")
  color: string (HEX color code)
  icon: string (vector icon name)
  is_default: boolean
  sort_order: integer
  created_at: timestamp
  evidence: S04 donut slices, S02 category picker, Play Store customizable categories
  confidence: high

Transaction
  id: string (UUID, primary key)
  account_id: string (foreign key -> Account.id)
  category_id: string (foreign key -> Category.id)
  amount: decimal (precision 12, scale 2, non-negative)
  transaction_type: enum ("expense", "income", "transfer")
  transaction_date: date (YYYY-MM-DD)
  transaction_time: time (HH:MM:SS)
  notes: text (optional memo)
  to_account_id: string (optional, foreign key -> Account.id for transfers)
  created_at: timestamp
  evidence: S01 transaction feed, S02 transaction creation form, S03 ledger
  confidence: high

Budget
  id: string (UUID, primary key)
  name: string (e.g. "Monthly Spending", "Groceries Budget")
  amount_limit: decimal (precision 12, scale 2)
  period_type: enum ("weekly", "monthly", "yearly", "custom")
  start_date: date
  end_date: date (nullable for auto-recurring cycles)
  category_ids: json_array (array of Category.id, empty/null = all categories)
  account_ids: json_array (array of Account.id, empty/null = all accounts)
  notify_threshold: decimal (e.g. 0.80 for 80% warning)
  created_at: timestamp
  evidence: S04/S05 "$500 / 1 Month beginning July 1", Play Store flexible budgeting
  confidence: high

UserSettings
  id: string (singleton "local_user")
  theme_mode: enum ("system", "light", "dark")
  accent_color: string (HEX code, default emerald green #10B981)
  default_currency: string (default "USD")
  first_day_of_week: integer (0=Sunday, 1=Monday)
  enable_biometrics: boolean (default false)
  last_backup_at: timestamp (nullable)
  created_at: timestamp
  evidence: S06 light/dark and color selection, S09 settings
  confidence: high
```

Relationships:
- `Account 1-n Transaction` (each transaction belongs to an origin account)
- `Category 1-n Transaction` (each transaction is classified under a category)
- `Budget m-n Category` (a budget tracks either all categories or a designated subset)
- `Budget m-n Account` (a budget can filter by specific accounts or apply globally)

## Feature matrix

See [features.csv](file:///c:/Users/user/Desktop/New%20folder/duplicat/fund%20trcker/replica/features.csv).
- **Must-have**: 14 (Core loop: Transaction logging, Ledger, Multi-account, Custom categories, Budgets, Gauges, Donut & Line charts, Theming, Local-first storage)
- **Should-have**: 5 (Transfers, Yearly/custom ranges, Period comparisons, CSV/JSON export & import)
- **Could-have**: 3 (Recurring subscriptions, Multi-currency rates, Biometric PIN lock)
- **Skip / Out of scope**: 3 (Google Drive OAuth sync, Commercial bank API / Plaid integration, Ad networks)

## Out of scope (cannot or should not be cloned)

- **Google Drive Private OAuth sync**: Requires proprietary Google Cloud project verification, client secrets, and OAuth consent screen approvals. Replaced with clean standard JSON/CSV file backup and restore.
- **Direct Banking / Plaid Feed Aggregation**: Requires commercial financial licenses, paid subscription services, banking aggregator NDAs, and ongoing maintenance. The core premise of Cashew is privacy-first, manual and CSV-based transaction control.
- **Third-party Advertising Networks & Analytics Trackers**: The user explicitly requested an ad-free, private personal finance tool. No Google AdMob or invasive tracking SDKs.

## Size

- **Screens**: 9 screens (S01 - S09)
- **Flows**: 5 key flows (F01 - F05)
- **Entities**: 5 data models (`Account`, `Category`, `Transaction`, `Budget`, `UserSettings`)
- **Hard parts**:
  1. Interactive Donut Chart with icons rendered on slice arcs and reactive touch selection.
  2. Dynamic Budget pace math (calculating elapsed cycle days vs spent ratio, projecting daily spending allowance).
  3. Clean cross-platform responsive layout supporting both mobile phones and tablets/desktop viewports.
  4. Local-first persistence layer with zero cloud lock-in.
- **Size**: **M** (A focused 2–3 week build; the thin vertical slice can be built in 2–3 days).
