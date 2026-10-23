# Deploy Checklist: VaultPace

- **Date**: 2026-10-23
- **Commit**: `800593f`
- **Application**: VaultPace (Privacy-First Personal Budget & Pace Tracker)
- **Deployment Status**: Preflight All Gates Passed (Ready for User Production Go)

---

## 1. Preflight Gates (All Must Pass)

| Check | Requirement | Result | Status |
| :--- | :--- | :--- | :--- |
| **Automated Test Suite** | All e2e and domain flow tests passing | `4 of 4 tests passing` (Transaction math, Budget alerts, Account isolation, Category taxonomy) | **PASS** |
| **Open Bugs** | No open S1 (blocker) or S2 (critical) bugs | 0 open S1/S2 bugs (`replica/bugs.md` verified clean) | **PASS** |
| **Feature Parity** | Must-haves 100%, score >= 80% | **93.6 / 100** (Must-haves: 14 of 14 completed, 100%) | **PASS** |
| **Rebrand Sweep** | `sweep.py` exit 0 (clean of original assets/names) | Clean. Zero references to target name, domain, or colors. | **PASS** |
| **Store Listing Linter** | `listing.py` exit 0 (limits, claims, avoid list) | `0 errors, 0 warnings` (App Store & Google Play metadata valid) | **PASS** |
| **Production Build** | `npm run build` exits 0 | `Compiled successfully`, 19 of 19 static/dynamic routes generated | **PASS** |
| **Privacy & Legal** | 100% telemetry-free, zero third-party trackers | Stated in footer, settings, and landing page; RFC-4180 export verified | **PASS** |
| **Data Deletion** | Local-first reset and deletion functional | Reset Ledger function tested in Settings (`fundtracker_state_v1` wipe) | **PASS** |
| **Brand Assets** | Fresh styling, custom palette, unique SVG icons | Deep Emerald theme, Lucide icons, custom shield-pace logo brief | **PASS** |

---

## 2. Production Services & Environment Setup

### A. Database (Supabase PostgreSQL)
1. Create a dedicated production project in Supabase: `vaultpace-prod`.
2. Execute schema migration script:
   ```bash
   psql "$DATABASE_URL" -f replica/schema.sql
   ```
3. Verify RLS policies are enabled on all 8 tables (`users`, `accounts`, `categories`, `budgets`, `budget_categories`, `budget_accounts`, `transactions`, `recurring_rules`) and the `account_balances` view.
4. Ensure automated daily backups are active in Supabase Project Settings > Database > Backups.

### B. Environment Variables (.env.production)
Configure these secrets in your deployment dashboard (e.g. Vercel Project Settings > Environment Variables):

```ini
# Application URL
NEXT_PUBLIC_APP_URL=https://vaultpace.app

# Supabase Production Database
DATABASE_URL=postgres://postgres:[PROD_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...[PROD_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...[PROD_SERVICE_KEY]

# Stripe Live Mode Credentials
STRIPE_SECRET_KEY=sk_live_51...[PROD_LIVE_SECRET]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51...[PROD_LIVE_PUBLISHABLE]
STRIPE_WEBHOOK_SECRET=whsec_...[PROD_LIVE_WEBHOOK_SECRET]

# Stripe Live Price Identifiers
NEXT_PUBLIC_STRIPE_PRICE_LIFETIME=price_1Psupporter_live
NEXT_PUBLIC_STRIPE_PRICE_SYNC_MONTHLY=price_1Psync_monthly_live
NEXT_PUBLIC_STRIPE_PRICE_SYNC_ANNUAL=price_1Psync_annual_live

# Optional Cron Authentication (for automated budget overspend notifications)
CRON_SECRET=[SECURE_RANDOM_UUID_OR_TOKEN]
```

### C. Stripe Live Activation
- Toggle Stripe Dashboard to **Live Mode**.
- Create the 3 products documented in `replica/launch/pricing.md`.
- Register Webhook Endpoint:
  - **URL**: `https://vaultpace.app/api/webhooks/stripe`
  - **Events to Listen**: `checkout.session.completed`, `customer.subscription.deleted`, `customer.subscription.updated`
- Perform a live $14.99 test checkout using a real credit card, verify supporter badge unlocks in Settings, and execute an immediate test refund in Stripe dashboard.

---

## 3. Host & Domain DNS Configuration

### Target Host: Vercel (or Cloudflare Pages)

1. Connect GitHub repository `fund-tracker` / `vaultpace` to Vercel.
2. Select Framework Preset: **Next.js**.
3. Set Root Directory: `./`.
4. Deploy branch `master`.

### Domain Records (to be configured at registrar for `vaultpace.app`):

| Type | Name / Host | Target Value | TTL | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **A** | `@` (Apex) | `76.76.21.21` (Vercel Apex IP) | 3600 | Points apex domain to Vercel CDN |
| **CNAME** | `www` | `cname.vercel-dns.com` | 3600 | Points www subdomain to Vercel |
| **TXT** | `@` | `v=spf1 include:_spf.mx.cloudflare.net ~all` | 3600 | SPF email authorization |
| **TXT** | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@vaultpace.app` | 3600 | DMARC report monitoring |

*Domain routing*: Canonical host set to `https://vaultpace.app`. Any request to `http://` or `www.` automatically issues a 301 redirect with automatic Let's Encrypt SSL/TLS.

---

## 4. Post-Launch Observability & Watch Plan

### Week 1 Monitoring Metrics:
1. **API Uptime & Edge Latency**:
   - Configure BetterStack / UptimeRobot monitor pinging `https://vaultpace.app/api/cron/budget-check` every 5 minutes (HTTP 200 / 401 expected).
2. **Error Tracking**:
   - Sentry monitoring with zero PII logging. Scrub `amount`, `notes`, `account_name`, and user emails.
3. **Core Transaction Flow Live Verification**:
   - Step 1: Open `https://vaultpace.app/home` on desktop Chrome.
   - Step 2: Open `https://vaultpace.app/home` on mobile Safari / Android Chrome.
   - Step 3: Record an expense of `$12.50` in "Groceries" using the quick chips (`+$10`, `+$1`, `+$1`, `+0.50`).
   - Step 4: Verify "Today" pace marker recalculates instantly.
   - Step 5: Export ledger as CSV, verify all fields conform to RFC-4180 in Excel / Google Sheets.
   - Step 6: Test offline flight mode: turn off Wi-Fi, add a cash expense, reconnect Wi-Fi, verify zero data loss.
