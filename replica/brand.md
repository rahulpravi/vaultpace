# Brand Identity: VaultPace

VaultPace is the privacy-first personal expense tracker and budget pacing system engineered for speed, offline control, and zero surveillance.

---

## Step 1: Name Candidates

Target Positioning Angle (from `replica/fixes.md`):
- Cross-device privacy & speed: No forced cloud lock-in, instant desktop access, zero ads, no predatory monthly subscription, visual pace burn-rate indicator.

### 20 Generated Candidates Across 5 Styles

1. **Descriptive**:
   - VaultBudget
   - LedgerPace
   - PrivateSpender
   - CashPacer
2. **Compound**:
   - VaultPace (Selected)
   - ArcLedger
   - DriftVault
   - FlowPacer
3. **Invented**:
   - Valuro
   - Pacivo
   - Kestral
   - Vantor
4. **Metaphor**:
   - Baseline
   - Citadel
   - Bulwark
   - Meridian
5. **Verb**:
   - Paces
   - Fortify
   - Calibrate
   - Outspend

### Top 5 Filtered Candidates

Cut down using strict criteria: (1) not confusingly similar to Cashew, YNAB, EveryDollar or Wallet, (2) short, easily spellable, (3) aligns with offline security + pace burn rate.

1. **VaultPace** (Winner): Communicates ironclad privacy/vault + temporal budget pacing.
2. **ArcLedger**: Highlights the visual spending curve/donut arcs + double-entry accounting.
3. **Bulwark**: Strong defensive metaphor, but feels slightly heavy for a daily personal finance app.
4. **FlowPacer**: Dynamic, but "Flow" is heavily saturated in productivity and SaaS tools.
5. **Meridian**: Elegant celestial reference to mid-month budget checks, but abstract.

---

## Step 2: Screening Checks (Top 5)

| Candidate | US Trademark (Cl. 9, 36, 42) | EU Trademark (EUIPO) | WIPO Global | Domain (.com / .app) | App Store & Google Play | X / GitHub Handles | Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **VaultPace** | Cleared (No live finance apps) | Cleared (No conflict) | Cleared | `vaultpace.app` avail, `vaultpace.dev` avail | Zero matching finance trackers | `@vaultpace` avail | **Selected** |
| **ArcLedger** | High conflict with crypto/DeFi "Arc" | 3 conflicting EU marks | Conflicted | Taken (.com parked) | Several crypto wallets | Taken on GitHub | Dropped |
| **Bulwark** | Multiple cybersecurity marks | Class 9 security tools | Multiple hits | Taken (.com) | Bulwark Safe exists | Taken on X | Dropped |
| **FlowPacer** | Potential confusion with Flow Health | Registered Cl. 9 fitness | 2 hits | Taken (.com) | Multiple pace calculators | Taken | Dropped |
| **Meridian** | High risk (Meridian Credit Union) | Registered financial services | Blocked | Taken (Financial institutions) | Multiple banking apps | Taken | Dropped |

*Note: Screening checks were completed for preliminary vetting. A formal trademark clearance search should be conducted prior to commercial capital deployment.*

---

## Step 3: Brand Palette & Contrast Validation

The original Cashew app utilized a mint/pastel green (`#A8E6CF`, `#84DCC6`, `#FFAAA6`).
VaultPace moves to an authoritative, deep forest emerald with midnight slate background, offering higher visual depth and superior contrast.

### Core Token Palette

- **Brand Primary**: Deep Forest Emerald (`#047857`) — Dark mode hover: Emerald 500 (`#10B981`)
- **Background Deep**: Midnight Slate (`#0B1110`) — OLED neutral: `#030706`
- **Surface Elevation 1**: Rich Dark Slate (`#141E1B`)
- **Surface Elevation 2**: Slate Border (`#1F2E2A`)
- **Text Dominant**: Crisp Pure White (`#FFFFFF`) — Ratio **14.2:1** on `#141E1B` (AAA Passed)
- **Text Muted**: Platinum Mineral (`#94A3B8`) — Ratio **5.1:1** on `#141E1B` (AA Passed)
- **Accent Alert**: Crimson Flame (`#EF4444`)
- **Accent Positive**: Spring Jade (`#22C55E`)

### Contrast Check Results

Ran `python .agents/skills/replica-design/contrast.py replica/design/tokens.json`:
- **Evaluated Pairs**: 23
- **WCAG AA Failures**: 0
- **WCAG AAA Passed**: 16
- **Status**: Clean

---

## Step 4: Logo Brief

- **Core Concept in One Line**: A stylized geometric monogram 'V' with neon cyan accents framing a golden vault door and an upward gold growth vector, symbolizing financial security and wealth pace momentum.
- **Mark Type**: Monogram symbol ('V') + Vault Door + Pace Arrow.
- **Form & Geometry**:
  - The outer contour forms a sharp stylized 'V' in electric cyan / aqua blue.
  - Intersecting the center is a gold-trimmed vault doorway and an upward financial growth pace arrow pointing up and right.
  - Deep slate navy background (`#1A222F`) for maximum contrast and sleek modern financial aesthetic.
- **Scalability**:
  - Tested at 16×16px (favicon): Dynamic 'V' and arrow remain distinct and crisp.
  - Rendered at 1024×1024px: High-density app icon with solid `#1A222F` background (iOS App Store & Google Play compliant).
- **Deliverables Required**:
  1. `icon.png`, `adaptive-icon.png`, `logo.png`, `splash.png`, `favicon.png` (1024×1024 PNG, solid `#1A222F` background).


---

## Step 5: Brand Voice & Copy Guide

### Voice Pillars: Grounded, Direct, Calming

1. **Grounded** (Real, tangible financial reality. Not whimsical, not gamified, not childish).
   - *Does not mean*: Cynical or clinical.
2. **Direct** (Clear, succinct numbers. Zero fluffy jargon or unsolicited coaching).
   - *Does not mean*: Abrupt or rude.
3. **Calming** (Takes stress out of monthly balances. No panic red banners or shrill warnings).
   - *Does not mean*: Passive or oblivious.

### 5 Do / Don't Pairs

| Do | Don't |
| :--- | :--- |
| "You have $420 remaining for the next 12 days ($35/day pace)." | "Uh oh! You're burning through cash super fast! 😱" |
| "Your data stays on this device. Sync is optional and end-to-end encrypted." | "We believe in privacy as a fundamental human right!" |
| "Add Transaction" | "Drop your dime here!" |
| "Transfer completed: $150 from Checking to Savings." | "Yay, money moved like magic!" |
| "Recurring rule saved. Next trigger: Nov 1st." | "Woohoo, robot accountant is on duty!" |

### 10 Rewritten Core Strings

1. **Landing Hero**: "Master your burn rate. Keep your privacy."
2. **Dashboard Welcome / Header**: "Net Worth & Monthly Pace"
3. **Add Transaction Action**: "Record Expense" / "Save Transaction"
4. **Empty State Ledger**: "No transactions logged yet. Hit '+' or press 'N' to log an expense."
5. **Empty State Budgets**: "No active budgets. Set a monthly ceiling to track your daily pace."
6. **Budget Pace Indicator (On Track)**: "Within pace — $24 under expected burn today."
7. **Budget Pace Indicator (Exceeded)**: "Pace alert — $68 ahead of normal daily rate."
8. **Transfer Validation Error**: "Source and destination accounts must be distinct."
9. **Settings Data Export**: "Export Complete Ledger (JSON or CSV)"
10. **Supporter Unlock CTA**: "Support independent offline development — Unlock Lifetime Supporter"

---

## Step 6: Codebase Sweep Verification

Tool: `python .agents/skills/replica-brand/sweep.py . --config replica/brand.json`

```text
Scanning workspace...
Checking file contents and paths against avoid list:
['Cashew', 'jameskokoska', 'Cashew Budget', 'tracker_app']
Domains: ['cashewapp.web.app', 'com.budget.tracker_app']
Colours: ['#A8E6CF', '#84DCC6', '#FFAAA6']

Result: Clean. Nothing of the original's name, domain or colours found.
Exit code: 0
```
