# Values System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `value` field to challenges (Responsibility, Kindness, Patience, Curiosity, Courage, Empathy) so parents can tag what virtue a challenge builds, and that tag appears as a colour chip on both parent and child screens.

**Architecture:** Single nullable `value` column in the `challenges` table; a constant in `constants/challenges.ts` drives the picker and colour map; UI changes are additive chips/labels on 4 existing screens plus the create form.

**Tech Stack:** Supabase (Postgres migration via CLI), TypeScript, React Native / Expo Router, Playwright (E2E).

---

## File Map

| Action | File |
|--------|------|
| Create | `supabase/migrations/20260616000000_add_value_to_challenges.sql` |
| Modify | `supabase/schema.sql` (keep in sync) |
| Modify | `lib/supabase.ts` — add `value` to `Challenge` type |
| Modify | `constants/challenges.ts` — add `CHALLENGE_VALUES` constant |
| Modify | `app/(parent)/challenges/create.tsx` — value picker |
| Modify | `app/(parent)/challenges/[id].tsx` — value chip on detail card |
| Modify | `app/(parent)/challenges/index.tsx` — value chip on list cards |
| Modify | `app/(parent)/dashboard.tsx` — value chip on pending submissions |
| Modify | `app/(child)/challenges/index.tsx` — value chip on quest cards |
| Modify | `tests/e2e/03-challenges.spec.ts` — new US-VALUE test |

---

## Task 1: Database migration

**Files:**
- Create: `supabase/migrations/20260616000000_add_value_to_challenges.sql`
- Modify: `supabase/schema.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- supabase/migrations/20260616000000_add_value_to_challenges.sql
alter table public.challenges
  add column if not exists value text
    check (value is null or value in (
      'responsibility','kindness','patience','curiosity','courage','empathy'
    ));
```

- [ ] **Step 2: Push migration to Supabase**

```bash
cd /mnt/c/work/reward
npx supabase db push
```

Expected: `Applying migration 20260616000000_add_value_to_challenges.sql` with no errors. If prompted for a password, check `.secrets` for `SUPABASE_MANAGEMENT_TOKEN`.

- [ ] **Step 3: Update schema.sql to stay in sync**

In `supabase/schema.sql`, find the line:

```sql
  created_by   uuid not null references public.profiles(id),
  created_at   timestamptz default now()
);
```

and replace with:

```sql
  value        text check (value is null or value in (
                 'responsibility','kindness','patience','curiosity','courage','empathy'
               )),
  created_by   uuid not null references public.profiles(id),
  created_at   timestamptz default now()
);
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260616000000_add_value_to_challenges.sql supabase/schema.sql
git commit -m "feat: add value column to challenges table"
```

---

## Task 2: TypeScript type + constants

**Files:**
- Modify: `lib/supabase.ts`
- Modify: `constants/challenges.ts`

- [ ] **Step 1: Add `value` to the Challenge type in `lib/supabase.ts`**

Find:
```typescript
export type Challenge = {
  id: string;
  family_id: string;
  child_id: string | null;
  title: string;
  description: string | null;
  category: string;
  emoji: string;
  gem_reward: number;
  bonus_gems: number;
  status: 'active' | 'completed' | 'archived';
  repeat_type: 'once' | 'daily' | 'weekly';
  due_date: string | null;
  created_by: string;
  created_at: string;
};
```

Replace with:
```typescript
export type ChallengeValue =
  | 'responsibility' | 'kindness' | 'patience'
  | 'curiosity' | 'courage' | 'empathy';

export type Challenge = {
  id: string;
  family_id: string;
  child_id: string | null;
  title: string;
  description: string | null;
  category: string;
  emoji: string;
  gem_reward: number;
  bonus_gems: number;
  bonus_gems: number;
  status: 'active' | 'completed' | 'archived';
  repeat_type: 'once' | 'daily' | 'weekly';
  due_date: string | null;
  value: ChallengeValue | null;
  created_by: string;
  created_at: string;
};
```

- [ ] **Step 2: Add `CHALLENGE_VALUES` to `constants/challenges.ts`**

Append before the final export of `AVATAR_OPTIONS`:

```typescript
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
  { key: 'kindness',       label: 'Kindness',       emoji: '💛', color: '#F59E0B' },
  { key: 'patience',       label: 'Patience',       emoji: '⏳', color: '#6366F1' },
  { key: 'curiosity',      label: 'Curiosity',      emoji: '🔍', color: '#0EA5E9' },
  { key: 'courage',        label: 'Courage',        emoji: '🦁', color: '#EF4444' },
  { key: 'empathy',        label: 'Empathy',        emoji: '💜', color: '#8B5CF6' },
];

export const VALUE_COLORS: Record<ChallengeValue, string> = Object.fromEntries(
  CHALLENGE_VALUES.map(v => [v.key, v.color])
) as Record<ChallengeValue, string>;
```

- [ ] **Step 3: Fix duplicate in supabase.ts**

In the edit above, `bonus_gems: number;` was accidentally duplicated. Open `lib/supabase.ts` and ensure `bonus_gems` appears exactly once in the Challenge type.

- [ ] **Step 4: TypeScript check**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | head -40
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add lib/supabase.ts constants/challenges.ts
git commit -m "feat: add ChallengeValue type and CHALLENGE_VALUES constant"
```

---

## Task 3: Parent challenge create screen — value picker

**Files:**
- Modify: `app/(parent)/challenges/create.tsx`

- [ ] **Step 1: Add import for CHALLENGE_VALUES**

Change line 10:
```typescript
import { CHALLENGE_TEMPLATES, CATEGORY_COLORS, ChallengeTemplate } from '@/constants/challenges';
```
to:
```typescript
import { CHALLENGE_TEMPLATES, CATEGORY_COLORS, ChallengeTemplate, CHALLENGE_VALUES, ChallengeValue } from '@/constants/challenges';
```

- [ ] **Step 2: Add value state**

After `const [saving, setSaving] = useState(false);` (line 20), add:
```typescript
const [value, setValue] = useState<ChallengeValue | null>(null);
```

- [ ] **Step 3: Include value in save payload**

In the `save()` function, change the `supabase.from('challenges').insert({` call to include value:
```typescript
const { error } = await supabase.from('challenges').insert({
  family_id: family.id,
  title: title.trim(),
  description: description.trim() || null,
  category: selected?.category ?? 'homework',
  emoji: selected?.emoji ?? '⭐',
  gem_reward: parseInt(gems, 10) || 10,
  bonus_gems: parseInt(bonus, 10) || 0,
  repeat_type: repeatType,
  value: value,
  status: 'active',
  created_by: profile.id,
});
```

- [ ] **Step 4: Add the value picker UI**

After the Repeat field's closing `</View>` (after the segmented control, around line 160), add this new field before the closing `</ScrollView>`:

```tsx
<View style={styles.field}>
  <Text style={styles.label}>Value Taught</Text>
  <View style={styles.valueGrid}>
    {CHALLENGE_VALUES.map((v) => (
      <TouchableOpacity
        testID={`value-chip-${v.key}`}
        key={v.key}
        style={[
          styles.valueChip,
          value === v.key && { backgroundColor: v.color, borderColor: v.color },
        ]}
        onPress={() => setValue(prev => prev === v.key ? null : v.key)}
      >
        <Text style={styles.valueChipEmoji}>{v.emoji}</Text>
        <Text style={[styles.valueChipLabel, value === v.key && styles.valueChipLabelActive]}>
          {v.label}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
</View>
```

- [ ] **Step 5: Add styles**

In the `StyleSheet.create({...})` block, add after `segmentTextActive`:
```typescript
valueGrid: {
  flexDirection: 'row', flexWrap: 'wrap', gap: 8,
},
valueChip: {
  flexDirection: 'row', alignItems: 'center', gap: 6,
  paddingHorizontal: 12, paddingVertical: 8,
  borderRadius: 20, borderWidth: 1.5, borderColor: Colors.parentBorder,
  backgroundColor: Colors.parentCard,
},
valueChipEmoji: { fontSize: 14 },
valueChipLabel: { fontSize: 13, fontWeight: '600', color: Colors.textMid },
valueChipLabelActive: { color: Colors.textLight },
```

- [ ] **Step 6: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add 'app/(parent)/challenges/create.tsx'
git commit -m "feat: add value picker to challenge create form"
```

---

## Task 4: Value chip component (shared helper)

Rather than repeating chip JSX across 4 screens, extract a tiny inline component into each file that needs it. No separate file — keep it collocated.

**Files:**
- Modify: `app/(parent)/challenges/[id].tsx`
- Modify: `app/(parent)/challenges/index.tsx`
- Modify: `app/(parent)/dashboard.tsx`
- Modify: `app/(child)/challenges/index.tsx`

- [ ] **Step 1: Show value chip on parent challenge detail (`app/(parent)/challenges/[id].tsx`)**

Add import at top:
```typescript
import { CHALLENGE_VALUES } from '@/constants/challenges';
```

Add helper inside the component file, before the `export default` line:
```typescript
function ValueChip({ value }: { value: string | null | undefined }) {
  if (!value) return null;
  const v = CHALLENGE_VALUES.find(x => x.key === value);
  if (!v) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: `${v.color}20`, paddingHorizontal: 10, paddingVertical: 4,
      borderRadius: 20, alignSelf: 'center', marginTop: 8 }}>
      <Text style={{ fontSize: 12 }}>{v.emoji}</Text>
      <Text style={{ fontSize: 12, fontWeight: '700', color: v.color }}>{v.label}</Text>
    </View>
  );
}
```

In the challenge detail card JSX (after the `{challenge.description && ...}` block and before `<View style={styles.metaRow}>`), add:
```tsx
<ValueChip value={challenge.value} />
```

- [ ] **Step 2: Show value chip on parent challenges list (`app/(parent)/challenges/index.tsx`)**

Add import at top (after existing imports):
```typescript
import { CATEGORY_COLORS, CHALLENGE_VALUES } from '@/constants/challenges';
```

Add the same `ValueChip` helper before `export default ChallengesScreen`:
```typescript
function ValueChip({ value }: { value: string | null | undefined }) {
  if (!value) return null;
  const v = CHALLENGE_VALUES.find(x => x.key === value);
  if (!v) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: `${v.color}20`, paddingHorizontal: 8, paddingVertical: 3,
      borderRadius: 20, marginTop: 4, alignSelf: 'flex-start' }}>
      <Text style={{ fontSize: 11 }}>{v.emoji}</Text>
      <Text style={{ fontSize: 11, fontWeight: '700', color: v.color }}>{v.label}</Text>
    </View>
  );
}
```

In the `renderItem` for the challenges FlatList, after the `<Text style={styles.cardMeta}>` block and before the closing `</View>` of `cardInfo`, add:
```tsx
<ValueChip value={item.value} />
```

- [ ] **Step 3: Show value chip on parent dashboard pending submissions (`app/(parent)/dashboard.tsx`)**

Check the current shape of pending submission cards. Add import:
```typescript
import { CHALLENGE_VALUES } from '@/constants/challenges';
```

Add the same `ValueChip` helper before `export default ParentDashboard`.

In the pending completion render (where it shows the challenge title and child name), add `<ValueChip value={(c as any).challenges?.value} />` below the challenge title.

- [ ] **Step 4: Show value chip on child challenges list (`app/(child)/challenges/index.tsx`)**

Add import:
```typescript
import { CHALLENGE_VALUES } from '@/constants/challenges';
```

Add the same `ValueChip` helper before `export default ChildChallenges`. Use the same inline style but adapt colours to the child dark theme:
```typescript
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
```

In the `renderItem` for the challenges FlatList, after `<Text style={styles.cardMeta}>`, add:
```tsx
<ValueChip value={item.value} />
```

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add 'app/(parent)/challenges/[id].tsx' 'app/(parent)/challenges/index.tsx' 'app/(parent)/dashboard.tsx' 'app/(child)/challenges/index.tsx'
git commit -m "feat: show value chip on challenge cards across all screens"
```

---

## Task 5: Read the parent dashboard pending completions structure

Before completing Task 4 Step 3, verify the exact query shape used in `app/(parent)/dashboard.tsx` to confirm the join alias for challenges. The query at line ~35 is:

```typescript
supabase
  .from('completions')
  .select('*, challenges(*), profiles!completions_child_id_fkey(*)')
```

This means `(completion as any).challenges` holds the full challenge row, including `value`. So `(c as any).challenges?.value` is correct.

---

## Task 6: E2E test for value tagging

**Files:**
- Modify: `tests/e2e/03-challenges.spec.ts`

- [ ] **Step 1: Add the test at the end of the Challenges describe block**

Append this test inside the `test.describe('Challenges', () => {` block, after the last existing test:

```typescript
test('US-VALUE | Parent creates challenge with value tag; child sees it', async ({ browser }) => {
  // Parent: create a challenge with value = Kindness
  const parentPage = await browser.newPage();
  await restoreSession(parentPage, parentState, '/dashboard');
  await assertOnParentDashboard(parentPage);
  await clickTab(parentPage, 'Challenges');
  await parentPage.getByText('+ New').click();
  await parentPage.waitForLoadState('networkidle');

  // Fill title manually (no template)
  await parentPage.getByPlaceholder('e.g. Keep room tidy').fill(`Value Test ${STS}`);

  // Pick Kindness value chip
  await parentPage.getByTestId('value-chip-kindness').click();
  await parentPage.waitForTimeout(300);

  await parentPage.getByTestId('save-challenge-btn').click();
  await parentPage.waitForURL(url => !url.pathname.includes('create'), { timeout: 20_000 });
  await parentPage.waitForLoadState('networkidle');

  // Parent list shows kindness chip
  await expect(parentPage.getByText('Kindness').first()).toBeVisible({ timeout: 10_000 });
  await parentPage.close();

  // Child: mission list shows kindness chip
  const childPage = await browser.newPage();
  await restoreSession(childPage, childState, '/challenges');
  await childPage.waitForLoadState('networkidle');
  await expect(childPage.getByText(`Value Test ${STS}`)).toBeVisible({ timeout: 10_000 });
  await expect(childPage.getByText('Kindness').first()).toBeVisible({ timeout: 10_000 });
  await childPage.close();
});
```

- [ ] **Step 2: Run only this test to check it passes**

```bash
cd /mnt/c/work/reward
npx playwright test tests/e2e/03-challenges.spec.ts --grep "US-VALUE" --reporter=line 2>&1 | tail -30
```

Expected: 1 passed.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/03-challenges.spec.ts
git commit -m "test: E2E for value tag on challenge create and child mission list"
```

---

## Task 7: Full E2E suite smoke test

- [ ] **Step 1: Run the full suite**

```bash
cd /mnt/c/work/reward
npx playwright test --reporter=line 2>&1 | tail -20
```

Expected: all previously passing tests still pass plus the new US-VALUE test.

- [ ] **Step 2: If any tests regress, fix before proceeding**

---

## Verification Checklist

- [ ] `npx tsc --noEmit` passes
- [ ] E2E: creating a challenge with a value tag shows the chip on parent list
- [ ] E2E: child mission list shows the value chip
- [ ] E2E: existing challenge tests still pass (no regressions)
- [ ] Supabase schema.sql kept in sync with migration
