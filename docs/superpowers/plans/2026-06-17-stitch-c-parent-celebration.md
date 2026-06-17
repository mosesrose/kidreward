# Stitch Visual Rework — Plan C: Parent Screens + Celebration System

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle all parent screens (Dashboard, Challenges, Rewards, My Family), wire up push notifications on child approval, and complete Celebration Overlay B (woohoo!) on the child Home screen via Supabase real-time + offline detection.

**Architecture:** Plan A and Plan B must be complete before starting this plan. Push notifications use `expo-notifications` + Expo Push API (server-side call from parent's device on approval). Child home subscribes to `completions` table via Supabase real-time channel. Offline approvals are detected on Home mount by comparing `updated_at` timestamps to `last_seen_at` stored in AsyncStorage.

**Tech Stack:** React Native + Expo SDK 54, Expo Router, TypeScript, Supabase (Postgres + Realtime), `expo-notifications` (new), `@react-native-async-storage/async-storage` (already installed), MaterialCommunityIcons

**Spec:** `docs/superpowers/specs/2026-06-17-stitch-visual-rework-spec.md` §5 (Parent) + §6 (Celebration)

**Prerequisites:** Plan A + Plan B complete. `components/CelebrationOverlay.tsx` exists with Mode A and Mode B stubs.

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| SQL | Supabase dashboard | Add `push_token` column to `profiles` |
| Install pkg | — | `expo-notifications` |
| Create | `lib/push-notifications.ts` | Send push notification via Expo Push API |
| Modify | `app/(child)/home.tsx` | Realtime subscription + offline approval detection + Overlay B |
| Modify | `contexts/AuthContext.tsx` | Store push token after child login |
| Modify | `app/(parent)/dashboard.tsx` | Stitch design + inline Action Needed (completions + redemptions) |
| Modify | `app/(parent)/challenges/index.tsx` | Stitch design |
| Modify | `app/(parent)/challenges/[id].tsx` | Stitch design + approve → push notification |
| Modify | `app/(parent)/rewards/index.tsx` | Stitch design |
| Modify | `app/(parent)/children/index.tsx` | Rewrite as "My Family" (kids + invite merged) |

---

## Task 1: DB migration — add push_token column

**Files:** Supabase SQL (run once against live project `nvrexzvpjklwfgvqcpoe`)

- [ ] **Step 1: Run migration**

```bash
SUPABASE_MANAGEMENT_TOKEN=$(grep SUPABASE_MANAGEMENT_TOKEN /mnt/c/work/reward/.secrets | cut -d= -f2)
curl -s -X POST \
  "https://api.supabase.com/v1/projects/nvrexzvpjklwfgvqcpoe/database/query" \
  -H "Authorization: Bearer $SUPABASE_MANAGEMENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token text;"}' \
  | jq .
```

Expected output: `{"rowCount":0}` or similar success response. No "error" key.

- [ ] **Step 2: Verify column exists**

```bash
SUPABASE_MANAGEMENT_TOKEN=$(grep SUPABASE_MANAGEMENT_TOKEN /mnt/c/work/reward/.secrets | cut -d= -f2)
curl -s -X POST \
  "https://api.supabase.com/v1/projects/nvrexzvpjklwfgvqcpoe/database/query" \
  -H "Authorization: Bearer $SUPABASE_MANAGEMENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT column_name FROM information_schema.columns WHERE table_name='\''profiles'\'' AND column_name='\''push_token'\'';"}' \
  | jq '.rows'
```

Expected: `[{"column_name":"push_token"}]`

- [ ] **Step 3: Update Profile type in `lib/supabase.ts`**

Find the `Profile` type (around line 43) and add `push_token`:

```typescript
export type Profile = {
  id: string;
  name: string;
  role: 'parent' | 'child';
  avatar_emoji: string;
  created_at: string;
  push_token?: string | null;
};
```

- [ ] **Step 4: Verify TypeScript**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | head -10
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add lib/supabase.ts
git commit -m "feat: add push_token to Profile type (DB column already added)"
```

---

## Task 2: Install expo-notifications + push notification helper

**Files:**
- Install: `expo-notifications`
- Create: `lib/push-notifications.ts`

- [ ] **Step 1: Install expo-notifications**

```bash
cd /mnt/c/work/reward && npx expo install expo-notifications
```

Expected: package added. No errors.

- [ ] **Step 2: Create `lib/push-notifications.ts`**

```typescript
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure foreground notification behaviour
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Request permission and return the push token (or null on failure / simulator). */
export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') return null; // push not supported on web

  const { status: existing } = await Notifications.getPermissionsAsync();
  const finalStatus = existing === 'granted'
    ? existing
    : (await Notifications.requestPermissionsAsync()).status;

  if (finalStatus !== 'granted') return null;

  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID ?? undefined,
    });
    return token.data;
  } catch {
    return null;
  }
}

/** Send a push notification to a child's push token via Expo Push API.
 *  Called from parent device on challenge approval. */
export async function sendApprovalPush({
  pushToken,
  parentName,
  challengeTitle,
  gems,
}: {
  pushToken: string;
  parentName: string;
  challengeTitle: string;
  gems: number;
}) {
  const message = {
    to: pushToken,
    sound: 'default',
    title: `🎉 ${parentName} approved your challenge!`,
    body: `${challengeTitle} — you earned ${gems} 💎 gems!`,
    data: { type: 'approval' },
  };

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
  } catch (e) {
    // Best-effort — non-fatal if push fails
    console.warn('Push notification failed:', e);
  }
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | head -10
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add lib/push-notifications.ts package.json
git commit -m "feat: install expo-notifications + push notification helper"
```

---

## Task 3: Register push token on child login

On child login, request notification permission and store the push token in `profiles.push_token` so the parent can send notifications on approval.

**Files:**
- Modify: `contexts/AuthContext.tsx`

- [ ] **Step 1: Read the current AuthContext**

```bash
head -80 /mnt/c/work/reward/contexts/AuthContext.tsx
```

- [ ] **Step 2: Add push token registration**

Find the section where the user session is loaded and the profile is fetched. After the profile is confirmed as a `child`, add:

```typescript
import { registerForPushNotifications } from '@/lib/push-notifications';

// Inside the auth state change handler, after setting `profile`:
if (profile?.role === 'child') {
  registerForPushNotifications().then((token) => {
    if (token) {
      supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('id', profile.id)
        .then(() => {});
    }
  });
}
```

The exact location to insert this depends on the current file structure. Read the file first (Step 1), then insert at the right place. The trigger is: after `setProfile(profile)` is called for a child user.

- [ ] **Step 3: Verify TypeScript**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | head -10
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add contexts/AuthContext.tsx
git commit -m "feat: register push token for child users on login"
```

---

## Task 4: Wire Celebration Overlay B + real-time on child Home

This is the most complex task. Adds:
1. Supabase real-time subscription on `completions` table — fires Overlay B when parent approves
2. Offline detection on Home mount — fires Overlay B for approvals that happened while app was closed

**Files:**
- Modify: `app/(child)/home.tsx`

- [ ] **Step 1: Add offline detection + real-time subscription**

Add these imports to `app/(child)/home.tsx`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import CelebrationOverlay from '@/components/CelebrationOverlay';
import { getLevel } from '@/constants/levels';
```

Add this state inside `ChildHome`:

```typescript
const [celebration, setCelebration] = useState<{
  gems: number;
  challengeTitle: string;
  levelUp: boolean;
  newLevel: number;
} | null>(null);
```

Add this helper inside `ChildHome` (before the JSX):

```typescript
async function checkOfflineApprovals() {
  if (!profile) return;
  const lastSeenKey = `last_seen_at_${profile.id}`;
  const lastSeen = await AsyncStorage.getItem(lastSeenKey) ?? '1970-01-01T00:00:00Z';

  const { data } = await supabase
    .from('completions')
    .select('*, challenges(*)')
    .eq('child_id', profile.id)
    .eq('status', 'approved')
    .gt('reviewed_at', lastSeen)
    .order('reviewed_at', { ascending: false })
    .limit(1);

  await AsyncStorage.setItem(lastSeenKey, new Date().toISOString());

  if (data && data.length > 0) {
    const comp = data[0];
    const prevTotal = (membership?.total_gems_earned ?? 0) - (comp.gems_awarded ?? 0);
    const prevLevel = getLevel(prevTotal).level;
    const newTotal  = membership?.total_gems_earned ?? 0;
    const newLevel  = getLevel(newTotal).level;
    setCelebration({
      gems: comp.gems_awarded ?? 0,
      challengeTitle: (comp as any).challenges?.title ?? '',
      levelUp: newLevel > prevLevel,
      newLevel,
    });
  }
}
```

Update `useFocusEffect` to also call `checkOfflineApprovals`:

```typescript
useFocusEffect(useCallback(() => {
  if (loading) return;
  if (!family) { router.replace('/(child)/join'); return; }
  load();
  checkOfflineApprovals();
}, [family, load, loading, membership]));
```

Add real-time subscription in a separate `useEffect`:

```typescript
useEffect(() => {
  if (!profile || !family) return;

  const channel = supabase
    .channel(`completions_child_${profile.id}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'completions',
        filter: `child_id=eq.${profile.id}`,
      },
      async (payload) => {
        const record = payload.new as any;
        if (record.status !== 'approved') return;

        // Reload to get updated gem balance
        await Promise.all([load(), refreshFamily()]);

        // Fetch challenge title
        const { data: ch } = await supabase
          .from('challenges')
          .select('title')
          .eq('id', record.challenge_id)
          .single();

        const gems = record.gems_awarded ?? 0;
        const newTotal = (membership?.total_gems_earned ?? 0) + gems;
        const prevTotal = newTotal - gems;
        const prevLevel = getLevel(prevTotal).level;
        const newLevel  = getLevel(newTotal).level;

        setCelebration({
          gems,
          challengeTitle: ch?.title ?? '',
          levelUp: newLevel > prevLevel,
          newLevel,
        });
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [profile?.id, family?.id]);
```

Add `CelebrationOverlay` to the JSX (before `ScrollView`):

```typescript
<CelebrationOverlay
  visible={!!celebration}
  mode="approved"
  gems={celebration?.gems}
  challengeTitle={celebration?.challengeTitle}
  levelUp={celebration?.levelUp}
  newLevel={celebration?.newLevel}
  onDismiss={() => { setCelebration(null); load(); refreshFamily(); }}
/>
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | head -20
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(child)/home.tsx"
git commit -m "feat: add Celebration Overlay B on child Home (realtime + offline detection)"
```

---

## Task 5: Rewrite parent Dashboard

Replaces the current dashboard with the Stitch design: Action Needed section (pending completions + redemptions inline), Family Pulse (activity feed), stats widget.

**Files:**
- Modify: `app/(parent)/dashboard.tsx`

- [ ] **Step 1: Replace the file**

```typescript
import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, SafeAreaView, Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Completion, FamilyMember } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import AppHeader from '@/components/AppHeader';
import ActivityFeed from '@/components/ActivityFeed';
import { sendApprovalPush } from '@/lib/push-notifications';

const QUOTES = [
  'Children are not things to be moulded, but people to be unfolded.',
  'It is easier to build strong children than to repair broken men.',
  'The greatest gifts you can give your children are the roots of responsibility and the wings of independence.',
  'Every child you encounter is a divine appointment.',
];

function todayQuote() {
  const day = new Date().getDate();
  return QUOTES[day % QUOTES.length];
}

export default function ParentDashboard() {
  const { profile, family, signOut } = useAuth();
  const [children, setChildren] = useState<FamilyMember[]>([]);
  const [pendingCompletions, setPendingCompletions] = useState<any[]>([]);
  const [pendingRedemptions, setPendingRedemptions] = useState<any[]>([]);
  const [weekCompleted, setWeekCompleted] = useState(0);
  const [weekGems, setWeekGems] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!family) return;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const challengeIds = (await supabase
      .from('challenges').select('id').eq('family_id', family.id)
    ).data?.map((c: { id: string }) => c.id) ?? [];

    const [
      { data: members },
      { data: pending },
      { data: weekComps },
      { data: pendingReds },
    ] = await Promise.all([
      supabase.from('family_members').select('*, profiles(*)').eq('family_id', family.id),
      supabase
        .from('completions')
        .select('*, challenges(*), profiles!completions_child_id_fkey(*)')
        .eq('status', 'pending')
        .in('challenge_id', challengeIds)
        .order('submitted_at', { ascending: false }),
      supabase
        .from('completions').select('gems_awarded')
        .eq('status', 'approved').gte('reviewed_at', weekAgo)
        .in('challenge_id', challengeIds),
      supabase
        .from('redemptions')
        .select('*, rewards(*), profiles!redemptions_child_id_fkey(*)')
        .eq('family_id', family.id).eq('status', 'pending')
        .order('requested_at', { ascending: false }),
    ]);

    setChildren(members ?? []);
    setPendingCompletions(pending ?? []);
    setPendingRedemptions(pendingReds ?? []);
    setWeekCompleted(weekComps?.length ?? 0);
    setWeekGems((weekComps ?? []).reduce((s, c: any) => s + (c.gems_awarded ?? 0), 0));
  }, [family]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  async function approveCompletion(comp: any) {
    const challenge = comp.challenges;
    const gems = (challenge?.gem_reward ?? 0) + (challenge?.bonus_gems ?? 0);
    const { error } = await supabase
      .from('completions')
      .update({ status: 'approved', gems_awarded: gems, reviewed_at: new Date().toISOString() })
      .eq('id', comp.id);
    if (error) { Alert.alert('Error', error.message); return; }
    await supabase.rpc('award_gems', {
      p_child_id: comp.child_id,
      p_family_id: family!.id,
      p_gems: gems,
    });
    // Send push notification to child
    const childPushToken = comp.profiles?.push_token;
    if (childPushToken) {
      sendApprovalPush({
        pushToken: childPushToken,
        parentName: profile?.name ?? 'Your parent',
        challengeTitle: challenge?.title ?? '',
        gems,
      });
    }
    load();
  }

  async function rejectCompletion(comp: any) {
    await supabase
      .from('completions')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', comp.id);
    load();
  }

  async function fulfillRedemption(red: any) {
    await supabase
      .from('redemptions')
      .update({ status: 'fulfilled', fulfilled_at: new Date().toISOString() })
      .eq('id', red.id);
    load();
  }

  async function rejectRedemption(red: any) {
    await supabase.from('redemptions').update({ status: 'rejected' }).eq('id', red.id);
    // Refund gems
    await supabase.rpc('award_gems', {
      p_child_id: red.child_id,
      p_family_id: family!.id,
      p_gems: red.gems_spent,
    });
    load();
  }

  const totalPending = pendingCompletions.length + pendingRedemptions.length;

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader mode="parent" />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back, {profile?.name}</Text>
            <Text style={styles.familyName}>{family?.name}'s Family</Text>
          </View>
          <TouchableOpacity onPress={signOut}>
            <Text style={styles.signOut}>Sign out</Text>
          </TouchableOpacity>
        </View>

        {/* Quote */}
        <View style={styles.quote}>
          <Text style={styles.quoteText}>"{todayQuote()}"</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsLabel}>FAMILY THIS WEEK</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{weekCompleted}</Text>
              <Text style={styles.statMeta}>completed</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: Colors.primary }]}>{totalPending}</Text>
              <Text style={styles.statMeta}>to review</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{weekGems}</Text>
              <Text style={styles.statMeta}>gems out</Text>
            </View>
          </View>
        </View>

        {/* Action Needed */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACTION NEEDED</Text>
          {totalPending === 0 ? (
            <View style={styles.allCaughtUp}>
              <Text style={styles.allCaughtUpText}>✓ All caught up</Text>
            </View>
          ) : (
            <>
              {pendingCompletions.map((comp) => (
                <View key={comp.id} style={styles.actionCard}>
                  <View style={styles.actionCardTop}>
                    <Text style={styles.actionAvatar}>{comp.profiles?.avatar_emoji ?? '🧒'}</Text>
                    <View style={styles.actionInfo}>
                      <Text style={styles.actionTitle}>{comp.challenges?.title}</Text>
                      <Text style={styles.actionMeta}>
                        {comp.profiles?.name} · challenge submission
                      </Text>
                      {comp.note ? <Text style={styles.actionNote}>"{comp.note}"</Text> : null}
                    </View>
                  </View>
                  <View style={styles.actionBtns}>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => rejectCompletion(comp)}
                    >
                      <Text style={styles.rejectBtnText}>✗ Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.approveBtn}
                      onPress={() => approveCompletion(comp)}
                    >
                      <Text style={styles.approveBtnText}>
                        ✓ Approve +{comp.challenges?.gem_reward ?? 0}💎
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {pendingRedemptions.map((red) => (
                <View key={red.id} style={styles.actionCard}>
                  <View style={styles.actionCardTop}>
                    <Text style={styles.actionAvatar}>{red.profiles?.avatar_emoji ?? '🧒'}</Text>
                    <View style={styles.actionInfo}>
                      <Text style={styles.actionTitle}>{red.rewards?.title}</Text>
                      <Text style={styles.actionMeta}>
                        {red.profiles?.name} · reward redemption · {red.gems_spent}💎
                      </Text>
                    </View>
                  </View>
                  <View style={styles.actionBtns}>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => rejectRedemption(red)}
                    >
                      <Text style={styles.rejectBtnText}>✗ Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.approveBtn}
                      onPress={() => fulfillRedemption(red)}
                    >
                      <Text style={styles.approveBtnText}>✓ Fulfil</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Family Pulse */}
        {family && <ActivityFeed familyId={family.id} />}

        {/* Switch to kid mode */}
        <TouchableOpacity style={styles.kidModeCard} onPress={signOut}>
          <Text style={styles.kidModeText}>Switch to Kid Mode →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8,
  },
  greeting:   { fontFamily: Fonts.parentH1, fontSize: 22, color: Colors.onSurface },
  familyName: { fontFamily: Fonts.body,     fontSize: 14, color: Colors.onSurfaceVariant, marginTop: 2 },
  signOut:    { fontFamily: Fonts.body,     fontSize: 13, color: Colors.outline, paddingTop: 4 },

  quote: {
    marginHorizontal: 20, marginBottom: 16,
    paddingLeft: 14, borderLeftWidth: 3, borderLeftColor: Colors.primary,
  },
  quoteText: {
    fontFamily: 'SourceSerif4-SemiBold',
    fontSize: 14, fontStyle: 'italic',
    color: Colors.onSurfaceVariant, lineHeight: 20,
  },

  statsCard: {
    marginHorizontal: 20, marginBottom: 16,
    backgroundColor: Colors.white, borderRadius: 12, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03, shadowRadius: 15, elevation: 1,
  },
  statsLabel: {
    fontFamily: Fonts.bodyBold, fontSize: 11,
    color: Colors.onSurfaceVariant, letterSpacing: 1.5, marginBottom: 14,
  },
  statsRow: { flexDirection: 'row', gap: 28 },
  stat:     {},
  statNum:  { fontFamily: Fonts.parentH1, fontSize: 28, color: Colors.onSurface },
  statMeta: { fontFamily: Fonts.body,     fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },

  section:      { paddingHorizontal: 20, marginBottom: 8 },
  sectionTitle: {
    fontFamily: Fonts.bodyBold, fontSize: 11,
    color: Colors.onSurfaceVariant, letterSpacing: 1.5, marginBottom: 12,
  },

  allCaughtUp: {
    backgroundColor: Colors.successContainer,
    borderRadius: 12, paddingVertical: 12, alignItems: 'center',
  },
  allCaughtUpText: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.success },

  actionCard: {
    backgroundColor: Colors.white, borderRadius: 12, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03, shadowRadius: 15, elevation: 1,
  },
  actionCardTop:  { flexDirection: 'row', gap: 12, marginBottom: 12 },
  actionAvatar:   { fontSize: 32 },
  actionInfo:     { flex: 1 },
  actionTitle:    { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.onSurface },
  actionMeta:     { fontFamily: Fonts.body, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },
  actionNote:     { fontFamily: Fonts.body, fontSize: 12, color: Colors.onSurface, fontStyle: 'italic', marginTop: 4 },
  actionBtns:     { flexDirection: 'row', gap: 8 },
  rejectBtn: {
    flex: 1, borderWidth: 1, borderColor: Colors.error,
    borderRadius: 9999, paddingVertical: 10, alignItems: 'center',
  },
  rejectBtnText:  { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.error },
  approveBtn: {
    flex: 2, backgroundColor: Colors.success,
    borderRadius: 9999, paddingVertical: 10, alignItems: 'center',
  },
  approveBtnText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.white },

  kidModeCard: {
    margin: 20, marginTop: 4,
    backgroundColor: Colors.primary,
    borderRadius: 12, paddingVertical: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 0, elevation: 4,
    marginBottom: 32,
  },
  kidModeText: { fontFamily: Fonts.bodyBold, fontSize: 16, color: Colors.white },
});
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | head -20
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(parent)/dashboard.tsx"
git commit -m "feat: rewrite parent Dashboard with Stitch design + inline Action Needed"
```

---

## Task 6: Restyle parent Challenges list

**Files:**
- Modify: `app/(parent)/challenges/index.tsx`

- [ ] **Step 1: Replace the styles only**

The data-loading logic is correct. Only the JSX + styles need updating. Replace the full file:

```typescript
import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Challenge } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { FALLBACK_ICON } from '@/constants/icons';

type ChallengeWithPending = Challenge & { pending_count: number };

export default function ChallengesScreen() {
  const { family } = useAuth();
  const [challenges, setChallenges] = useState<ChallengeWithPending[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!family) return;
    const { data: ch } = await supabase
      .from('challenges').select('*').eq('family_id', family.id)
      .neq('status', 'archived').order('created_at', { ascending: false });
    if (!ch) return;

    const { data: completions } = await supabase
      .from('completions').select('challenge_id').eq('status', 'pending')
      .in('challenge_id', ch.map((c: Challenge) => c.id));

    const map: Record<string, number> = {};
    completions?.forEach((c: { challenge_id: string }) => {
      map[c.challenge_id] = (map[c.challenge_id] ?? 0) + 1;
    });

    setChallenges(ch.map((c: Challenge) => ({ ...c, pending_count: map[c.id] ?? 0 })));
  }, [family]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Challenges</Text>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => router.push('/(parent)/challenges/create')}
        >
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={challenges}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No challenges yet</Text>
            <Text style={styles.emptyMeta}>Create your first challenge for your kids</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/(parent)/challenges/${item.id}`)}
          >
            <View style={styles.iconBox}>
              <MaterialCommunityIcons
                name={(item.emoji || FALLBACK_ICON) as any}
                size={26}
                color={Colors.primary}
              />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardMeta}>
                {item.repeat_type === 'daily' ? 'Daily' :
                 item.repeat_type === 'weekly' ? 'Weekly' : 'Once'}
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
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 20, paddingHorizontal: 20, paddingBottom: 16,
  },
  title: { fontFamily: Fonts.parentH1, fontSize: 28, color: Colors.onSurface },
  newBtn: {
    backgroundColor: Colors.primary, borderRadius: 9999,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  newBtnText: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.white },
  list:  { padding: 20, gap: 10 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontFamily: Fonts.parentH1, fontSize: 20, color: Colors.onSurface },
  emptyMeta:  { fontFamily: Fonts.body,     fontSize: 14, color: Colors.onSurfaceVariant, marginTop: 6 },

  card: {
    backgroundColor: Colors.white, borderRadius: 12,
    padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03, shadowRadius: 15, elevation: 1,
  },
  iconBox: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center', justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.onSurface },
  cardMeta:  { fontFamily: Fonts.body,         fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },
  gemBadge: {
    backgroundColor: Colors.tertiaryFixed,
    borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4,
  },
  gemBadgeText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.onTertiaryFixed },
  pendingDot: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.warning, alignItems: 'center', justifyContent: 'center',
  },
  pendingDotText: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.white },
});
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | head -10
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(parent)/challenges/index.tsx"
git commit -m "feat: restyle parent Challenges list (Stitch design)"
```

---

## Task 7: Update parent Challenge Detail — approve sends push notification

The approve action must send a push notification to the child. Also restyle the screen.

**Files:**
- Modify: `app/(parent)/challenges/[id].tsx`

- [ ] **Step 1: Replace the file**

The logic is the same as the current file; add `sendApprovalPush` to the `approve` function and restyle:

```typescript
import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase, Challenge, Completion } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { FALLBACK_ICON } from '@/constants/icons';
import { sendApprovalPush } from '@/lib/push-notifications';

export default function ChallengeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [id]);

  async function load() {
    setLoading(true);
    const [{ data: ch }, { data: comps }] = await Promise.all([
      supabase.from('challenges').select('*').eq('id', id).single(),
      supabase
        .from('completions')
        .select('*, profiles!completions_child_id_fkey(*)')
        .eq('challenge_id', id)
        .order('submitted_at', { ascending: false }),
    ]);
    setChallenge(ch);
    setCompletions(comps ?? []);
    setLoading(false);
  }

  async function approve(completion: Completion) {
    const gems = (challenge?.gem_reward ?? 0) + (challenge?.bonus_gems ?? 0);
    const { error } = await supabase
      .from('completions')
      .update({ status: 'approved', gems_awarded: gems, reviewed_at: new Date().toISOString() })
      .eq('id', completion.id);
    if (error) { Alert.alert('Error', error.message); return; }

    await supabase.rpc('award_gems', {
      p_child_id: completion.child_id,
      p_family_id: challenge?.family_id,
      p_gems: gems,
    });

    // Send push notification to child
    const childPushToken = (completion as any).profiles?.push_token;
    if (childPushToken) {
      sendApprovalPush({
        pushToken: childPushToken,
        parentName: profile?.name ?? 'Your parent',
        challengeTitle: challenge?.title ?? '',
        gems,
      });
    }

    load();
  }

  async function reject(completion: Completion) {
    const { error } = await supabase
      .from('completions')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', completion.id);
    if (error) { Alert.alert('Error', error.message); return; }
    load();
  }

  async function deleteChallenge() {
    Alert.alert('Delete challenge?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await supabase.from('challenges').delete().eq('id', id);
          router.replace('/(parent)/challenges');
        },
      },
    ]);
  }

  if (loading || !challenge) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.loading}>Loading…</Text>
      </SafeAreaView>
    );
  }

  const pending   = completions.filter(c => c.status === 'pending');
  const past      = completions.filter(c => c.status !== 'pending');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={Colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="delete-challenge-btn" onPress={deleteChallenge}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <View style={styles.heroCircle}>
          <MaterialCommunityIcons
            name={(challenge.emoji || FALLBACK_ICON) as any}
            size={40}
            color={Colors.primary}
          />
        </View>
        <Text style={styles.title}>{challenge.title}</Text>

        {/* Meta chips */}
        <View style={styles.chipsRow}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>
              {challenge.repeat_type === 'daily' ? 'Daily' :
               challenge.repeat_type === 'weekly' ? 'Weekly' : 'Once'}
            </Text>
          </View>
          <View style={styles.gemChip}>
            <Text style={styles.gemChipText}>💎 {challenge.gem_reward}</Text>
          </View>
        </View>

        {challenge.description ? (
          <Text style={styles.desc}>{challenge.description}</Text>
        ) : null}

        {/* Pending submissions */}
        {pending.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Pending ({pending.length})</Text>
            {pending.map((c) => (
              <View key={c.id} style={styles.submissionCard}>
                <View style={styles.submissionTop}>
                  <Text style={styles.submissionAvatar}>
                    {(c as any).profiles?.avatar_emoji ?? '🧒'}
                  </Text>
                  <View style={styles.submissionInfo}>
                    <Text style={styles.submissionName}>{(c as any).profiles?.name}</Text>
                    <Text style={styles.submissionDate}>
                      {new Date(c.submitted_at).toLocaleDateString()}
                    </Text>
                    {c.note && <Text style={styles.submissionNote}>"{c.note}"</Text>}
                  </View>
                </View>
                <View style={styles.submissionBtns}>
                  <TouchableOpacity
                    testID={`reject-btn-${c.id}`}
                    style={styles.rejectBtn}
                    onPress={() => reject(c)}
                  >
                    <Text style={styles.rejectBtnText}>✗ Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID={`approve-btn-${c.id}`}
                    style={styles.approveBtn}
                    onPress={() => approve(c)}
                  >
                    <Text style={styles.approveBtnText}>✓ Approve +{challenge.gem_reward}💎</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Past submissions */}
        {past.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Past ({past.length})</Text>
            {past.map((c) => (
              <View key={c.id} style={styles.pastCard}>
                <Text style={styles.pastAvatar}>
                  {(c as any).profiles?.avatar_emoji ?? '🧒'}
                </Text>
                <Text style={styles.pastName}>{(c as any).profiles?.name}</Text>
                <View style={[
                  styles.statusPill,
                  c.status === 'approved' ? styles.pillGreen : styles.pillRed,
                ]}>
                  <Text style={[
                    styles.statusText,
                    c.status === 'approved' ? styles.statusGreen : styles.statusRed,
                  ]}>
                    {c.status}
                  </Text>
                </View>
                {c.status === 'approved' && c.gems_awarded ? (
                  <Text style={styles.awarded}>+{c.gems_awarded}💎</Text>
                ) : null}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.surface },
  loading: { padding: 40, textAlign: 'center', color: Colors.onSurfaceVariant },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 16, paddingHorizontal: 20, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant,
  },
  backBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText:   { fontFamily: Fonts.bodyBold, fontSize: 15, color: Colors.primary },
  deleteText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.error },
  scroll:     { padding: 20, paddingBottom: 40 },

  heroCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 16,
  },
  title: {
    fontFamily: Fonts.parentH1, fontSize: 24,
    color: Colors.onSurface, textAlign: 'center', marginBottom: 12,
  },
  chipsRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 16 },
  chip: {
    backgroundColor: Colors.primaryFixed, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  chipText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.primary },
  gemChip: {
    backgroundColor: Colors.tertiaryFixed, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  gemChipText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.onTertiaryFixed },
  desc: {
    fontFamily: Fonts.body, fontSize: 14,
    color: Colors.onSurfaceVariant, textAlign: 'center',
    lineHeight: 20, marginBottom: 20,
  },

  sectionTitle: {
    fontFamily: Fonts.bodyBold, fontSize: 11,
    color: Colors.onSurfaceVariant, letterSpacing: 1.5,
    marginBottom: 10, marginTop: 8,
  },

  submissionCard: {
    backgroundColor: Colors.white, borderRadius: 12,
    padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03, shadowRadius: 15, elevation: 1,
  },
  submissionTop:    { flexDirection: 'row', gap: 12, marginBottom: 12 },
  submissionAvatar: { fontSize: 28 },
  submissionInfo:   { flex: 1 },
  submissionName:   { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.onSurface },
  submissionDate:   { fontFamily: Fonts.body, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },
  submissionNote:   { fontFamily: Fonts.body, fontSize: 12, color: Colors.onSurface, fontStyle: 'italic', marginTop: 4 },
  submissionBtns: { flexDirection: 'row', gap: 8 },
  rejectBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 9999,
    borderWidth: 1, borderColor: Colors.error, alignItems: 'center',
  },
  rejectBtnText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.error },
  approveBtn: {
    flex: 2, paddingVertical: 10, borderRadius: 9999,
    backgroundColor: Colors.success, alignItems: 'center',
  },
  approveBtnText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.white },

  pastCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.white, borderRadius: 10,
    padding: 12, marginBottom: 8,
  },
  pastAvatar:  { fontSize: 22 },
  pastName:    { flex: 1, fontFamily: Fonts.body, fontSize: 13, color: Colors.onSurface },
  statusPill:  { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  pillGreen:   { backgroundColor: Colors.successContainer },
  pillRed:     { backgroundColor: Colors.errorContainer },
  statusText:  { fontFamily: Fonts.bodyBold, fontSize: 11, textTransform: 'capitalize' },
  statusGreen: { color: Colors.success },
  statusRed:   { color: Colors.error },
  awarded:     { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.success },
});
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | head -10
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(parent)/challenges/[id].tsx"
git commit -m "feat: parent Challenge Detail sends push notification on approve (Stitch design)"
```

---

## Task 8: Restyle parent Rewards list

**Files:**
- Modify: `app/(parent)/rewards/index.tsx`

- [ ] **Step 1: Replace the file**

```typescript
import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Switch, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Reward } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { FALLBACK_ICON } from '@/constants/icons';

const TYPE_COLORS: Record<string, string> = {
  money:       '#00C853',
  gift:        '#FF9FF3',
  screen_time: '#74C0FC',
  activity:    '#FFA94D',
};

const TYPE_LABELS: Record<string, string> = {
  money:       'Money',
  gift:        'Gift',
  screen_time: 'Screen Time',
  activity:    'Activity',
};

export default function RewardsScreen() {
  const { family } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!family) return;
    const { data } = await supabase
      .from('rewards').select('*').eq('family_id', family.id)
      .order('gem_cost', { ascending: true });
    setRewards(data ?? []);
  }, [family]);

  useEffect(() => { load(); }, [load]);

  async function toggleActive(reward: Reward) {
    const next = !reward.is_active;
    setRewards(prev => prev.map(r => r.id === reward.id ? { ...r, is_active: next } : r));
    await supabase.from('rewards').update({ is_active: next }).eq('id', reward.id);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Rewards</Text>
        <TouchableOpacity style={styles.newBtn} onPress={() => router.push('/(parent)/rewards/create')}>
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={rewards}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No rewards yet</Text>
            <Text style={styles.emptyMeta}>Create rewards your kids can buy with their gems</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, !item.is_active && styles.cardInactive]}>
            {/* Type badge strip */}
            <View style={[styles.typeBadge, { backgroundColor: TYPE_COLORS[item.reward_type] + '20' }]}>
              <Text style={[styles.typeText, { color: TYPE_COLORS[item.reward_type] }]}>
                {TYPE_LABELS[item.reward_type]}
              </Text>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.iconBox}>
                <MaterialCommunityIcons
                  name={(item.emoji || FALLBACK_ICON) as any}
                  size={28}
                  color={item.is_active ? Colors.primary : Colors.onSurfaceVariant}
                />
              </View>
              <View style={styles.rewardInfo}>
                <Text style={[styles.rewardTitle, !item.is_active && styles.dim]}>{item.title}</Text>
                {item.description ? (
                  <Text style={styles.rewardDesc}>{item.description}</Text>
                ) : null}
              </View>
              <View style={styles.costBadge}>
                <Text style={styles.costText}>{item.gem_cost} 💎</Text>
              </View>
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>
                {item.is_active ? 'Visible to kids' : 'Hidden from kids'}
              </Text>
              <Switch
                value={item.is_active}
                onValueChange={() => toggleActive(item)}
                trackColor={{ false: Colors.outlineVariant, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 20, paddingHorizontal: 20, paddingBottom: 16,
  },
  title:      { fontFamily: Fonts.parentH1, fontSize: 28, color: Colors.onSurface },
  newBtn:     { backgroundColor: Colors.primary, borderRadius: 9999, paddingHorizontal: 16, paddingVertical: 8 },
  newBtnText: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.white },
  list:  { padding: 20, gap: 12, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontFamily: Fonts.parentH1, fontSize: 20, color: Colors.onSurface },
  emptyMeta:  { fontFamily: Fonts.body,     fontSize: 14, color: Colors.onSurfaceVariant, marginTop: 6, textAlign: 'center' },

  card: {
    backgroundColor: Colors.white, borderRadius: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03, shadowRadius: 15, elevation: 1,
  },
  cardInactive: { opacity: 0.6 },
  typeBadge: { paddingHorizontal: 12, paddingVertical: 6 },
  typeText:  { fontFamily: Fonts.bodyBold, fontSize: 12 },
  cardBody:  { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  iconBox: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center', justifyContent: 'center',
  },
  dim:         { opacity: 0.45 },
  rewardInfo:  { flex: 1 },
  rewardTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.onSurface },
  rewardDesc:  { fontFamily: Fonts.body, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 3 },
  costBadge: {
    backgroundColor: Colors.tertiaryFixed, borderRadius: 9999,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  costText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.onTertiaryFixed },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: Colors.outlineVariant,
  },
  toggleLabel: { fontFamily: Fonts.body, fontSize: 13, color: Colors.onSurfaceVariant },
});
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | head -10
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(parent)/rewards/index.tsx"
git commit -m "feat: restyle parent Rewards list (Stitch design)"
```

---

## Task 9: Rewrite My Family screen

Merges children list + invite functionality into one screen (the "Family" tab).

**Files:**
- Modify: `app/(parent)/children/index.tsx`

- [ ] **Step 1: Replace the file**

The current `children/index.tsx` only shows the kids list. The new version adds an "Invite a Child" section and links to `children/invite.tsx` (which handles code creation/sharing). We embed the invite action inline.

```typescript
import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, FamilyMember } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';

export default function MyFamilyScreen() {
  const { family } = useAuth();
  const [children, setChildren] = useState<FamilyMember[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!family) return;
    const { data } = await supabase
      .from('family_members')
      .select('*, profiles(*)')
      .eq('family_id', family.id);
    setChildren(data ?? []);
  }, [family]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>My Family</Text>
      </View>

      <FlatList
        data={children}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <>
            <Text style={styles.sectionLabel}>KIDS</Text>
          </>
        }
        ListFooterComponent={
          <>
            {/* Invite a Child */}
            <TouchableOpacity
              style={styles.inviteBtn}
              onPress={() => router.push('/(parent)/children/invite')}
            >
              <Text style={styles.inviteBtnText}>+ Invite a Child</Text>
            </TouchableOpacity>

            {/* Co-Parents section */}
            <Text style={[styles.sectionLabel, { marginTop: 28 }]}>CO-PARENTS</Text>
            <TouchableOpacity
              style={styles.coParentBtn}
              onPress={() => router.push('/(parent)/children/invite')}
            >
              <Text style={styles.coParentBtnText}>+ Invite a Co-Parent</Text>
            </TouchableOpacity>
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No kids connected yet</Text>
            <Text style={styles.emptyMeta}>Tap "Invite a Child" below to get started</Text>
          </View>
        }
        renderItem={({ item }) => {
          const p = (item as any).profiles;
          return (
            <View style={styles.kidCard}>
              <View style={styles.kidLeft}>
                <Text style={styles.avatar}>{p?.avatar_emoji ?? '🧒'}</Text>
                <View>
                  <Text style={styles.kidName}>{p?.name}</Text>
                  <Text style={styles.kidJoined}>
                    Joined {new Date(item.joined_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <View style={styles.kidStats}>
                <View style={styles.kidStat}>
                  <Text style={styles.kidStatNum}>{item.gem_balance}</Text>
                  <Text style={styles.kidStatLabel}>💎 Balance</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.kidStat}>
                  <Text style={styles.kidStatNum}>{item.total_gems_earned}</Text>
                  <Text style={styles.kidStatLabel}>🏆 Total</Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.surface },
  header: { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 16 },
  title:  { fontFamily: Fonts.parentH1, fontSize: 28, color: Colors.onSurface },
  list:   { padding: 20, paddingBottom: 40 },

  sectionLabel: {
    fontFamily: Fonts.bodyBold, fontSize: 11,
    color: Colors.onSurfaceVariant, letterSpacing: 1.5, marginBottom: 12,
  },

  kidCard: {
    backgroundColor: Colors.white, borderRadius: 12, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03, shadowRadius: 15, elevation: 1,
  },
  kidLeft:  { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  avatar:   { fontSize: 40 },
  kidName:  { fontFamily: Fonts.bodySemiBold, fontSize: 17, color: Colors.onSurface },
  kidJoined: { fontFamily: Fonts.body, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },
  kidStats:  { flexDirection: 'row', backgroundColor: Colors.surfaceContainerLow, borderRadius: 10, padding: 12 },
  kidStat:   { flex: 1, alignItems: 'center' },
  kidStatNum: { fontFamily: Fonts.parentH1, fontSize: 22, color: Colors.onSurface },
  kidStatLabel: { fontFamily: Fonts.body, fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.outlineVariant },

  empty:      { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontFamily: Fonts.parentH1, fontSize: 18, color: Colors.onSurface },
  emptyMeta:  { fontFamily: Fonts.body, fontSize: 14, color: Colors.onSurfaceVariant, marginTop: 4, textAlign: 'center' },

  inviteBtn: {
    marginTop: 12,
    backgroundColor: Colors.primary, borderRadius: 9999,
    paddingVertical: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 0, elevation: 4,
  },
  inviteBtnText: { fontFamily: Fonts.bodyBold, fontSize: 15, color: Colors.white },

  coParentBtn: {
    borderWidth: 1, borderColor: Colors.outlineVariant,
    borderRadius: 9999, paddingVertical: 14, alignItems: 'center',
  },
  coParentBtnText: { fontFamily: Fonts.body, fontSize: 15, color: Colors.onSurfaceVariant },
});
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | head -10
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(parent)/children/index.tsx"
git commit -m "feat: rewrite My Family screen merging kids list + invite CTAs (Stitch design)"
```

---

## Task 9b: Restyle parent Create Challenge screen

**Files:**
- Modify: `app/(parent)/challenges/create.tsx`

- [ ] **Step 1: Update container background and card surfaces**

Open `app/(parent)/challenges/create.tsx` and apply the following token changes throughout the file:

| Old value / token | Replace with |
|---|---|
| `Colors.parentBg` | `Colors.surface` |
| `Colors.parentCard` | `Colors.white` |
| `Colors.parentBorder` | `Colors.outlineVariant` |
| `Colors.purple` | `Colors.primary` |
| `Colors.textDark` | `Colors.onSurface` |
| `Colors.textMuted` | `Colors.onSurfaceVariant` |
| `Colors.textLight` | `Colors.white` |
| `fontSize: N, fontWeight: '700'` on headings | add `fontFamily: Fonts.parentH1` |
| `fontSize: N` on body text | add `fontFamily: Fonts.body` |
| `fontSize: N, fontWeight: '700'` on labels | add `fontFamily: Fonts.bodyBold` |
| `borderRadius: 12` on CTAs | `borderRadius: 9999` (rounded-full) |
| gem badge bg `rgba(122,60,225,0.1)` | `Colors.tertiaryFixed` |
| gem badge text color `Colors.purple` | `Colors.onTertiaryFixed` |

Add `import { Fonts } from '@/constants/fonts';` at the top if not present.

Add `import { SafeAreaView } from 'react-native';` and wrap outer `View` with `<SafeAreaView>`.

- [ ] **Step 2: Verify TypeScript**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | head -10
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(parent)/challenges/create.tsx"
git commit -m "feat: restyle parent Create Challenge (Stitch tokens)"
```

---

## Task 9c: Restyle parent Create Reward screen

**Files:**
- Modify: `app/(parent)/rewards/create.tsx`

- [ ] **Step 1: Apply the same token mapping as Task 9b**

Apply the same mapping table from Task 9b to `app/(parent)/rewards/create.tsx`. Key changes specific to the rewards form:

- Reward type chips: selected state bg → `Colors.primary`, text → `Colors.white`
- Suggestion cards: bg → `Colors.primaryFixed`, border → `Colors.primaryFixedDim`
- Gem cost badge: `Colors.tertiaryFixed` bg, `Colors.onTertiaryFixed` text
- "Save Reward →" button: `Colors.primary`, `borderRadius: 9999`
- Input borders: `Colors.outlineVariant`

Add `import { Fonts } from '@/constants/fonts';` at top.
Add `SafeAreaView` wrapper.

- [ ] **Step 2: Verify TypeScript**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | head -10
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(parent)/rewards/create.tsx"
git commit -m "feat: restyle parent Create Reward (Stitch tokens)"
```

---

## Task 10: Final TypeScript + sanity check

- [ ] **Step 1: Full TypeScript check**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1
```

Expected: 0 errors.

- [ ] **Step 2: Build for web**

```bash
cd /mnt/c/work/reward && timeout 60 npx expo export --platform web 2>&1 | tail -10
```

Expected: Exits with "Export was successful" or similar. No fatal errors about missing modules.

- [ ] **Step 3: Commit anything remaining**

```bash
git status
# If any files show as modified that weren't committed above, add and commit them.
git add -A
git commit -m "chore: final cleanup after Plan C parent screens rework"
```

---

## Done

Plan C deliverables:
- `push_token` column in `profiles` table (Supabase)
- `lib/push-notifications.ts` helper (register + send)
- Push token registered on child login
- Child Home: Celebration Overlay B via Supabase realtime + offline detection
- Parent Dashboard: inline Action Needed (completions + redemptions) + Stitch design
- Parent Challenges list: Stitch design
- Parent Challenge Detail: push notification on approve + Stitch design
- Parent Rewards list: Stitch design
- My Family screen: kids list + invite CTAs merged

**All three plans complete. The full Stitch visual rework is done.**

> **Note:** Auth screens (`app/(auth)/`) are not explicitly restyled in these plans. The color token replacement in Plan A (Task 1) will automatically update their backgrounds and accents via the legacy key aliases. A full font/layout pass on auth screens is a follow-up if needed.

Run E2E tests:
```bash
VERCEL_AUTOMATION_BYPASS_SECRET=$(grep VERCEL_AUTOMATION_BYPASS_SECRET /mnt/c/work/reward/.secrets | cut -d= -f2) \
npx playwright test --project=chromium 2>&1 | tail -20
```
