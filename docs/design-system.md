# Spendly AI — Design System

Foundational design tokens extracted from the prototype. Values marked **TBD** are not defined by the prototype and must be decided during build.

> Platform note: the prototype is a single 390 × 844 mockup (one device size, light mode only). Responsive breakpoints, dark mode, and tablet layouts are **TBD**.

---

## 1. Color

### 1.1 Brand / primary

| Token | Hex | Usage |
|---|---|---|
| `color.primary` | `#7c3aed` | Primary actions, active nav, accents, links |
| `color.primaryDark` | `#6d28d9` | Pressed/hover on primary |
| `color.primaryTint` | `#f3ebfd` | Icon chip backgrounds, subtle primary surfaces |

Brand purple is used as a **gradient** almost everywhere it appears as a fill (see §1.6).

### 1.2 Neutrals / surfaces

| Token | Hex | Usage |
|---|---|---|
| `color.appBackdrop` | `#e8e9ec` | Canvas behind the device frame (prototype chrome only) |
| `color.background` | `#f5f6f8` | Screen background |
| `color.surface` | `#ffffff` | Cards, sheets, nav bar, inputs |
| `color.surfaceMuted` | `#fafbfc` | Inset field backgrounds |
| `color.surfaceGrey` | `#f2f3f6` | Close-button / secondary chip backgrounds |
| `color.track` | `#eef0f4` | Progress/bar track background |

### 1.3 Text

| Token | Hex | Usage |
|---|---|---|
| `color.textPrimary` | `#16181c` | Headlines, amounts, primary labels |
| `color.textSecondary` | `#5a5f6c` | Secondary labels |
| `color.textMuted` | `#8a90a0` | Meta text (dates, captions) |
| `color.textFaint` | `#a2a8b4` | De-emphasized meta, chart labels |
| `color.textDisabled` | `#c2c7d0` | Chevrons, placeholder-level icons |
| `color.textOnPrimary` | `#ffffff` | Text/icons on purple fills |
| `color.navInactive` | `#9aa0ab` | Inactive bottom-nav tabs |

### 1.4 Borders / dividers

| Token | Hex | Usage |
|---|---|---|
| `color.border` | `#e2e5ea` | Default input / control border |
| `color.borderSoft` | `#e6e8ec` | Sheet field borders |
| `color.borderFaint` | `#eceef2` | Card list dividers, hairlines |
| `color.divider` | `#f0f1f4` | Row separators inside cards |
| `color.borderDashed` | `#cdd2db` | "Add category" dashed outline |
| `color.chipBorder` | `#dfe2e8` | Suggested-question chip border |

### 1.5 Semantic

| Token | Hex | Usage |
|---|---|---|
| `color.success` | `#16a34a` | Positive/decrease indicator, "online" dot |
| `color.danger` | `#dc2626` | Delete, sign out, spend-increase indicator |
| `color.dangerTint` | `#fef2f2` | Delete-button background |
| `color.scrim` | `rgba(16,18,30,0.42)` | Modal / sheet backdrop overlay |

> Note: for expenses, an **increase** vs. previous period is shown in `color.danger` and a **decrease** in `color.success` (spending less is "good").

### 1.6 Gradients

| Token | Value | Usage |
|---|---|---|
| `gradient.brand` | `linear-gradient(135deg, #7c3aed, #a855f7)` | FAB, send button, primary buttons, sent chat bubbles |
| `gradient.brandCard` | `linear-gradient(150deg, #7c3aed 0%, #9061f2 55%, #a855f7 100%)` | Home "total spent" hero card |

### 1.7 Category palette

Each category has a solid color; icon chips use a **13%-opacity tint** of that color as background (`categoryTint = rgba(color, 0.13)`).

| Category | Token | Hex | Icon (Material Symbols) |
|---|---|---|---|
| Groceries | `category.groceries` | `#16a34a` | `shopping_cart` |
| Kids | `category.kids` | `#f97316` | `child_care` |
| Utilities | `category.utilities` | `#0284c7` | `bolt` |
| Dining Out | `category.dining` | `#dc2626` | `restaurant` |
| Transport | `category.transport` | `#9333ea` | `directions_car` |
| Health | `category.health` | `#0d9488` | `medical_services` |
| Home | `category.home` | `#d97706` | `chair` |
| Entertainment | `category.entertainment` | `#db2777` | `movie` |
| Shopping | `category.shopping` | `#2563eb` | `shopping_bag` |
| Other | `category.other` | `#64748b` | `category` |

New user-created categories cycle through this palette: `#e11d48`, `#0891b2`, `#65a30d`, `#9333ea`, `#ea580c`, `#0d9488` (default icon `label`).

---

## 2. Typography

**Family:** `Manrope` (Google Fonts). Fallback stack: `Manrope, system-ui, sans-serif`.
**Icon font:** `Material Symbols Outlined` (opsz 24, weight 400, fill 0, grade 0).

**Weights in use:** 400 (regular), 500 (medium), 600 (semibold), 700 (bold), 800 (extrabold).

### Type scale (observed)

| Token | Size | Weight | Letter-spacing | Used for |
|---|---|---|---|---|
| `text.displayXL` | 48px | 800 | −1.5px | Add-expense amount input |
| `text.display` | 42px | 800 | −1.2px | Home total spent |
| `text.amountLg` | 40px | 800 | −1px | Expense-detail amount |
| `text.h1` | 32px | 800 | −0.8px | Insights range total |
| `text.symbol` | 34px | 800 | — | "$" prefix on amount input |
| `text.screenTitle` | 24px | 800 | −0.4px | Screen titles (Insights, Profile) |
| `text.sheetTitle` | 19px | 800 | — | Add-expense sheet title |
| `text.titleLg` | 20px | 800 | — | Sub-screen headers (Categories, Detail) |
| `text.name` | 18px | 800 | −0.3px | Greeting name, profile name |
| `text.bodyLg` | 16px | 800 | — | Primary button label |
| `text.body` | 15px | 700–800 | — | List titles, field values |
| `text.bodySm` | 14px / 14.5px | 700–800 | — | Row titles, settings labels |
| `text.label` | 13px / 13.5px | 600–700 | — | Secondary labels, chat text |
| `text.caption` | 12px / 12.5px | 600–700 | — | Meta, chips, toggle labels |
| `text.captionSm` | 11px / 11.5px | 700 | — | Field mini-labels |
| `text.overline` | 10.5px / 11px | 700–800 | +0.5–0.6px, uppercase | FROM/TO, AMOUNT, section overlines |
| `text.micro` | 10px | 700 | — | Chart axis labels |

**Line heights:** default (~1.2) for most UI; **1.5** for chat message bubbles; **1.2–1.3** for wrapped labels. A formal line-height scale is **TBD**.

---

## 3. Spacing

The prototype uses ad-hoc pixel values, not a strict token scale. Observed values form roughly a 2–4px-step ramp:

`2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 26px`

Suggested normalized scale for build (a **recommendation**, not enforced by the prototype):

| Token | Value |
|---|---|
| `space.1` | 4px |
| `space.2` | 8px |
| `space.3` | 12px |
| `space.4` | 16px |
| `space.5` | 20px |
| `space.6` | 24px |

**Key layout constants:**

| Purpose | Value |
|---|---|
| Screen horizontal padding | 20px |
| Screen top padding (below status bar) | 56px |
| Screen bottom padding (clears nav) | 120px |
| Chat composer bottom padding (clears nav) | 86px |
| Status bar height | 46px |
| Bottom nav bar height | 76px |
| Nav interaction zone height | 92px |

---

## 4. Border radius

| Token | Value | Usage |
|---|---|---|
| `radius.full` | 50% / 9999px | Avatars, FAB, nav icons, circular buttons, dots |
| `radius.device` | 44px | Phone frame (prototype only) |
| `radius.sheet` | 30px (top corners) | Bottom sheets (Add expense, Category picker) |
| `radius.xl` | 26px | Hero card, calendar modal |
| `radius.lg` | 22px | Standard cards |
| `radius.md` | 16–18px | Buttons, biggest-category tiles |
| `radius.sm` | 14–15px | Sheet fields, list rows, picker tiles |
| `radius.xs` | 11–12px | Icon chips |
| `radius.pill` | 20–26px | Toggle segments, chips, input bar |
| `radius.bar` | 4px | Progress/breakdown bars |

---

## 5. Shadows / elevation

| Token | Value | Usage |
|---|---|---|
| `shadow.card` | `0 2px 10px rgba(20,22,40,0.05)` | Cards, nav rows |
| `shadow.iconButton` | `0 2px 8px rgba(20,22,40,0.06)` | Back / notification circle buttons |
| `shadow.nav` | `0 -4px 24px rgba(20,22,40,0.08)` | Bottom nav bar |
| `shadow.sheet` | `0 -12px 40px rgba(20,22,40,0.20)` | Bottom sheets |
| `shadow.modal` | `0 20px 50px rgba(20,22,40,0.30)` | Calendar modal |
| `shadow.heroCard` | `0 16px 34px rgba(124,58,237,0.34)` | Purple total card |
| `shadow.fab` | `0 10px 24px rgba(124,58,237,0.45)` | FAB |
| `shadow.avatar` | `0 6px 14px rgba(124,58,237,0.35)` | Avatar circles |
| `shadow.sendButton` | `0 4px 12px rgba(124,58,237,0.40)` | Chat send button |
| `shadow.device` | `0 40px 90px rgba(20,22,40,0.32)` | Phone frame (prototype only) |

Neutral elevation uses cool near-black `rgba(20,22,40,·)`; primary-colored surfaces (FAB, hero, avatar) cast a **purple-tinted** shadow `rgba(124,58,237,·)`.

---

## 6. Motion

| Token | Duration | Easing | Usage |
|---|---|---|---|
| `motion.sheet` | 280ms | `cubic-bezier(0.2,0.8,0.2,1)` | Bottom sheets slide up (`translateY(100%)→0`) |
| `motion.fade` | 200ms | `ease` | Scrim / overlay fade-in |
| `motion.msgIn` | 250ms | `ease` | Chat bubble + calendar modal entrance (fade + `translateY(6px)→0`) |
| `motion.control` | 150ms | (default) | Save button / primary button state change |
| `motion.toggle` | 180ms | (default) | Period toggle segment change |

- Screen-to-screen transitions: the prototype swaps screens instantly (no animated push/pop). Native **screen transitions are TBD** (recommend standard platform stack push for sub-screens, modal present for sheets).
- Reduced-motion handling: **TBD**.
