# Test Plan: FundTracker

Build: `f5f6efa`  
Date: 2026-10-23  
Environment: Local Next.js 14 Production Server (`http://localhost:3000`), Seed Data  
Target: Cashew Core Budgeting Clone

---

## Flow Test Matrix

| Case ID | Flow | Type | Steps | Expected Result | Result |
| --- | --- | --- | --- | --- | --- |
| **F01-H1** | Quick Expense Logging | Happy | Click "+ Add Transaction", enter $14.50, select "Wallet", pick "Dining", tap Save | Modal closes, $14.50 Dining row appears in movements, Wallet balance decrements by $14.50 | **PASS** |
| **F01-E1** | Quick Expense Logging | Edge | Enter zero ($0.00) or leave amount empty | Validation error message displayed; Save is blocked | **PASS** |
| **F01-E2** | Quick Expense Logging | Edge | Type large amount (e.g. $9,999.99) | Correctly formatted as $9,999.99 with integer-cents (999999) stored without float rounding | **PASS** |
| **F01-N1** | Quick Expense Logging | Negative | Submit expense with negative amount via API or modified input | Server Zod validation rejects with 400 Bad Request | **PASS** |
| **F02-H1** | Create Monthly Budget | Happy | Open `/budgets`, tap "New Budget", enter $500, period Monthly, 80% threshold, tap Save | Budget card generated with live progress gauge, Today marker, and daily burn pace | **PASS** |
| **F02-E1** | Create Monthly Budget | Edge | Set budget cap ($200) lower than current month's actual spend ($398) | Instantly enters overspent state with crimson warning badge and overspend allowance calculation | **PASS** |
| **F02-N1** | Create Monthly Budget | Negative | Create budget with empty name or negative cap | Validation error displayed; creation prevented | **PASS** |
| **F03-H1** | Inspect Category Spending | Happy | Open `/analytics`, inspect SVG donut chart, tap "Groceries" slice | Donut center updates to show Groceries total, percentage (44%), and highlights legend chip | **PASS** |
| **F03-E1** | Inspect Category Spending | Edge | Small category slice (<4% of total spend) | Arc renders smoothly, internal icon suppressed to prevent label collision | **PASS** |
| **F03-E2** | Inspect Category Spending | Edge | Hover/touch data points along the velocity curve | Tooltip scrub reveals exact date and cumulative expenditure | **PASS** |
| **F04-H1** | Add Financial Pool | Happy | Open `/accounts`, tap "Add Pool", enter "Vacation Vault", Savings, $1,500, Emerald | Account card created, Net Worth increments by $1,500 immediately | **PASS** |
| **F04-E1** | Account Transfer | Edge | Select "Transfer", pick source "Savings" and destination "Wallet", enter $200 | Savings decreases by $200, Wallet increases by $200, Net Worth remains constant | **PASS** |
| **F04-N1** | Account Transfer | Negative | Select same source and destination account for a transfer | Validation blocks transfer with "Source and destination must be different" | **PASS** |
| **F05-H1** | Theme & Hues Switch | Happy | Open `/settings`, select Dark theme, pick "Royal Blue" accent swatch | Entire app updates to dark background (`#0c110e`) with royal blue accents (`#1d4ed8`); persists on reload | **PASS** |
| **F05-E1** | Data Backup & Restore | Edge | Click "Export JSON Backup" and "Export CSV Ledger" | Browser downloads clean `.json` snapshot and RFC-4180 compliant `.csv` ledger | **PASS** |

---

## Test Execution Summary
- **Total Cases Planned**: 15 cases across flows F01 through F05
- **Automated / Unit / Integration Checks**: 15 / 15 Passed
- **WCAG Contrast Pairs**: 23 / 23 Passed AA & AAA
- **Open S1 / S2 Severity Blockers**: 0
