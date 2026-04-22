---
path: projects/saasy/docs/spec/design.md
outline: |
  • Saasy :: Design System                L37
    ◦ 1. Color System                     L45
      ▪ 1.1 — Principles                  L47
      ▪ 1.2 — Scales                      L64
      ▪ 1.3 — Semantic Aliases            L77
      ▪ 1.4 — Token Values               L104
        · Light Mode — Backgrounds       L106
        · Light Mode — Gray              L116
        · Dark Mode — Backgrounds        L132
        · Backgrounds                    L134
        · Gray                           L144
        · Steel                          L161
        · Blue                           L169
        · Green                          L177
        · Red                            L185
        · Amber                          L202
        · Purple                         L219
        · Pink                           L236
    ◦ 2. Typography                      L255
      ▪ 2.1 — Principles                 L259
      ▪ 2.2 — Display                    L266
      ▪ 2.3 — Headings                   L274
      ▪ 2.3 — Labels                     L286
      ▪ 2.4 — Copy                       L300
      ▪ 2.5 — Buttons                    L311
    ◦ 3. Icons                           L323
      ▪ 3.1 — Principles                 L327
      ▪ 3.2 — Standard Set               L335
    ◦ 4. Spacing                         L349
    ◦ 5. Radius                          L366
    ◦ 6. Shadows                         L377
---

# Saasy :: Design System

Last updated: `2026.04.06`

> Color, typography, icon, spacing, and shadow tokens for the saasy SaaS template. Adapted from Vercel's Geist design system, optimized for a dark-first dashboard.

---

## 1. Color System

### 1.1 — Principles

- Color families use steps **100–1000** where applicable
- Steps map to **function**, not arbitrary shade (Geist convention):

| Steps   | Role                                        |
| ------- | ------------------------------------------- |
| 100–300 | Component backgrounds (default/hover/active)|
| 400–600 | Borders (default/hover/active)              |
| 700–800 | High-contrast fills (badges, buttons)       |
| 900–1000| Text and icons (secondary/primary)          |

- Three **background** tokens (`bg-100`–`bg-300`) for page and surface layering
- Light and dark mode are **independent sets**, not inversions
- oklch color space — all values have a subtle cool blue-violet undertone (~280-286 hue)
- Dark-first: dark mode is the primary design target

### 1.2 — Scales

| Scale    | Hue range | Chroma    | Purpose                                    |
| -------- | --------- | --------- | ------------------------------------------ |
| `gray`   | ~286      | very low  | Neutral UI — backgrounds, text, borders    |
| `steel`  | ~272      | moderate  | Blue-tinted utility — muted icons, controls|
| `blue`   | ~251      | moderate  | Primary accent — links, focus, charts      |
| `green`  | ~208      | low       | Success, positive states (sage/teal tone)  |
| `red`    | TBD       | TBD       | Errors, destructive actions                |
| `amber`  | TBD       | TBD       | Warnings                                   |

All scales share a tight cool-toned hue corridor (208–286). Reds and ambers will be derived to fit this palette when needed — Geist values are too saturated for this design language.

### 1.3 — Semantic Aliases

Shadcn-compatible semantic tokens reference into the scales. Components use these, never raw scale values:

| Token                   | Dark mode          | Notes                          |
| ----------------------- | ------------------ | ------------------------------ |
| `--background`          | `bg-100`           | Page background                |
| `--foreground`          | `gray-1000`        | Primary text (white)           |
| `--muted`               | `bg-300`           | Muted surface                  |
| `--muted-foreground`    | `gray-600`         | Secondary text                 |
| `--card`                | `bg-200`           | Primary card surface           |
| `--card-foreground`     | `gray-1000`        |                                |
| `--card-inset`          | `bg-200`           | Recessed area inside bg-300    |
| `--card-elevated`       | `bg-300`           | Elevated card / card-in-card   |
| `--border`              | `gray-100`         | Default border                 |
| `--border-subtle`       | `bg-300`           | Subtle border (same as S1 stroke) |
| `--input`               | `gray-100`         | Input border                   |
| `--primary`             | `gray-1000`        | Primary action                 |
| `--primary-foreground`  | `bg-100`           | Text on primary                |
| `--secondary`           | `bg-300`           | Secondary action surface       |
| `--secondary-foreground`| `gray-1000`        |                                |
| `--accent`              | `blue-500`         | Accent color (blue steel)      |
| `--accent-foreground`   | `gray-1000`        |                                |
| `--destructive`         | TBD                | Destructive actions            |
| `--ring`                | `blue-500`         | Focus ring                     |
| `--icon-muted`          | `steel-500`        | Muted icon buttons             |

### 1.4 — Token Values

#### Light Mode — Backgrounds

```
--bg-100:   #F4F5F6   oklch(96.97% 0.002 248)   /* page background (slight cool tint) */
--bg-200:   #FFFFFF   oklch(100% 0 0)            /* card fill / inset on bg-300 */
--bg-300:   #F9FAFA   oklch(98.43% 0.001 197)   /* elevated surface (no stroke) */
```

Layering model (light): bg-100 (page, tinted) → bg-200 (card, white) → bg-300 (elevated, near-white). bg-200 also serves as inset fill inside bg-300. In light mode, cards are brighter than the page — the inverse of dark mode.

#### Light Mode — Gray

```
--gray-100:   #EEEFF1   oklch(95.19% 0.003 265)   /* stroke on bg-200 surfaces */
--gray-500:   ...       TBD
--gray-600:   #5C5E71   oklch(48.72% 0.030 280)   /* muted-foreground */
--gray-700:   ...       TBD
--gray-800:   ...       TBD
--gray-900:   ...       TBD
--gray-1000:  #1D1D1F   oklch(23.16% 0.004 286)   /* primary text */
```

Remaining light mode steel/blue/green steps TBD.

---

#### Dark Mode — Backgrounds

#### Backgrounds

```
--bg-100:   #070708   oklch(12.91% 0.003 286)   /* page background */
--bg-200:   #101011   oklch(17.35% 0.002 286)   /* primary surface / inset fill */
--bg-300:   #171719   oklch(20.55% 0.004 286)   /* elevated surface / outer card */
```

Layering model: bg-100 (page) → bg-200 (card) → bg-300 (elevated card). bg-200 also serves as inset/recessed fill inside bg-300 containers (darker = recessed in dark mode).

#### Gray

```
--gray-100:   #1D1D20   oklch(23.20% 0.006 286)   /* border on elevated surfaces */
--gray-200:   #1D1E20   oklch(23.48% 0.004 264)   /* active pill bg (tabs, toggles) */
--gray-300:   #282828   oklch(27.68% 0.000 0)     /* muted text, inactive tab labels */
--gray-400:   ...       TBD
--gray-500:   #535565   oklch(45.37% 0.026 280)   /* tertiary text, inactive */
--gray-600:   #70717B   oklch(55.12% 0.015 281)   /* muted-foreground */
--gray-700:   ...       TBD
--gray-800:   ...       TBD
--gray-900:   ...       TBD
--gray-1000:  #FFFFFF   oklch(100% 0 0)            /* primary text */
```

Chroma increases as lightness decreases in the mid-range — darker grays read cooler.

#### Steel

```
--steel-500:  #73798C   oklch(57.77% 0.030 272)   /* muted icon buttons */
```

Blue-tinted utility tone. More saturated than gray, less than blue. Full scale TBD — expand as the design requires hover/active/disabled states.

#### Blue

```
--blue-500:   #B5D6FB   oklch(86.44% 0.063 251)   /* accent — charts, links, focus */
```

Soft, desaturated blue. Full scale TBD.

#### Green

```
--green-500:  #99B2B6   oklch(74.59% 0.028 208)   /* success, positive states */
```

Sage/teal tone. Full scale TBD.

#### Red

```
--red-100:    [ TODO ]
--red-200:    [ TODO ]
--red-300:    [ TODO ]
--red-400:    [ TODO ]
--red-500:    [ TODO ]
--red-600:    [ TODO ]
--red-700:    [ TODO ]
--red-800:    [ TODO ]
--red-900:    [ TODO ]
--red-1000:   [ TODO ]
```

Errors, destructive actions. Derive to fit the cool-toned palette.

#### Amber

```
--amber-100:  [ TODO ]
--amber-200:  [ TODO ]
--amber-300:  [ TODO ]
--amber-400:  [ TODO ]
--amber-500:  [ TODO ]
--amber-600:  [ TODO ]
--amber-700:  [ TODO ]
--amber-800:  [ TODO ]
--amber-900:  [ TODO ]
--amber-1000: [ TODO ]
```

Warnings. Derive to fit the cool-toned palette.

#### Purple

```
--purple-100:  [ TODO ]
--purple-200:  [ TODO ]
--purple-300:  [ TODO ]
--purple-400:  [ TODO ]
--purple-500:  [ TODO ]
--purple-600:  [ TODO ]
--purple-700:  [ TODO ]
--purple-800:  [ TODO ]
--purple-900:  [ TODO ]
--purple-1000: [ TODO ]
```

Badges, plans, roles.

#### Pink

```
--pink-100:   [ TODO ]
--pink-200:   [ TODO ]
--pink-300:   [ TODO ]
--pink-400:   [ TODO ]
--pink-500:   [ TODO ]
--pink-600:   [ TODO ]
--pink-700:   [ TODO ]
--pink-800:   [ TODO ]
--pink-900:   [ TODO ]
--pink-1000:  [ TODO ]
```

Marketing, accents.

---

## 2. Typography

Font stack: **Inter** (`--font-sans`) + **Geist Mono** (`--font-mono`). Inter is the primary typeface; SF Pro renders as a fallback on Apple devices via the system font stack.

### 2.1 — Principles

- Sizes are in **px**, referenced by function — not arbitrary `text-[27px]`
- Negative letter-spacing increases with size (tighter headings)
- `strong` children use weight **500**, not 700 — keeps everything feeling light
- Three categories: **headings** (titles), **labels** (UI controls), **copy** (paragraphs)

### 2.2 — Display

For large metric numbers. Weight 400.

| Class             | Size | Line-height | Letter-spacing | Usage                           |
| ----------------- | ---- | ----------- | -------------- | ------------------------------- |
| `text-display-40` | 40px | 44px        | -1.6px         | Revenue, large stats            |

### 2.3 — Headings

For page and section titles. Default weight 600; dashboard page titles use weight 500 (`font-medium` override).

| Class             | Size | Line-height | Letter-spacing | Usage                           |
| ----------------- | ---- | ----------- | -------------- | ------------------------------- |
| `text-heading-32` | 32px | 40px        | -1.28px        | Hero headings                   |
| `text-heading-24` | 24px | 32px        | -0.96px        | Page titles (w/ font-medium), section headings |
| `text-heading-20` | 20px | 26px        | -0.4px         | Card titles, sub-sections       |
| `text-heading-16` | 16px | 24px        | -0.32px        | Small headings, dialog titles   |
| `text-heading-14` | 14px | 20px        | -0.28px        | Sidebar headings, table headers |

### 2.3 — Labels

For UI controls, menus, metadata. Weight 400, strong 500.

| Class                  | Size | Line-height | Usage                              |
| ---------------------- | ---- | ----------- | ---------------------------------- |
| `text-label-16`        | 16px | 20px        | Large form labels                  |
| `text-label-14`        | 14px | 20px        | Default labels, menu items         |
| `text-label-14-mono`   | 14px | 20px        | Monospace labels (code refs)       |
| `text-label-13`        | 13px | 16px        | Secondary labels, metadata         |
| `text-label-13-mono`   | 13px | 20px        | Timestamps, IDs                    |
| `text-label-12`        | 12px | 16px        | Tertiary labels, captions, badges  |
| `text-label-12-mono`   | 12px | 16px        | Small monospace                    |

### 2.4 — Copy

For readable paragraphs and body text. Weight 400, strong 500.

| Class              | Size | Line-height | Usage                         |
| ------------------ | ---- | ----------- | ----------------------------- |
| `text-copy-16`     | 16px | 24px        | Default body text             |
| `text-copy-14`     | 14px | 20px        | Compact body text, tooltips   |
| `text-copy-13`     | 13px | 18px        | Dense info, descriptions      |
| `text-copy-13-mono`| 13px | 18px        | Inline code mentions          |

### 2.5 — Buttons

Weight 500.

| Class             | Size | Line-height | Usage              |
| ----------------- | ---- | ----------- | ------------------ |
| `text-button-16`  | 16px | 20px        | Large buttons      |
| `text-button-14`  | 14px | 20px        | Default buttons    |
| `text-button-12`  | 12px | 16px        | Tiny inline buttons|

---

## 3. Icons

All icons live in `components/ui/icons.tsx`.

### 3.1 — Principles

- Consistent API: `({ className, ...props }: React.ComponentProps<"svg">)`
- Default size: `size-4` (16px), overridable via `className`
- Fill: `currentColor` for monochrome icons, explicit colors for brand logos
- Stroke-based icons use `stroke-width: 1.5`
- Named with `Icon` prefix: `IconArrowRight`, `IconCheck`, `IconGoogle`

### 3.2 — Standard Set

| Category    | Icons                                                    |
| ----------- | -------------------------------------------------------- |
| Navigation  | ArrowRight, ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, ExternalLink |
| Actions     | Plus, Minus, X, Check, Copy, Search, Settings, Edit, Trash |
| Status      | AlertCircle, CheckCircle, Info, Loader, AlertTriangle    |
| Social      | Google, GitHub, Apple, Microsoft                         |
| Layout      | Menu, LayoutDashboard, Sidebar                           |
| User        | User, Users, LogOut, Mail                                |
| Misc        | Moon, Sun, Monitor, Eye, EyeOff                          |

---

## 4. Spacing

Base unit: **4px** (`--space`).

| Token        | Value  | Usage               |
| ------------ | ------ | ------------------- |
| `space-1`    | 4px    | Tight gaps          |
| `space-2`    | 8px    | Inline spacing      |
| `space-3`    | 12px   | Component padding   |
| `space-4`    | 16px   | Section gaps        |
| `space-6`    | 24px   | Card padding        |
| `space-8`    | 32px   | Section spacing     |
| `space-10`   | 40px   | Large gaps          |
| `space-16`   | 64px   | Page sections       |

---

## 5. Radius

| Token        | Value  | Usage                   |
| ------------ | ------ | ----------------------- |
| `radius-sm`  | 6px    | Small elements (badges) |
| `radius`     | 12px   | Default (inputs, cards) |
| `radius-lg`  | 20px   | Large cards, modals     |
| `radius-full`| 9999px | Avatars, pills          |

---

## 6. Shadows

Layered shadow system — each level adds depth.

| Token           | Usage                        |
| --------------- | ---------------------------- |
| `shadow-border` | Subtle border replacement    |
| `shadow-small`  | Cards, dropdowns             |
| `shadow-medium` | Elevated cards               |
| `shadow-large`  | Modals, popovers             |
| `shadow-menu`   | Context menus, select menus  |
| `shadow-modal`  | Dialogs, drawers             |
