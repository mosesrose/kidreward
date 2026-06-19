# APYX LEGEND — UI Refactor Plan

> **Goal:** Make every screen in the app visually consistent with the APYX LEGEND design system, using the exact Stitch HTML screens as the implementation source of truth.

---

## Design System

### APYX LEGEND Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `kidBg` | `#1a0b2e` | Child screen backgrounds |
| `kidCard` | `#231437` | Child card surfaces |
| `kidCardHigh` | `#3d2e52` | Tab bar, elevated cards |
| `kidDark` | `#150629` | Shadow color, darkest inset |
| `kidBorder` | `#bc13fe` | Quest borders, glows, accents |
| `kidText` | `#eddcff` | Primary text |
| `kidMuted` | `#d4c0d7` | Secondary/muted text |
| `kidAccent` | `#ebb2ff` | Lavender highlight, logo |
| `kidGreen` | `#2ff801` | Active/GO buttons, energy bars |
| `kidGreenText` | `#053900` | Text on green |
| `kidGreenDim` | `#2ae500` | Streak badges, green text |
| `kidActionGreen` | `#39ff14` | Section icons |
| `kidTabBg` | `#3d2e52` | Bottom tab bar bg |
| `parentBg` | `#f8f7f4` | Parent screen backgrounds |
| `parentCard` | `#ffffff` | Parent card surfaces |
| `parentSurface` | `#f0efed` | Parent inset backgrounds |
| `parentText` | `#1a0b2e` | Parent primary text |
| `parentMuted` | `#9d8ba0` | Parent muted text |
| `parentAccent` | `#7ca982` | Sage green — buttons, headers |
| `parentSecondary` | `#e8f0e9` | Light green badge bg |
| `parentSecText` | `#254f30` | Dark green text on green bg |

### Typography
| Role | Font | Size | Weight |
|------|------|------|--------|
| Display/logo | Bricolage Grotesque | 48px | 800, italic |
| H1 / quest titles | Bricolage Grotesque | 28–32px | 800 |
| Body | DM Sans | 16px | 400 |
| Mono caps / labels | JetBrains Mono | 10–12px | 500–700, uppercase |

### Styling Rules (APYX LEGEND)
- **Child cards:** `borderRadius: 0` (square/brutalist), 2px border `#bc13fe`, shadow `4px 4px 0 #150629`
- **Child buttons:** Square corners, `bg #2ff801`, text `#053900`, `border-bottom: 4px solid black`, italic slant
- **Parent cards:** `borderRadius: 16–24px`, soft shadow, white bg, `border: 1px solid rgba(0,0,0,0.06)`
- **Parent buttons:** Full pill `borderRadius: 9999`, `bg #7ca982` sage green
- **Icons:** `MaterialIcons` (hyphen names) + `MaterialCommunityIcons` for missing icons

### Icons Reference

#### Child mode icons
| Use | Icon | Library |
|-----|------|---------|
| QUESTS tab | `sword-cross` | MaterialCommunityIcons |
| MAP tab | `map` | MaterialIcons |
| LOOT tab | `card-giftcard` | MaterialIcons |
| HERO tab | `person` | MaterialIcons |
| Gem/XP count | `account-balance-wallet` | MaterialIcons |
| Section: Quests | `rocket-launch` | MaterialIcons |
| Section: Loot | `inventory` | MaterialIcons |
| Quest timer | `timer` | MaterialIcons |
| Back | `arrow-back` | MaterialIcons |
| Active quest | `swords` → use `extension` | MaterialIcons |

#### Parent mode icons
| Use | Icon | Library |
|-----|------|---------|
| Secure badge | `shield-account` | MaterialCommunityIcons |
| Switch to kid | `sports-esports` | MaterialIcons |
| Settings | `settings` | MaterialIcons |
| Kindness | `favorite` | MaterialIcons |
| Achievement | `auto-awesome` | MaterialIcons |
| Goal progress | `trending-up` | MaterialIcons |
| Edit goals | `edit` | MaterialIcons |
| Add | `add` | MaterialIcons |
| Check/Approve | `check-circle` | MaterialIcons |
| Reject | `cancel` | MaterialIcons |

---

## Screen Coverage Matrix

### Auth Screens

| File | Screen Name | Stitch Design | Status |
|------|-------------|---------------|--------|
| `welcome.tsx` | Welcome / Role Select | ✅ **Epik Kid Gateway** (`84f2db3a`) | Needs impl |
| `login.tsx` | Parent Login | ✅ **Epik Parent Login** (`2123242b`) | ✅ Done |
| `signup.tsx` | Parent Signup | ❌ Missing | Need Stitch screen |
| `signup-child.tsx` | Child Join (enter code) | ✅ **Epik Kid Login** (`aaefbf25`) | Needs impl |
| `join.tsx` | Child Join (in-app) | ✅ **Epik Kid Login** (`aaefbf25`) | Needs impl |
| `complete-profile.tsx` | Complete Profile | ❌ Missing | Defer |
| `forgot-password.tsx` | Forgot Password | ❌ Missing | Defer (minimal screen) |
| `reset-password.tsx` | Reset Password | ❌ Missing | Defer (minimal screen) |
| `join-coparen.tsx` | Co-parent Join | ❌ Missing | Defer |

### Child Screens

| File | Tab / Screen | Stitch Design | Status |
|------|--------------|---------------|--------|
| `home.tsx` | QUESTS tab | ✅ **Epik Quest Hub** (`d0619c3d`) | ✅ Done |
| `store/index.tsx` | LOOT tab | ✅ **Apyx Loot Shop - Reward States** (`768413a8`) | Needs impl |
| `progress.tsx` | MAP tab | ❌ Missing | Need Stitch screen |
| `family.tsx` | HERO tab | ✅ **Apyx Hero Stats Hub** (`ff1e2338`) | Needs impl |
| `challenges/index.tsx` | Quest list (alt) | ✅ Merge into `home.tsx` | Redundant — merge |
| `challenges/[id].tsx` | Quest Detail | ❌ Missing | Need Stitch screen |

### Parent Screens

| File | Screen Name | Stitch Design | Status |
|------|-------------|---------------|--------|
| `dashboard.tsx` | Parent Dashboard | ✅ **Epik Parent Terminal** (`c104455c`) | Needs impl |
| `challenges/index.tsx` | Challenge List | ✅ **Parent Command Terminal** (`d455a8d3`) | Needs impl |
| `challenges/[id].tsx` | Challenge Detail / Approval | ❌ Missing | Need Stitch screen |
| `challenges/create.tsx` | Create Challenge | ❌ Missing | Need Stitch screen |
| `rewards/index.tsx` | Rewards List | ❌ Missing | Need Stitch screen |
| `rewards/create.tsx` | Create Reward | ❌ Missing | Need Stitch screen |
| `children/index.tsx` | Family Management | ❌ Missing | Need Stitch screen |
| `children/invite.tsx` | Invite Child | ❌ Missing | Need Stitch screen |
| `redemptions.tsx` | Redemptions | ❌ Missing | Need Stitch screen |
| `goals/index.tsx` | Goals | ✅ **Apyx Goal Workshop** (`a06ebe16`) | Needs impl |
| `settings.tsx` | Settings | ❌ Missing | Defer (minimal) |

---

## Missing Stitch Screens — To Generate

| Priority | Screen | For | Prompt Key |
|----------|--------|-----|------------|
| 🔴 P0 | **Apyx Quest Detail** | `(child)/challenges/[id].tsx` | Child submits proof |
| 🔴 P0 | **Apyx Progress Map** | `(child)/progress.tsx` | Child MAP tab |
| 🔴 P0 | **Apyx Parent Approve Quest** | `(parent)/challenges/[id].tsx` | Parent approves/rejects |
| 🔴 P0 | **Apyx Family Command** | `(parent)/children/index.tsx` | Parent sees children |
| 🔴 P0 | **Apyx Vault** | `(parent)/redemptions.tsx` | Parent fulfils rewards |
| 🟡 P1 | **Apyx Loot Command** | `(parent)/rewards/index.tsx` | Parent manages rewards |
| 🟡 P1 | **Apyx Create Quest** | `(parent)/challenges/create.tsx` | Parent creates challenge |
| 🟡 P1 | **Apyx Parent Signup** | `(auth)/signup.tsx` | New parent signs up |
| 🟢 P2 | **Apyx Create Reward** | `(parent)/rewards/create.tsx` | Parent adds reward |
| 🟢 P2 | **Apyx Invite Hero** | `(parent)/children/invite.tsx` | Invite child code |

---

## Implementation Tasks

### Phase 1 — Foundation ✅ DONE
- [x] Color tokens (`constants/colors.ts`)
- [x] Child tab layout (QUESTS / MAP / LOOT / HERO)
- [x] Child home screen (`home.tsx`) — Epik Quest Hub
- [x] Parent login (`login.tsx`) — Epik Parent Login
- [x] AppHeader mode-aware

### Phase 2 — Child Experience (next)
- [ ] **C1** — Child LOOT store (`store/index.tsx`) — use Apyx Loot Shop - Reward States
- [ ] **C2** — Child HERO profile (`family.tsx`) — use Apyx Hero Stats Hub
- [ ] **C3** — Child MAP progress (`progress.tsx`) — ⚠️ needs Stitch screen first
- [ ] **C4** — Child Quest Detail (`challenges/[id].tsx`) — ⚠️ needs Stitch screen first
- [ ] **C5** — App welcome / role select (`welcome.tsx`) — use Epik Kid Gateway
- [ ] **C6** — Child join flow (`signup-child.tsx` + `join.tsx`) — use Epik Kid Login

### Phase 3 — Parent Experience
- [ ] **P1** — Parent dashboard (`dashboard.tsx`) — use Epik Parent Terminal
- [ ] **P2** — Parent challenges list (`challenges/index.tsx`) — use Parent Command Terminal
- [ ] **P3** — Parent challenge detail/approval (`challenges/[id].tsx`) — ⚠️ needs Stitch screen
- [ ] **P4** — Parent create challenge (`challenges/create.tsx`) — ⚠️ needs Stitch screen
- [ ] **P5** — Parent goals (`goals/index.tsx`) — use Apyx Goal Workshop
- [ ] **P6** — Parent family (`children/index.tsx`) — ⚠️ needs Stitch screen
- [ ] **P7** — Parent redemptions (`redemptions.tsx`) — ⚠️ needs Stitch screen
- [ ] **P8** — Parent rewards list (`rewards/index.tsx`) — ⚠️ needs Stitch screen
- [ ] **P9** — Parent create reward (`rewards/create.tsx`) — ⚠️ needs Stitch screen
- [ ] **P10** — Parent tab layout update

### Phase 4 — Auth & Polish
- [ ] **A1** — Parent signup (`signup.tsx`) — ⚠️ needs Stitch screen
- [ ] **A2** — Forgot password (`forgot-password.tsx`) — minimal, defer
- [ ] **A3** — `CelebrationOverlay` dark theme update
- [ ] **A4** — `GemBadge` component dark theme
- [ ] **A5** — TypeScript clean + E2E smoke

---

## Stitch Screen IDs Reference

| ID | Title | Maps To |
|----|-------|---------|
| `d0619c3d` | Epik Quest Hub | `(child)/home.tsx` |
| `e4b817cc` | Epik Action Dashboard | `(child)/home.tsx` (variant) |
| `de8cc5ff` | Apyx Kid Quest Hub - High Energy | `(child)/home.tsx` (variant) |
| `ff1e2338` | Apyx Hero Stats Hub | `(child)/family.tsx` |
| `955697e4` | Epik Loot Shop | `(child)/store/index.tsx` |
| `402febfe` | Apyx Eye Candy Loot Shop | `(child)/store/index.tsx` |
| `768413a8` | Apyx Loot Shop - Reward States | `(child)/store/index.tsx` |
| `aaefbf25` | Epik Kid Login | `(auth)/signup-child.tsx` + `join.tsx` |
| `84f2db3a` | Epik Kid Gateway | `(auth)/welcome.tsx` |
| `2123242b` | Epik Parent Login | `(auth)/login.tsx` ✅ |
| `eb43a475` | Apyx Parent Login - Unified | `(auth)/login.tsx` (variant) |
| `2f992b96` | Apyx Parent Terminal Login | `(auth)/login.tsx` (variant) |
| `c104455c` | Epik Parent Terminal | `(parent)/dashboard.tsx` |
| `89b11773` | Apyx Parent Terminal - Unified | `(parent)/dashboard.tsx` (variant) |
| `37f3ea30` | Apyx Parent Terminal - Advanced | `(parent)/dashboard.tsx` (variant) |
| `d455a8d3` | Parent Command Terminal | `(parent)/challenges/index.tsx` |
| `a06ebe16` | Apyx Goal Workshop - Unified | `(parent)/goals/index.tsx` |
| `66f65121` | Epik Reward Trigger | `components/CelebrationOverlay.tsx` |
| `654a6b97` | Shader | Design element / background |

---

## Notes
- `(child)/challenges/index.tsx` is **redundant** — the QUESTS tab (`home.tsx`) already shows active quests. This file can be removed or repurposed as a "completed quests archive."
- The parent tab bar still needs redesigning to match APYX LEGEND sage-green theme.
- All `AppHeader` usages in parent screens should use `parentAccent` sage green branding.
- The name "KidReward" should be replaced with "APYX LEGEND" consistently across all visible UI text.
