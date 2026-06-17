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
