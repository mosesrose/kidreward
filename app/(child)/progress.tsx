import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, SectionList, SafeAreaView,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';

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
    await supabase.from('redemptions').update({ status: 'consumed' }).eq('id', redemptionId);
    setFulfilledRedemptions(prev =>
      prev.map(r => r.id === redemptionId ? { ...r, status: 'consumed' } : r)
    );
  }

  const totalGems = approvedCompletions.reduce((s, c) => s + (c.gems_awarded ?? 0), 0);

  const sections = [
    { title: 'QUESTS COMPLETED', data: approvedCompletions, type: 'challenge' },
    { title: 'REWARDS COLLECTED', data: fulfilledRedemptions, type: 'reward' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>MY JOURNEY</Text>
        <Text style={styles.headerTitle}>PROGRESS MAP</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.kidGreen} />}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) =>
          section.data.length > 0 ? (
            <Text style={styles.sectionLabel}>{section.title}</Text>
          ) : <View />
        }
        ListHeaderComponent={
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{approvedCompletions.length}</Text>
              <Text style={styles.statLabel}>QUESTS</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNum, { color: Colors.kidGreen }]}>{totalGems}</Text>
              <Text style={styles.statLabel}>💎 EARNED</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{fulfilledRedemptions.length}</Text>
              <Text style={styles.statLabel}>REWARDS</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="map" size={48} color={Colors.kidMuted} />
            <Text style={styles.emptyTitle}>MAP BLANK</Text>
            <Text style={styles.emptyMeta}>Complete quests to fill your map!</Text>
          </View>
        }
        renderItem={({ item, section }) => {
          if ((section as any).type === 'challenge') {
            return (
              <View style={styles.card}>
                <View style={styles.timelineDot} />
                <View style={styles.cardContent}>
                  <View style={styles.cardRow}>
                    <Text style={styles.cardEmoji}>{(item as any).challenges?.emoji ?? '⭐'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{(item as any).challenges?.title}</Text>
                      <Text style={styles.cardDate}>
                        {item.reviewed_at ? new Date(item.reviewed_at).toLocaleDateString() : ''}
                      </Text>
                    </View>
                    <View style={styles.gemPill}>
                      <Text style={styles.gemPillText}>+{item.gems_awarded ?? 0}💎</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          }
          const reward = (item as any).rewards;
          const isConsumed = item.status === 'consumed';
          return (
            <View style={[styles.card, styles.rewardCard]}>
              <View style={[styles.timelineDot, { backgroundColor: Colors.kidAccent }]} />
              <View style={styles.cardContent}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardEmoji}>{reward?.emoji ?? '🎁'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{reward?.title}</Text>
                    <Text style={styles.cardDate}>
                      {item.gems_spent}💎 · {new Date(item.fulfilled_at ?? item.requested_at).toLocaleDateString()}
                    </Text>
                  </View>
                  {isConsumed ? (
                    <View style={styles.consumedBadge}>
                      <Text style={styles.consumedBadgeText}>USED ✓</Text>
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.consumeBtn} onPress={() => consumeReward(item.id)}>
                      <Text style={styles.consumeBtnText}>MARK USED</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const CARD_BASE = {
  borderWidth: 2,
  borderColor: Colors.kidBorder,
  borderRadius: 0,
  shadowColor: Colors.kidDark,
  shadowOffset: { width: 4, height: 4 },
  shadowOpacity: 1 as number,
  shadowRadius: 0,
  elevation: 4,
} as const;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.kidBg },

  header: {
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 2, borderBottomColor: Colors.kidBorder,
  },
  headerEyebrow: { fontFamily: Fonts.bodyBold, fontSize: 9, color: Colors.kidMuted, letterSpacing: 2 },
  headerTitle:   { fontFamily: Fonts.kidsDisplay, fontSize: 24, color: Colors.kidAccent, fontStyle: 'italic' },

  list: { padding: 16, paddingBottom: 40 },

  statsRow: {
    flexDirection: 'row', gap: 10, marginBottom: 20,
  },
  statCard: {
    ...CARD_BASE,
    flex: 1, backgroundColor: Colors.kidCard,
    padding: 14, alignItems: 'center',
  },
  statNum:   { fontFamily: Fonts.kidsH1,   fontSize: 26, color: Colors.kidAccent },
  statLabel: { fontFamily: Fonts.bodyBold,  fontSize: 8,  color: Colors.kidMuted, letterSpacing: 1.5, marginTop: 4 },

  sectionLabel: {
    fontFamily: Fonts.bodyBold, fontSize: 9,
    color: Colors.kidMuted, letterSpacing: 2,
    marginBottom: 10, marginTop: 4,
  },

  card: {
    ...CARD_BASE,
    backgroundColor: Colors.kidCard,
    marginBottom: 10,
    flexDirection: 'row',
  },
  rewardCard: { borderColor: Colors.kidAccent + '88' },

  timelineDot: {
    width: 4, backgroundColor: Colors.kidGreen,
    alignSelf: 'stretch',
  },
  cardContent: { flex: 1, padding: 14 },
  cardRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardEmoji:   { fontSize: 24 },
  cardTitle:   { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.kidText },
  cardDate:    { fontFamily: Fonts.body,         fontSize: 11, color: Colors.kidMuted, marginTop: 2 },

  gemPill: {
    backgroundColor: Colors.kidGreen + '22',
    borderWidth: 1, borderColor: Colors.kidGreen,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  gemPillText: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.kidGreen },

  consumeBtn: {
    backgroundColor: Colors.kidCardHigh,
    borderWidth: 1, borderColor: Colors.kidAccent,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  consumeBtnText: { fontFamily: Fonts.bodyBold, fontSize: 9, color: Colors.kidAccent, letterSpacing: 1 },

  consumedBadge: {
    backgroundColor: Colors.kidGreen + '22',
    borderWidth: 1, borderColor: Colors.kidGreen,
    paddingHorizontal: 8, paddingVertical: 6,
  },
  consumedBadgeText: { fontFamily: Fonts.bodyBold, fontSize: 9, color: Colors.kidGreen, letterSpacing: 1 },

  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontFamily: Fonts.kidsH1, fontSize: 16, color: Colors.kidText, letterSpacing: 1 },
  emptyMeta:  { fontFamily: Fonts.body,   fontSize: 13, color: Colors.kidMuted },
});
