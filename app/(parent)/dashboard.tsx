import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, SafeAreaView, Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Completion, FamilyMember } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import ActivityFeed from '@/components/ActivityFeed';
import ItemGraphic from '@/components/ItemGraphic';
import { sendApprovalPush, sendRewardFulfilledPush } from '@/lib/push-notifications';

const QUOTES = [
  'Children are not things to be moulded, but people to be unfolded.',
  'It is easier to build strong children than to repair broken men.',
  'The greatest gifts you can give your children are the roots of responsibility and the wings of independence.',
  'Every child you encounter is a divine appointment.',
];
function todayQuote() { return QUOTES[new Date().getDate() % QUOTES.length]; }

export default function ParentDashboard() {
  const { profile, family, signOut } = useAuth();
  const [children, setChildren]                   = useState<FamilyMember[]>([]);
  const [pendingCompletions, setPendingCompletions] = useState<any[]>([]);
  const [pendingRedemptions, setPendingRedemptions] = useState<any[]>([]);
  const [weekCompleted, setWeekCompleted]           = useState(0);
  const [weekGems, setWeekGems]                     = useState(0);
  const [weeklyTrend, setWeeklyTrend]               = useState<number[]>([0, 0, 0, 0]);
  const [refreshing, setRefreshing]                 = useState(false);

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
      buckets[3 - Math.min(3, Math.floor(daysAgo / 7))]++;
    });
    setWeeklyTrend(buckets);
  }, [family]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  async function approveCompletion(comp: any) {
    const challenge = comp.challenges;
    const gems = (challenge?.gem_reward ?? 0) + (challenge?.bonus_gems ?? 0);
    const { error } = await supabase
      .from('completions')
      .update({ status: 'approved', gems_awarded: gems, reviewed_at: new Date().toISOString() })
      .eq('id', comp.id);
    if (error) { Alert.alert('Error', error.message); return; }
    await supabase.rpc('award_gems', { p_child_id: comp.child_id, p_family_id: family!.id, p_gems: gems });
    const token = comp.profiles?.push_token;
    if (token) sendApprovalPush({ pushToken: token, parentName: profile?.name ?? 'Your parent', challengeTitle: challenge?.title ?? '', gems });
    load();
  }

  async function rejectCompletion(comp: any) {
    await supabase.from('completions').update({ status: 'rejected', reviewed_at: new Date().toISOString() }).eq('id', comp.id);
    load();
  }

  async function fulfillRedemption(red: any) {
    await supabase.from('redemptions').update({ status: 'fulfilled', fulfilled_at: new Date().toISOString() }).eq('id', red.id);
    const token = red.profiles?.push_token;
    if (token) sendRewardFulfilledPush({ pushToken: token, parentName: profile?.name ?? 'Your parent', rewardTitle: red.rewards?.title ?? '' });
    load();
  }

  async function rejectRedemption(red: any) {
    await supabase.from('redemptions').update({ status: 'rejected' }).eq('id', red.id);
    await supabase.rpc('award_gems', { p_child_id: red.child_id, p_family_id: family!.id, p_gems: red.gems_spent });
    load();
  }

  const totalPending = pendingCompletions.length + pendingRedemptions.length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.parentAccent} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerEyebrow}>APYX LEGEND</Text>
            <Text style={styles.greeting}>Welcome, {profile?.name}</Text>
            <Text style={styles.familyName}>{family?.name}</Text>
          </View>
          <TouchableOpacity onPress={signOut} style={styles.signOutBtn}>
            <MaterialIcons name="logout" size={18} color={Colors.parentMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Quote */}
          <View style={styles.quoteCard}>
            <View style={styles.quoteBar} />
            <Text style={styles.quoteText}>"{todayQuote()}"</Text>
          </View>

          {/* Stats */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>THIS WEEK</Text>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{weekCompleted}</Text>
                <Text style={styles.statMeta}>completed</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={[styles.statNum, { color: Colors.parentAccent }]}>{totalPending}</Text>
                <Text style={styles.statMeta}>to review</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNum}>{weekGems}💎</Text>
                <Text style={styles.statMeta}>gems out</Text>
              </View>
            </View>
          </View>

          {/* Trend chart */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>LAST 4 WEEKS</Text>
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
                        i === 3 && { backgroundColor: Colors.parentAccent },
                      ]} />
                    </View>
                    <Text style={styles.trendLabel}>{labels[i]}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Action Needed */}
          <Text style={styles.sectionLabel}>
            ACTION NEEDED {totalPending > 0 ? `(${totalPending})` : ''}
          </Text>
          {totalPending === 0 ? (
            <View style={styles.allCaughtUp}>
              <MaterialIcons name="check-circle" size={20} color={Colors.success} />
              <Text style={styles.allCaughtUpText}>All caught up</Text>
            </View>
          ) : (
            <>
              {pendingCompletions.map((comp) => (
                <View key={comp.id} style={[styles.card, styles.pendingCard]}>
                  <View style={styles.actionTop}>
                    <ItemGraphic
                      emoji={comp.challenges?.emoji}
                      size={24}
                      mode="parent"
                      style={{ marginRight: 12 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.actionTitle}>{comp.challenges?.title}</Text>
                      <Text style={styles.actionMeta}>
                        {comp.profiles?.name} · quest submission
                      </Text>
                      {comp.note ? (
                        <Text style={styles.actionNote}>"{comp.note}"</Text>
                      ) : null}
                    </View>
                  </View>
                  <View style={styles.actionBtns}>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => rejectCompletion(comp)}>
                      <MaterialIcons name="cancel" size={14} color={Colors.error} />
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.approveBtn} onPress={() => approveCompletion(comp)}>
                      <MaterialIcons name="check-circle" size={14} color={Colors.white} />
                      <Text style={styles.approveBtnText}>
                        Approve +{comp.challenges?.gem_reward ?? 0}💎
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {pendingRedemptions.map((red) => (
                <View key={red.id} style={[styles.card, styles.pendingCard]}>
                  <View style={styles.actionTop}>
                    <ItemGraphic
                      emoji={red.rewards?.emoji}
                      size={24}
                      mode="parent"
                      style={{ marginRight: 12 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.actionTitle}>{red.rewards?.title}</Text>
                      <Text style={styles.actionMeta}>
                        {red.profiles?.name} · reward request · {red.gems_spent}💎
                      </Text>
                    </View>
                  </View>
                  <View style={styles.actionBtns}>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => rejectRedemption(red)}>
                      <MaterialIcons name="cancel" size={14} color={Colors.error} />
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.approveBtn} onPress={() => fulfillRedemption(red)}>
                      <MaterialIcons name="check-circle" size={14} color={Colors.white} />
                      <Text style={styles.approveBtnText}>Fulfil</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Family Pulse */}
          {family && <ActivityFeed familyId={family.id} />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.parentBg },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
    backgroundColor: Colors.parentCard,
    borderBottomWidth: 1, borderBottomColor: Colors.parentBorder,
  },
  headerEyebrow: { fontFamily: Fonts.bodyBold, fontSize: 9, color: Colors.parentMuted, letterSpacing: 2, marginBottom: 2 },
  greeting:    { fontFamily: Fonts.parentH1, fontSize: 24, color: Colors.parentText },
  familyName:  { fontFamily: Fonts.body, fontSize: 13, color: Colors.parentMuted, marginTop: 2 },
  signOutBtn:  { padding: 8 },

  content: { padding: 16, gap: 12 },

  quoteCard: {
    flexDirection: 'row', gap: 12,
    backgroundColor: Colors.parentCard, borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 1,
  },
  quoteBar:  { width: 3, borderRadius: 3, backgroundColor: Colors.parentAccent },
  quoteText: {
    flex: 1, fontFamily: Fonts.parentH1, fontSize: 13,
    fontStyle: 'italic', color: Colors.parentMuted, lineHeight: 20,
  },

  card: {
    backgroundColor: Colors.parentCard, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  pendingCard: { borderLeftWidth: 3, borderLeftColor: Colors.parentAccent },
  cardLabel: {
    fontFamily: Fonts.bodyBold, fontSize: 10,
    color: Colors.parentMuted, letterSpacing: 1.5, marginBottom: 14,
  },

  statsRow:    { flexDirection: 'row', alignItems: 'center' },
  stat:        { flex: 1, alignItems: 'center' },
  statNum:     { fontFamily: Fonts.parentH1, fontSize: 28, color: Colors.parentText },
  statMeta:    { fontFamily: Fonts.body, fontSize: 11, color: Colors.parentMuted, marginTop: 2 },
  statDivider: { width: 1, height: 40, backgroundColor: Colors.parentBorder },

  trendBars: { flexDirection: 'row', gap: 8, height: 90, alignItems: 'flex-end', marginTop: 10 },
  trendCol:  { flex: 1, alignItems: 'center' },
  trendNum:  { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.parentText, marginBottom: 4 },
  trendBarBg: { width: '100%', flex: 1, backgroundColor: Colors.parentSurface, borderRadius: 4, justifyContent: 'flex-end' },
  trendBar:   { width: '100%', backgroundColor: Colors.parentBorder, borderRadius: 4 },
  trendLabel: { fontFamily: Fonts.body, fontSize: 9, color: Colors.parentMuted, marginTop: 4, textAlign: 'center' },

  sectionLabel: { fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.parentMuted, letterSpacing: 1.5 },

  allCaughtUp: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#d4f7e1', borderRadius: 12, padding: 14,
  },
  allCaughtUpText: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.success },

  actionTop:   { flexDirection: 'row', gap: 12, marginBottom: 12 },
  avatar:      { fontSize: 30 },
  actionTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.parentText },
  actionMeta:  { fontFamily: Fonts.body, fontSize: 12, color: Colors.parentMuted, marginTop: 2 },
  actionNote:  { fontFamily: Fonts.body, fontSize: 12, color: Colors.parentText, fontStyle: 'italic', marginTop: 4 },
  actionBtns:  { flexDirection: 'row', gap: 8 },

  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    borderWidth: 1, borderColor: Colors.error, borderRadius: 9999, paddingVertical: 10,
  },
  rejectBtnText:  { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.error },
  approveBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: Colors.parentAccent, borderRadius: 9999, paddingVertical: 10,
  },
  approveBtnText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.white },
});
