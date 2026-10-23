# Component Specifications: FundTracker

Complete design system specifications for all UI components identified in `replica/recon.md`.
All components consume CSS design tokens defined in `replica/design/tokens.json` and `tokens.css`.

---

### 1. AccountCard
```
AccountCard
  variants  compact (carousel item 140x96px), expanded (full-width ledger card), minimal
  sizes     compact: 140px width x 96px height; expanded: 100% width x 80px height
  states    default, selected (2px solid ring, border accent), hover, negative-balance (danger tint), empty
  tokens    bg surface, border border, radius xl (20px), shadow card, font-display md/bold
  details   Displays account name (sm/medium, text), balance in integer cents formatted to local currency (lg/bold, text), 8px color swatch dot indicating account color, transaction count (xs, text-muted).
  a11y      role="button" or interactive card with aria-pressed for active filter, keyboard navigable (Enter/Space to select).
  used on   S01 (Home Dashboard Carousel), S07 (Accounts Manager)
```

---

### 2. BudgetProgressCard
```
BudgetProgressCard
  variants  monthly (gradient emerald), weekly (gradient cyan), custom (gradient indigo)
  sizes     full-width card (padding 20px, height auto ~150px)
  states    healthy (<80% spend, green accent), warning (80-99% spend, amber accent), overspent (>=100% spend, crimson danger), empty (no active budget set)
  tokens    bg surface, surface-subtle gradient, radius 2xl (24px), shadow elevated, text-display xl/800
  details   Features:
            1. Title & Remaining amount: "$124.54 left of $500" (text-xl bold).
            2. Progress Bar: 12px height track (radius-pill, bg border), fill bar (bg accent / danger), with centered percentage text ("75%").
            3. "Today" vertical tick marker positioned at `(current_day / total_days) * 100%` along the track with small black tooltip chip ("Today").
            4. Pace caption: "You can keep spending $24.91 for 3 more days" (text-sm, text-muted).
            5. History icon button in top-right corner to view past budget cycles.
  a11y      role="progressbar" with aria-valuenow, aria-valuemin="0", aria-valuemax="100", and accessible label.
  used on   S01 (Dashboard), S04 (Budgets Overview)
```

---

### 3. CategoryDonutChart
```
CategoryDonutChart
  variants  interactive (expandable slice on tap), static-preview (embedded in cards)
  sizes     mobile: 240px x 240px; desktop/tablet: 320px x 320px; inner radius 60%, outer radius 85%
  states    default, slice-hovered (expanded outer radius +6px, drop-shadow), slice-tapped (locks center info to category), empty (light grey ring)
  tokens    radius-pill, motion-spring (320ms ease), center font display xl/800, text-muted sm
  details   Constructed with pure SVG arcs.
            Embedded vector icons: Centered along the curved mid-angle of each slice `x = cx + r*cos(θ)`, `y = cy + r*sin(θ)`.
            Slices < 4% of total expenditure suppress their icon to prevent collision.
            Center hole displays total spend by default or tapped category total and percentage when a slice is active.
  a11y      role="graphics-document", SVG title & desc for screen readers, keyboard arrows to cycle through slices with aria-label describing each category and amount.
  used on   S04 (Budgets Overview), S06 (Visual Analytics)
```

---

### 4. SpendingLineGraph
```
SpendingLineGraph
  variants  gradient-area (filled below line), comparison-overlay (dashed prior-period curve)
  sizes     responsive container: 100% width x 180px height
  states    default, point-active (vertical crosshair + floating tooltip chip), empty (placeholder baseline curve)
  tokens    stroke accent (2.5px), fill accent gradient (opacity 0.25 to 0.0), stroke-grid border (dashed 1px), font mono xs
  details   Smooth Bézier interpolation curve over calendar days (e.g. Jul 1 to Jul 31).
            Left Y-axis labels with currency steps ($0, $100, $200, $300, $400).
            Bottom X-axis with key date milestones (Jul 1, Jul 9, Jul 16, Jul 24, Jul 31).
            Interactive touch/mouse scrub reveals daily transaction sum and date.
  a11y      Accessible table fallback with role="region" and aria-label="Monthly spending trend over days".
  used on   S01 (Home Dashboard), S06 (Visual Analytics)
```

---

### 5. CategoryBudgetItem
```
CategoryBudgetItem
  variants  compact list row, expanded card
  sizes     full-width x 56px height
  states    healthy (green fill bar), overspent (crimson fill bar, text-danger), zero-spend (empty track)
  tokens    bg surface, radius lg (16px), border-b border, font sm/600, font-mono sm
  details   Left: Circular CategoryIconAvatar (36px).
            Middle: Category name (text-sm font-semibold), thin 6px progress bar below.
            Right: Amount spent / Limit formatted: "$174.19 / $250" and transaction count ("7 transactions").
  a11y      Semantic list item with aria-label describing category, spend, and limit.
  used on   S04 (Budgets Overview), S05 (Budget Editor)
```

---

### 6. TransactionRow
```
TransactionRow
  variants  expense (neutral or crimson amount), income (green positive amount), transfer (blue arrows amount)
  sizes     full-width x 64px height (padding 12px 16px)
  states    default, hover, active/pressed, swipe-action (reveals delete/edit actions)
  tokens    bg surface, hover bg surface-subtle, radius md (12px), text sm/medium, text-muted xs
  details   Left: CategoryIconAvatar with category background color.
            Center: Category name (text-sm font-semibold) and notes/memo (text-xs text-muted truncate).
            Right: Signed amount in currency (e.g. `-$14.50` or `+$3,200.00`) and account badge (text-2xs pill).
  a11y      role="listitem" with aria-label e.g. "Dining expense, $14.50 from Wallet on October 23".
  used on   S01 (Dashboard Recent Activity), S03 (Transaction Ledger)
```

---

### 7. NumericAmountInput
```
NumericAmountInput
  variants  modal display with custom numeric keypad, inline numeric input
  sizes     oversized amount display: text-display (40px / 48px font-extrabold)
  states    unfocused, editing (pulsing cursor), zero (placeholder grey), error (invalid precision)
  tokens    text accent / text-danger, font-display display/800, letter-spacing -0.03em
  details   Large currency symbol prefix (`$` / `€` / `£`).
            Live integer cents formatting: As the user types digits `1`, `4`, `5`, `0`, displays `$14.50`.
            Includes quick preset adjustment chips (`+1`, `+5`, `+10`, `+50`, `Clear`).
  a11y      aria-label="Transaction amount", inputmode="decimal", auto-focus on modal mount.
  used on   S02 (Add Transaction), S05 (Budget Editor), S07 (Account Balance)
```

---

### 8. PillSegmentedControl
```
PillSegmentedControl
  variants  2-option (Expense / Income), 3-option (Monthly / Yearly / Total), multi-option
  sizes     sm (32px height), md (40px height)
  states    default, active-pill (sliding white/surface pill with shadow, text-text font-semibold), disabled
  tokens    bg surface-subtle, active-bg surface, radius pill (9999px), text sm/medium, motion-base
  details   Encapsulated container with smooth animated slider background under the active segment.
  a11y      role="radiogroup" with role="radio" and aria-checked="true|false", keyboard left/right arrow navigation.
  used on   S02 (Expense vs Income toggle), S05 (Period picker), S06 (Analytics timeframe)
```

---

### 9. ColorSwatchPicker
```
ColorSwatchPicker
  variants  horizontal scroll row, 2-row grid (5 columns x 2 rows = 10 swatches)
  sizes     each circle: 36px diameter x 36px diameter
  states    unselected (solid color circle), selected (2px offset ring, white border inside), hover (scale 1.08)
  tokens    palette 10 colors (emerald, teal, cyan, blue, indigo, violet, fuchsia, rose, amber, yellow), radius pill
  details   Selecting any swatch triggers instant CSS variable shift across the application shell (`data-accent="..."`).
  a11y      role="radiogroup", each swatch has aria-label with color name and aria-checked status.
  used on   S06 (Visual Analytics), S08 (Category Manager), S09 (Settings)
```

---

### 10. FloatingActionButton (FAB)
```
FloatingActionButton
  variants  primary circular FAB, extended FAB (with label)
  sizes     circular: 56px x 56px; extended: 48px height x auto width
  states    default, hover (elevation +2px), active/pressed (scale 0.94), hidden-on-scroll
  tokens    bg accent, text on-accent, radius pill (9999px), shadow popover, icon 24px '+'
  details   Fixed position bottom-right (`bottom-6 right-6` on mobile, bottom of content on desktop).
            Opens S02 (Add Transaction Modal) with smooth bottom-sheet spring transition.
  a11y      aria-label="Add new transaction", accessible tooltip, visible 2px keyboard focus ring.
  used on   S01 (Dashboard), S03 (Ledger), S04 (Budgets)
```

---

### 11. CategoryIconAvatar
```
CategoryIconAvatar
  variants  sm (28px), md (38px), lg (48px)
  sizes     sm: 28px; md: 38px; lg: 48px; border-radius: 50%
  states    default, selected (ring-2 ring-accent), disabled
  tokens    bg dynamic category color at 15% opacity or solid, icon color category color, radius pill
  details   Renders MIT Lucide vector icon corresponding to category (e.g. `Utensils`, `ShoppingBag`, `Car`, `Home`, `Briefcase`).
            Never uses third-party proprietary artwork.
  a11y      role="img" with aria-label describing the category.
  used on   S01, S02, S03, S04, S05, S08
```

---

### 12. NavigationShell
```
NavigationShell
  variants  mobile-bottom-bar (fixed bottom, 60px height), desktop-sidebar (left rail, 240px width)
  sizes     mobile: 100% width x 60px height; desktop: 240px width x 100vh
  states    active-tab (pill container, accent color icon + text, font-bold), inactive-tab (text-muted, hover text-text)
  tokens    bg surface, border border, font sm/600, motion-fast
  details   Tabs:
            1. Home (`/home` - icon: LayoutDashboard)
            2. Transactions (`/transactions` - icon: Receipt)
            3. Budgets (`/budgets` - icon: PieChart)
            4. Analytics (`/analytics` - icon: TrendingUp)
            5. Settings (`/settings` - icon: Settings)
            Desktop sidebar also incorporates digital clock header (Time, Day, Date) matching screenshot 09.
  a11y      nav element with aria-label="Main navigation", active tab has aria-current="page".
  used on   Global application shell across all screens
```

---

### 13. Button (Primitive)
```
Button
  variants  primary (bg accent, text on-accent), secondary (bg surface-subtle, text text), outline (border border-input), ghost, danger (bg danger, text on-accent)
  sizes     sm (32px height, text-xs), md (40px height, text-sm), lg (48px height, text-base)
  states    default, hover, active (scale 0.98), focus-visible (2px ring accent, 2px offset), disabled (opacity 0.5, cursor not-allowed), loading (spinner + aria-busy)
  tokens    radius md (12px), font-sans sm/600, motion-fast
  a11y      Native `<button type="button|submit">`, preserves accessible label during loading state.
  used on   All screens and forms
```

---

### 14. InputField (Primitive)
```
InputField
  variants  text, currency, date, search
  sizes     md (42px height), lg (48px height)
  states    default (border border-input), focus (border accent, 2px ring accent/20), error (border danger, 2px ring danger/20), disabled
  tokens    bg surface, text text, placeholder text-muted, radius md (12px), font-sans sm
  a11y      Associated `<label>`, `aria-invalid="true"` on validation failure, `aria-describedby` pointing to error message.
  used on   S02, S05, S07, S08, S09
```

---

### 15. ModalDialog / BottomSheet (Primitive)
```
ModalDialog
  variants  mobile-bottom-sheet (slides up from bottom with drag handle), desktop-centered-dialog (modal overlay)
  sizes     mobile: max-h-[90vh] with scrollable body; desktop: max-w-lg (512px) centered
  states    entering (spring slide up), open, exiting (fade + slide down)
  tokens    bg surface, radius-2xl (24px top on sheet, all corners on dialog), shadow popover, backdrop bg black/40
  a11y      role="dialog", aria-modal="true", traps focus, Escape key to close, returns focus to trigger element upon dismissal.
  used on   S02 (Add Transaction), S05 (Budget Editor), S07 (New Account), S08 (New Category)
```
