# Kinetic Harmony Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the Kinetic Harmony / Dual-Orbit visual system from the Stitch designs — dark gamified child mode, refined cream parent mode, Material icons everywhere, level/progress system on child screens, and an activity feed on the parent dashboard.

**Architecture:** Token-first — update `constants/colors.ts` then restyle each screen in-place. New shared UI pieces (LevelBadge, ProgressBar, ActivityFeed, IconPicker) each live in their own file under `components/`. The `emoji` DB column keeps its name but will store MaterialCommunityIcons icon name strings instead of emoji characters, migrated via Supabase Management API.

**Tech Stack:** React Native + Expo SDK 54, `@expo/vector-icons` (MaterialCommunityIcons — already installed), `expo-linear-gradient` (already installed), Supabase Postgres (Management API for migration).

---

## File Map

| Action | File | Role |
|--------|------|------|
| Modify | `constants/colors.ts` | Add dark child tokens, rename childAccent to cyan |
| Create | `constants/levels.ts` | Level thresholds + helpers |
| Create | `constants/icons.ts` | MaterialCommunityIcons name lists for challenges + rewards |
| Modify | `constants/challenges.ts` | Rename `emoji` → `icon` in ChallengeTemplate; update all 14 templates |
| Create | `supabase/migrations/20260617000000_emoji_to_icon.sql` | Convert emoji chars → icon names in DB |
| Create | `components/ProgressBar.tsx` | Thin gradient progress bar |
| Create | `components/LevelBadge.tsx` | Level card with badge + progress bar |
| Modify | `components/GemHeader.tsx` | Dark theme + level badge pill in compact mode |
| Create | `components/IconPicker.tsx` | Scrollable icon grid chip-picker |
| Create | `components/ActivityFeed.tsx` | Parent dashboard recent-activity list |
| Modify | `app/(child)/home.tsx` | Full dark reskin + LevelBadge |
| Modify | `app/(child)/challenges/index.tsx` | Dark reskin + MaterialCommunityIcons |
| Modify | `app/(child)/challenges/[id].tsx` | Dark reskin + MaterialCommunityIcons |
| Modify | `app/(child)/store/index.tsx` | Dark reskin + MaterialCommunityIcons + locked state |
| Modify | `app/(parent)/dashboard.tsx` | Add ActivityFeed, crisper card shadows |
| Modify | `app/(parent)/challenges/index.tsx` | MaterialCommunityIcons, shadow tweak |
| Modify | `app/(parent)/challenges/[id].tsx` | MaterialCommunityIcons |
| Modify | `app/(parent)/challenges/create.tsx` | IconPicker replaces emoji in templates |
| Modify | `app/(parent)/rewards/index.tsx` | MaterialCommunityIcons |
| Modify | `app/(parent)/rewards/create.tsx` | IconPicker replaces emoji text input |

---

## Task 1: Colour Tokens

**Files:**
- Modify: `constants/colors.ts`

- [ ] **Step 1: Replace the file**

```typescript
// Kinetic Harmony — Dual-Orbit palette
// Child mode: dark gamified. Parent mode: light editorial (cream).
export const Colors = {
  // Brand
  purple: '#7A3CE1',
  purpleLight: '#A076F0',
  purpleDark: '#5A2BA8',

  // Child theme — Dark Gamified
  childBg:      '#1A0A3C',
  childCard:    '#2D1B69',
  childBorder:  '#4C3490',
  childAccent:  '#00D4FF',   // cyan — gems, level badge, progress bar
  childAccent2: '#FF6B35',   // orange — CTA buttons, action highlights
  childText:    '#FFFFFF',   // primary text on dark bg
  childMuted:   '#8B7BAE',   // secondary text on dark bg

  // Parent theme — Light Editorial (unchanged values)
  parentBg:     '#FFF7ED',
  parentCard:   '#FFFFFF',
  parentBorder: '#F3E7D8',

  // Gems
  gem:     '#7A3CE1',
  gemGlow: '#00D4FF',        // cyan in new palette

  // Status (shared)
  success: '#3DB78A',
  warning: '#FFB84D',
  danger:  '#E55545',
  pending: '#FFB84D',

  // Text (shared — parent screens + auth)
  textDark:  '#1A1530',
  textMid:   '#5C4F7A',
  textLight: '#FFFFFF',
  textMuted: '#8A7AA8',

  // Surfaces
  border:      '#F3E7D8',
  surfaceSoft: '#FDECC8',

  // Challenge category colours (unchanged)
  cat: {
    phone:    '#FF8E8E',
    outdoor:  '#7DCC8F',
    social:   '#F5A8D8',
    family:   '#FFB07A',
    morning:  '#FFD66B',
    sibling:  '#9DBFE8',
    chores:   '#8FD9C2',
    room:     '#C2DE85',
    garden:   '#94D89E',
    cooking:  '#FFA0A0',
    math:     '#A4B0F0',
    homework: '#C99CE2',
    behavior: '#F0A0BC',
  },
};
```

- [ ] **Step 2: TypeScript check**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

Expected: no errors (or only pre-existing supabase/functions errors).

- [ ] **Step 3: Commit**

```bash
git add constants/colors.ts
git commit -m "feat: dark child palette + cyan gem accent (Kinetic Harmony)"
```

---

## Task 2: Level System

**Files:**
- Create: `constants/levels.ts`

- [ ] **Step 1: Create the file**

```typescript
export type Level = {
  level: number;
  title: string;
  emoji: string;
  minGems: number;
  maxGems: number;
};

export const LEVELS: Level[] = [
  { level: 1, title: 'Starter',    emoji: '🌱', minGems: 0,    maxGems: 99   },
  { level: 2, title: 'Explorer',   emoji: '🔍', minGems: 100,  maxGems: 249  },
  { level: 3, title: 'Adventurer', emoji: '⚔️', minGems: 250,  maxGems: 499  },
  { level: 4, title: 'Champion',   emoji: '🏆', minGems: 500,  maxGems: 999  },
  { level: 5, title: 'Super Hero', emoji: '⚡', minGems: 1000, maxGems: 1999 },
  { level: 6, title: 'Legend',     emoji: '🌟', minGems: 2000, maxGems: Infinity },
];

export function getLevel(totalGemsEarned: number): Level {
  return [...LEVELS].reverse().find(l => totalGemsEarned >= l.minGems) ?? LEVELS[0];
}

export function getLevelProgress(totalGemsEarned: number): number {
  const l = getLevel(totalGemsEarned);
  if (l.maxGems === Infinity) return 1;
  return (totalGemsEarned - l.minGems) / (l.maxGems - l.minGems);
}

export function gemsToNextLevel(totalGemsEarned: number): number {
  const l = getLevel(totalGemsEarned);
  if (l.maxGems === Infinity) return 0;
  return l.maxGems - totalGemsEarned + 1;
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add constants/levels.ts
git commit -m "feat: level system constants (gem thresholds + helpers)"
```

---

## Task 3: Icon Constants

**Files:**
- Create: `constants/icons.ts`

- [ ] **Step 1: Create the file**

```typescript
// MaterialCommunityIcons names for challenge and reward card icons.
// These are stored in the `emoji` column of the challenges / rewards tables.

export type IconName = string;

export const CHALLENGE_ICONS: { name: IconName; label: string }[] = [
  { name: 'broom',                    label: 'Chores'       },
  { name: 'book-open-variant',        label: 'Homework'     },
  { name: 'tree',                     label: 'Outdoor'      },
  { name: 'account-group',            label: 'Family'       },
  { name: 'weather-sunny',            label: 'Morning'      },
  { name: 'hand-heart',               label: 'Kindness'     },
  { name: 'calculator',               label: 'Math'         },
  { name: 'bed',                      label: 'Room'         },
  { name: 'flower',                   label: 'Garden'       },
  { name: 'silverware-fork-knife',    label: 'Cooking'      },
  { name: 'human-male-female-child',  label: 'Siblings'     },
  { name: 'emoticon-happy-outline',   label: 'Behaviour'    },
  { name: 'cellphone-off',            label: 'Screen time'  },
  { name: 'run',                      label: 'Exercise'     },
  { name: 'star-outline',             label: 'Other'        },
];

export const REWARD_ICONS: { name: IconName; label: string }[] = [
  { name: 'cash',                     label: 'Money'        },
  { name: 'gift-outline',             label: 'Gift'         },
  { name: 'television-play',          label: 'Screen time'  },
  { name: 'bike',                     label: 'Activity'     },
  { name: 'ice-cream',                label: 'Treat'        },
  { name: 'gamepad-variant-outline',  label: 'Gaming'       },
  { name: 'movie-open-outline',       label: 'Movie'        },
  { name: 'food',                     label: 'Food'         },
  { name: 'pizza',                    label: 'Pizza'        },
  { name: 'shopping-outline',         label: 'Shopping'     },
  { name: 'star-outline',             label: 'Other'        },
];

// Fallback icon when a stored name can't be matched
export const FALLBACK_ICON: IconName = 'star-outline';
```

- [ ] **Step 2: TypeScript check**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add constants/icons.ts
git commit -m "feat: MaterialCommunityIcons name lists for challenges and rewards"
```

---

## Task 4: Update Challenge Templates

**Files:**
- Modify: `constants/challenges.ts`

Rename the `emoji` field in `ChallengeTemplate` to `icon` and replace all emoji characters with MaterialCommunityIcons names.

- [ ] **Step 1: Replace the entire file**

```typescript
import type { IconName } from './icons';

export type ChallengeTemplate = {
  title: string;
  description: string;
  category: string;
  icon: IconName;
  defaultGems: number;
  defaultBonus: number;
  repeatType: 'once' | 'daily' | 'weekly';
};

export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  {
    title: 'Less screen time today',
    description: 'Keep your phone usage under 2 hours today',
    category: 'phone',
    icon: 'cellphone-off',
    defaultGems: 15,
    defaultBonus: 5,
    repeatType: 'daily',
  },
  {
    title: 'Play outside',
    description: 'Spend at least 30 minutes playing or exercising outside',
    category: 'outdoor',
    icon: 'tree',
    defaultGems: 10,
    defaultBonus: 5,
    repeatType: 'daily',
  },
  {
    title: 'Hang out with friends',
    description: 'Spend quality time with a friend (in person)',
    category: 'social',
    icon: 'account-group',
    defaultGems: 10,
    defaultBonus: 0,
    repeatType: 'weekly',
  },
  {
    title: 'Family time',
    description: 'Join the family for an activity or meal without screens',
    category: 'family',
    icon: 'account-group',
    defaultGems: 10,
    defaultBonus: 5,
    repeatType: 'daily',
  },
  {
    title: 'Up early on a school day',
    description: 'Wake up and be ready before the agreed time',
    category: 'morning',
    icon: 'weather-sunny',
    defaultGems: 15,
    defaultBonus: 10,
    repeatType: 'daily',
  },
  {
    title: 'Help a brother or sister',
    description: 'Do something kind or helpful for a sibling today',
    category: 'sibling',
    icon: 'hand-heart',
    defaultGems: 10,
    defaultBonus: 5,
    repeatType: 'daily',
  },
  {
    title: 'Help clean the house',
    description: 'Help with cleaning — vacuum, mop, wipe surfaces, etc.',
    category: 'chores',
    icon: 'broom',
    defaultGems: 20,
    defaultBonus: 5,
    repeatType: 'weekly',
  },
  {
    title: 'Keep room tidy',
    description: 'Make your bed and keep your room clean all day',
    category: 'room',
    icon: 'bed',
    defaultGems: 10,
    defaultBonus: 5,
    repeatType: 'daily',
  },
  {
    title: 'Help in the garden',
    description: 'Water plants, pull weeds, or help with any garden task',
    category: 'garden',
    icon: 'flower',
    defaultGems: 15,
    defaultBonus: 5,
    repeatType: 'weekly',
  },
  {
    title: 'Help prepare dinner',
    description: 'Help chop, stir, set the table, or assist with cooking',
    category: 'cooking',
    icon: 'silverware-fork-knife',
    defaultGems: 15,
    defaultBonus: 5,
    repeatType: 'daily',
  },
  {
    title: 'Math homework streak',
    description: 'Do math homework every day for a week without being reminded',
    category: 'math',
    icon: 'calculator',
    defaultGems: 50,
    defaultBonus: 20,
    repeatType: 'weekly',
  },
  {
    title: 'Do homework early',
    description: 'Finish all homework before 5 PM',
    category: 'homework',
    icon: 'book-open-variant',
    defaultGems: 15,
    defaultBonus: 5,
    repeatType: 'daily',
  },
  {
    title: 'No missing homework',
    description: 'Complete and hand in every assignment this week',
    category: 'homework',
    icon: 'book-open-variant',
    defaultGems: 30,
    defaultBonus: 15,
    repeatType: 'weekly',
  },
  {
    title: 'No yelling all day',
    description: 'Stay calm and speak kindly to everyone all day',
    category: 'behavior',
    icon: 'emoticon-happy-outline',
    defaultGems: 20,
    defaultBonus: 10,
    repeatType: 'daily',
  },
];

export const CATEGORY_COLORS: Record<string, string> = {
  phone:    '#FF6B6B',
  outdoor:  '#51CF66',
  social:   '#FF9FF3',
  family:   '#FFA94D',
  morning:  '#FFD43B',
  sibling:  '#74C0FC',
  chores:   '#63E6BE',
  room:     '#A9E34B',
  garden:   '#69DB7C',
  cooking:  '#FF8787',
  math:     '#748FFC',
  homework: '#DA77F2',
  behavior: '#F783AC',
};

export const AVATAR_OPTIONS = ['🧒', '👦', '👧', '🧑', '🦸', '🧙', '🦊', '🐼', '🦁', '🐸', '🚀', '⭐'];

export type ChallengeValue =
  | 'responsibility' | 'kindness' | 'patience'
  | 'curiosity' | 'courage' | 'empathy';

export const CHALLENGE_VALUES: {
  key: ChallengeValue;
  label: string;
  emoji: string;
  color: string;
}[] = [
  { key: 'responsibility', label: 'Responsibility', emoji: '🏆', color: '#4B634D' },
  { key: 'kindness',       label: 'Kindness',       emoji: '💛', color: '#D97706' },
  { key: 'patience',       label: 'Patience',       emoji: '⏳', color: '#6366F1' },
  { key: 'curiosity',      label: 'Curiosity',      emoji: '🔍', color: '#0EA5E9' },
  { key: 'courage',        label: 'Courage',        emoji: '🦁', color: '#DC2626' },
  { key: 'empathy',        label: 'Empathy',        emoji: '💜', color: '#7C3AED' },
];

export const VALUE_COLORS: Record<ChallengeValue, string> = Object.fromEntries(
  CHALLENGE_VALUES.map(v => [v.key, v.color])
) as Record<ChallengeValue, string>;
```

- [ ] **Step 2: TypeScript check**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -30
```

Expected: errors about `selected?.emoji` in `create.tsx` — those will be fixed in Task 11.

- [ ] **Step 3: Commit**

```bash
git add constants/challenges.ts constants/icons.ts
git commit -m "feat: rename ChallengeTemplate.emoji → icon; use MaterialCommunityIcons names"
```

---

## Task 5: DB Migration

**Files:**
- Create: `supabase/migrations/20260617000000_emoji_to_icon.sql`

- [ ] **Step 1: Create the SQL file**

```sql
-- Convert emoji characters in challenges.emoji and rewards.emoji
-- to MaterialCommunityIcons name strings.
-- Unrecognised values fall back to 'star-outline'.

update public.challenges
set emoji = case emoji
  when '📵' then 'cellphone-off'
  when '🌳' then 'tree'
  when '👫' then 'account-group'
  when '👨‍👩‍👧‍👦' then 'account-group'
  when '🌅' then 'weather-sunny'
  when '🤝' then 'hand-heart'
  when '🧹' then 'broom'
  when '🛏️' then 'bed'
  when '🌱' then 'flower'
  when '🍳' then 'silverware-fork-knife'
  when '🔢' then 'calculator'
  when '📚' then 'book-open-variant'
  when '✅' then 'book-open-variant'
  when '😌' then 'emoticon-happy-outline'
  when '⭐' then 'star-outline'
  else 'star-outline'
end
where emoji not like '%-%';   -- skip rows already migrated (icon names contain hyphens)

update public.rewards
set emoji = case emoji
  when '💵' then 'cash'
  when '💰' then 'cash'
  when '🎁' then 'gift-outline'
  when '📱' then 'television-play'
  when '🎡' then 'bike'
  when '🍦' then 'ice-cream'
  when '🎮' then 'gamepad-variant-outline'
  when '🎬' then 'movie-open-outline'
  when '🌳' then 'bike'
  when '🧸' then 'gift-outline'
  when '🍕' then 'pizza'
  else 'gift-outline'
end
where emoji not like '%-%';
```

- [ ] **Step 2: Apply migration via Supabase Management API**

```bash
MIGRATION_SQL=$(cat supabase/migrations/20260617000000_emoji_to_icon.sql)
MGMT_TOKEN=$(grep SUPABASE_MGMT_TOKEN .secrets | cut -d= -f2 | tr -d ' ')
curl -s -X POST \
  "https://api.supabase.com/v1/projects/nvrexzvpjklwfgvqcpoe/database/query" \
  -H "Authorization: Bearer $MGMT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(echo "$MIGRATION_SQL" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')}"
```

Expected response: `[{"command":"UPDATE","rowCount":N},{"command":"UPDATE","rowCount":M}]` — rowCounts are the number of rows updated.

- [ ] **Step 3: Update schema.sql comment**

In `supabase/schema.sql`, find the `emoji text` column definition for challenges and add a comment:

```sql
  emoji        text,             -- MaterialCommunityIcons name (e.g. 'broom')
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260617000000_emoji_to_icon.sql supabase/schema.sql
git commit -m "feat: migrate challenges+rewards emoji column to MaterialCommunityIcons names"
```

---

## Task 6: ProgressBar Component

**Files:**
- Create: `components/ProgressBar.tsx`

- [ ] **Step 1: Create the file**

```typescript
import { View, StyleSheet } from 'react-native';

interface Props {
  progress: number;   // 0–1
  color?: string;
  trackColor?: string;
  height?: number;
}

export default function ProgressBar({
  progress,
  color = '#00D4FF',
  trackColor = '#1A0A3C',
  height = 8,
}: Props) {
  const pct = `${Math.min(1, Math.max(0, progress)) * 100}%`;
  return (
    <View style={[styles.track, { backgroundColor: trackColor, height, borderRadius: height / 2 }]}>
      <View style={[styles.fill, { width: pct, backgroundColor: color, height, borderRadius: height / 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { overflow: 'hidden' },
  fill:  {},
});
```

- [ ] **Step 2: TypeScript check**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add components/ProgressBar.tsx
git commit -m "feat: ProgressBar component"
```

---

## Task 7: LevelBadge Component

**Files:**
- Create: `components/LevelBadge.tsx`

- [ ] **Step 1: Create the file**

```typescript
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { getLevel, getLevelProgress, gemsToNextLevel } from '@/constants/levels';
import ProgressBar from './ProgressBar';

interface Props {
  totalGemsEarned: number;
  compact?: boolean;   // compact=true shows just the pill, no progress bar
}

export default function LevelBadge({ totalGemsEarned, compact }: Props) {
  const lv = getLevel(totalGemsEarned);
  const progress = getLevelProgress(totalGemsEarned);
  const toNext = gemsToNextLevel(totalGemsEarned);

  if (compact) {
    return (
      <View style={styles.pill}>
        <Text style={styles.pillText}>{lv.emoji} Lvl {lv.level}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View>
          <Text style={styles.levelLabel}>YOUR LEVEL</Text>
          <Text style={styles.levelTitle}>{lv.emoji} Level {lv.level} — {lv.title}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeNum}>{lv.level}</Text>
        </View>
      </View>
      <View style={{ marginTop: 12 }}>
        <ProgressBar
          progress={progress}
          color={Colors.childAccent}
          trackColor={Colors.childBg}
        />
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerLeft}>{totalGemsEarned} total gems</Text>
        {toNext > 0 && (
          <Text style={styles.footerRight}>{toNext} to Level {lv.level + 1}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.childCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.childBorder,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  levelLabel: {
    fontSize: 10, fontWeight: '700', color: Colors.childMuted,
    letterSpacing: 1.5, marginBottom: 4,
  },
  levelTitle: { fontSize: 15, fontWeight: '800', color: Colors.childAccent },
  badge: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: `${Colors.childAccent}20`,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeNum: { fontSize: 18, fontWeight: '900', color: Colors.childAccent },
  footer: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 8,
  },
  footerLeft:  { fontSize: 11, color: Colors.childMuted },
  footerRight: { fontSize: 11, color: Colors.childAccent, fontWeight: '600' },
  pill: {
    backgroundColor: Colors.childCard,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.childBorder,
  },
  pillText: { fontSize: 11, color: Colors.childMuted, fontWeight: '600' },
});
```

- [ ] **Step 2: TypeScript check**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add components/LevelBadge.tsx components/ProgressBar.tsx
git commit -m "feat: LevelBadge and ProgressBar components"
```

---

## Task 8: Update GemHeader

**Files:**
- Modify: `components/GemHeader.tsx`

Replace the coral/purple gradient with a dark child theme. The non-compact variant also accepts `totalGemsEarned` so it can render a LevelBadge below the balance.

- [ ] **Step 1: Replace the file**

```typescript
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/colors';
import LevelBadge from './LevelBadge';

interface Props {
  name: string;
  gems: number;
  lifetime?: number;
  compact?: boolean;
  onSignOut?: () => void;
}

export default function GemHeader({ name, gems, lifetime, compact, onSignOut }: Props) {
  if (compact) {
    return (
      <View style={styles.headerCompact}>
        <View style={styles.row}>
          <View>
            <Text style={styles.nameSmall}>{name}</Text>
            <Text style={styles.gemCompact}>🔮 {gems} gems</Text>
          </View>
          {typeof lifetime === 'number' && (
            <LevelBadge totalGemsEarned={lifetime} compact />
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.header}>
      <View style={styles.row}>
        <View>
          <Text style={styles.greeting}>Hi {name} 👋</Text>
          {onSignOut ? (
            <TouchableOpacity onPress={onSignOut} style={{ marginTop: 4 }}>
              <Text style={styles.signOut}>Sign out</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.gemPill}>
          <Text style={styles.gemAmount}>🔮 {gems}</Text>
          <Text style={styles.gemLabel}>GEMS</Text>
        </View>
      </View>

      {typeof lifetime === 'number' && (
        <View style={{ marginTop: 16 }}>
          <LevelBadge totalGemsEarned={lifetime} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.childBg,
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: Colors.childBorder,
  },
  headerCompact: {
    backgroundColor: Colors.childBg,
    paddingTop: 50, paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.childBorder,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 22, fontWeight: '800', color: Colors.childText },
  signOut: { fontSize: 13, color: Colors.childMuted },
  nameSmall: { fontSize: 13, color: Colors.childMuted, marginBottom: 2 },
  gemCompact: { fontSize: 16, fontWeight: '800', color: Colors.childAccent },
  gemPill: { alignItems: 'flex-end' },
  gemAmount: { fontSize: 22, fontWeight: '900', color: Colors.childAccent },
  gemLabel: { fontSize: 10, color: Colors.childMuted, letterSpacing: 1, fontWeight: '600' },
});
```

- [ ] **Step 2: TypeScript check**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add components/GemHeader.tsx
git commit -m "feat: GemHeader dark theme + LevelBadge integration"
```

---

## Task 9: IconPicker Component

**Files:**
- Create: `components/IconPicker.tsx`

A scrollable row of icon chips. Tapping toggles selection.

- [ ] **Step 1: Create the file**

```typescript
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import type { IconName } from '@/constants/icons';

interface IconOption {
  name: IconName;
  label: string;
}

interface Props {
  icons: IconOption[];
  selected: IconName | null;
  onSelect: (name: IconName) => void;
  iconColor?: string;
  activeColor?: string;
}

export default function IconPicker({
  icons,
  selected,
  onSelect,
  iconColor = Colors.textMid,
  activeColor = Colors.purple,
}: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {icons.map((ic) => {
        const active = selected === ic.name;
        return (
          <TouchableOpacity
            key={ic.name}
            testID={`icon-pick-${ic.name}`}
            style={[styles.chip, active && { backgroundColor: activeColor, borderColor: activeColor }]}
            onPress={() => onSelect(ic.name)}
          >
            <MaterialCommunityIcons
              name={ic.name as any}
              size={22}
              color={active ? '#fff' : iconColor}
            />
            <Text style={[styles.label, active && styles.labelActive]}>{ic.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 4, gap: 8 },
  chip: {
    alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 14, borderWidth: 1.5, borderColor: Colors.parentBorder,
    backgroundColor: Colors.parentCard, gap: 4,
  },
  label: { fontSize: 10, fontWeight: '600', color: Colors.textMid },
  labelActive: { color: '#fff' },
});
```

- [ ] **Step 2: TypeScript check**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add components/IconPicker.tsx
git commit -m "feat: IconPicker component (MaterialCommunityIcons chip grid)"
```

---

## Task 10: ActivityFeed Component

**Files:**
- Create: `components/ActivityFeed.tsx`

Fetches the 20 most recent family events (completions + redemptions) and renders them as a feed.

- [ ] **Step 1: Create the file**

```typescript
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { FALLBACK_ICON } from '@/constants/icons';

type FeedItem = {
  id: string;
  kind: 'completion' | 'redemption';
  title: string;
  childName: string;
  icon: string;
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  gemsChange: number | null;
  updatedAt: string;
};

interface Props {
  familyId: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ActivityFeed({ familyId }: Props) {
  const [items, setItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    load();
  }, [familyId]);

  async function load() {
    const [{ data: comps }, { data: redemps }] = await Promise.all([
      supabase
        .from('completions')
        .select('id, status, gems_awarded, updated_at, challenges(title, emoji, family_id), profiles!completions_child_id_fkey(name)')
        .eq('challenges.family_id', familyId)
        .not('challenges', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(15),
      supabase
        .from('redemptions')
        .select('id, status, gems_spent, updated_at, rewards(title, emoji), profiles!redemptions_child_id_fkey(name)')
        .eq('family_id', familyId)
        .order('updated_at', { ascending: false })
        .limit(10),
    ]);

    const feed: FeedItem[] = [
      ...(comps ?? []).map((c: any) => ({
        id: `c-${c.id}`,
        kind: 'completion' as const,
        title: c.challenges?.title ?? 'Challenge',
        childName: c.profiles?.name ?? 'Child',
        icon: c.challenges?.emoji ?? FALLBACK_ICON,
        status: c.status,
        gemsChange: c.status === 'approved' ? c.gems_awarded : null,
        updatedAt: c.updated_at,
      })),
      ...(redemps ?? []).map((r: any) => ({
        id: `r-${r.id}`,
        kind: 'redemption' as const,
        title: r.rewards?.title ?? 'Reward',
        childName: r.profiles?.name ?? 'Child',
        icon: r.rewards?.emoji ?? FALLBACK_ICON,
        status: r.status,
        gemsChange: r.status === 'fulfilled' ? -r.gems_spent : null,
        updatedAt: r.updated_at,
      })),
    ]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 20);

    setItems(feed);
  }

  if (items.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Recent Activity</Text>
      {items.map((item) => (
        <View key={item.id} style={styles.row}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name={item.icon as any}
              size={22}
              color={Colors.purple}
            />
          </View>
          <View style={styles.body}>
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.meta}>{item.childName} · {timeAgo(item.updatedAt)}</Text>
          </View>
          <StatusChip item={item} />
        </View>
      ))}
    </View>
  );
}

function StatusChip({ item }: { item: FeedItem }) {
  if (item.kind === 'completion') {
    if (item.status === 'pending') {
      return (
        <View style={[styles.chip, { backgroundColor: 'rgba(255,184,77,0.12)', borderColor: 'rgba(255,184,77,0.3)' }]}>
          <Text style={[styles.chipText, { color: Colors.warning }]}>⏳ Review</Text>
        </View>
      );
    }
    if (item.status === 'approved') {
      return (
        <View style={[styles.chip, { backgroundColor: 'rgba(61,183,138,0.12)', borderColor: 'rgba(61,183,138,0.3)' }]}>
          <Text style={[styles.chipText, { color: Colors.success }]}>✓ +{item.gemsChange}💎</Text>
        </View>
      );
    }
    return (
      <View style={[styles.chip, { backgroundColor: 'rgba(229,85,69,0.1)', borderColor: 'rgba(229,85,69,0.3)' }]}>
        <Text style={[styles.chipText, { color: Colors.danger }]}>Rejected</Text>
      </View>
    );
  }
  // redemption
  if (item.status === 'pending') {
    return (
      <View style={[styles.chip, { backgroundColor: 'rgba(122,60,225,0.08)', borderColor: 'rgba(122,60,225,0.2)' }]}>
        <Text style={[styles.chipText, { color: Colors.purple }]}>Pending</Text>
      </View>
    );
  }
  return (
    <View style={[styles.chip, { backgroundColor: 'rgba(122,60,225,0.08)', borderColor: 'rgba(122,60,225,0.2)' }]}>
      <Text style={[styles.chipText, { color: Colors.purple }]}>{item.gemsChange}💎</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 4 },
  heading: { fontSize: 15, fontWeight: '800', color: Colors.textDark, marginBottom: 12 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.parentCard, borderRadius: 14, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: Colors.parentBorder,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(122,60,225,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  body: { flex: 1 },
  title: { fontSize: 13, fontWeight: '700', color: Colors.textDark },
  meta:  { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  chip: {
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5,
    borderWidth: 1,
  },
  chipText: { fontSize: 11, fontWeight: '700' },
});
```

- [ ] **Step 2: TypeScript check**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add components/ActivityFeed.tsx
git commit -m "feat: ActivityFeed component for parent dashboard"
```

---

## Task 11: Child Home Screen

**Files:**
- Modify: `app/(child)/home.tsx`

Full dark reskin. Replace cream+coral with dark gamified palette. Remove LinearGradient. Add LevelBadge.

- [ ] **Step 1: Replace the file**

```typescript
import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Challenge, Completion } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import GemHeader from '@/components/GemHeader';
import { FALLBACK_ICON } from '@/constants/icons';

export default function ChildDashboard() {
  const { profile, family, membership, signOut, refreshFamily, loading } = useAuth();
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [recentCompletions, setRecentCompletions] = useState<Completion[]>([]);
  const [cheapestReward, setCheapestReward] = useState<{ title: string; gem_cost: number } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!family || !profile) return;
    const [{ data: challenges }, { data: completions }, { data: rewards }] = await Promise.all([
      supabase
        .from('challenges')
        .select('*')
        .eq('family_id', family.id)
        .eq('status', 'active')
        .or(`child_id.eq.${profile.id},child_id.is.null`)
        .order('created_at', { ascending: false })
        .limit(4),
      supabase
        .from('completions')
        .select('*, challenges(*)')
        .eq('child_id', profile.id)
        .order('submitted_at', { ascending: false })
        .limit(3),
      supabase
        .from('rewards')
        .select('title, gem_cost')
        .eq('family_id', family.id)
        .eq('is_active', true)
        .order('gem_cost', { ascending: true })
        .limit(1),
    ]);
    setActiveChallenges(challenges ?? []);
    setRecentCompletions(completions ?? []);
    setCheapestReward(rewards?.[0] ?? null);
  }, [family, profile]);

  useEffect(() => {
    if (loading) return;
    if (!family) { router.replace('/(child)/join'); } else { load(); }
  }, [family, load, loading]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([load(), refreshFamily()]);
    setRefreshing(false);
  };

  const gemBalance = membership?.gem_balance ?? 0;
  const totalEarned = membership?.total_gems_earned ?? 0;
  const nextRewardGap = cheapestReward ? cheapestReward.gem_cost - gemBalance : null;

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.childAccent} />
        }
      >
        <GemHeader
          name={profile?.name ?? ''}
          gems={gemBalance}
          lifetime={totalEarned}
          onSignOut={signOut}
        />

        {/* Quick stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{activeChallenges.length}</Text>
            <Text style={styles.statLabel}>Missions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: Colors.childAccent }]}>🔮 {gemBalance}</Text>
            <Text style={styles.statLabel}>Spendable</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{recentCompletions.length}</Text>
            <Text style={styles.statLabel}>Recent</Text>
          </View>
        </View>

        {/* Active challenges */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACTIVE MISSIONS</Text>
          {activeChallenges.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No missions yet</Text>
              <Text style={styles.emptyMeta}>Ask your parent to add one</Text>
            </View>
          ) : (
            activeChallenges.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.card}
                onPress={() => router.push(`/(child)/challenges/${c.id}`)}
              >
                <View style={styles.cardLeft}>
                  <MaterialCommunityIcons
                    name={(c.emoji || FALLBACK_ICON) as any}
                    size={28}
                    color={Colors.childAccent}
                    style={styles.cardIcon}
                  />
                  <View>
                    <Text style={styles.cardTitle} numberOfLines={1}>{c.title}</Text>
                    <Text style={styles.cardMeta}>
                      {c.repeat_type === 'daily' ? 'Daily' : c.repeat_type === 'weekly' ? 'Weekly' : 'Once'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardPoints}>+{c.gem_reward} 💎</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Next reward callout */}
        {cheapestReward && nextRewardGap !== null && nextRewardGap > 0 && (
          <View style={styles.callout}>
            <Text style={styles.calloutTitle}>{nextRewardGap} gems to your next reward</Text>
            <Text style={styles.calloutMeta}>{cheapestReward.title} · {cheapestReward.gem_cost} gems</Text>
          </View>
        )}

        {/* Store CTA */}
        <TouchableOpacity style={styles.storeCta} onPress={() => router.push('/(child)/store')}>
          <Text style={styles.storeCtaText}>Visit the Treasure Chest 🎁</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.childBg },

  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 18, paddingTop: 16 },
  statCard: {
    flex: 1, backgroundColor: Colors.childCard,
    borderRadius: 14, padding: 12, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.childBorder,
  },
  statNum: { fontSize: 20, fontWeight: '900', color: Colors.childText, marginBottom: 2 },
  statLabel: { fontSize: 10, color: Colors.childMuted, fontWeight: '600' },

  section: { paddingHorizontal: 18, paddingTop: 20 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.childMuted,
    letterSpacing: 2, marginBottom: 12,
  },

  card: {
    backgroundColor: Colors.childCard,
    borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: Colors.childBorder,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  cardIcon: { marginRight: 12 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.childText, marginBottom: 2 },
  cardMeta:  { fontSize: 12, color: Colors.childMuted },
  cardPoints: { fontSize: 14, fontWeight: '800', color: Colors.childAccent },

  empty: {
    backgroundColor: Colors.childCard, borderRadius: 16,
    paddingVertical: 28, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.childBorder,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: Colors.childText, marginBottom: 4 },
  emptyMeta:  { fontSize: 13, color: Colors.childMuted },

  callout: {
    marginHorizontal: 18, marginTop: 16,
    backgroundColor: Colors.childCard,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.childBorder,
  },
  calloutTitle: { fontSize: 14, fontWeight: '700', color: Colors.childAccent, marginBottom: 4 },
  calloutMeta:  { fontSize: 12, color: Colors.childMuted },

  storeCta: {
    margin: 18, marginTop: 20,
    backgroundColor: Colors.childAccent2,
    borderRadius: 100, paddingVertical: 16, alignItems: 'center',
  },
  storeCtaText: { color: Colors.childText, fontWeight: '700', fontSize: 15 },
});
```

- [ ] **Step 2: TypeScript check**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add app/\(child\)/home.tsx
git commit -m "feat: child home dark reskin + level badge + material icons"
```

---

## Task 12: Child Missions Screen

**Files:**
- Modify: `app/(child)/challenges/index.tsx`

Dark reskin. Replace emoji with MaterialCommunityIcons. Keep value chip.

- [ ] **Step 1: Replace the file**

```typescript
import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Challenge } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import GemHeader from '@/components/GemHeader';
import { CHALLENGE_VALUES } from '@/constants/challenges';
import { FALLBACK_ICON } from '@/constants/icons';

function ValueChip({ value }: { value: string | null | undefined }) {
  if (!value) return null;
  const v = CHALLENGE_VALUES.find(x => x.key === value);
  if (!v) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: `${v.color}30`, paddingHorizontal: 8, paddingVertical: 3,
      borderRadius: 20, marginTop: 4, alignSelf: 'flex-start' }}>
      <Text style={{ fontSize: 11 }}>{v.emoji}</Text>
      <Text style={{ fontSize: 11, fontWeight: '700', color: v.color }}>{v.label}</Text>
    </View>
  );
}

export default function ChildChallenges() {
  const { family, profile, membership } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'active' | 'done'>('active');

  const load = useCallback(async () => {
    if (!family || !profile) return;
    const [{ data: ch }, { data: comps }] = await Promise.all([
      supabase
        .from('challenges')
        .select('*')
        .eq('family_id', family.id)
        .eq('status', 'active')
        .or(`child_id.eq.${profile.id},child_id.is.null`)
        .order('created_at', { ascending: false }),
      supabase
        .from('completions')
        .select('challenge_id, status')
        .eq('child_id', profile.id)
        .in('status', ['pending', 'approved']),
    ]);
    setChallenges(ch ?? []);
    const ids = new Set<string>(comps?.map((c: { challenge_id: string }) => c.challenge_id) ?? []);
    setCompletedIds(ids);
  }, [family, profile]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const visible = challenges.filter(c =>
    filter === 'active' ? !completedIds.has(c.id) : completedIds.has(c.id)
  );
  const todoCount = challenges.filter(c => !completedIds.has(c.id)).length;

  return (
    <View style={styles.container}>
      <GemHeader
        name={profile?.name ?? ''}
        gems={membership?.gem_balance ?? 0}
        lifetime={membership?.total_gems_earned ?? 0}
        compact
      />

      <View style={styles.body}>
        <Text style={styles.h1}>Missions</Text>
        <Text style={styles.h2}>{todoCount} to do</Text>

        <View style={styles.segmented}>
          <TouchableOpacity
            style={[styles.seg, filter === 'active' && styles.segOn]}
            onPress={() => setFilter('active')}
          >
            <Text style={[styles.segText, filter === 'active' && styles.segTextOn]}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.seg, filter === 'done' && styles.segOn]}
            onPress={() => setFilter('done')}
          >
            <Text style={[styles.segText, filter === 'done' && styles.segTextOn]}>Done</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
              tintColor={Colors.childAccent}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                {filter === 'active' ? 'No missions yet' : 'Nothing done yet'}
              </Text>
              <Text style={styles.emptyMeta}>
                {filter === 'active' ? 'Ask your parent to add one' : 'Complete a mission to see it here'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const done = completedIds.has(item.id);
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/(child)/challenges/${item.id}`)}
              >
                <View style={styles.iconWrap}>
                  <MaterialCommunityIcons
                    name={(item.emoji || FALLBACK_ICON) as any}
                    size={26}
                    color={done ? Colors.childMuted : Colors.childAccent}
                  />
                </View>
                <View style={styles.cardLeft}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.cardMeta}>
                    {item.repeat_type === 'daily' ? 'Daily' : item.repeat_type === 'weekly' ? 'Weekly' : 'Once'} · {capitalize(item.category)}
                  </Text>
                  <ValueChip value={item.value} />
                </View>
                {done ? (
                  <Text style={styles.cardWaiting}>Waiting</Text>
                ) : (
                  <View style={styles.gemBadge}>
                    <Text style={styles.gemText}>+{item.gem_reward} 💎</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </View>
  );
}

function capitalize(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.childBg },
  body: { flex: 1, paddingHorizontal: 18, paddingTop: 20 },
  h1: { fontSize: 11, color: Colors.childMuted, letterSpacing: 2, fontWeight: '700', marginBottom: 2 },
  h2: { fontSize: 22, fontWeight: '800', color: Colors.childText, marginBottom: 18 },

  segmented: {
    flexDirection: 'row', backgroundColor: Colors.childCard,
    borderRadius: 100, padding: 4, marginBottom: 18,
    borderWidth: 1, borderColor: Colors.childBorder,
  },
  seg: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 100 },
  segOn: { backgroundColor: Colors.childBorder },
  segText: { fontSize: 12, color: Colors.childMuted, fontWeight: '500' },
  segTextOn: { color: Colors.childText, fontWeight: '700' },

  list: { paddingBottom: 30 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.childText, marginBottom: 4 },
  emptyMeta:  { fontSize: 13, color: Colors.childMuted },

  card: {
    backgroundColor: Colors.childCard,
    borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: Colors.childBorder,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: `${Colors.childAccent}10`,
    alignItems: 'center', justifyContent: 'center',
  },
  cardLeft: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.childText, marginBottom: 2 },
  cardMeta:  { fontSize: 11, color: Colors.childMuted },
  gemBadge: {
    backgroundColor: `${Colors.childAccent}15`,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: `${Colors.childAccent}30`,
  },
  gemText: { color: Colors.childAccent, fontWeight: '800', fontSize: 13 },
  cardWaiting: { fontSize: 12, fontWeight: '600', color: Colors.warning },
});
```

- [ ] **Step 2: TypeScript check**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add app/\(child\)/challenges/index.tsx
git commit -m "feat: child missions dark reskin + MaterialCommunityIcons"
```

---

## Task 13: Child Challenge Detail

**Files:**
- Modify: `app/(child)/challenges/[id].tsx`

Dark reskin. Replace emoji display with MaterialCommunityIcons for the challenge icon.

- [ ] **Step 1: Replace styles and icon display**

Replace the entire `StyleSheet.create` block (lines 154–208) with:

```typescript
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.childBg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.childBg },
  loading: { color: Colors.childMuted, fontSize: 16 },
  scroll: { padding: 20, paddingBottom: 40 },

  back: { marginBottom: 16 },
  backText: { color: Colors.childMuted, fontSize: 14, fontWeight: '500' },

  iconHero: { alignSelf: 'center', marginBottom: 16 },
  kicker: { fontSize: 11, color: Colors.childMuted, letterSpacing: 2, fontWeight: '700', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.childText, lineHeight: 32, marginBottom: 10 },
  desc: { fontSize: 14, color: Colors.childMuted, lineHeight: 20, marginBottom: 20 },

  rewardCard: {
    backgroundColor: Colors.childCard,
    borderRadius: 18, padding: 22, alignItems: 'center', marginBottom: 24,
    borderWidth: 1, borderColor: Colors.childBorder,
  },
  rewardLabel: { fontSize: 11, color: Colors.childMuted, letterSpacing: 2, fontWeight: '700', marginBottom: 8 },
  rewardRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  rewardBig: { fontSize: 56, fontWeight: '800', color: Colors.childAccent, lineHeight: 60 },
  rewardUnit: { fontSize: 14, color: Colors.childMuted },
  bonus: { color: Colors.childAccent2, fontWeight: '700', fontSize: 13, marginTop: 8 },

  noteLabel: { fontSize: 11, color: Colors.childMuted, letterSpacing: 2, fontWeight: '700', marginBottom: 8 },
  noteInput: {
    backgroundColor: Colors.childCard,
    borderRadius: 14, padding: 14,
    color: Colors.childText, fontSize: 15,
    textAlignVertical: 'top', minHeight: 90,
    borderWidth: 1, borderColor: Colors.childBorder,
  },
  noteHint: { fontSize: 12, color: Colors.childMuted, marginTop: 6, marginBottom: 20 },

  submitBtn: {
    backgroundColor: Colors.childAccent2,
    borderRadius: 100, paddingVertical: 18, alignItems: 'center',
  },
  disabled: { opacity: 0.5 },
  submitBtnText: { color: Colors.childText, fontWeight: '700', fontSize: 16 },

  cancelBtn: { paddingVertical: 16, alignItems: 'center' },
  cancelBtnText: { color: Colors.childMuted, fontSize: 14 },

  statusCard: {
    backgroundColor: Colors.childCard, borderRadius: 18, padding: 24, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.childBorder,
  },
  statusTitle: { fontSize: 20, fontWeight: '700', color: Colors.childText, marginBottom: 6 },
  statusMeta: { fontSize: 14, color: Colors.childMuted, textAlign: 'center' },
  retryBtn: {
    marginTop: 18, backgroundColor: Colors.childAccent2,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 100,
  },
  retryBtnText: { color: Colors.childText, fontWeight: '600', fontSize: 14 },
});
```

Also add the `MaterialCommunityIcons` import and hero icon display. At the top of the file add:

```typescript
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FALLBACK_ICON } from '@/constants/icons';
```

And inside the return, after the `backText` line and before `kicker`, add:

```tsx
<View style={styles.iconHero}>
  <MaterialCommunityIcons
    name={(challenge.emoji || FALLBACK_ICON) as any}
    size={56}
    color={Colors.childAccent}
  />
</View>
```

- [ ] **Step 2: TypeScript check**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add app/\(child\)/challenges/'\[id\]'.tsx
git commit -m "feat: child challenge detail dark reskin + icon hero"
```

---

## Task 14: Child Store

**Files:**
- Modify: `app/(child)/store/index.tsx`

Dark reskin. MaterialCommunityIcons. Lock state: show "🔒 Need N more gems" instead of Redeem for unaffordable rewards.

- [ ] **Step 1: Replace the file**

```typescript
import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Reward } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import GemHeader from '@/components/GemHeader';
import { FALLBACK_ICON } from '@/constants/icons';

function typeLabel(t: string) {
  return t === 'screen_time' ? 'Screen time' : t === 'money' ? 'Money' : t === 'activity' ? 'Activity' : 'Gift';
}

export default function ChildRewards() {
  const { family, profile, membership, refreshFamily } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [myRedemptions, setMyRedemptions] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!family || !profile) return;
    const [{ data: rw }, { data: redemptions }] = await Promise.all([
      supabase.from('rewards').select('*').eq('family_id', family.id).eq('is_active', true).order('gem_cost', { ascending: true }),
      supabase.from('redemptions').select('reward_id').eq('child_id', profile.id).eq('status', 'pending'),
    ]);
    setRewards(rw ?? []);
    setMyRedemptions(new Set<string>(redemptions?.map((r: { reward_id: string }) => r.reward_id) ?? []));
  }, [family, profile]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([load(), refreshFamily()]);
    setRefreshing(false);
  };

  async function confirmRedeem(reward: Reward) {
    setRedeeming(reward.id);
    setConfirmId(null);
    try {
      const { error } = await supabase.rpc('spend_gems', {
        p_child_id: profile!.id,
        p_family_id: family!.id,
        p_gems: reward.gem_cost,
      });
      if (error) {
        Alert.alert('Error', error.message.includes('Insufficient') ? 'Not enough gems!' : error.message);
        setRedeeming(null);
        return;
      }
      await supabase.from('redemptions').insert({
        reward_id: reward.id,
        child_id: profile!.id,
        family_id: family!.id,
        gems_spent: reward.gem_cost,
        status: 'pending',
        requested_at: new Date().toISOString(),
      });
      await Promise.all([load(), refreshFamily()]);
      Alert.alert('Redeemed! 🎉', 'Your parent will see your request and confirm it soon.');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Something went wrong');
    } finally {
      setRedeeming(null);
    }
  }

  const balance = membership?.gem_balance ?? 0;
  const affordable = rewards.filter(r => balance >= r.gem_cost);
  const locked = rewards.filter(r => balance < r.gem_cost);
  const sections = [
    ...(affordable.length ? [{ key: 'a', label: 'YOU CAN GET', data: affordable }] : []),
    ...(locked.length    ? [{ key: 'l', label: 'KEEP SAVING',  data: locked    }] : []),
  ];

  const renderItem = (item: Reward) => {
    const canAfford = balance >= item.gem_cost;
    const pending = myRedemptions.has(item.id);
    const isConfirming = confirmId === item.id;
    const isRedeeming = redeeming === item.id;
    const need = item.gem_cost - balance;

    return (
      <View key={item.id} style={[styles.card, !canAfford && styles.cardLocked]}>
        <View style={styles.cardRow}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name={(item.emoji || FALLBACK_ICON) as any}
              size={28}
              color={canAfford ? Colors.childAccent : Colors.childMuted}
            />
          </View>
          <View style={styles.cardLeft}>
            <Text style={[styles.cardTitle, !canAfford && styles.dimText]} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.cardMeta}>{typeLabel(item.reward_type)}</Text>
          </View>
          <View style={[styles.costBadge, !canAfford && styles.costBadgeLocked]}>
            <Text style={[styles.costText, !canAfford && styles.costTextLocked]}>
              {item.gem_cost} 💎
            </Text>
          </View>
        </View>

        {!canAfford && (
          <View style={styles.lockRow}>
            <Text style={styles.lockText}>🔒 Need {need} more gems</Text>
          </View>
        )}

        {canAfford && (
          pending ? (
            <Text style={styles.statusText}>⏳ Waiting for parent</Text>
          ) : isRedeeming ? (
            <Text style={styles.statusText}>Processing…</Text>
          ) : isConfirming ? (
            <View style={styles.confirmRow}>
              <TouchableOpacity style={styles.confirmBtn} onPress={() => confirmRedeem(item)}>
                <Text style={styles.confirmBtnText}>Yes, redeem!</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setConfirmId(null)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.redeemBtn} onPress={() => setConfirmId(item.id)}>
              <Text style={styles.redeemBtnText}>Redeem 🎁</Text>
            </TouchableOpacity>
          )
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <GemHeader
        name={profile?.name ?? ''}
        gems={balance}
        lifetime={membership?.total_gems_earned ?? 0}
        compact
      />

      <View style={styles.body}>
        <Text style={styles.h1}>Treasure Chest</Text>
        <Text style={styles.h2}>{affordable.length} you can get</Text>

        <FlatList
          data={sections}
          keyExtractor={(s) => s.key}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.childAccent} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No rewards yet</Text>
              <Text style={styles.emptyMeta}>Your parent hasn't set up rewards yet</Text>
            </View>
          }
          renderItem={({ item: section }) => (
            <>
              <Text style={styles.sectionLabel}>{section.label}</Text>
              {section.data.map(renderItem)}
            </>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.childBg },
  body: { flex: 1, paddingHorizontal: 18, paddingTop: 20 },
  h1: { fontSize: 11, color: Colors.childMuted, letterSpacing: 2, fontWeight: '700', marginBottom: 2 },
  h2: { fontSize: 22, fontWeight: '800', color: Colors.childText, marginBottom: 18 },
  list: { paddingBottom: 30 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.childMuted,
    letterSpacing: 2, marginTop: 8, marginBottom: 10,
  },
  card: {
    backgroundColor: Colors.childCard, borderRadius: 16, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: Colors.childBorder,
  },
  cardLocked: { opacity: 0.65 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: `${Colors.childAccent}12`,
    alignItems: 'center', justifyContent: 'center',
  },
  cardLeft: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.childText, marginBottom: 2 },
  cardMeta: { fontSize: 11, color: Colors.childMuted },
  dimText: { color: Colors.childMuted },
  costBadge: {
    backgroundColor: `${Colors.childAccent}15`, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: `${Colors.childAccent}30`,
  },
  costBadgeLocked: { backgroundColor: `${Colors.childBorder}50`, borderColor: Colors.childBorder },
  costText: { color: Colors.childAccent, fontWeight: '800', fontSize: 13 },
  costTextLocked: { color: Colors.childMuted },
  lockRow: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.childBorder },
  lockText: { fontSize: 12, color: Colors.childMuted, fontWeight: '600' },
  statusText: { fontSize: 12, color: Colors.warning, fontWeight: '600', marginTop: 10 },
  redeemBtn: {
    marginTop: 10, backgroundColor: Colors.childAccent2,
    paddingVertical: 10, borderRadius: 100, alignItems: 'center',
  },
  redeemBtnText: { color: Colors.childText, fontSize: 13, fontWeight: '700' },
  confirmRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  confirmBtn: {
    flex: 1, backgroundColor: Colors.success,
    paddingVertical: 10, borderRadius: 100, alignItems: 'center',
  },
  confirmBtnText: { color: Colors.childText, fontWeight: '700', fontSize: 13 },
  cancelBtn: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.childBorder,
    borderRadius: 100, alignItems: 'center',
  },
  cancelBtnText: { color: Colors.childMuted, fontWeight: '500', fontSize: 13 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.childText, marginBottom: 4 },
  emptyMeta: { fontSize: 13, color: Colors.childMuted },
});
```

- [ ] **Step 2: TypeScript check**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add app/\(child\)/store/index.tsx
git commit -m "feat: child store dark reskin + locked reward state + material icons"
```

---

## Task 15: Parent Dashboard

**Files:**
- Modify: `app/(parent)/dashboard.tsx`

Add `<ActivityFeed>` between stats card and Quick Actions. Tighten card shadows.

- [ ] **Step 1: Add ActivityFeed import and component**

At the top of the file, add:

```typescript
import ActivityFeed from '@/components/ActivityFeed';
```

Inside the return, after the closing `</View>` of the `{/* Primary CTA */}` block (around line 115) and before the Kids section, add:

```tsx
{/* Activity feed */}
{family && (
  <View style={styles.section}>
    <ActivityFeed familyId={family.id} />
  </View>
)}
```

Also update the `card` style to add shadow:

```typescript
card: {
  backgroundColor: Colors.parentCard,
  borderRadius: 16, padding: 20,
  borderWidth: 1, borderColor: Colors.parentBorder,
  shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
},
```

- [ ] **Step 2: TypeScript check**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add app/\(parent\)/dashboard.tsx components/ActivityFeed.tsx
git commit -m "feat: parent dashboard activity feed + crisper card shadows"
```

---

## Task 16: Parent Challenges List

**Files:**
- Modify: `app/(parent)/challenges/index.tsx`

Replace `{item.emoji}` Text with `<MaterialCommunityIcons>`. Tweak shadow.

- [ ] **Step 1: Add import**

At the top of the file add:

```typescript
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FALLBACK_ICON } from '@/constants/icons';
```

- [ ] **Step 2: Replace emoji Text node**

Find (around line 102):

```tsx
<Text style={styles.cardEmoji}>{item.emoji}</Text>
```

Replace with:

```tsx
<MaterialCommunityIcons
  name={(item.emoji || FALLBACK_ICON) as any}
  size={28}
  color={Colors.purple}
/>
```

Remove the `cardEmoji` style entry from the StyleSheet.

- [ ] **Step 3: Tighten shadow on card style**

Find the `card` style and update shadowOpacity/shadowRadius:

```typescript
card: {
  flexDirection: 'row', backgroundColor: Colors.parentCard,
  borderRadius: 16, overflow: 'hidden',
  shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
},
```

- [ ] **Step 4: TypeScript check**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

- [ ] **Step 5: Commit**

```bash
git add app/\(parent\)/challenges/index.tsx
git commit -m "feat: parent challenges list — MaterialCommunityIcons + shadow tweak"
```

---

## Task 17: Parent Challenge Detail

**Files:**
- Modify: `app/(parent)/challenges/[id].tsx`

Replace emoji display with `<MaterialCommunityIcons>`.

- [ ] **Step 1: Add imports**

At the top of the file add:

```typescript
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FALLBACK_ICON } from '@/constants/icons';
```

- [ ] **Step 2: Replace emoji display**

Find the `<Text>` node that renders `challenge.emoji` (there is a large emoji in the hero area — it will be something like `<Text style={{ fontSize: 64 ... }}>{challenge.emoji}</Text>`). Replace it with:

```tsx
<MaterialCommunityIcons
  name={(challenge.emoji || FALLBACK_ICON) as any}
  size={56}
  color={Colors.purple}
/>
```

- [ ] **Step 3: TypeScript check + commit**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
git add app/\(parent\)/challenges/'\[id\]'.tsx
git commit -m "feat: parent challenge detail — MaterialCommunityIcons icon"
```

---

## Task 18: Parent Create Challenge

**Files:**
- Modify: `app/(parent)/challenges/create.tsx`

Replace `selected?.emoji` with `selected?.icon`. Add `<IconPicker>` for custom icon selection.

- [ ] **Step 1: Update imports**

Replace:

```typescript
import { CHALLENGE_TEMPLATES, CATEGORY_COLORS, ChallengeTemplate, CHALLENGE_VALUES, ChallengeValue } from '@/constants/challenges';
```

With:

```typescript
import { CHALLENGE_TEMPLATES, CATEGORY_COLORS, ChallengeTemplate, CHALLENGE_VALUES, ChallengeValue } from '@/constants/challenges';
import { CHALLENGE_ICONS, FALLBACK_ICON } from '@/constants/icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import IconPicker from '@/components/IconPicker';
```

- [ ] **Step 2: Update state**

Change:

```typescript
const [value, setValue] = useState<ChallengeValue | null>(null);
```

To (keep it; add icon state below it):

```typescript
const [value, setValue] = useState<ChallengeValue | null>(null);
const [icon, setIcon] = useState<string>(FALLBACK_ICON);
```

- [ ] **Step 3: Update pickTemplate**

In the `pickTemplate` function, replace:

```typescript
setTitle(t.title);
setDescription(t.description);
setGems(String(t.defaultGems));
setBonus(String(t.defaultBonus));
setRepeatType(t.repeatType);
```

With:

```typescript
setTitle(t.title);
setDescription(t.description);
setGems(String(t.defaultGems));
setBonus(String(t.defaultBonus));
setRepeatType(t.repeatType);
setIcon(t.icon);
```

- [ ] **Step 4: Update Supabase insert**

Change `emoji: selected?.emoji ?? '⭐'` to:

```typescript
emoji: icon,
```

- [ ] **Step 5: Replace template card emoji with icon**

In the template card JSX, replace:

```tsx
<Text style={styles.templateEmoji}>{t.emoji}</Text>
```

With:

```tsx
<MaterialCommunityIcons
  name={(t.icon || FALLBACK_ICON) as any}
  size={28}
  color={CATEGORY_COLORS[t.category] ?? Colors.purple}
  style={{ marginBottom: 6 }}
/>
```

- [ ] **Step 6: Add IconPicker before value picker**

After the Repeat field View and before the Value Taught field View, add:

```tsx
<View style={styles.field}>
  <Text style={styles.label}>Icon</Text>
  <IconPicker
    icons={CHALLENGE_ICONS}
    selected={icon}
    onSelect={setIcon}
  />
</View>
```

- [ ] **Step 7: TypeScript check**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

- [ ] **Step 8: Commit**

```bash
git add app/\(parent\)/challenges/create.tsx components/IconPicker.tsx
git commit -m "feat: challenge create — IconPicker replaces emoji; template.icon"
```

---

## Task 19: Parent Rewards List

**Files:**
- Modify: `app/(parent)/rewards/index.tsx`

Replace emoji Text with MaterialCommunityIcons. Tweak TYPE_LABELS to remove emoji.

- [ ] **Step 1: Add imports**

```typescript
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FALLBACK_ICON } from '@/constants/icons';
```

- [ ] **Step 2: Update TYPE_LABELS** (remove emoji from labels — icons do the work now)

```typescript
const TYPE_LABELS: Record<string, string> = {
  money:       'Money',
  gift:        'Gift',
  screen_time: 'Screen Time',
  activity:    'Activity',
};
```

- [ ] **Step 3: Replace emoji Text**

Find:

```tsx
<Text style={[styles.rewardEmoji, !item.is_active && styles.dim]}>{item.emoji}</Text>
```

Replace with:

```tsx
<MaterialCommunityIcons
  name={(item.emoji || FALLBACK_ICON) as any}
  size={32}
  color={item.is_active ? Colors.purple : Colors.textMuted}
/>
```

Remove `rewardEmoji` from styles.

- [ ] **Step 4: TypeScript check + commit**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
git add app/\(parent\)/rewards/index.tsx
git commit -m "feat: parent rewards list — MaterialCommunityIcons"
```

---

## Task 20: Parent Create Reward

**Files:**
- Modify: `app/(parent)/rewards/create.tsx`

Replace emoji TextInput and SUGGESTED_REWARDS emoji chars with MaterialCommunityIcons. Add `<IconPicker>`.

- [ ] **Step 1: Add imports**

```typescript
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { REWARD_ICONS, FALLBACK_ICON } from '@/constants/icons';
import IconPicker from '@/components/IconPicker';
```

- [ ] **Step 2: Update REWARD_TYPES** — replace emoji with icon names

```typescript
const REWARD_TYPES: { type: RewardType; label: string; icon: string; desc: string }[] = [
  { type: 'money',       label: 'Money',       icon: 'cash',                  desc: 'Real cash or pocket money' },
  { type: 'gift',        label: 'Gift',        icon: 'gift-outline',          desc: 'A toy, book, or surprise' },
  { type: 'screen_time', label: 'Screen Time', icon: 'television-play',       desc: 'Extra gaming or TV time' },
  { type: 'activity',    label: 'Activity',    icon: 'bike',                  desc: 'Trip, outing, or experience' },
];
```

- [ ] **Step 3: Update SUGGESTED_REWARDS**

```typescript
const SUGGESTED_REWARDS = [
  { title: '£1 pocket money',        icon: 'cash',                 type: 'money'       as RewardType, cost: 50,  desc: '' },
  { title: '£5 pocket money',        icon: 'cash',                 type: 'money'       as RewardType, cost: 200, desc: '' },
  { title: '30 min extra screen time', icon: 'television-play',    type: 'screen_time' as RewardType, cost: 30,  desc: 'Extra gaming or TV time' },
  { title: 'Choose dinner tonight',  icon: 'pizza',                type: 'activity'    as RewardType, cost: 40,  desc: 'Pick what the family eats!' },
  { title: 'Movie night pick',       icon: 'movie-open-outline',   type: 'activity'    as RewardType, cost: 60,  desc: 'Choose the movie' },
  { title: 'Trip to the park',       icon: 'bike',                 type: 'activity'    as RewardType, cost: 80,  desc: 'A fun trip out' },
  { title: 'Small toy or book',      icon: 'gift-outline',         type: 'gift'        as RewardType, cost: 100, desc: 'Up to £5 toy or book' },
  { title: 'New video game',         icon: 'gamepad-variant-outline', type: 'gift'     as RewardType, cost: 500, desc: 'A new game of their choice' },
];
```

- [ ] **Step 4: Update state**

Change:

```typescript
const [emoji, setEmoji] = useState('🎁');
```

To:

```typescript
const [icon, setIcon] = useState<string>('gift-outline');
```

- [ ] **Step 5: Update pickSuggestion**

```typescript
function pickSuggestion(s: typeof SUGGESTED_REWARDS[0]) {
  setTitle(s.title);
  setIcon(s.icon);
  setType(s.type);
  setCost(String(s.cost));
  setDescription(s.desc);
}
```

- [ ] **Step 6: Update Supabase insert**

Change `emoji,` to `emoji: icon,`.

- [ ] **Step 7: Update suggestion card JSX**

Replace `<Text style={styles.suggEmoji}>{s.emoji}</Text>` with:

```tsx
<MaterialCommunityIcons name={(s.icon || FALLBACK_ICON) as any} size={28} color={Colors.purple} style={{ marginBottom: 6 }} />
```

- [ ] **Step 8: Update type card JSX**

Replace `<Text style={styles.typeEmoji}>{rt.emoji}</Text>` with:

```tsx
<MaterialCommunityIcons name={(rt.icon || FALLBACK_ICON) as any} size={24} color={type === rt.type ? Colors.purple : Colors.textMid} style={{ marginBottom: 4 }} />
```

And update the `onPress`:

```tsx
onPress={() => { setType(rt.type); setIcon(rt.icon); }}
```

- [ ] **Step 9: Replace emoji TextInput with IconPicker**

Remove the entire emoji `<View style={[styles.field, { flex: 1 }]}>` block (the one with `Emoji` label and emojiInput TextInput). Replace it with:

```tsx
<View style={styles.field}>
  <Text style={styles.label}>Icon</Text>
  <IconPicker
    icons={REWARD_ICONS}
    selected={icon}
    onSelect={setIcon}
  />
</View>
```

Remove `emojiInput` from styles.

- [ ] **Step 10: TypeScript check**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | grep -v "supabase/functions" | head -20
```

Expected: no errors.

- [ ] **Step 11: Commit**

```bash
git add app/\(parent\)/rewards/create.tsx
git commit -m "feat: reward create — IconPicker replaces emoji text input"
```

---

## Task 21: Full E2E Suite

- [ ] **Step 1: Push to GitHub (triggers Vercel deploy)**

```bash
git push origin master
```

- [ ] **Step 2: Wait for Vercel deploy (~3 min), then verify value-chip keyword in bundle**

```bash
sleep 180 && curl -sf https://reward-hazel.vercel.app \
  | grep -o 'src="[^"]*\.js"' \
  | head -1 \
  | sed 's/src="//;s/"//' \
  | xargs -I{} curl -sf "https://reward-hazel.vercel.app{}" \
  | grep -c "broom\|childBg\|LevelBadge" || echo "0"
```

Expected: a number > 0.

- [ ] **Step 3: Run the full E2E suite**

```bash
npx playwright test
```

Expected: `154 passed` (or more if new tests added). Zero failures.

- [ ] **Step 4: If any test fails**

Check `test-results/*/error-context.md` for the failing test. The most likely breakage is a test that looked for an emoji character in a challenge card — those tests need updating to look for text content (challenge title) instead.

---

## Self-Review Checklist

**Spec coverage:**
- ✅ Colour tokens (Task 1)
- ✅ Level system (Task 2)
- ✅ Icon system (Task 3)
- ✅ DB migration (Task 5)
- ✅ ProgressBar (Task 6)
- ✅ LevelBadge (Task 7)
- ✅ GemHeader dark (Task 8)
- ✅ IconPicker (Task 9)
- ✅ ActivityFeed (Task 10)
- ✅ Child home (Task 11)
- ✅ Child missions (Task 12)
- ✅ Child challenge detail (Task 13)
- ✅ Child store (Task 14)
- ✅ Parent dashboard (Task 15)
- ✅ Parent challenges list (Task 16)
- ✅ Parent challenge detail (Task 17)
- ✅ Parent create challenge (Task 18)
- ✅ Parent rewards list (Task 19)
- ✅ Parent create reward (Task 20)

**Not in scope (deferred):**
- Auth / onboarding screens
- Leaderboard tab
