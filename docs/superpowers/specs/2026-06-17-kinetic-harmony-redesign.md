# Kinetic Harmony Redesign — Implementation Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply the "Kinetic Harmony / Dual-Orbit" visual language from the Stitch designs to all four app areas: child home, child missions, child rewards, and all parent screens.

**Architecture:** Token-first approach — update `constants/colors.ts` and `constants/challenges.ts` (icon names), then restyle each screen in-place using those tokens. New UI pieces (LevelBadge, ProgressBar, ActivityFeed, IconPicker) each live in their own file under `components/`.

**Tech Stack:** React Native + Expo SDK 54, `@expo/vector-icons` (MaterialIcons + MaterialCommunityIcons already bundled), Supabase (one migration to convert emoji→icon names).

**Source of truth:** Stitch project `5122639136594342577` — screens: Kid Quest Hub, Parent Reflection Hub, The Treasure Chest, Goal Workshop.

---

## Decisions Made

| Topic | Decision |
|-------|----------|
| Child theme | Dark gamified — `#1A0A3C` bg, `#2D1B69` cards, `#00D4FF` cyan accent, `#FF6B35` orange accent |
| Parent theme | Cream stays — `#FFF7ED` bg, `#FFFFFF` cards + crisper shadows, `#7A3CE1` purple |
| Gem / XP | Same data. `total_gems_earned` drives levels; `gem_balance` drives the store. No new DB column. |
| Iconography | Material icons everywhere — tab bar, buttons, status chips, AND challenge/reward card icons. Parents pick from an icon grid, not an emoji picker. |
| Approach | A — per-screen StyleSheet edits using updated tokens; new UI pieces in separate component files. |

---

## Colour Tokens (`constants/colors.ts`)

```typescript
// Child — Dark Gamified
childBg:       '#1A0A3C'
childCard:     '#2D1B69'
childBorder:   '#4C3490'
childAccent:   '#00D4FF'   // cyan — gem callouts, level badge
childAccent2:  '#FF6B35'   // orange — CTA buttons, action highlights
childMuted:    '#8B7BAE'   // secondary text

// Parent — Light Editorial (unchanged values, unchanged names)
parentBg:      '#FFF7ED'
parentCard:    '#FFFFFF'   // + shadow: 0 2px 12px rgba(0,0,0,0.07)
parentBorder:  '#F3E7D8'
purple:        '#7A3CE1'

// Shared text
textDark:      '#1A1530'
textMid:       '#5C4F7A'
textMuted:     '#8A7AA8'
textLight:     '#FFFFFF'

// Status (unchanged)
success:       '#3DB78A'
warning:       '#FFB84D'
danger:        '#E55545'
pending:       '#FFB84D'

// Gems
gem:           '#7C3AED'
gemGlow:       '#00D4FF'   // changed: cyan instead of coral in child mode
```

---

## Level System (`constants/levels.ts` — new file)

Levels are computed client-side from `membership.total_gems_earned`. No DB changes.

```typescript
export type Level = { level: number; title: string; minGems: number; maxGems: number };

export const LEVELS: Level[] = [
  { level: 1, title: 'Starter',     minGems: 0,    maxGems: 99   },
  { level: 2, title: 'Explorer',    minGems: 100,  maxGems: 249  },
  { level: 3, title: 'Adventurer',  minGems: 250,  maxGems: 499  },
  { level: 4, title: 'Champion',    minGems: 500,  maxGems: 999  },
  { level: 5, title: 'Super Hero',  minGems: 1000, maxGems: 1999 },
  { level: 6, title: 'Legend',      minGems: 2000, maxGems: Infinity },
];

export function getLevel(totalGemsEarned: number): Level {
  return [...LEVELS].reverse().find(l => totalGemsEarned >= l.minGems) ?? LEVELS[0];
}

export function getLevelProgress(totalGemsEarned: number): number {
  const l = getLevel(totalGemsEarned);
  if (l.maxGems === Infinity) return 1;
  return (totalGemsEarned - l.minGems) / (l.maxGems - l.minGems);
}
```

---

## Icon System (`constants/icons.ts` — new file)

The `emoji` column in `challenges` and `rewards` now stores Material icon names (e.g. `"cleaning_services"`) instead of emoji characters. A DB migration converts existing rows.

```typescript
export type IconName = string;  // MaterialCommunityIcons name

export const CHALLENGE_ICONS: { name: IconName; label: string }[] = [
  { name: 'broom',              label: 'Chores'      },
  { name: 'book-open-variant',  label: 'Homework'    },
  { name: 'tree',               label: 'Outdoor'     },
  { name: 'account-group',      label: 'Family'      },
  { name: 'weather-sunny',      label: 'Morning'     },
  { name: 'hand-heart',         label: 'Kindness'    },
  { name: 'calculator',         label: 'Math'        },
  { name: 'bed',                label: 'Room'        },
  { name: 'flower',             label: 'Garden'      },
  { name: 'silverware-fork-knife', label: 'Cooking'  },
  { name: 'human-male-female',  label: 'Sibling'     },
  { name: 'emoticon-happy',     label: 'Behaviour'   },
  { name: 'cellphone-off',      label: 'Screen time' },
  { name: 'run',                label: 'Activity'    },
];

export const REWARD_ICONS: { name: IconName; label: string }[] = [
  { name: 'cash',               label: 'Money'       },
  { name: 'gift',               label: 'Gift'        },
  { name: 'television-play',    label: 'Screen time' },
  { name: 'bike',               label: 'Activity'    },
  { name: 'ice-cream',          label: 'Treat'       },
  { name: 'controller-classic', label: 'Gaming'      },
  { name: 'movie-open',         label: 'Movie'       },
  { name: 'food',               label: 'Food'        },
];
```

Challenge templates in `constants/challenges.ts` replace their `emoji` field with an `icon: IconName` field.

---

## DB Migration

File: `supabase/migrations/20260617000000_emoji_to_icon.sql`

```sql
-- Convert existing emoji values to MaterialCommunityIcons names.
-- Any row with an unrecognised emoji gets the fallback 'star'.
update public.challenges set emoji = case emoji
  when '🧹' then 'broom'
  when '📚' then 'book-open-variant'
  when '🌳' then 'tree'
  when '👨‍👩‍👧‍👦' then 'account-group'
  when '🌅' then 'weather-sunny'
  when '🤝' then 'hand-heart'
  when '🔢' then 'calculator'
  when '🛏️' then 'bed'
  when '🌱' then 'flower'
  when '🍳' then 'silverware-fork-knife'
  when '👫' then 'human-male-female'
  when '😌' then 'emoticon-happy'
  when '📵' then 'cellphone-off'
  else 'star'
end;

update public.rewards set emoji = case emoji
  when '💰' then 'cash'
  when '🎁' then 'gift'
  when '📱' then 'television-play'
  when '🚲' then 'bike'
  when '🍦' then 'ice-cream'
  when '🎮' then 'controller-classic'
  when '🎬' then 'movie-open'
  else 'gift'
end;
```

---

## New Components

### `components/LevelBadge.tsx`
Displays level number, title, and a horizontal progress bar.

Props: `totalGemsEarned: number`

Renders: `⚡ Level N — Title` + progress bar + "X gems to next level" caption.

Used on: child home, child missions list (compact variant).

### `components/ProgressBar.tsx`
Simple styled progress bar with a gradient fill.

Props: `progress: number` (0–1), `color?: string`

### `components/ActivityFeed.tsx`
Fetches and displays the last 20 family events on mount (no realtime).

Query: `completions` joined to `challenges` and `profiles`, union with `redemptions` joined to `rewards`, ordered by `updated_at desc`, limit 20.

Each row shows: icon (Material), challenge/reward title, child name, relative timestamp ("2 hours ago"), status chip (Review / ✓ +N💎 / −N💎).

Used on: parent dashboard, replacing the current "Quick Actions" section (quick actions move below the feed).

### `components/IconPicker.tsx`
A scrollable grid of MaterialCommunityIcons chips.

Props: `icons: { name, label }[]`, `selected: string | null`, `onSelect: (name) => void`

Used on: challenge create form and reward create form, replacing the emoji picker.

---

## Screen-by-Screen Changes

### Child Home (`app/(child)/home.tsx`)
- Background → `childBg`
- Gem balance header: cyan `#00D4FF`, card `childCard` with `childBorder`
- Add `<LevelBadge>` card below gem header
- Quick-stats row (missions, spendable gems, rewards available) — dark cards
- CTA banner → orange gradient button to Missions tab
- Tab icons: home → `home`, missions → `sword-cross`, rewards → `treasure-chest` (MaterialCommunityIcons)

### Child Missions (`app/(child)/challenges/index.tsx`)
- All backgrounds → `childBg` / `childCard`
- Compact `<LevelBadge>` in gem header row
- Segmented filter: dark pill on `childCard` background
- Mission cards: dark `childCard`, gem badge cyan/orange per value amount
- "Waiting" state: amber `#FFB84D`
- Replace emoji on cards with `<MaterialCommunityIcons name={item.emoji} />`

### Child Rewards (`app/(child)/store/index.tsx`)
- All backgrounds → `childBg` / `childCard`
- Gem balance hero: large cyan text, centred at top
- Reward cards: dark, `<MaterialCommunityIcons name={item.emoji} />`
- Affordable: orange "Redeem" button
- Locked (balance < cost): dimmed card + "🔒 Need N more gems" label instead of button

### Parent Dashboard (`app/(parent)/dashboard.tsx`)
- Keep cream background
- Stats row: white cards with `box-shadow` equivalent (`elevation: 3`)
- Add `<ActivityFeed>` component between stats row and Quick Actions
- Quick Actions stays but moves below feed

### Parent Challenges (`app/(parent)/challenges/index.tsx`)
- Keep cream background
- Card shadows: `shadowOpacity: 0.07, shadowRadius: 10`
- Replace emoji on cards with `<MaterialCommunityIcons name={item.emoji} size={26} />`

### Parent Challenge Detail (`app/(parent)/challenges/[id].tsx`)
- Same shadow refinement
- Replace emoji with `<MaterialCommunityIcons name={challenge.emoji} size={32} />`

### Parent Create Challenge (`app/(parent)/challenges/create.tsx`)
- Replace emoji picker (horizontal scroll of templates showing emoji) with an `<IconPicker>` grid
- Template list thumbnails use `<MaterialCommunityIcons>`

### Parent Rewards (`app/(parent)/rewards/index.tsx` + `create.tsx`)
- Shadow refinement
- Replace emoji with `<MaterialCommunityIcons>`
- Create form gets `<IconPicker>` using `REWARD_ICONS`

---

## Files Created / Modified

| Action | File |
|--------|------|
| Modify | `constants/colors.ts` |
| Create | `constants/levels.ts` |
| Create | `constants/icons.ts` |
| Modify | `constants/challenges.ts` — replace `emoji` with `icon` in templates |
| Create | `supabase/migrations/20260617000000_emoji_to_icon.sql` |
| Modify | `supabase/schema.sql` — add comment |
| Create | `components/LevelBadge.tsx` |
| Create | `components/ProgressBar.tsx` |
| Create | `components/ActivityFeed.tsx` |
| Create | `components/IconPicker.tsx` |
| Modify | `app/(child)/home.tsx` |
| Modify | `app/(child)/challenges/index.tsx` |
| Modify | `app/(child)/challenges/[id].tsx` |
| Modify | `app/(child)/store/index.tsx` |
| Modify | `components/GemHeader.tsx` — dark theme variant |
| Modify | `app/(parent)/dashboard.tsx` |
| Modify | `app/(parent)/challenges/index.tsx` |
| Modify | `app/(parent)/challenges/[id].tsx` |
| Modify | `app/(parent)/challenges/create.tsx` |
| Modify | `app/(parent)/rewards/index.tsx` |
| Modify | `app/(parent)/rewards/create.tsx` |

---

## What is NOT in Scope

- Leaderboard tab (v1.1 roadmap)
- Push notifications
- Streaks / badges beyond the level system
- Auth / onboarding screen reskin (kept for a separate pass)
