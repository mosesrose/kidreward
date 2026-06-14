import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Challenge, Completion } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import GemHeader from '@/components/GemHeader';

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
    if (!family) {
      router.replace('/(child)/join');
    } else {
      load();
    }
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.childAccent} />}
      >
        <GemHeader
          name={profile?.name ?? ''}
          gems={gemBalance}
          lifetime={totalEarned}
          onSignOut={signOut}
        />

        {/* Today's missions */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TODAY</Text>

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
                  <Text style={styles.cardTitle} numberOfLines={1}>{c.title}</Text>
                  <Text style={styles.cardMeta}>
                    {c.repeat_type === 'daily' ? 'Daily' : c.repeat_type === 'weekly' ? 'Weekly' : 'Once'} · {capitalize(c.category)}
                  </Text>
                </View>
                <Text style={styles.cardPoints}>+{c.gem_reward} 💎</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Encouragement callout — gap to next reward */}
        {cheapestReward && nextRewardGap !== null && nextRewardGap > 0 && (
          <View style={styles.callout}>
            <Text style={styles.calloutTitle}>{nextRewardGap} gems to your next reward</Text>
            <Text style={styles.calloutMeta}>{cheapestReward.title} · {cheapestReward.gem_cost} gems</Text>
          </View>
        )}

        {/* Recent activity */}
        {recentCompletions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>RECENT</Text>
            {recentCompletions.map((c) => {
              const status = c.status;
              const statusText = status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Waiting';
              const statusColor = status === 'approved' ? Colors.success : status === 'rejected' ? Colors.danger : Colors.warning;
              return (
                <View key={c.id} style={styles.card}>
                  <View style={styles.cardLeft}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {(c as any).challenges?.title}
                    </Text>
                    <Text style={[styles.cardMeta, { color: statusColor }]}>{statusText}</Text>
                  </View>
                  {status === 'approved' && c.gems_awarded ? (
                    <Text style={styles.cardPoints}>+{c.gems_awarded} 💎</Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}

        {/* Store CTA */}
        <TouchableOpacity
          style={styles.storeCta}
          onPress={() => router.push('/(child)/store')}
        >
          <Text style={styles.storeCtaText}>Visit the store</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function capitalize(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.childBg },

  section: { paddingHorizontal: 18, paddingTop: 24 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.textMuted,
    letterSpacing: 2, marginBottom: 12,
  },

  card: {
    backgroundColor: Colors.childCard,
    borderRadius: 16, padding: 16,
    marginBottom: 10,
    borderWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  cardLeft: { flex: 1, paddingRight: 12 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: Colors.textDark, marginBottom: 4 },
  cardMeta: { fontSize: 12, color: Colors.textMuted },
  cardPoints: { fontSize: 14, fontWeight: '700', color: Colors.childAccent },

  empty: {
    backgroundColor: Colors.childCard, borderRadius: 16,
    paddingVertical: 28, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: Colors.textDark, marginBottom: 4 },
  emptyMeta: { fontSize: 13, color: Colors.textMuted },

  callout: {
    marginHorizontal: 18, marginTop: 18,
    backgroundColor: Colors.surfaceSoft,
    borderRadius: 16, padding: 16,
  },
  calloutTitle: { fontSize: 14, fontWeight: '700', color: '#8A4A00', marginBottom: 4 },
  calloutMeta: { fontSize: 12, color: '#B07728' },

  storeCta: {
    margin: 18, marginTop: 24,
    backgroundColor: Colors.childAccent,
    borderRadius: 100, paddingVertical: 16, alignItems: 'center',
  },
  storeCtaText: { color: Colors.textLight, fontWeight: '700', fontSize: 15 },
});
