# Stitch Visual Rework — Plan B: Child Screens

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle all child-facing screens (Home, Challenge Detail, Store) to match the Stitch light-purple design, merge the Missions tab into Home, and wire up Celebration Overlay A on challenge submit.

**Architecture:** Plan A must be complete before starting this plan (new color tokens + shared components are required). Home screen absorbs the full mission list (with Active/Done tabs), Missions tab is removed. A new `CelebrationOverlay` component (mode A: submitted) is created here and re-used in Plan C (mode B: approved).

**Tech Stack:** React Native + Expo SDK 54, Expo Router, TypeScript, MaterialCommunityIcons, Supabase, `expo-av` (sound), Lottie or `expo-confetti` (confetti — see Task 4)

**Spec:** `docs/superpowers/specs/2026-06-17-stitch-visual-rework-spec.md` §4 (Child Screens) + §6 (Celebration System)

**Prerequisite:** Plan A complete (`constants/colors.ts` updated, `components/AppHeader.tsx`, `components/GemBadge.tsx`, `components/SquishButton.tsx`, `components/LevelCircle.tsx` all exist)

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Create | `components/CelebrationOverlay.tsx` | Mode A (submit) + Mode B (approved) overlay |
| Modify | `app/(child)/home.tsx` | Level circle + full mission list + submit CTA |
| Modify | `app/(child)/challenges/[id].tsx` | Challenge detail + CelebrationOverlay A on submit |
| Modify | `app/(child)/store/index.tsx` | Reward store with amber badges, squish buttons |
| Modify | `tests/e2e/helpers.ts` | Update tab label references (Rewards → Store) |
| Modify | `tests/e2e/04-rewards.spec.ts` | Update tab navigation to "Store" |
| Modify | `tests/e2e/05-gem-economy.spec.ts` | Update gem store label checks |

---

## Task 1: CelebrationOverlay component (Mode A only)

Plan C will add Mode B (approved/woohoo). This task creates the shared component with Mode A (submitted, soft 2s dismiss) and a stub for Mode B.

**Files:**
- Create: `components/CelebrationOverlay.tsx`

- [ ] **Step 1: Install expo-av for sound**

```bash
cd /mnt/c/work/reward && npx expo install expo-av
```

Expected: `expo-av` added to package.json. No errors.

- [ ] **Step 2: Create the component**

```typescript
import { useEffect, useRef } from 'react';
import {
  Modal, View, Text, StyleSheet,
  Animated, TouchableOpacity,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';

export type CelebrationMode = 'submitted' | 'approved';

interface Props {
  visible: boolean;
  mode: CelebrationMode;
  gems?: number;            // required for 'approved'
  challengeTitle?: string;  // required for 'approved'
  levelUp?: boolean;
  newLevel?: number;
  onDismiss: () => void;
}

export default function CelebrationOverlay({
  visible, mode, gems, challengeTitle, levelUp, newLevel, onDismiss,
}: Props) {
  const opacity   = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) return;

    // Fade + scale in
    Animated.parallel([
      Animated.timing(opacity,   { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();

    // Mode A: auto-dismiss after 2 seconds
    if (mode === 'submitted') {
      timerRef.current = setTimeout(onDismiss, 2000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, mode, onDismiss]);

  if (!visible) return null;

  const isApproved = mode === 'approved';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <Animated.View
        style={[
          styles.backdrop,
          { opacity },
          isApproved && styles.backdropApproved,
        ]}
      >
        <Animated.View style={[styles.content, { transform: [{ scale: scaleAnim }] }]}>
          {isApproved ? (
            // Mode B — full woohoo (wired up in Plan C)
            <>
              <Text style={styles.gemIcon}>💎</Text>
              <Text style={styles.gemsText}>+{gems} 💎</Text>
              <Text style={styles.heading}>WOOHOO! 🎉</Text>
              {challengeTitle ? (
                <Text style={styles.subheading}>{challengeTitle}</Text>
              ) : null}
              {levelUp && newLevel ? (
                <View style={styles.levelUpBanner}>
                  <Text style={styles.levelUpText}>⬆️ Level up! You're now Level {newLevel}</Text>
                </View>
              ) : null}
              <TouchableOpacity style={styles.collectBtn} onPress={onDismiss}>
                <Text style={styles.collectBtnText}>Collect my gems! →</Text>
              </TouchableOpacity>
            </>
          ) : (
            // Mode A — soft submitted feedback (auto-dismisses)
            <>
              <Text style={styles.starIcon}>🌟</Text>
              <Text style={styles.heading}>Submitted! 🌟</Text>
              <Text style={styles.body}>
                Great work — waiting for your parent to approve
              </Text>
            </>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(79,55,138,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  backdropApproved: {
    backgroundColor: Colors.primaryContainer,
  },
  content: {
    alignItems: 'center',
    gap: 12,
    maxWidth: 320,
    width: '100%',
  },
  starIcon: { fontSize: 80 },
  gemIcon:  { fontSize: 100 },
  heading: {
    fontFamily: Fonts.kidsDisplay,
    fontSize: 40,
    color: Colors.white,
    textAlign: 'center',
  },
  subheading: {
    fontFamily: Fonts.kidsH1,
    fontSize: 22,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  gemsText: {
    fontFamily: Fonts.kidsDisplay,
    fontSize: 56,
    color: Colors.radiantAmber,
    lineHeight: 64,
  },
  body: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 26,
  },
  levelUpBanner: {
    backgroundColor: Colors.tertiaryFixed,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 8,
  },
  levelUpText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.primary,
    textAlign: 'center',
  },
  collectBtn: {
    marginTop: 16,
    backgroundColor: Colors.radiantAmber,
    borderRadius: 9999,
    paddingVertical: 18,
    paddingHorizontal: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 4,
  },
  collectBtnText: {
    fontFamily: Fonts.kidsH1,
    fontSize: 20,
    color: Colors.onTertiaryFixed,
  },
});
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | head -20
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add components/CelebrationOverlay.tsx
git commit -m "feat: add CelebrationOverlay component (modes: submitted + approved)"
```

---

## Task 2: Rewrite child Home screen

The Home screen absorbs the full mission list (replaces the old Missions tab). Shows: AppHeader → LevelCircle → Active/Done tabs → full quest card list → store CTA.

**Files:**
- Modify: `app/(child)/home.tsx`

- [ ] **Step 1: Replace the file**

```typescript
import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Challenge, Completion } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import AppHeader from '@/components/AppHeader';
import LevelCircle from '@/components/LevelCircle';
import GemBadge from '@/components/GemBadge';
import { FALLBACK_ICON } from '@/constants/icons';

export default function ChildHome() {
  const { profile, family, membership, signOut, refreshFamily, loading } = useAuth();
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
    const ids = new Set<string>(comps?.map((c: Completion) => c.challenge_id) ?? []);
    setCompletedIds(ids);
  }, [family, profile]);

  useFocusEffect(useCallback(() => {
    if (loading) return;
    if (!family) { router.replace('/(child)/join'); } else { load(); }
  }, [family, load, loading]));

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([load(), refreshFamily()]);
    setRefreshing(false);
  };

  const gemBalance  = membership?.gem_balance ?? 0;
  const totalEarned = membership?.total_gems_earned ?? 0;

  const visible   = challenges.filter(c => filter === 'active' ? !completedIds.has(c.id) : completedIds.has(c.id));
  const todoCount = challenges.filter(c => !completedIds.has(c.id)).length;

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader mode="child" onSwitchMode={signOut} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Level circle + gem badge */}
        <View style={styles.heroRow}>
          <LevelCircle totalGemsEarned={totalEarned} />
          <View style={styles.gemBadgePos}>
            <GemBadge gems={gemBalance} />
          </View>
        </View>

        {/* Mission list */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Missions</Text>
            <Text style={styles.sectionCount}>{todoCount} remaining</Text>
          </View>

          {/* Active / Done tabs */}
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

          {/* Quest cards */}
          {visible.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={styles.emptyTitle}>
                {filter === 'active' ? 'No missions yet' : 'Nothing done yet'}
              </Text>
              <Text style={styles.emptyMeta}>
                {filter === 'active' ? 'Ask your parent to add one' : 'Complete a mission to see it here'}
              </Text>
            </View>
          ) : (
            visible.map((c) => {
              const done = completedIds.has(c.id);
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.questCard, done && styles.questCardDone]}
                  onPress={() => router.push(`/(child)/challenges/${c.id}`)}
                >
                  {/* Icon box */}
                  <View style={[styles.questIcon, done && styles.questIconDone]}>
                    <MaterialCommunityIcons
                      name={(c.emoji || FALLBACK_ICON) as any}
                      size={28}
                      color={done ? Colors.onSurfaceVariant : Colors.primary}
                    />
                  </View>

                  {/* Text */}
                  <View style={styles.questBody}>
                    <Text
                      style={[styles.questTitle, done && styles.questTitleDone]}
                      numberOfLines={1}
                    >
                      {c.title}
                    </Text>
                    <Text style={styles.questMeta}>
                      {c.repeat_type === 'daily' ? 'Daily' : c.repeat_type === 'weekly' ? 'Weekly' : 'Once'}
                    </Text>
                  </View>

                  {/* Right: gem reward or done check */}
                  {done ? (
                    <View style={styles.doneCircle}>
                      <MaterialCommunityIcons name="check" size={20} color={Colors.white} />
                    </View>
                  ) : (
                    <View style={styles.gemPill}>
                      <Text style={styles.gemPillText}>💎 {c.gem_reward}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Store CTA */}
        <TouchableOpacity style={styles.storeCta} onPress={() => router.push('/(child)/store')}>
          <MaterialCommunityIcons name="store" size={20} color={Colors.white} style={{ marginRight: 8 }} />
          <Text style={styles.storeCtaText}>Visit the Store</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.surface },
  scroll:  { flex: 1 },
  content: { paddingBottom: 40 },

  heroRow: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    position: 'relative',
  },
  gemBadgePos: {
    position: 'absolute',
    top: 24,
    right: 20,
  },

  section: { paddingHorizontal: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: Fonts.kidsH1,
    fontSize: 20,
    color: Colors.onSurface,
  },
  sectionCount: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },

  segmented: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 9999,
    padding: 4,
    marginBottom: 16,
  },
  seg:       { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 9999 },
  segOn:     { backgroundColor: Colors.white },
  segText:   { fontFamily: Fonts.body, fontSize: 14, color: Colors.onSurfaceVariant },
  segTextOn: { fontFamily: Fonts.bodyBold, color: Colors.primary },

  questCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: 'rgba(103,80,164,1)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 3,
  },
  questCardDone: {
    backgroundColor: Colors.surfaceContainerHigh,
    shadowOpacity: 0,
    elevation: 0,
    opacity: 0.6,
  },
  questIcon: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: Colors.secondaryContainer,
    alignItems: 'center', justifyContent: 'center',
  },
  questIconDone: { backgroundColor: Colors.surfaceContainerHighest },
  questBody:  { flex: 1 },
  questTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: Colors.onSurface, marginBottom: 2 },
  questTitleDone: { color: Colors.onSurfaceVariant },
  questMeta:  { fontFamily: Fonts.body, fontSize: 12, color: Colors.onSurfaceVariant },

  doneCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.success,
    alignItems: 'center', justifyContent: 'center',
  },
  gemPill: {
    backgroundColor: Colors.tertiaryFixed,
    borderRadius: 9999,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  gemPillText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.onTertiaryFixed,
  },

  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon:  { fontSize: 40, marginBottom: 8 },
  emptyTitle: { fontFamily: Fonts.kidsH1, fontSize: 18, color: Colors.onSurface, marginBottom: 4 },
  emptyMeta:  { fontFamily: Fonts.body,   fontSize: 14, color: Colors.onSurfaceVariant },

  storeCta: {
    margin: 20,
    marginTop: 24,
    backgroundColor: Colors.primary,
    borderRadius: 9999,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 4,
  },
  storeCtaText: { fontFamily: Fonts.bodyBold, fontSize: 16, color: Colors.white },
});
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | head -20
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(child)/home.tsx"
git commit -m "feat: rewrite child Home with LevelCircle + merged mission list (Stitch design)"
```

---

## Task 3: Rewrite child Challenge Detail

Adds Celebration Overlay A (soft, 2s auto-dismiss) after successful submit.

**Files:**
- Modify: `app/(child)/challenges/[id].tsx`

- [ ] **Step 1: Replace the file**

```typescript
import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, ScrollView, SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Challenge, Completion } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { FALLBACK_ICON } from '@/constants/icons';
import CelebrationOverlay from '@/components/CelebrationOverlay';
import SquishButton from '@/components/SquishButton';

function capitalize(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

export default function ChildChallengeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, membership } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [myCompletion, setMyCompletion] = useState<Completion | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => { load(); }, [id]);

  async function load() {
    if (!profile) return;
    const [{ data: ch }, { data: comp }] = await Promise.all([
      supabase.from('challenges').select('*').eq('id', id).single(),
      supabase
        .from('completions')
        .select('*')
        .eq('challenge_id', id)
        .eq('child_id', profile.id)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    setChallenge(ch);
    setMyCompletion(comp);
  }

  async function submit() {
    if (!profile || !challenge) return;
    setSubmitting(true);
    const { error } = await supabase.from('completions').insert({
      challenge_id: id,
      child_id: profile.id,
      note: note.trim() || null,
      status: 'pending',
      submitted_at: new Date().toISOString(),
    });
    setSubmitting(false);
    if (error) { Alert.alert('Error', error.message); return; }
    setShowCelebration(true);
    await load();
  }

  const onCelebrationDismiss = () => setShowCelebration(false);

  if (!challenge) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.loading}>Loading…</Text>
      </SafeAreaView>
    );
  }

  const status = myCompletion?.status;
  const isPending  = status === 'pending';
  const isApproved = status === 'approved';
  const isRejected = status === 'rejected';
  const canSubmit  = !isPending && !isApproved;

  return (
    <SafeAreaView style={styles.safe}>
      <CelebrationOverlay
        visible={showCelebration}
        mode="submitted"
        onDismiss={onCelebrationDismiss}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={Colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {/* Hero icon */}
        <View style={styles.heroCircle}>
          <MaterialCommunityIcons
            name={(challenge.emoji || FALLBACK_ICON) as any}
            size={48}
            color={Colors.primary}
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>{challenge.title}</Text>

        {/* Chips row */}
        <View style={styles.chipsRow}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{capitalize(challenge.category)}</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>
              {challenge.repeat_type === 'daily' ? 'Daily' :
               challenge.repeat_type === 'weekly' ? 'Weekly' : 'Once'}
            </Text>
          </View>
          <View style={styles.gemChip}>
            <Text style={styles.gemChipText}>💎 {challenge.gem_reward} Gems</Text>
          </View>
        </View>

        {/* Description */}
        {challenge.description ? (
          <Text style={styles.desc}>{challenge.description}</Text>
        ) : null}

        {/* Status chip or submit form */}
        {isPending && (
          <View style={styles.statusChip}>
            <Text style={styles.statusChipText}>⏳ Waiting for your parent</Text>
          </View>
        )}

        {isApproved && (
          <View style={[styles.statusChip, styles.statusChipGreen]}>
            <Text style={[styles.statusChipText, styles.statusChipTextGreen]}>
              ✓ Approved — +{myCompletion?.gems_awarded} 💎
            </Text>
          </View>
        )}

        {isRejected && (
          <View style={[styles.statusChip, styles.statusChipRed]}>
            <Text style={[styles.statusChipText, styles.statusChipTextRed]}>
              ✗ Rejected — try again
            </Text>
          </View>
        )}

        {canSubmit && (
          <>
            <Text style={styles.noteLabel}>ADD A NOTE</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Tell your parent what you did…"
              placeholderTextColor={Colors.outline}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />

            <SquishButton
              label={submitting ? 'Submitting…' : 'I Did It! 🎉'}
              onPress={submit}
              disabled={submitting}
              style={styles.submitBtn}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.surface },
  loading: { padding: 40, textAlign: 'center', color: Colors.onSurfaceVariant },
  scroll:  { padding: 20, paddingBottom: 40 },

  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 },
  backText: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.primary },

  heroCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.secondaryContainer,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 20,
  },

  title: {
    fontFamily: Fonts.kidsH1,
    fontSize: 28,
    color: Colors.onSurface,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },

  chipsRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 8, justifyContent: 'center', marginBottom: 16,
  },
  chip: {
    backgroundColor: Colors.primaryFixed,
    borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  chipText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.primary },
  gemChip: {
    backgroundColor: Colors.tertiaryFixed,
    borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  gemChipText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.onTertiaryFixed },

  desc: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.onSurfaceVariant,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },

  statusChip: {
    backgroundColor: Colors.warningContainer,
    borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 12,
    alignItems: 'center', marginBottom: 20,
  },
  statusChipGreen:  { backgroundColor: Colors.successContainer },
  statusChipRed:    { backgroundColor: Colors.errorContainer },
  statusChipText:   { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.warning },
  statusChipTextGreen: { color: Colors.success },
  statusChipTextRed:   { color: Colors.error },

  noteLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    letterSpacing: 1,
    marginBottom: 8,
  },
  noteInput: {
    backgroundColor: Colors.white,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: 14,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.onSurface,
    textAlignVertical: 'top',
    minHeight: 90,
    marginBottom: 24,
  },

  submitBtn: { marginTop: 0 },
});
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | head -20
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(child)/challenges/[id].tsx"
git commit -m "feat: rewrite child Challenge Detail with Stitch design + Celebration Overlay A"
```

---

## Task 4: Rewrite child Store

**Files:**
- Modify: `app/(child)/store/index.tsx`

- [ ] **Step 1: Replace the file**

```typescript
import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, RefreshControl, SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Reward } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import AppHeader from '@/components/AppHeader';
import GemBadge from '@/components/GemBadge';
import { FALLBACK_ICON } from '@/constants/icons';

function typeLabel(t: string) {
  if (t === 'screen_time') return 'Screen Time';
  if (t === 'money')       return 'Money';
  if (t === 'activity')    return 'Activity';
  return 'Gift';
}

export default function ChildStore() {
  const { family, profile, membership, refreshFamily, signOut } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [myRedemptions, setMyRedemptions] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!family || !profile) return;
    const [{ data: rw }, { data: redemptions }] = await Promise.all([
      supabase
        .from('rewards').select('*')
        .eq('family_id', family.id).eq('is_active', true)
        .order('gem_cost', { ascending: true }),
      supabase
        .from('redemptions').select('reward_id')
        .eq('child_id', profile.id).eq('status', 'pending'),
    ]);
    setRewards(rw ?? []);
    setMyRedemptions(new Set<string>(redemptions?.map((r: { reward_id: string }) => r.reward_id) ?? []));
  }, [family, profile]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

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
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Something went wrong');
    } finally {
      setRedeeming(null);
    }
  }

  const balance   = membership?.gem_balance ?? 0;
  const affordable = rewards.filter(r => balance >= r.gem_cost);
  const locked     = rewards.filter(r => balance < r.gem_cost);

  const sections = [
    ...(affordable.length ? [{ key: 'a', label: 'YOU CAN GET',  data: affordable }] : []),
    ...(locked.length     ? [{ key: 'l', label: 'KEEP SAVING',  data: locked     }] : []),
  ];

  const renderReward = (item: Reward) => {
    const canAfford    = balance >= item.gem_cost;
    const pending      = myRedemptions.has(item.id);
    const isConfirming = confirmId === item.id;
    const isRedeeming  = redeeming === item.id;
    const need         = item.gem_cost - balance;

    return (
      <View key={item.id} style={[styles.rewardCard, !canAfford && styles.rewardCardLocked]}>
        {/* Cost badge top-right */}
        <View style={styles.costBadge}>
          <Text style={styles.costText}>{item.gem_cost} 💎</Text>
        </View>

        {/* Icon circle */}
        <View style={[styles.rewardIconCircle, !canAfford && styles.rewardIconCircleLocked]}>
          <MaterialCommunityIcons
            name={(item.emoji || FALLBACK_ICON) as any}
            size={56}
            color={canAfford ? Colors.radiantAmber : Colors.onSurfaceVariant}
          />
        </View>

        <Text style={[styles.rewardTitle, !canAfford && styles.rewardTitleLocked]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.rewardType}>{typeLabel(item.reward_type)}</Text>

        {/* CTA area */}
        {pending ? (
          <View style={styles.pendingChip}>
            <Text style={styles.pendingChipText}>⏳ Waiting for parent</Text>
          </View>
        ) : isRedeeming ? (
          <Text style={styles.processingText}>Processing…</Text>
        ) : isConfirming ? (
          <View style={styles.confirmRow}>
            <TouchableOpacity style={styles.confirmBtn} onPress={() => confirmRedeem(item)}>
              <Text style={styles.confirmBtnText}>Yes, redeem!</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setConfirmId(null)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : canAfford ? (
          <TouchableOpacity style={styles.unlockBtn} onPress={() => setConfirmId(item.id)}>
            <Text style={styles.unlockBtnText}>Unlock Now!</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.needMoreBtn}>
            <Text style={styles.needMoreText}>Need {need} more 💎</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader mode="child" onSwitchMode={signOut} />

      {/* Hero row */}
      <View style={styles.heroRow}>
        <View style={styles.heroIcon}>
          <MaterialCommunityIcons name="star-four-points" size={80} color={Colors.radiantAmber} />
        </View>
        <Text style={styles.heroTitle}>Reward Shop</Text>
        <GemBadge gems={balance} />
      </View>

      <FlatList
        data={sections}
        keyExtractor={(s) => s.key}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
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
            {section.data.map(renderReward)}
          </>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },

  heroRow: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  heroIcon:  { marginBottom: 4 },
  heroTitle: { fontFamily: Fonts.kidsDisplay, fontSize: 32, color: Colors.primary },

  list: { padding: 20, paddingBottom: 40 },
  sectionLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    letterSpacing: 1.5,
    marginTop: 8,
    marginBottom: 12,
  },

  rewardCard: {
    backgroundColor: Colors.white,
    borderRadius: 40,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    position: 'relative',
    shadowColor: 'rgba(103,80,164,1)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 3,
  },
  rewardCardLocked: { opacity: 0.6 },

  costBadge: {
    position: 'absolute',
    top: 16, right: 16,
    backgroundColor: Colors.tertiaryFixed,
    borderRadius: 9999,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  costText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.onTertiaryFixed },

  rewardIconCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: Colors.tertiaryFixed,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  rewardIconCircleLocked: { backgroundColor: Colors.surfaceContainerHigh },

  rewardTitle: { fontFamily: Fonts.kidsH1, fontSize: 20, color: Colors.onSurface, textAlign: 'center', marginBottom: 4 },
  rewardTitleLocked: { color: Colors.onSurfaceVariant },
  rewardType: { fontFamily: Fonts.body, fontSize: 13, color: Colors.onSurfaceVariant, marginBottom: 16 },

  pendingChip: {
    backgroundColor: Colors.warningContainer,
    borderRadius: 9999,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  pendingChipText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.warning },
  processingText:  { fontFamily: Fonts.body, fontSize: 13, color: Colors.onSurfaceVariant },

  confirmRow:  { flexDirection: 'row', gap: 8, width: '100%' },
  confirmBtn: {
    flex: 1, backgroundColor: Colors.radiantAmber,
    borderRadius: 9999, paddingVertical: 12, alignItems: 'center',
  },
  confirmBtnText: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.onTertiaryFixed },
  cancelBtn: {
    flex: 1, borderRadius: 9999, paddingVertical: 12, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  cancelBtnText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.onSurfaceVariant },

  unlockBtn: {
    width: '100%', backgroundColor: Colors.primary,
    borderRadius: 9999, paddingVertical: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 0,
    elevation: 4,
  },
  unlockBtnText: { fontFamily: Fonts.bodyBold, fontSize: 16, color: Colors.white },

  needMoreBtn: {
    width: '100%', backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 9999, paddingVertical: 14, alignItems: 'center',
  },
  needMoreText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.onSurfaceVariant },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontFamily: Fonts.kidsH1, fontSize: 18, color: Colors.onSurface, marginBottom: 4 },
  emptyMeta:  { fontFamily: Fonts.body,   fontSize: 14, color: Colors.onSurfaceVariant },
});
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | head -20
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(child)/store/index.tsx"
git commit -m "feat: rewrite child Store with Stitch reward cards and amber gem badges"
```

---

## Task 5: Update E2E test helpers for renamed tabs

The child "Rewards" tab is now "Store". The "Missions" tab is gone (missions are on "Home"). Update tests that click these tabs.

**Files:**
- Modify: `tests/e2e/04-rewards.spec.ts`
- Modify: `tests/e2e/05-gem-economy.spec.ts`

- [ ] **Step 1: Update rewards spec — child tab name**

In `tests/e2e/04-rewards.spec.ts`, find all occurrences of `clickTab(page, 'Rewards')` that refer to the **child** store tab, and change them to `clickTab(page, 'Store')`.

Lines to change (look for child context — after `restoreSession(page, childState, '/')` calls):

```typescript
// line 79 (US-016):
await clickTab(page, 'Store');

// line 96 (US-017 cannot redeem):
await clickTab(page, 'Store');

// line 131 (US-017 can redeem):
await clickTab(page, 'Store');

// line 265 (cancel redemption confirm):
await clickTab(page, 'Store');
```

Note: parent `clickTab(page, 'Rewards')` calls stay unchanged (parent tab is still "Rewards").

- [ ] **Step 2: Update gem economy spec — gem store header check**

In `tests/e2e/05-gem-economy.spec.ts`, line 115, update the `clickTab`:

```typescript
// line 115:
await clickTab(page, 'Store');
```

The label `'GEMS'` and `'gems to spend'` checks can stay — those are text content, not tab names.

- [ ] **Step 3: Verify TypeScript**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | head -10
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/04-rewards.spec.ts tests/e2e/05-gem-economy.spec.ts
git commit -m "fix(e2e): update child tab name Rewards → Store in E2E tests"
```

---

## Done

Plan B deliverables:
- `CelebrationOverlay` component (Mode A auto-dismiss)
- Child Home screen: LevelCircle + full mission list + amber gem badges
- Child Challenge Detail: Stitch design + Overlay A on submit
- Child Store: reward cards with 40px radius, amber cost badges, squish unlock button
- E2E tests updated for renamed "Store" tab

**Proceed to Plan C** (`2026-06-17-stitch-c-parent-celebration.md`) to restyle parent screens, add push notifications, and wire up Celebration Overlay B.
