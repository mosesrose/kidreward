# KidReward — Visual Rework Spec (Stitch)
_Source of truth for the full visual rework. Extracted from Stitch HTML + designs._

---

## 1. Global Design Tokens

### Colors (`constants/colors.ts` — full replacement)

```
// Surfaces
surface                   #fdf7ff   main background (both modes)
surface-container-low     #f8f2fa   header / nav background
surface-container         #f2ecf4   subtle section / input background
surface-container-high    #ece6ee   completed / disabled states
surface-container-highest #e6e0e9   dividers
white                     #ffffff   card surface

// Primary — deep purple
primary                   #4f378a   CTA buttons, titles, active icons
primary-container         #6750a4   filled chips, avatar background
primary-fixed             #e9ddff   light purple tag / chip background
primary-fixed-dim         #cfbcff   muted purple borders

// Secondary — muted lavender
secondary                 #63597c   secondary icons
secondary-container       #e1d4fd   icon background on quest cards
on-secondary-fixed        #1f1635   text on secondary background

// Tertiary — amber / gold (gems)
tertiary                  #765b00   gem text colour
tertiary-container        #c9a74d   warm amber badge background
tertiary-fixed            #ffdf93   light gold — level ring, gem badge
on-tertiary-fixed         #241a00   dark brown text on amber badge
on-tertiary-fixed-variant #594400   icon colour on amber
radiant-amber             #FFB800   bright amber — reward screen hero

// Text
on-surface                #1d1b20   main text
on-surface-variant        #494551   secondary / muted text
outline                   #7a7582   borders, placeholders
outline-variant           #cbc4d2   light borders

// Status
error                     #ba1a1a   reject / danger
error-container           #ffdad6   light red background
success                   #1a7a4a   approve / positive
success-container         #d4f7e1   light green background
warning                   #b45309   pending
warning-container         #ffdf93   light amber background
```

### Typography

| Token | Font | Size | Weight | Line-height | Letter-spacing |
|---|---|---|---|---|---|
| `kids-display` | Bricolage Grotesque | 40px | 800 | 110% | -0.02em |
| `kids-h1` | Bricolage Grotesque | 32px | 700 | 120% | — |
| `kids-body` | Plus Jakarta Sans | 18px | 600 | 150% | — |
| `parent-h1` | Source Serif 4 | 28px | 600 | 130% | — |
| `parent-body` | Plus Jakarta Sans | 16px | 400 | 160% | — |
| `label-caps` | Plus Jakarta Sans | 12px | 700 | 100% | 0.1em |

Expo Google Fonts packages needed:
- `@expo-google-fonts/bricolage-grotesque`
- `@expo-google-fonts/source-serif-4`
- `@expo-google-fonts/plus-jakarta-sans`

### Spacing
```
xs: 4px   sm: 12px   gutter: 16px   container-margin: 20px
md: 24px  lg: 48px   xl: 80px
```

### Border Radius
```
input:       4px    text fields
tag:         8px    small chips, tags
card:        12px   parent cards
kids-card:   24px   standard child cards
kids-large:  32px   quest cards, featured card
reward-card: 40px   treasure chest reward cards
circle:      9999px avatars, buttons, badges
```

### Shadows
```
parent-card:   0 4px 30px rgba(0,0,0,0.03)
kids-card:     0 8px 32px rgba(103,80,164,0.10)
squish-btn:    0 4px 0 0 rgba(0,0,0,0.2)      — rest state
squish-btn:    0 0px 0 0 rgba(0,0,0,0.2)      — pressed state (translateY +4px)
level-badge:   0 20px 60px rgba(0,0,0,0.15)
```

---

## 2. Shared Components

### AppHeader
```
height: 56px, fixed top-0, z-index 40
bg: surface-container-low (#f8f2fa) + backdrop blur
border-bottom: 1px outline-variant
px: 16px (gutter), py: 12px (sm)

Left:  40×40 avatar circle (bg secondary-container)
       + "KidReward" in kids-display 24px, color primary

Right (child):  "Parent Mode" pill — rounded-full, bg surface-container-highest,
                border outline-variant, label-caps, settings icon left
Right (parent): settings icon button 40×40 rounded-full, color on-surface-variant
```

### BottomTabBar
```
height: 64px, fixed bottom-0
bg: white, border-top: 1px outline-variant

Child tabs:  Home (home) | Store (storefront)
Parent tabs: Dashboard (dashboard) | Challenges (assignment_turned_in) |
             Rewards (card_giftcard) | Family (group_work)

Active:   color primary (#4f378a), icon filled, label label-caps primary
Inactive: color on-surface-variant, icon outlined, label label-caps muted
```

### GemBadge
```
Shape: rounded-full pill
bg: tertiary-fixed (#ffdf93)
color: on-tertiary-fixed (#241a00)
font: kids-body 18px 600
content: "💎 {N}"
padding: 8px 16px
```

### CelebrationOverlay — two modes

**Mode A: "Submitted" (soft positive)**
```
Appears: immediately when child submits a completion
Duration: 2 seconds then auto-dismisses

Full-screen overlay, bg: rgba(79,55,138,0.92) (primary, translucent)
Center column:
  Confetti burst (light, 40 particles, 1.5s)
  Star emoji 80px, bouncing animation
  Heading: kids-display "Submitted! 🌟" color white
  Body: kids-body "Great work — waiting for your parent to approve" color white/80
  Sound: soft ascending chime (short)
Auto-dismisses after 2s → screen shows "⏳ Waiting" chip
```

**Mode B: "Approved" (full woohoo)**
```
Appears: on parent approval — via push notification tap, real-time subscription,
         or on next app open if approval happened while app was closed

Full-screen overlay, bg: gradient primary → primary-container
Center column:
  Heavy confetti cannon (120 particles, 3s, multi-colour)
  Gem icon 100px, scale-bounce animation
  "+{N} 💎" in kids-display 56px, color radiant-amber (#FFB800)
  Heading: kids-display "WOOHOO! 🎉" color white
  Subheading: kids-h1 "{ChallengeName}" color white/90
  If level-up: level-up banner slides up from bottom:
    "⬆️ Level up! You're now Level {N}: {Title}" — amber bg, primary text
  Sound: upbeat win jingle (1.5s)
  Button: "Collect my gems! →" — rounded-full, bg radiant-amber,
          color on-tertiary-fixed, font kids-h1, squish shadow
          → dismisses overlay, Home gem count animates to new value
```

### Push Notification (sent on parent approval)
```
Title:  "🎉 {ParentName} approved your challenge!"
Body:   "{ChallengeName} — you earned {N} 💎 gems!"
Tap:    opens app → Home with Celebration Overlay B
```

---

## 3. Auth Screens

### Welcome
**Content:** App logo · "KidReward" in kids-display · tagline · two buttons
**Actions:**
- "I'm a Parent" → Parent Signup
- "I already have an account" → Login

### Login
**Content:** Email + password inputs · error message if invalid
**Actions:**
- "Sign In" → Dashboard (parent) or Home (child)
- "Forgot password?" → Forgot Password
- "Sign up" → Welcome

### Parent Signup
**Content:** Name + email + password inputs
**Actions:**
- "Create Account" → Complete Profile
- "Sign in instead" → Login

### Child Signup
**Content:** Email + password + invite code inputs (code pre-filled if deep-linked)
**Actions:**
- "Join as Child" → Complete Profile
- "I already have an account" → Login

### Complete Profile
**Content:** Name input · avatar emoji picker (12 options)
**Actions:**
- Tap avatar emoji → selects it (highlighted border)
- "Let's go!" → Dashboard (parent) or Join (child with no family)

### Forgot Password
**Content:** Email input · confirmation message after submit
**Actions:**
- "Send Reset Link" → shows "Check your email" confirmation
- "Back to login" → Login

---

## 4. Child Screens

### Home
**Content:**
- AppHeader with "Parent Mode" button
- Level circle (192px): circular amber progress ring · star emoji · level number
- Floating gem badge (top-right of circle): "+{N} 💎" amber pill, bounce animation
- Level title: "Level {N}: {Title}" in kids-h1 Bricolage Grotesque
- Subtitle: "Only {N} more gems to Level {N+1}"
- "Active Missions" heading + "{N} remaining" count (right)
- Active / Done segmented tabs
- Quest cards (per challenge):
  - 64×64 icon box (bg secondary-container) · MaterialCommunityIcons
  - Title in kids-body · "💎 {N}" reward in tertiary colour
  - Purple check button (48×48 circle) on active · tick icon on done
  - Done cards: 60% opacity, surface-container-highest bg
- Empty state (no missions): "Ask your parent to add one" + icon
- BottomTabBar

**Actions:**
- Tap "Active" / "Done" tab → filters list
- Tap quest card (anywhere) → Challenge Detail
- Tap check button on card → Challenge Detail
- Tap "Store" tab → Store
- Tap "Parent Mode" → confirm prompt → sign out → Welcome

---

### Challenge Detail
**Content:**
- ← Back button
- 96×96 hero icon circle (bg secondary-container, primary icon)
- Title in kids-h1
- Chips row: category chip (primary-fixed bg) · repeat chip · "💎 {N} Gems" amber badge
- Description in parent-body, muted
- "Add a note…" TextInput (white bg, outline-variant border, 4px radius)
- Submit button: "I Did It! 🎉" — full-width, bg primary, rounded-full, squish shadow
- If pending: "⏳ Waiting for your parent" status chip (amber)
- If approved: "✓ Approved — +{N} 💎" chip (green) — read-only
- If rejected: "✗ Rejected — try again" chip (red) — submit button re-enabled

**Actions:**
- Tap ← Back → Home
- Type in note field → updates note text
- Tap "I Did It! 🎉":
  1. Submits completion to Supabase (status: pending)
  2. **Celebration Overlay A fires** (soft, 2s)
  3. Screen shows "⏳ Waiting for your parent" chip
- _(if previously rejected)_ submit button re-enabled, child can resubmit with new note

---

### Store
**Content:**
- AppHeader + gem balance GemBadge (top-right)
- "Reward Shop" hero: sparkle icon (120px, radiant-amber) · kids-display title · subtitle pill
- Section "YOU CAN GET" (if balance ≥ any reward):
  - Reward cards (40px radius): amber cost badge (top-right) · 144×144 icon circle ·
    title kids-h1 · description parent-body · "Unlock Now!" purple squish button
- Section "KEEP SAVING" (locked rewards):
  - Same cards, icon circle 50% opacity · "Need {N} more 💎" disabled button (grey)
- Empty state (no rewards): "Your parent hasn't set up rewards yet"
- Confirm step (after tapping Unlock): "Yes, redeem!" (amber) + "Cancel" (ghost) inline below card
- After redemption: "⏳ Waiting for parent" replaces button
- BottomTabBar

**Actions:**
- Tap "Home" tab → Home
- Tap affordable reward → confirm row appears
- Tap "Yes, redeem!" → submits redemption (status: pending) · button → "⏳ Waiting"
- Tap "Cancel" → dismisses confirm row
- Tap locked reward → no action (visual only)

---

### Join _(gate — shown when child has no family)_
**Content:**
- "KidReward" title · "Join your family" heading
- 6-char invite code input (large, auto-uppercase)
- Family name preview once code validates
- "Join Family" button (primary, full-width)
- "Sign out" text link (bottom)

**Actions:**
- Type code → validates live, shows family name or error
- "Join Family" → joins family → Home (with level circle showing Level 1)
- "Sign out" → Welcome

---

## 5. Parent Screens

### Dashboard
**Content:**
- AppHeader (settings icon)
- Greeting: "Welcome back, {Name}" · "{FamilyName}'s Family" · "Sign out" link
- Reflection quote (italic, serif, left purple border) — rotates daily
- **Action Needed** section (if any pending):
  - Combined list of pending completions + pending redemptions
  - Per completion card: child avatar · challenge icon · challenge name · child name ·
    submission note · "✓ Approve" (green) + "✗ Reject" (red) buttons
  - Per redemption card: child avatar · reward icon · reward name · gems spent ·
    "✓ Fulfil" (green) + "✗ Reject" (red/refund) buttons
  - Collapsed if nothing pending: "All caught up ✓" green chip
- **Family Pulse** section:
  - "View All →" link (right)
  - Last 10 activity cards: child avatar · child name · time ago ·
    category chip · what happened · "+{N} 💎" footer
- "Switch to Kid Mode →" purple card (bottom)
- BottomTabBar

**Actions:**
- Tap "Sign out" → confirm prompt → Welcome
- Tap "✓ Approve" on completion → awards gems · **push notification to child** ·
  card moves to Family Pulse · if child in app: Celebration Overlay B fires on child device
- Tap "✗ Reject" on completion → rejects · card moves to Family Pulse
- Tap "✓ Fulfil" on redemption → marks fulfilled · card moves to Family Pulse
- Tap "✗ Reject" on redemption → rejects + refunds gems · card moves to Family Pulse
- Tap "View All →" → expands full activity feed (scrollable inline, or modal)
- Tap "Switch to Kid Mode →" → sign out → Welcome
- Tap "Challenges" tab → Challenges
- Tap "Rewards" tab → Rewards
- Tap "Family" tab → My Family

---

### Challenges
**Content:**
- "Challenges" heading · "+ New" button (top-right, purple pill)
- Active / Archived segmented tabs
- Challenge cards: 48×48 icon box (primary-fixed bg) · title parent-body bold ·
  repeat chip · gem badge (amber) · arrow right
- Empty state: "Create your first challenge"
- BottomTabBar

**Actions:**
- Tap "+ New" → Create Challenge
- Tap "Active" / "Archived" tab → filters list
- Tap challenge card → Challenge Detail
- Pull to refresh

---

### Challenge Detail
**Content:**
- ← Back
- 80×80 hero icon circle (primary-fixed bg)
- Title in parent-h1 (Source Serif 4)
- Chips: repeat · category · "💎 {N}" amber badge
- Description in parent-body muted
- **Pending Submissions** section (if any):
  - Per submission: child avatar · child name · submission note ·
    "✓ Approve" (green, squish) + "✗ Reject" (red outline) buttons
- **Past Submissions** section (collapsed, tap to expand):
  - Approved (green chip) and rejected (red chip) history
- "Edit" button (outline, bottom-left) · "Archive" button (ghost red, bottom-right)

**Actions:**
- Tap ← Back → Challenges
- Tap "✓ Approve" on submission → awards gems · push notification to child ·
  card moves to Past Submissions · if child in app: Celebration Overlay B fires
- Tap "✗ Reject" on submission → rejects · card moves to Past Submissions
- Tap "Past Submissions" → expands/collapses
- Tap "Edit" → edit form (same as Create Challenge, pre-filled) → save → back
- Tap "Archive" → confirm prompt ("Archive this challenge?") → archives → back to Challenges

---

### Create Challenge
**Content:**
- ← Back / Cancel
- **Value Templates** (horizontal scroll, 6 cards): Responsibility · Kindness ·
  Patience · Curiosity · Courage · Empathy — each with icon + title + description
- **Parenting Tip** card (primary-fixed bg, italic quote, left border)
- Form heading: "Create a New Goal" in parent-h1
- Field "THE ACTION": TextInput — "What should your child do?"
- Field "VALUE TAUGHT": chip row (6 values, single-select)
- Field "REPEAT": chip row — Once · Daily · Weekly
- Field "GEM REWARD": number input (default 10)
- Field "ASSIGN TO": child avatar chips + "All children" option
- **Icon Picker**: horizontal scroll of 15 icon chips

**Actions:**
- Tap value template card → pre-fills THE ACTION + VALUE TAUGHT fields
- Tap value chip → selects (highlights)
- Tap repeat chip → selects
- Edit gem reward number (keyboard)
- Tap child avatar → toggles assigned / not assigned
- Tap "All children" → assigns to everyone
- Tap icon chip → selects icon
- Tap "Cancel" → back to Challenges, discard all
- Tap "Create Goal →" → validates (title required) · saves to Supabase ·
  back to Challenges · new card appears at top

---

### Rewards
**Content:**
- "Rewards" heading · "+ New" button
- Reward cards: icon box · title · type chip (colour per type) · gem cost badge ·
  active toggle switch (right)
- Empty state: "Create your first reward"
- BottomTabBar

**Actions:**
- Tap "+ New" → Create Reward
- Tap reward card → edit form (same as Create Reward, pre-filled)
- Toggle active switch → immediately hides / shows reward in child Store (no navigation)
- Pull to refresh

---

### Create Reward
**Content:**
- ← Back / Cancel
- **Type picker** (2×2 grid): Money · Gift · Screen Time · Activity
- **Suggestions** (horizontal scroll, updates per type): pre-filled reward ideas
- Field "TITLE": TextInput
- Field "GEM COST": number input (default 50)
- **Icon Picker**: horizontal scroll of 11 reward icon chips

**Actions:**
- Tap type chip → selects · updates suggestions below
- Tap suggestion card → pre-fills title + icon
- Edit title manually (clears suggestion selection)
- Edit gem cost number
- Tap icon chip → selects
- Tap "Cancel" → back to Rewards, discard
- Tap "Save Reward →" → validates (title + cost required) · saves ·
  back to Rewards · new card appears

---

### My Family
**Content:**
- "My Family" heading
- **Kids** section: child cards (avatar, name, gem balance, total earned)
- "Invite a Child" button → expands inline invite card:
  - 6-char code (large, monospace) · expiry date · "Copy Code" + "Share" buttons
- **Co-Parents** section: linked parent accounts (name, email)
- "Invite a Co-Parent" button → expands inline invite card:
  - Invite link · "Copy Link" + "Share" buttons
- BottomTabBar

**Actions:**
- Tap "Invite a Child" → expands inline code card (collapses if tapped again)
- Tap "Copy Code" → copies 6-char code to clipboard · toast "Copied!"
- Tap "Share" (child invite) → system share sheet with message "Join KidReward with code: XXXXXX"
- Tap "Invite a Co-Parent" → expands inline link card
- Tap "Copy Link" → copies invite URL to clipboard · toast "Copied!"
- Tap "Share" (co-parent invite) → system share sheet with invite link
- Pull to refresh kids list

---

## 6. Celebration System — Technical Notes

### On child submit (Challenge Detail)
```
1. supabase.from('completions').insert(...)
2. Show CelebrationOverlay A (mode: 'submitted')
3. After 2s auto-dismiss: update local state → show "⏳ Waiting" chip
```

### On parent approve (Dashboard or Challenge Detail)
```
1. supabase.rpc('award_gems', { child_id, family_id, gems })
2. supabase.from('completions').update({ status: 'approved', gems_awarded: N })
3. Send push notification via Expo Notifications to child's push token
4. Supabase real-time subscription on child's Home fires:
   → Show CelebrationOverlay B (mode: 'approved', gems: N, challenge: title, levelUp: bool)
```

### Detecting approvals on app open (child was offline)
```
On Home mount:
  Query completions where status='approved' AND updated_at > last_seen_at
  If any results → show CelebrationOverlay B for the most recent one
  Store current timestamp as last_seen_at in AsyncStorage
```

### Push token storage
```
On child login: request notification permission → store push token in profiles table
  profiles.push_token (new column, nullable text)
On parent approve: read child's push_token → send via Expo Push API
```

### New DB column needed
```sql
ALTER TABLE profiles ADD COLUMN push_token text;
```

---

## 7. Summary: What Changes vs Current Build

| Area | Current | Target |
|---|---|---|
| Child background | `#1A0A3C` dark navy | `#fdf7ff` light cream |
| Child cards | `#2D1B69` dark purple | `#ffffff` white with purple shadow |
| Child accent | `#00D4FF` cyan | `#4f378a` deep purple |
| Gem badges | cyan pill | amber `#ffdf93` pill |
| Level badge | small text pill | 192px circle with conic progress ring |
| Quest card radius | 14px | 32px |
| Reward card radius | 16px | 40px |
| CTA buttons | flat | squish 3D shadow |
| Fonts | system | Bricolage Grotesque + Source Serif 4 + Plus Jakarta Sans |
| Bottom nav (child) | 2 tabs (Home, Missions) | 2 tabs (Home, Store) — missions on Home |
| Bottom nav (parent) | 3 tabs | 4 tabs (Dashboard, Challenges, Rewards, Family) |
| On submit | status update only | Celebration Overlay A (soft) |
| On approval | nothing on child | Push notification + Celebration Overlay B (woohoo) |
| Parent bg | `#FFF7ED` warm cream | `#fdf7ff` cool cream |
| Parent shadows | heavy | editorial (0 4px 30px rgba(0,0,0,0.03)) |
