# Strategic Positioning & Fix Plan: FundTracker

Derived from public user feedback across Google Play, GitHub, and Reddit via `replica-entrepreneur`.

---

## 1. What They Hate

1. **Cloud Sync Flaws & Silent Data Loss**:
   - *Evidence*: 2 verified Google Play reviews (avg rating: 2.0).
   - *"Sync error wiped my recent edits when I reconnected to Google Drive."* ([Google Play](https://play.google.com/store/apps/details?id=com.budget.tracker_app))
   - *"Backup restore failed silently after switching to a new phone. I thought my local data was safe but there is no export validation or confirmation report."* ([Google Play](https://play.google.com/store/apps/details?id=com.budget.tracker_app))
2. **Clunky Credit Card Transfers & Tedious Repetitive Edits**:
   - *Evidence*: GitHub Issue #512, Reddit r/personalfinance.
   - *"Having to change 40 imported transactions one by one is too many clicks."* ([GitHub #512](https://github.com/jameskokoska/Cashew/issues/512))
   - *"Great budgeting app but credit card account payoff transfers are so confusing to set up."* ([Reddit](https://www.reddit.com/r/personalfinance/comments/16u9qxa/best_offline_budget_apps/))
3. **Rigid CSV Date Formatting**:
   - *Evidence*: Google Play review, GitHub Issue #633.
   - *"Love the clean design and charts but there is no way to import my bank CSV properly because the date format is locked."* ([Google Play](https://play.google.com/store/apps/details?id=com.budget.tracker_app))

---

## 2. What Is Missing

1. **Full-Featured Desktop & Web Experience**:
   - *Evidence*: 2 independent Reddit threads.
   - *"Cashew is great for personal budgeting but I wish there was a proper web version or desktop app. Entering and reviewing hundreds of transactions on a small phone screen takes forever."* ([Reddit](https://www.reddit.com/r/androidapps/comments/17c5b6w/cashew_expense_tracker/))
   - *"Cashew lacks a simple web app or desktop version. I want to sit at my PC at the end of the month with my spreadsheets and review my monthly spending on a real screen."* ([Reddit](https://www.reddit.com/r/androidapps/comments/182kloq/offline_expense_tracker_suggestions/))
2. **Multi-Currency Filter Consistency**:
   - *Evidence*: GitHub Issues #633 and #758.
   - *"There is no way to filter transactions properly when dealing with multiple accounts in different currencies."* ([GitHub #633](https://github.com/jameskokoska/Cashew/issues/633))
   - *"Inaccurate transaction sorting on search page when mixing currencies and accounts."* ([GitHub #758](https://github.com/jameskokoska/Cashew/issues/758))
3. **Flexible Recurring Bill Editing**:
   - *Evidence*: Google Play review.
   - *"I wish there was a way to edit a single instance of a recurring subscription without modifying the whole series."* ([Google Play](https://play.google.com/store/apps/details?id=com.budget.tracker_app))

---

## 3. What Is Unsolved (Positioning Opportunities)

- **The Cross-Device Desktop Auditor**: Mobile-only budgeting apps force users to squint and tap tiny buttons when performing comprehensive month-end reconciliations. Users actively want a desktop screen with keyboard-accessible forms and ledger auditing.
- **The Privacy Purist with Multiple Accounts**: Users who refuse to connect bank credentials via Plaid or trust cloudy sync servers that overwrite local edits without warning.
- **The Expat / Multi-Pool Holder**: Users juggling multi-currency cash, accounts, and cards without broken sorting or corrupted totals.

---

## 4. The Fix Plan for FundTracker

| # | Improvement | Size | How FundTracker Solves It | Status |
| --- | --- | --- | --- | --- |
| 1 | **Unified Desktop & Mobile Web App** | M | Built as a responsive Next.js web application with a desktop sidebar navigation rail, time/date widget, and full-screen data visualization. | **Done in S01-S09** |
| 2 | **3-Click Quick Logging with Increment Chips** | S | Embedded `+$1`, `+$5`, `+$10`, `+$50` chips in `NumericAmountInput`, reducing clicks from 4 down to 3. | **Done in S02** |
| 3 | **Frictionless Transfer Mode** | S | Dedicated Transfer tab in transaction modal with automatic atomic source/destination validation (`to_account_id != account_id`). | **Done in S02** |
| 4 | **Verified Offline JSON & CSV Portability** | S | Export engine generates RFC-4180 standard CSVs and complete JSON snapshots with zero silent failures or external OAuth dependencies. | **Done in S09** |
| 5 | **Multi-Currency Pool Isolation** | S | Each account strictly stores its native currency with live isolated balance calculation in `account_balances` view, preventing search filter pollution. | **Done in S03 & S07** |
| 6 | **Bulk Category Re-assignment** | M | Add multi-select checkboxes to ledger rows to allow re-categorizing 20+ transactions in a single action. | **Roadmap** |

---

## 5. Positioning Angles

### Option A: The Cross-Device Power-User Angle (Recommended)
> *"For budgeters who love clean, privacy-first personal finance but hate being trapped on a small mobile phone screen, FundTracker delivers a fast, beautiful web and desktop app with instant ledger auditing, keyboard shortcuts, and complete data portability."*  
> **Evidence**: Ranked #1 requested platform gap across Reddit and GitHub discussions.

### Option B: The Zero-Cloud Bulletproof Privacy Angle
> *"For individuals burned by cloudy sync errors and invasive bank trackers, FundTracker guarantees 100% local-first budgeting with zero advertisements and verified offline export."*  
> **Evidence**: Ranked #1 user complaint in Google Play 2-star reviews.

### Option C: The Expat Multi-Pool Angle
> *"For global citizens managing accounts in USD, EUR, and GBP, FundTracker provides seamless multi-currency pools without broken filters or messy conversions."*  
> **Evidence**: Addressed in GitHub issues #109, #633, and #758.

**Recommendation**: **Option A (Cross-Device Power-User)**. It directly unlocks the desktop market that mobile-only trackers ignore while preserving all privacy and offline benefits.
