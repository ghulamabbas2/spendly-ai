# Spendly AI — UI Specification

**Reference prototype:** https://claude.ai/design/p/b9ffa84d-218a-42ba-ae97-b3134378b81a?file=Spendly+AI.dc.html&via=share — match the corresponding screen when building any UI.

Screen-by-screen and component-by-component reference for the React Native build. Token names refer to `design-system.md`. Values marked **TBD** are not defined by the prototype.

App is **signed-in by default** — no auth/onboarding screens exist yet (**TBD**). Currency is USD; sample data represents a family household. Today's date in the prototype is **Aug 8, 2026**.

---

## 1. Navigation model

### 1.1 Bottom tab bar + FAB

- Persistent bar, height 76px, `color.surface`, `shadow.nav`, anchored to bottom.
- **Four tabs**, left→right: **Home**, **Chat**, *(FAB gap)*, **Insights**, **Profile**.
- Each tab: Material icon (25px) + 10.5px/700 label, stacked. Active = `color.primary`; inactive = `color.navInactive`.
- Tab icons: `home`, `chat_bubble`, `bar_chart`, `person`.
- **Center FAB**: 62px circle, `gradient.brand`, 5px `color.background` border ring, `shadow.fab`, raised (sits 44px from bottom, overlapping above the bar). Icon `add` (32px). Tap → **Add Expense** sheet.

**Tab bar visibility:** shown only on the four top-level screens (Home, Chat, Insights, Profile) **and** only when no sheet/modal is open. Hidden on pushed sub-screens (Categories, Expense Detail) and while any overlay is open.

### 1.2 Overlay types

| Type | Enter | Dismiss | Examples |
|---|---|---|---|
| Bottom sheet | Slide up `motion.sheet`, scrim fade `motion.fade` | Tap scrim, or close/save | Add Expense, Category Picker |
| Center modal | `motion.msgIn` + scrim | Tap scrim (tap card = no-op) | Calendar / date picker |
| Pushed screen | Instant (native transition **TBD**) | Back arrow → Home | Categories, Expense Detail |

Category Picker and Calendar can stack **on top of** the open Add Expense sheet (z-order: sheet < picker/calendar).

### 1.3 Status bar

Mock status bar (46px): time `9:41`, and `signal_cellular_alt` / `wifi` / `battery_full` icons. Replace with native status bar in build.

---

## 2. Screens

### 2.1 Home (dashboard)

**Route:** `home` (default). Scrollable.

| Section | Contents |
|---|---|
| Header | Avatar circle (initials "AM", `gradient`/primary), "Good morning" + user name; notification bell button (circular, `shadow.iconButton`). |
| Hero card | `gradient.brandCard`, `shadow.heroCard`. Contains: period toggle, "Total spent · {period}", large total (`text.display`), comparison pill + transaction count. |
| Period toggle | Segmented control (Week / Month / Year) on translucent white track. Active segment = white bg / primary text. Changing it recomputes total, comparison, and count. Default = **Month**. |
| Comparison pill | Icon (`trending_up`/`trending_down`/`trending_flat`) + "±N% vs last {period}". Shows "No prior data" when previous period is empty. |
| Top categories card | "Top categories" + "View all" (→ Insights). Up to **4** rows: icon chip, name, amount, and a proportional bar (widths normalized to the largest). |
| Recent transactions card | Up to **8** most-recent rows (all-time, newest first), independent of the period filter. |

**Transaction row:** icon chip (category tint + color), title, "{category} · {short date}" (e.g. "Groceries · Jul 11"), amount. Whole row is tappable → Expense Detail. Hover/press → `#f6f7f9` background.

---

### 2.2 Add Expense (bottom sheet)

**Trigger:** FAB. Also reused for **Edit** (prefilled; title "Edit Expense", CTA "Save changes").

| Field | Control | Notes |
|---|---|---|
| Amount | Large centered numeric input, "$" prefix, placeholder `0.00` | Filters to digits + `.` (`inputmode=decimal`). |
| Category | Tappable row → opens Category Picker | Shows selected icon/name, or "Select category" (muted) when empty. |
| Note | Text input inside a field row | Placeholder "What was it for?"; optional. |
| Date | Tappable row → opens Calendar | Defaults to **today**; displays e.g. "Aug 8, 2026". |
| Save | Full-width button | **Disabled** (grey `#e6e8ee` / `#a2a8b4` text) until amount > 0 **and** a category is chosen; enabled = `gradient.brand`. |

**Save behavior:** if editing, updates the existing transaction; otherwise prepends a new transaction (title = note, or category name when note is blank). Then closes the sheet and returns to **Home** with the item on top.

Dismiss: tap scrim or the close (×) button — no save.

---

### 2.3 Category Picker (bottom sheet)

- Title "Choose category". 2-column grid of all categories (icon chip + name).
- Selected category shows a colored border + tinted background.
- Footer button **"Manage categories"** (`tune` icon) → closes sheet, navigates to Categories screen.
- Selecting a category sets it on the Add Expense form and returns to the sheet.

---

### 2.4 Calendar / Date Picker (center modal)

- Header: `chevron_left` / month-year label / `chevron_right` to page months.
- Weekday row **Mon-first** (M T W T F S S).
- 7-column day grid; leading blanks for month offset.
- Day states: **selected** = primary fill / white text; **today** = primary tint bg / primary text; default = transparent / primary text.
- Selecting a day sets the target date and closes the modal.
- Three targets: Add-expense date, Insights range **start**, Insights range **end**. For range: choosing a start after the current end (or an end before the current start) collapses both to the picked day.
- No explicit "Today"/"Clear"/"Confirm" buttons — selection is immediate (**those affordances are TBD**).

---

### 2.5 Chat

**Route:** `chat`. Column layout: header / scrolling thread / composer.

| Part | Contents |
|---|---|
| Header | Purple icon chip (`auto_awesome`), "Spendly AI", green dot + "Analyzing your data". |
| Thread | Message bubbles. **Sent (me):** `gradient.brand`, white text, right-aligned, radius `18 18 4 18`. **AI:** white surface, dark text, left-aligned, radius `18 18 18 4`, `shadow.card`. Text line-height 1.5. Entrance `motion.msgIn`. |
| Suggested chips | Horizontally scrollable row above the input: outlined pills. Tapping one sends it. Defaults: "How much on food this month?", "Where can I cut back?", "What's my biggest expense?". |
| Composer | Rounded input bar: text field ("Ask about your spending…") + circular send button (`gradient.brand`, `arrow_upward`). Enter key or button sends. |

**AI responses** are computed locally from the transaction data via keyword matching:
- food/grocery/dining → food total + Groceries/Dining split + % of month.
- cut/save/reduce/budget → biggest category + 15% savings estimate.
- biggest/most/largest → largest single expense this month.
- else → month total + transaction count.

> This is prototype logic. Real NLP / LLM backend is **TBD**.

---

### 2.6 Insights

**Route:** `insights`. Scrollable. Title "Insights".

| Card | Contents |
|---|---|
| Date range | "FROM" and "TO" buttons, each opens the Calendar for that endpoint. Drives every card below. Default range Jul 1 → Aug 8, 2026. |
| Total in range | Range total (`text.h1`) + transaction count; then a **spend-over-time chart**. |
| Chart | SVG, weekly buckets across the range (max 8 bars). **Bar** style default; **Line** style (polyline + filled area) available via the `chartStyle` tweak. Axis labels = bucket start dates. |
| Category breakdown | All categories with spend in range, sorted desc: icon chip, name, "amount · N%", proportional bar. |
| Biggest categories | Top 3 as tiles: solid-color icon chip, name, amount. |

---

### 2.7 Profile

**Route:** `profile`. Scrollable. Title "Profile".

| Section | Contents |
|---|---|
| Identity card | Avatar (initials), name, email, `edit` icon (non-functional — **TBD**). |
| Settings list | Rows: **Manage categories** (→ Categories, shows count), Currency (USD $), Notifications (On), Appearance (Light), Export data, Help & support. Each: icon chip + label + optional value + chevron. Only "Manage categories" is wired; the rest are visual-only (**TBD**). |
| Sign out | Full-width white button, `color.danger` text, `logout` icon. Not wired (**TBD**). |

---

### 2.8 Categories (management, pushed screen)

**Route:** `categories`. Back arrow → Home.

- Subtitle "{N} categories · used across all your expenses".
- List of all categories: icon chip, name, color swatch dot, `edit` icon (edit action **TBD**).
- **"Add category"** dashed-outline button appends a new category ("New Category", `label` icon, next palette color). Inline naming / icon / color editing is **TBD** — prototype adds a placeholder row only.
- Categories are a managed collection (not hardcoded); they drive the picker, breakdowns, and transaction display.

---

### 2.9 Expense Detail (pushed screen)

**Route:** `detail` (with selected transaction). Back arrow → Home.

- Centered: large category icon tile, amount (`text.amountLg`), merchant/title.
- Detail card rows: **Category** (color dot + name), **Date** (long form, e.g. "Aug 8, 2026"), **Note** ("—" when empty).
- Actions: **Edit** (outlined, primary) → opens Add Expense prefilled; **Delete** (`color.dangerTint` bg, `color.danger`) → removes transaction and returns to Home.
- Delete confirmation dialog: **TBD** (prototype deletes immediately).

---

## 3. Component inventory

| Component | Variants | States |
|---|---|---|
| Button (primary) | gradient fill (default), full-width | enabled / **disabled** (grey), press → `motion.control`; hover **TBD** on native |
| Button (secondary) | outlined (Edit), tinted danger (Delete), grey pill, dashed (Add category) | default / press |
| Icon button | circular w/ shadow (back, bell, close) | default / press |
| FAB | gradient circle w/ ring | default; loading/disabled **TBD** |
| Segmented toggle | 3-segment (period) | active / inactive; transition `motion.toggle` |
| Icon chip | tinted bg (list/picker) or solid bg (biggest tiles, chat/settings) | static; sizes 34/38/40/42/74px |
| Card | standard (`radius.lg`), hero (gradient), tile | static |
| Bottom sheet | Add Expense, Category Picker | enter/exit `motion.sheet`; scrim |
| Center modal | Calendar | enter `motion.msgIn`; scrim |
| List row | transaction, settings, category | default / hover(`#f6f7f9`) / press |
| Progress bar | category breakdown | proportional width |
| Input | amount, note, chat, field-embedded | empty(placeholder) / filled / focus (outline removed — **focus ring TBD**) |
| Suggested chip | outlined pill | default / hover(primary) |
| Chat bubble | sent (gradient) / received (surface) | entrance animation |
| Calendar day | blank / default / today / selected | as listed in §2.4 |
| Comparison pill | up / down / flat | color per direction |
| Avatar | initials circle | sizes 46 / 60px |

---

## 4. Configurable options (from prototype tweaks)

| Option | Values | Default | Effect |
|---|---|---|---|
| `showCents` | on / off | on | Whether amounts show 2 decimal places |
| `chartStyle` | Bar / Line | Bar | Insights spend-over-time chart style |
| `startScreen` | home / chat / insights / profile | home | Initial screen (dev/demo aid) |

---

## 5. Accessibility notes

The prototype does **not** implement accessibility; treat all of the following as build requirements. Where the prototype gives no guidance it is marked TBD.

- **Touch targets:** nav tabs, send button, and icon buttons are ≥ 40px; the FAB is 62px. Enforce a **44px minimum** hit area for all interactive elements (some list chevrons/edit icons are decorative and need labeled parent rows).
- **Labels:** all icon-only controls (bell, back, close, send, FAB, calendar arrows, category edit) need `accessibilityLabel`s — none are defined (**TBD**).
- **Semantic roles:** bottom-nav items should expose selected state; the period toggle and calendar days should announce selection.
- **Color contrast:** verify muted greys (`textMuted #8a90a0`, `textFaint #a2a8b4`, `textDisabled #c2c7d0`) against `color.surface` — several are below WCAG AA for body text and should be reserved for large/meta text or darkened (**needs audit**).
- **Do not rely on color alone:** the spend-comparison pill pairs color with an arrow icon (good); the category color dots/bars should be paired with text labels (they are). Category identification by color swatch alone (Categories screen) needs a text/label backup for color-blind users.
- **Dynamic type / font scaling:** not handled — layouts use fixed px. Behavior under OS font scaling is **TBD**.
- **Focus management:** input focus rings are removed (`outline:none`) with no replacement — define a visible focus state (**TBD**). Sheet/modal focus trapping and return-focus-on-close are **TBD**.
- **Reduced motion:** honor the OS "reduce motion" setting for sheet/chat animations (**TBD**).
- **Screen reader flow:** announce screen changes and newly-added chat messages / transactions (live regions) — **TBD**.
- **Dark mode / high-contrast themes:** **TBD**.
