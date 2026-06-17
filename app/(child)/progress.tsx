import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, SectionList, SafeAreaView,
  RefreshControl, TouchableOpacity,
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
        .in('status', ['fulfilled', 'consumed'])
        .order('fulfilled_at', { ascending: false }),
    ]);
    setApprovedCompletions(comps ?? []);
    setFulfilledRedemptions(reds ?? []);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  async function consumeReward(redemptionId: string) {
    await supabase
      .from('redemptions')
      .update({ status: 'consumed' })
      .eq('id', redemptionId);
    // Optimistic update
    setFulfilledRedemptions(prev =>
      prev.map(r => r.id === redemptionId ? { ...r, status: 'consumed' } : r)
    );
  }

  const sections = [
    {
      title: 'CHALLENGES COMPLETED',
      data: approvedCompletions,
      type: 'challenge',
    },
    {
      title: `REWARDS COLLECTED`,
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
        renderSectionHeader={({ section }) =>
          section.data.length > 0 ? (
            <Text style={styles.sectionLabel}>{section.title}</Text>
          ) : <View />
        }
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
          if ((section as any).type === 'challenge') {
            return (
              <View style={styles.card}>
                <Text style={styles.cardEmoji}>{(item as any).challenges?.emoji ?? '⭐'}</Text>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{(item as any).challenges?.title}</Text>
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
          const reward = (item as any).rewards;
          const isConsumed = item.status === 'consumed';
          return (
            <View style={styles.rewardCard}>
              <Text style={styles.rewardEmoji}>{reward?.emoji ?? '🎁'}</Text>
              <View style={styles.rewardInfo}>
                <Text style={styles.rewardTitle}>{reward?.title}</Text>
                <Text style={styles.rewardMeta}>
                  {item.gems_spent}💎 · {new Date(item.fulfilled_at ?? item.requested_at).toLocaleDateString()}
                </Text>
              </View>
              {isConsumed ? (
                <View style={styles.consumedBadge}>
                  <Text style={styles.consumedBadgeText}>Used ✓</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.consumeBtn}
                  onPress={() => consumeReward(item.id)}
                >
                  <Text style={styles.consumeBtnText}>Mark used</Text>
                </TouchableOpacity>
              )}
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

  rewardCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white, borderRadius: 12, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  rewardEmoji:  { fontSize: 28 },
  rewardInfo:   { flex: 1 },
  rewardTitle:  { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.onSurface },
  rewardMeta:   { fontFamily: Fonts.body, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },
  consumeBtn: {
    backgroundColor: Colors.primaryFixed, borderRadius: 9999,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  consumeBtnText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.primary },
  consumedBadge: {
    backgroundColor: Colors.tertiaryFixed, borderRadius: 9999,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  consumedBadgeText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.onTertiaryFixed },

  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.onSurfaceVariant, textAlign: 'center' },
});
