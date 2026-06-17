import { useState, useCallback, useEffect } from 'react';
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
import { sendApprovalPush, sendRewardFulfilledPush } from '@/lib/push-notifications';

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
  const [weeklyTrend, setWeeklyTrend] = useState<number[]>([0, 0, 0, 0]);
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

    // 4-week trend
    const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString();
    const { data: trendData } = await supabase
      .from('completions')
      .select('reviewed_at')
      .eq('status', 'approved')
      .gte('reviewed_at', fourWeeksAgo)
      .in('challenge_id', challengeIds.length ? challengeIds : ['00000000-0000-0000-0000-000000000000']);
    const buckets = [0, 0, 0, 0];
    const now = Date.now();
    (trendData ?? []).forEach((c: any) => {
      const daysAgo = (now - new Date(c.reviewed_at).getTime()) / (1000 * 60 * 60 * 24);
      const weekIdx = 3 - Math.min(3, Math.floor(daysAgo / 7));
      buckets[weekIdx]++;
    });
    setWeeklyTrend(buckets);
  }, [family]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [load]); // load when family becomes available

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
    // Notify child
    const childPushToken = red.profiles?.push_token;
    if (childPushToken) {
      sendRewardFulfilledPush({
        pushToken: childPushToken,
        parentName: profile?.name ?? 'Your parent',
        rewardTitle: red.rewards?.title ?? '',
      });
    }
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
                      { height: `${Math.max(8, heightPct * 100)}%` as any },
                      i === 3 && { backgroundColor: Colors.primary },
                    ]} />
                  </View>
                  <Text style={styles.trendLabel}>{labels[i]}</Text>
                </View>
              );
            })}
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

});
