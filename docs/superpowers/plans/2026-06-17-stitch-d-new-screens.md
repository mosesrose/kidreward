# Plan D: New Screens & Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Progress tab, Family tab (child), Goals tab (parent), challenge enable/disable, 4-week trend on parent dashboard, and Stitch-ify all auth screens.

**Architecture:** All new screens use existing Supabase tables — no new DB migrations needed. The Goals tab groups existing challenges by category. The trend chart uses plain React Native Views (no charting library). New child tabs expand the bottom nav from 2 → 4 tabs.

**Tech Stack:** React Native + Expo Router, Supabase, MaterialCommunityIcons, Stitch color/font tokens.

---

## File map

| File | Action |
|------|--------|
| `app/(child)/_layout.tsx` | Modify — add Progress + Family tabs |
| `app/(child)/progress.tsx` | Create — Progress tab |
| `app/(child)/family.tsx` | Create — Family tab |
| `app/(parent)/_layout.tsx` | Modify — add Goals tab |
| `app/(parent)/goals/index.tsx` | Create — Goals tab |
| `app/(parent)/challenges/index.tsx` | Modify — add enable/disable toggle per card |
| `app/(parent)/dashboard.tsx` | Modify — add 4-week trend section |
| `app/(auth)/welcome.tsx` | Modify — Stitch design |
| `app/(auth)/login.tsx` | Modify — Stitch design |
| `app/(auth)/signup.tsx` | Modify — Stitch design |
| `app/(auth)/complete-profile.tsx` | Modify — Stitch design |

---

## Task 1: Add Progress tab to child navigation

**Files:**
- Modify: `app/(child)/_layout.tsx`
- Create: `app/(child)/progress.tsx`

- [ ] **Step 1: Create `app/(child)/progress.tsx`**

```typescript
import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, SectionList, SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import AppHeader from '@/components/AppHeader';

export default function ProgressScreen() {
  const { profile } = useAuth();
  const [approvedCompletions, setApprovedCompletions] = useState<any[]>([]);
  const [fulfilledRedemptions, setFulfilledRedemptions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    const [{ data: comps }, { data: reds }] = await Promise.all([
      supabase
        .from('completions')
        .select('*, challenges(*)')
        .eq('child_id', profile.id)
        .eq('status', 'approved')
        .order('reviewed_at', { ascending: false }),
      supabase
        .from('redemptions')
        .select('*, rewards(*)')
        .eq('child_id', profile.id)
        .eq('status', 'fulfilled')
        .order('fulfilled_at', { ascending: false }),
    ]);
    setApprovedCompletions(comps ?? []);
    setFulfilledRedemptions(reds ?? []);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const sections = [
    {
      title: 'CHALLENGES COMPLETED',
      data: approvedCompletions,
      type: 'challenge',
    },
    {
      title: 'REWARDS COLLECTED',
      data: fulfilledRedemptions,
      type: 'reward',
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader mode="child" />
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={styles.list}
        renderSectionHeader={({ section }) => (
          section.data.length > 0 ? (
            <Text style={styles.sectionLabel}>{section.title}</Text>
          ) : null
        )}
        ListHeaderComponent={
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>My Progress 🏆</Text>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{approvedCompletions.length}</Text>
                <Text style={styles.statLabel}>Challenges</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNum}>{fulfilledRedemptions.length}</Text>
                <Text style={styles.statLabel}>Rewards</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNum}>
                  {approvedCompletions.reduce((s, c) => s + (c.gems_awarded ?? 0), 0)}
                </Text>
                <Text style={styles.statLabel}>💎 Earned</Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Complete challenges to see your progress here!</Text>
          </View>
        }
        renderItem={({ item, section }) => {
          if (section.type === 'challenge') {
            return (
              <View style={styles.card}>
                <Text style={styles.cardEmoji}>{item.challenges?.emoji ?? '⭐'}</Text>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{item.challenges?.title}</Text>
                  <Text style={styles.cardDate}>
                    {item.reviewed_at ? new Date(item.reviewed_at).toLocaleDateString() : ''}
                  </Text>
                </View>
                <View style={styles.gemPill}>
                  <Text style={styles.gemPillText}>+{item.gems_awarded ?? 0}💎</Text>
                </View>
              </View>
            );
          }
          return (
            <View style={styles.card}>
              <Text style={styles.cardEmoji}>{item.rewards?.emoji ?? '🎁'}</Text>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{item.rewards?.title}</Text>
                <Text style={styles.cardDate}>
                  {item.fulfilled_at ? new Date(item.fulfilled_at).toLocaleDateString() : ''}
                </Text>
              </View>
              <View style={[styles.gemPill, { backgroundColor: Colors.tertiaryFixed }]}>
                <Text style={[styles.gemPillText, { color: Colors.onTertiaryFixed }]}>
                  -{item.gems_spent ?? 0}💎
                </Text>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  list: { padding: 20, paddingBottom: 40 },

  hero: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 20, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03, shadowRadius: 15, elevation: 1,
  },
  heroTitle: { fontFamily: Fonts.kidsH1, fontSize: 24, color: Colors.onSurface, marginBottom: 16 },
  statsRow:  { flexDirection: 'row', alignItems: 'center' },
  stat:      { flex: 1, alignItems: 'center' },
  statNum:   { fontFamily: Fonts.kidsH1, fontSize: 28, color: Colors.primary },
  statLabel: { fontFamily: Fonts.body,   fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 2 },
  statDivider: { width: 1, height: 40, backgroundColor: Colors.outlineVariant },

  sectionLabel: {
    fontFamily: Fonts.bodyBold, fontSize: 11,
    color: Colors.onSurfaceVariant, letterSpacing: 1.5, marginBottom: 10, marginTop: 8,
  },

  card: {
    backgroundColor: Colors.white, borderRadius: 12,
    padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03, shadowRadius: 15, elevation: 1,
  },
  cardEmoji: { fontSize: 28 },
  cardBody:  { flex: 1 },
  cardTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.onSurface },
  cardDate:  { fontFamily: Fonts.body, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },
  gemPill: {
    backgroundColor: Colors.successContainer, borderRadius: 9999,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  gemPillText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.success },

  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.onSurfaceVariant, textAlign: 'center' },
});
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | grep -v supabase/functions | head -10
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(child)/progress.tsx"
git commit -m "feat: add child Progress tab (achieved challenges + collected rewards)"
```

---

## Task 2: Add Family tab to child navigation

**Files:**
- Create: `app/(child)/family.tsx`

- [ ] **Step 1: Create `app/(child)/family.tsx`**

```typescript
import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, RefreshControl,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import AppHeader from '@/components/AppHeader';

const CATEGORY_EMOJI: Record<string, string> = {
  homework: '📚', math: '➕', chores: '🧹', cooking: '🍳',
  room: '🛏️', garden: '🌱', morning: '🌅', behavior: '⭐',
  outdoor: '🌳', social: '🤝', family: '🏠', sibling: '👫',
  phone: '📱', other: '🎯',
};

export default function FamilyScreen() {
  const { profile, family } = useAuth();
  const [weekStats, setWeekStats] = useState<any[]>([]);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [weekTotal, setWeekTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!profile || !family) return;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Get all challenges for this family
    const { data: challenges } = await supabase
      .from('challenges')
      .select('id, title, category, emoji, gem_reward, child_id')
      .eq('family_id', family.id)
      .eq('status', 'active');

    if (!challenges) return;
    const challengeIds = challenges.map((c: any) => c.id);

    // Get this week's approved completions for the whole family
    const { data: completions } = await supabase
      .from('completions')
      .select('challenge_id, child_id, gems_awarded')
      .eq('status', 'approved')
      .gte('reviewed_at', weekAgo)
      .in('challenge_id', challengeIds);

    // Get family members (kids)
    const { data: members } = await supabase
      .from('family_members')
      .select('*, profiles(*)')
      .eq('family_id', family.id);

    // Group completions by category
    const catMap: Record<string, { count: number; gems: number }> = {};
    (completions ?? []).forEach((comp: any) => {
      const ch = challenges.find((c: any) => c.id === comp.challenge_id);
      const cat = ch?.category ?? 'other';
      if (!catMap[cat]) catMap[cat] = { count: 0, gems: 0 };
      catMap[cat].count++;
      catMap[cat].gems += comp.gems_awarded ?? 0;
    });

    const stats = Object.entries(catMap)
      .map(([cat, v]) => ({ category: cat, ...v }))
      .sort((a, b) => b.count - a.count);

    setWeekStats(stats);
    setFamilyMembers(members ?? []);
    setWeekTotal((completions ?? []).length);
  }, [profile, family]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader mode="child" />
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={styles.scroll}
      >
        <Text style={styles.pageTitle}>This Week 🗓️</Text>

        {/* Family member gems */}
        <Text style={styles.sectionLabel}>FAMILY GEMS THIS WEEK</Text>
        {familyMembers.map((m) => {
          const p = (m as any).profiles;
          return (
            <View key={m.id} style={styles.memberRow}>
              <Text style={styles.memberAvatar}>{p?.avatar_emoji ?? '🧒'}</Text>
              <Text style={styles.memberName}>{p?.name}</Text>
              <View style={styles.gemPill}>
                <Text style={styles.gemPillText}>{m.gem_balance} 💎</Text>
              </View>
            </View>
          );
        })}

        {/* Category breakdown */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>WHAT WE WORKED ON</Text>
        {weekStats.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No completed challenges yet this week. Keep going! 💪</Text>
          </View>
        ) : (
          weekStats.map((stat) => (
            <View key={stat.category} style={styles.catCard}>
              <Text style={styles.catEmoji}>
                {CATEGORY_EMOJI[stat.category] ?? '🎯'}
              </Text>
              <View style={styles.catBody}>
                <Text style={styles.catName}>
                  {stat.category.charAt(0).toUpperCase() + stat.category.slice(1).replace('_', ' ')}
                </Text>
                <Text style={styles.catMeta}>{stat.count} completed</Text>
              </View>
              <Text style={styles.catGems}>+{stat.gems}💎</Text>
            </View>
          ))
        )}

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total this week</Text>
          <Text style={styles.totalNum}>{weekTotal} challenges completed! 🎉</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: 20, paddingBottom: 40 },

  pageTitle: { fontFamily: Fonts.kidsH1, fontSize: 28, color: Colors.onSurface, marginBottom: 20 },

  sectionLabel: {
    fontFamily: Fonts.bodyBold, fontSize: 11,
    color: Colors.onSurfaceVariant, letterSpacing: 1.5, marginBottom: 12,
  },

  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white, borderRadius: 12, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03, shadowRadius: 15, elevation: 1,
  },
  memberAvatar: { fontSize: 28 },
  memberName:   { flex: 1, fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.onSurface },
  gemPill: {
    backgroundColor: Colors.tertiaryFixed, borderRadius: 9999,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  gemPillText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.onTertiaryFixed },

  catCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white, borderRadius: 12, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03, shadowRadius: 15, elevation: 1,
  },
  catEmoji: { fontSize: 28 },
  catBody:  { flex: 1 },
  catName:  { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.onSurface },
  catMeta:  { fontFamily: Fonts.body,         fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },
  catGems:  { fontFamily: Fonts.bodyBold,     fontSize: 14, color: Colors.primary },

  totalCard: {
    backgroundColor: Colors.primary, borderRadius: 12, padding: 18,
    alignItems: 'center', marginTop: 16,
  },
  totalLabel: { fontFamily: Fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  totalNum:   { fontFamily: Fonts.kidsH1, fontSize: 20, color: Colors.white, marginTop: 4 },

  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.onSurfaceVariant, textAlign: 'center' },
});
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | grep -v supabase/functions | head -10
```

- [ ] **Step 3: Commit**

```bash
git add "app/(child)/family.tsx"
git commit -m "feat: add child Family tab (weekly category activity summary)"
```

---

## Task 3: Update child tab layout (2 → 4 tabs)

**Files:**
- Modify: `app/(child)/_layout.tsx`

- [ ] **Step 1: Replace `app/(child)/_layout.tsx`**

```typescript
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  const icon: IconName = focused ? name : (`${name}-outline` as IconName);
  return (
    <MaterialCommunityIcons
      name={icon}
      size={24}
      color={focused ? Colors.primary : Colors.onSurfaceVariant}
    />
  );
}

export default function ChildLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.outlineVariant,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
        },
        tabBarActiveTintColor:   Colors.primary,
        tabBarInactiveTintColor: Colors.onSurfaceVariant,
        tabBarLabelStyle: {
          fontFamily: Fonts.bodyBold,
          fontSize: 10,
          letterSpacing: 1,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="store/index"
        options={{
          title: 'Store',
          tabBarIcon: ({ focused }) => <TabIcon name="store" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ focused }) => <TabIcon name="trophy" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="family"
        options={{
          title: 'Family',
          tabBarIcon: ({ focused }) => <TabIcon name="account-group" focused={focused} />,
        }}
      />
      {/* Hidden routes */}
      <Tabs.Screen name="challenges/index" options={{ href: null }} />
      <Tabs.Screen name="challenges/[id]"  options={{ href: null }} />
      <Tabs.Screen name="join"             options={{ href: null }} />
    </Tabs>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | grep -v supabase/functions | head -10
```

- [ ] **Step 3: Commit**

```bash
git add "app/(child)/_layout.tsx"
git commit -m "feat: expand child tab bar to 4 tabs (Home, Store, Progress, Family)"
```

---

## Task 4: Parent Goals tab

**Files:**
- Create: `app/(parent)/goals/index.tsx`
- Modify: `app/(parent)/_layout.tsx`

- [ ] **Step 1: Create `app/(parent)/goals/index.tsx`**

```typescript
import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, RefreshControl, TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';

const CATEGORY_EMOJI: Record<string, string> = {
  homework: '📚', math: '➕', chores: '🧹', cooking: '🍳',
  room: '🛏️', garden: '🌱', morning: '🌅', behavior: '⭐',
  outdoor: '🌳', social: '🤝', family: '🏠', sibling: '👫',
  phone: '📱',
};

const CATEGORY_VALUES: Record<string, string> = {
  homework: 'Learning & Education',
  math: 'Learning & Education',
  chores: 'Responsibility',
  cooking: 'Life Skills',
  room: 'Responsibility',
  garden: 'Nature & Care',
  morning: 'Discipline',
  behavior: 'Character',
  outdoor: 'Health & Fitness',
  social: 'Social Skills',
  family: 'Family Bonds',
  sibling: 'Family Bonds',
  phone: 'Balance',
};

export default function GoalsScreen() {
  const { family } = useAuth();
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!family) return;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: challenges } = await supabase
      .from('challenges')
      .select('id, title, category, gem_reward, child_id')
      .eq('family_id', family.id)
      .eq('status', 'active');

    if (!challenges) return;
    const challengeIds = challenges.map((c: any) => c.id);

    const { data: completions } = await supabase
      .from('completions')
      .select('challenge_id, gems_awarded, reviewed_at')
      .eq('status', 'approved')
      .gte('reviewed_at', weekAgo)
      .in('challenge_id', challengeIds.length ? challengeIds : ['00000000-0000-0000-0000-000000000000']);

    // Group by category
    const cats: Record<string, { challenges: any[]; weekCount: number; weekGems: number }> = {};
    challenges.forEach((ch: any) => {
      const cat = ch.category ?? 'other';
      if (!cats[cat]) cats[cat] = { challenges: [], weekCount: 0, weekGems: 0 };
      cats[cat].challenges.push(ch);
    });
    (completions ?? []).forEach((comp: any) => {
      const ch = challenges.find((c: any) => c.id === comp.challenge_id);
      const cat = ch?.category ?? 'other';
      if (cats[cat]) {
        cats[cat].weekCount++;
        cats[cat].weekGems += comp.gems_awarded ?? 0;
      }
    });

    const sorted = Object.entries(cats)
      .map(([cat, data]) => ({ category: cat, ...data }))
      .sort((a, b) => b.weekCount - a.weekCount);

    setCategoryData(sorted);
  }, [family]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Goals</Text>
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={styles.scroll}
      >
        <Text style={styles.intro}>
          Your challenges grouped by the values they build. Tap a category to manage its challenges.
        </Text>

        {categoryData.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No active challenges</Text>
            <Text style={styles.emptyMeta}>Create challenges to see them grouped by value here</Text>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => router.push('/(parent)/challenges/create')}
            >
              <Text style={styles.createBtnText}>+ Create a Challenge</Text>
            </TouchableOpacity>
          </View>
        ) : (
          categoryData.map((item) => (
            <TouchableOpacity
              key={item.category}
              style={styles.card}
              onPress={() => router.push('/(parent)/challenges')}
            >
              <View style={styles.cardTop}>
                <Text style={styles.catEmoji}>
                  {CATEGORY_EMOJI[item.category] ?? '🎯'}
                </Text>
                <View style={styles.catInfo}>
                  <Text style={styles.catName}>
                    {item.category.charAt(0).toUpperCase() + item.category.slice(1).replace('_', ' ')}
                  </Text>
                  <Text style={styles.catValue}>
                    {CATEGORY_VALUES[item.category] ?? 'Family Values'}
                  </Text>
                </View>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{item.challenges.length}</Text>
                  <Text style={styles.countLabel}>challenges</Text>
                </View>
              </View>
              {item.weekCount > 0 && (
                <View style={styles.weekRow}>
                  <Text style={styles.weekText}>
                    ✓ {item.weekCount} completed this week · +{item.weekGems}💎
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.surface },
  header: { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 8 },
  title:  { fontFamily: Fonts.parentH1, fontSize: 28, color: Colors.onSurface },
  scroll: { padding: 20, paddingBottom: 40 },

  intro: {
    fontFamily: Fonts.body, fontSize: 13, color: Colors.onSurfaceVariant,
    lineHeight: 20, marginBottom: 20,
  },

  card: {
    backgroundColor: Colors.white, borderRadius: 12, marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03, shadowRadius: 15, elevation: 1,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  catEmoji: { fontSize: 32 },
  catInfo:  { flex: 1 },
  catName:  { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.onSurface },
  catValue: { fontFamily: Fonts.body, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },
  countBadge: { alignItems: 'center' },
  countText:  { fontFamily: Fonts.parentH1, fontSize: 22, color: Colors.primary },
  countLabel: { fontFamily: Fonts.body, fontSize: 10, color: Colors.onSurfaceVariant },

  weekRow: {
    backgroundColor: Colors.successContainer,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  weekText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.success },

  empty:      { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontFamily: Fonts.parentH1, fontSize: 20, color: Colors.onSurface },
  emptyMeta:  { fontFamily: Fonts.body, fontSize: 14, color: Colors.onSurfaceVariant, marginTop: 6, textAlign: 'center' },
  createBtn:  { marginTop: 20, backgroundColor: Colors.primary, borderRadius: 9999, paddingHorizontal: 24, paddingVertical: 12 },
  createBtnText: { fontFamily: Fonts.bodyBold, fontSize: 15, color: Colors.white },
});
```

- [ ] **Step 2: Add Goals tab to `app/(parent)/_layout.tsx`**

Read the current file, then add the Goals tab after Family:

```typescript
      <Tabs.Screen
        name="goals/index"
        options={{
          title: 'Goals',
          tabBarIcon: ({ focused }) => <TabIcon name="flag" focused={focused} />,
        }}
      />
```

Also hide `goals/index` is not needed since it's shown in tabs. But add it inside the hidden section if there are any sub-routes.

- [ ] **Step 3: Verify TypeScript**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | grep -v supabase/functions | head -10
```

- [ ] **Step 4: Commit**

```bash
git add "app/(parent)/goals/index.tsx" "app/(parent)/_layout.tsx"
git commit -m "feat: add parent Goals tab (challenges grouped by value/category)"
```

---

## Task 5: Challenge enable/disable toggle in parent Challenges list

**Files:**
- Modify: `app/(parent)/challenges/index.tsx`

The `challenges` table already has `status` column with values `active | completed | archived`. We'll treat `archived` as "disabled" and use a toggle.

- [ ] **Step 1: Update `app/(parent)/challenges/index.tsx`**

Add a toggle function and modify the renderItem to show a Switch. Add these changes to the existing file:

**Add import:** `Switch` to the react-native import line.

**Add `toggleChallenge` function** after the `load` function:
```typescript
async function toggleChallenge(id: string, currentStatus: string) {
  const next = currentStatus === 'active' ? 'archived' : 'active';
  setChallenges(prev => prev.map(c => c.id === id ? { ...c, status: next } : c));
  await supabase.from('challenges').update({ status: next }).eq('id', id);
}
```

**Update the card renderItem** — after the chevron icon, add a separator line and toggle row below the existing `TouchableOpacity` by wrapping the card in a View:

Replace the `renderItem` `TouchableOpacity` with:
```tsx
renderItem={({ item }) => (
  <View style={styles.cardWrapper}>
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(parent)/challenges/${item.id}`)}
    >
      <View style={styles.iconBox}>
        <MaterialCommunityIcons
          name={(item.emoji || FALLBACK_ICON) as any}
          size={26}
          color={item.status === 'active' ? Colors.primary : Colors.onSurfaceVariant}
        />
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.cardTitle, item.status !== 'active' && styles.dim]}>{item.title}</Text>
        <Text style={styles.cardMeta}>
          {item.repeat_type === 'daily' ? 'Daily' :
           item.repeat_type === 'weekly' ? 'Weekly' : 'Once'}
          {item.status !== 'active' ? ' · Hidden' : ''}
        </Text>
      </View>
      <View style={styles.gemBadge}>
        <Text style={styles.gemBadgeText}>💎 {item.gem_reward}</Text>
      </View>
      {item.pending_count > 0 && (
        <View style={styles.pendingDot}>
          <Text style={styles.pendingDotText}>{item.pending_count}</Text>
        </View>
      )}
      <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.outline} />
    </TouchableOpacity>
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>
        {item.status === 'active' ? 'Visible to kids' : 'Hidden from kids'}
      </Text>
      <Switch
        value={item.status === 'active'}
        onValueChange={() => toggleChallenge(item.id, item.status)}
        trackColor={{ false: Colors.outlineVariant, true: Colors.primary }}
        thumbColor={Colors.white}
      />
    </View>
  </View>
)}
```

**Add new styles:**
```typescript
  cardWrapper: {
    backgroundColor: Colors.white, borderRadius: 12, marginBottom: 10, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03, shadowRadius: 15, elevation: 1,
  },
  card: {
    padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  dim: { opacity: 0.45 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: Colors.outlineVariant,
  },
  toggleLabel: { fontFamily: Fonts.body, fontSize: 13, color: Colors.onSurfaceVariant },
```

Remove the old `card` shadow styles since the wrapper now carries them.

- [ ] **Step 2: Verify TypeScript**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | grep -v supabase/functions | head -10
```

- [ ] **Step 3: Commit**

```bash
git add "app/(parent)/challenges/index.tsx"
git commit -m "feat: challenge enable/disable toggle on parent Challenges list"
```

---

## Task 6: 4-week trend on parent dashboard

**Files:**
- Modify: `app/(parent)/dashboard.tsx`

Add a 4-week bar chart (pure React Native Views, no library) showing approved completions per week.

- [ ] **Step 1: Add trend data loading to dashboard**

In `dashboard.tsx`:

**Add state:**
```typescript
const [weeklyTrend, setWeeklyTrend] = useState<number[]>([0, 0, 0, 0]);
```

**Add to the `load` function** (inside Promise.all or after):
```typescript
// Fetch 4 weeks of completions
const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString();
const { data: trendData } = await supabase
  .from('completions')
  .select('reviewed_at')
  .eq('status', 'approved')
  .gte('reviewed_at', fourWeeksAgo)
  .in('challenge_id', challengeIds);

// Bucket into 4 weeks (week 0 = oldest)
const buckets = [0, 0, 0, 0];
const now = Date.now();
(trendData ?? []).forEach((c: any) => {
  const daysAgo = (now - new Date(c.reviewed_at).getTime()) / (1000 * 60 * 60 * 24);
  const weekIdx = 3 - Math.min(3, Math.floor(daysAgo / 7));
  buckets[weekIdx]++;
});
setWeeklyTrend(buckets);
```

**Add JSX** — insert the trend section between the Stats card and Action Needed section:

```tsx
{/* Trend */}
<View style={styles.trendCard}>
  <Text style={styles.statsLabel}>LAST 4 WEEKS</Text>
  <View style={styles.trendBars}>
    {weeklyTrend.map((count, i) => {
      const maxVal = Math.max(...weeklyTrend, 1);
      const heightPct = count / maxVal;
      const labels = ['3w ago', '2w ago', 'Last wk', 'This wk'];
      return (
        <View key={i} style={styles.trendCol}>
          <Text style={styles.trendNum}>{count}</Text>
          <View style={styles.trendBarBg}>
            <View style={[
              styles.trendBar,
              { height: `${Math.max(8, heightPct * 100)}%` },
              i === 3 && { backgroundColor: Colors.primary },
            ]} />
          </View>
          <Text style={styles.trendLabel}>{labels[i]}</Text>
        </View>
      );
    })}
  </View>
</View>
```

**Add styles:**
```typescript
  trendCard: {
    marginHorizontal: 20, marginBottom: 16,
    backgroundColor: Colors.white, borderRadius: 12, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03, shadowRadius: 15, elevation: 1,
  },
  trendBars: { flexDirection: 'row', gap: 8, height: 100, alignItems: 'flex-end', marginTop: 12 },
  trendCol:  { flex: 1, alignItems: 'center' },
  trendNum:  { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.onSurface, marginBottom: 4 },
  trendBarBg: { width: '100%', flex: 1, backgroundColor: Colors.surfaceContainerHighest, borderRadius: 4, justifyContent: 'flex-end' },
  trendBar:   { width: '100%', backgroundColor: Colors.primaryFixed, borderRadius: 4 },
  trendLabel: { fontFamily: Fonts.body, fontSize: 10, color: Colors.onSurfaceVariant, marginTop: 4, textAlign: 'center' },
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | grep -v supabase/functions | head -10
```

- [ ] **Step 3: Commit**

```bash
git add "app/(parent)/dashboard.tsx"
git commit -m "feat: add 4-week completion trend chart to parent dashboard"
```

---

## Task 7: Auth screens Stitch redesign

**Files:**
- Modify: `app/(auth)/welcome.tsx`
- Modify: `app/(auth)/login.tsx`
- Modify: `app/(auth)/signup.tsx`
- Modify: `app/(auth)/complete-profile.tsx`

Token mapping for all auth screens (same as the create form mapping):

| Old | New |
|-----|-----|
| `Colors.parentBg` or `Colors.childBg` | `Colors.surface` |
| `Colors.purple` | `Colors.primary` |
| `Colors.textDark` | `Colors.onSurface` |
| `Colors.textMuted` | `Colors.onSurfaceVariant` |
| `Colors.textLight` | `Colors.white` |
| `Colors.parentCard` | `Colors.white` |
| `Colors.parentBorder` | `Colors.outlineVariant` |
| hardcoded `fontWeight: '700'` on headings | add `fontFamily: Fonts.parentH1` |
| hardcoded `fontWeight: '700'` on buttons | add `fontFamily: Fonts.bodyBold` |
| body text without fontFamily | add `fontFamily: Fonts.body` |
| CTA `borderRadius: 8` or `12` | `borderRadius: 9999` |

Add `import { Fonts } from '@/constants/fonts';` to each file.
Add `SafeAreaView` wrapper where not already present.

- [ ] **Step 1: Apply mapping to all 4 auth screens**

Read each file and apply the token changes. Do NOT change any business logic, navigation, or form submission code.

- [ ] **Step 2: Verify TypeScript**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | grep -v supabase/functions | head -10
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(auth)/welcome.tsx" "app/(auth)/login.tsx" "app/(auth)/signup.tsx" "app/(auth)/complete-profile.tsx"
git commit -m "feat: restyle auth screens with Stitch design tokens"
```

---

## Task 8: Final TypeScript + push to GitHub

- [ ] **Step 1: Full TypeScript check**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | grep -v supabase/functions
```

Expected: 0 errors.

- [ ] **Step 2: Push to GitHub**

```bash
git push origin master
```

---

## Done

Plan D deliverables:
- Child Progress tab: achieved challenges + collected rewards history
- Child Family tab: weekly category activity summary
- Child tab bar expanded: Home, Store, Progress, Family
- Parent Goals tab: challenges grouped by value/category, weekly activity
- Parent challenges list: enable/disable toggle per challenge
- Parent dashboard: 4-week completion trend chart
- Auth screens: Stitch design tokens applied
- Data loads on first mount (bug fixed)
- Parent fulfil reward → child push notification (bug fixed)
- PARENT MODE pill removed from child mode (bug fixed)
- Settings screen wired to cog icon (bug fixed)
