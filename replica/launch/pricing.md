# VaultPace: Pricing Strategy & Benchmarking

---

## 1. Competitive Benchmarking Table

| Product | Pricing Model | Monthly Rate | Annual Rate | Lifetime Option | URL | Date Verified |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Cashew** (Original) | Freemium (Ads in Free) | ~$1.99/mo | ~$11.99/yr | ~$14.99 one-time | [Play Store](https://play.google.com/store/apps/details?id=com.budget.tracker_app) | Oct 2024 |
| **YNAB** (You Need A Budget) | Subscription only | $14.99/mo | $99.00/yr | None | [ynab.com/pricing](https://www.ynab.com/pricing) | Oct 2024 |
| **EveryDollar** | Freemium / Paywall | $17.99/mo | $79.99/yr | None | [ramseysolutions.com](https://www.ramseysolutions.com/ramseyplus/everydollar) | Oct 2024 |
| **Wallet by BudgetBakers** | Freemium | $5.99/mo | $21.99/yr | $39.99 one-time | [budgetbakers.com](https://budgetbakers.com) | Oct 2024 |
| **VaultPace** (Our App) | **Free Core + Fair Supporter** | **$0** (Free Core) | **$29.99/yr** (Cloud Sync) | **$14.99** (Lifetime Supporter) | `vaultpace.app/pricing` | Oct 2024 |

---

## 2. Reviewer Evidence on Price & Billing

From `replica/feedback.md`:
- **Theme: Price and Paywalls** (2 reviews, avg rating 3.0 / 5.0):
  - Users expressed frustration with recurring subscription traps for simple offline tools, and a lack of transparency around upcoming billing dates.
- **Theme: Billing, Cancelling & Refunds** (1 review):
  - In-app purchases tied to app store accounts make cross-platform access (e.g. Android to Web or iOS) fragmented, resulting in double-charging or lost licenses.

---

## 3. The VaultPace Pricing Model

VaultPace rejects the industry trend of locking basic budgeting features (like accounts, categories, or CSV exports) behind predatory $15/month subscriptions.

### Tier 1: Free Offline Core ($0 Forever)
- **Target Audience**: Everyone wanting a private, lightning-fast expense tracker.
- **Inclusions**:
  - Unlimited transactions, accounts, and custom categories.
  - Full-featured weekly and monthly budgets with "Today" pace indicator.
  - Interactive SVG donut charts and 30-day velocity graphs.
  - Full desktop & mobile web responsive interface.
  - 100% offline local-first storage (zero bank login required).
  - RFC-4180 CSV & JSON one-click export.
  - **Zero ads and zero tracking**.

### Tier 2: Lifetime Supporter ($14.99 One-Time)
- **Target Audience**: Power users and financial privacy advocates who want to support independent development.
- **Inclusions**:
  - All Free Core features.
  - Permanent "Supporter" badge on profile & settings.
  - 10 custom aesthetic swatch accents (including Midnight Emerald, Solar Amber, Rose Gold).
  - Priority feature requests and early desktop app builds.
  - **No recurring fee ever**.

### Tier 3: Cloud Sync Optional ($3.99 / mo or $29.99 / yr)
- **Target Audience**: Multi-device users needing real-time automated backup across phone, tablet, and PC.
- **Inclusions**:
  - All Supporter features.
  - End-to-end encrypted backup relay.
  - Automatic cross-device sync.
  - Annual plan includes 2 months free ($29.99/yr vs $47.88/yr).

---

## 4. Fixing Billing Complaints

1. **One-Click Self-Serve Cancellation**: Users can cancel subscriptions anytime directly in `Settings > Subscription` with a single click via Stripe Customer Portal. No contacting support, no retention quizzes.
2. **Advance Renewal Notices**: For annual subscribers, automated emails are triggered 7 days prior to renewal.
3. **Cross-Platform License Portability**: A single Supporter or Sync purchase is linked to the user's account and recognized across Web, macOS, Windows, and mobile apps.

---

## 5. Stripe Configuration Specifications

To be configured by the project owner in the Stripe Dashboard:

### Product 1: VaultPace Lifetime Supporter
- **Type**: One-time product
- **Name**: `VaultPace Lifetime Supporter`
- **Price**: `$14.99 USD` (One-time)
- **Stripe Price ID**: `price_supporter_lifetime` (Placeholder: `price_1Psupporter_live`)
- **Metadata**: `{ "plan": "supporter", "tier": "lifetime" }`

### Product 2: VaultPace Cloud Sync (Monthly)
- **Type**: Recurring subscription
- **Name**: `VaultPace Cloud Sync (Monthly)`
- **Price**: `$3.99 USD / month`
- **Stripe Price ID**: `price_sync_monthly`
- **Metadata**: `{ "plan": "sync", "interval": "month" }`

### Product 3: VaultPace Cloud Sync (Annual)
- **Type**: Recurring subscription
- **Name**: `VaultPace Cloud Sync (Annual)`
- **Price**: `$29.99 USD / year`
- **Stripe Price ID**: `price_sync_annual`
- **Metadata**: `{ "plan": "sync", "interval": "year" }`
