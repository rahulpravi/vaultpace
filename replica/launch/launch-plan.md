# VaultPace: Go-To-Market Launch Plan

---

## 1. Pre-Launch Beta & Waitlist Infrastructure

- **Waitlist Channel**: Lightweight email capture on `vaultpace.app` (powered by self-hosted Listmonk or privacy-compliant Formspark).
- **Target Beta Cohort**: 50 active personal finance power users who maintain multi-account spreadsheets and track daily burn rates.
- **Privacy-First Observability**:
  - Telemetry: Zero third-party ad tracking or session replay cookies.
  - Optional Error Monitoring: Sentry (configured with strict `sendDefaultPii: false`, scrubbing all financial numbers, account names, and amounts).
  - Web Analytics: Privacy-friendly cookieless analytics (Plausible or Cloudflare Web Analytics).

---

## 2. Community Distribution Channels (Where Unhappy Users Gather)

Derived from verified user research in `replica/fixes.md` and `replica/feedback.md`:

1. **Reddit: r/personalfinance (18M+ members)**
   - Target Discussion: Monthly "Best offline budgeting tools" and "YNAB alternatives without $100/yr price tags".
   - Pitch Angle: Zero cloud sync corruption, 100% offline local storage, and instant desktop ledger review.
2. **Reddit: r/androidapps & r/iosapps**
   - Target Discussion: Offline expense trackers with web/desktop companions.
   - Evidence: Users explicitly asking: *"Cashew is great for personal budgeting but I wish there was a proper web version or desktop app"* ([Reddit](https://www.reddit.com/r/androidapps/comments/17c5b6w/cashew_expense_tracker/)).
3. **Reddit: r/budget**
   - Target Discussion: Daily burn rate calculations, envelope pacing, and envelope budgeting methods.
4. **GitHub Open Source Community**
   - Reaching users frustrated with unmerged multi-currency filter issues (Issues #512, #633, #758).

---

## 3. Launch Posts

### A. Hacker News: "Show HN"

**Title**: Show HN: VaultPace – A fast, offline-first personal budget tracker with burn-rate pacing

**Body**:
> Hi HN,
>
> Like many here, I got tired of modern personal finance apps demanding my bank passwords, charging $15/month subscriptions, and failing to work when I didn't have cell service.
>
> Most offline budgeting apps have the opposite problem: they only exist on a small 6-inch phone screen, making month-end reconciliations of 200+ transactions painful.
>
> I built **VaultPace** (`https://vaultpace.app`):
> - **Cross-Device Web & Desktop**: A responsive Next.js desktop experience with full-width ledger tables and keyboard navigation.
> - **Visual Pace Indicator**: A real-time "Today" marker on your budget progress bars that compares your actual spend against the expected daily burn rate for the month.
> - **100% Local-First Storage**: Your transactions and account balances stay in your browser/device storage. No Plaid, no third-party data aggregators, no advertising.
> - **3-Click Quick Logging**: Instant increment chips (`+$1`, `+$5`, `+$10`, `+$50`) to capture cash or card transactions in seconds.
> - **Zero Vendor Lock-In**: 1-click export to standard RFC-4180 CSV and JSON.
>
> Core budgeting is completely free with zero ads. There is an optional $14.99 one-time supporter badge for anyone wanting to fund ongoing development.
>
> Try the live web version without signing up: https://vaultpace.app/home
>
> Would love your feedback on the pacing charts and offline performance!

---

### B. Product Hunt Launch

- **Tagline**: The fast, privacy-first budget tracker with visual burn-rate pacing.
- **Topics**: Personal Finance, Productivity, Privacy, Web Apps.
- **First Maker Comment**:
  - Introduce the problem: Why mobile-only expense tracking creates month-end friction.
  - Highlight the 3 core differentiators: (1) Desktop-first audit ledger, (2) The "Today" burn-rate marker, (3) 100% local-first privacy with no bank logins.
  - Special launch offer: 20% discount on Lifetime Supporter for Product Hunt community using code `PHLAUNCH`.

---

## 4. The First 10 Beta Users (High-Touch Onboarding)

| # | Archetype | Recruitment Source | Key Validation Goal |
| :--- | :--- | :--- | :--- |
| 1-3 | **The Desktop Reconciler** | Reddit r/androidapps power users | Validate CSV export and desktop full-width ledger auditing speed. |
| 4-5 | **The Privacy Purist** | Mastodon / Hacker News privacy threads | Verify that zero external network calls occur during offline budgeting. |
| 6-7 | **The Multi-Account Holder** | Reddit r/personalfinance | Test transfer workflows between checking, credit cards, and cash. |
| 8-9 | **The Burn-Rate Budgeter** | r/budget power budgeters | Evaluate clarity of the "Today" marker on weekly and monthly envelopes. |
| 10 | **The Expat / Multi-Currency User** | Digital nomad Slack communities | Verify isolated currency pools for mixed USD/EUR transactions. |

### Feedback Protocol
- Conduct 15-minute async Loom or screen-share review with each user after their first month-end reconciliation.
- Track 3 core metrics: Time to log an expense (< 4 seconds), Monthly reconciliation duration (< 10 minutes), and Export confidence (100% data integrity).
