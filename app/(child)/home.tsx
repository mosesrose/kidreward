import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Challenge, Completion } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { CATEGORY_COLORS } from '@/constants/challenges';

export default function ChildDashboard() {
  const { profile, family, membership, signOut, refreshFamily } = useAuth();
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [recentCompletions, setRecentCompletions] = useState<Completion[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!family || !profile) return;

    const [{ data: challenges }, { data: completions }] = await Promise.all([
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
        .limit(5),
    ]);

    setActiveChallenges(challenges ?? []);
    setRecentCompletions(completions ?? []);
  }, [family, profile]);

  useEffect(() => {
    if (!family) {
      router.replace('/(child)/join');
    } else {
      load();
    }
  }, [family, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([load(), refreshFamily()]);
    setRefreshing(false);
  };

  const gemBalance = membership?.gem_balance ?? 0;
  const totalEarned = membership?.total_gems_earned ?? 0;

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gem} />}
      >
        {/* Hero header */}
        <LinearGradient
          colors={[Colors.childBg, Colors.childCard, Colors.purple]}
          style={styles.header}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          {/* Decorative stars */}
          <Text style={styles.deco1}>⭐</Text>
          <Text style={styles.deco2}>✨</Text>
          <Text style={styles.deco3}>💫</Text>

          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Hey, {profile?.name}! 👋</Text>
              <Text style={styles.subGreeting}>Keep up the great work!</Text>
            </View>
            <TouchableOpacity onPress={signOut}>
              <Text style={styles.signOut}>Sign out</Text>
            </TouchableOpacity>
          </View>

          {/* Gem balance card */}
          <View style={styles.gemCard}>
            <LinearGradient
              colors={['rgba(0,212,255,0.2)', 'rgba(0,153,187,0.3)']}
              style={styles.gemCardInner}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <View style={styles.gemMain}>
                <Text style={styles.gemEmoji}>💎</Text>
                <View>
                  <Text style={styles.gemBalance}>{gemBalance}</Text>
                  <Text style={styles.gemLabel}>Gems available</Text>
                </View>
              </View>
              <View style={styles.gemDivider} />
              <View style={styles.gemStats}>
                <View style={styles.gemStat}>
                  <Text style={styles.gemStatNum}>{totalEarned}</Text>
                  <Text style={styles.gemStatLabel}>Total earned</Text>
                </View>
                <View style={styles.gemStat}>
                  <Text style={styles.gemStatNum}>{recentCompletions.filter(c => c.status === 'approved').length}</Text>
                  <Text style={styles.gemStatLabel}>Completed</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </LinearGradient>

        {/* Active challenges */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>⚔️ Active Missions</Text>
            <TouchableOpacity onPress={() => router.push('/(child)/challenges/index')}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>

          {activeChallenges.length === 0 ? (
            <View style={styles.noChallenges}>
              <Text style={styles.noChallengesEmoji}>🎉</Text>
              <Text style={styles.noChallengesText}>No missions yet — ask your parent!</Text>
            </View>
          ) : (
            <View style={styles.challengeGrid}>
              {activeChallenges.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.challengeCard, { borderTopColor: CATEGORY_COLORS[c.category] ?? Colors.purple }]}
                  onPress={() => router.push(`/(child)/challenges/${c.id}`)}
                >
                  <Text style={styles.challengeEmoji}>{c.emoji}</Text>
                  <Text style={styles.challengeTitle} numberOfLines={2}>{c.title}</Text>
                  <View style={styles.challengeGems}>
                    <Text style={styles.challengeGemsText}>+{c.gem_reward} 💎</Text>
                  </View>
                  {c.repeat_type !== 'once' && (
                    <Text style={styles.repeatTag}>
                      {c.repeat_type === 'daily' ? '🔄' : '📆'}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Recent activity */}
        {recentCompletions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📜 Recent Activity</Text>
            {recentCompletions.map((c) => {
              const status = c.status;
              const color = status === 'approved' ? Colors.childGreen : status === 'rejected' ? Colors.danger : Colors.pending;
              const icon = status === 'approved' ? '✅' : status === 'rejected' ? '❌' : '⏳';
              return (
                <View key={c.id} style={styles.activityRow}>
                  <Text style={styles.activityIcon}>{(c as any).challenges?.emoji ?? '⭐'}</Text>
                  <Text style={styles.activityTitle} numberOfLines={1}>
                    {(c as any).challenges?.title}
                  </Text>
                  <Text style={styles.activityStatus}>{icon}</Text>
                  {status === 'approved' && c.gems_awarded && (
                    <Text style={[styles.activityGems, { color: Colors.childGreen }]}>
                      +{c.gems_awarded}💎
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Go to store CTA */}
        <TouchableOpacity
          style={styles.storeCta}
          onPress={() => router.push('/(child)/store/index')}
        >
          <LinearGradient
            colors={[Colors.childAccent, '#FF9500']}
            style={styles.storeCtaGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <Text style={styles.storeCtaText}>🛒 Spend your {gemBalance} gems!</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.childBg },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 28 },
  deco1: { position: 'absolute', top: 70, right: 24, fontSize: 28, opacity: 0.4 },
  deco2: { position: 'absolute', top: 110, left: 16, fontSize: 20, opacity: 0.3 },
  deco3: { position: 'absolute', top: 160, right: 50, fontSize: 16, opacity: 0.3 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  greeting: { fontSize: 26, fontWeight: '900', color: Colors.textLight },
  subGreeting: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 3 },
  signOut: { color: 'rgba(255,255,255,0.35)', fontSize: 13 },
  gemCard: { borderRadius: 20, overflow: 'hidden' },
  gemCardInner: { padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,212,255,0.3)' },
  gemMain: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  gemEmoji: { fontSize: 48 },
  gemBalance: { fontSize: 52, fontWeight: '900', color: Colors.gem, lineHeight: 56 },
  gemLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  gemDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 16 },
  gemStats: { flexDirection: 'row', gap: 32 },
  gemStat: {},
  gemStatNum: { fontSize: 20, fontWeight: '800', color: Colors.textLight },
  gemStatLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  section: { paddingHorizontal: 20, paddingTop: 24 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.textLight },
  seeAll: { color: Colors.gem, fontWeight: '700', fontSize: 14 },
  noChallenges: { alignItems: 'center', paddingVertical: 28 },
  noChallengesEmoji: { fontSize: 36, marginBottom: 8 },
  noChallengesText: { color: 'rgba(255,255,255,0.5)', fontSize: 15 },
  challengeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  challengeCard: {
    width: '47%', backgroundColor: Colors.childCard,
    borderRadius: 16, padding: 14,
    borderTopWidth: 4, borderTopColor: Colors.purple,
    position: 'relative',
  },
  challengeEmoji: { fontSize: 32, marginBottom: 8 },
  challengeTitle: { fontSize: 13, fontWeight: '700', color: Colors.textLight, marginBottom: 8, lineHeight: 18 },
  challengeGems: {
    backgroundColor: 'rgba(0,212,255,0.15)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start',
  },
  challengeGemsText: { color: Colors.gem, fontWeight: '700', fontSize: 12 },
  repeatTag: { position: 'absolute', top: 10, right: 10, fontSize: 14 },
  activityRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.childCard, borderRadius: 12,
    padding: 12, marginBottom: 8, gap: 10,
  },
  activityIcon: { fontSize: 22 },
  activityTitle: { flex: 1, fontSize: 14, color: Colors.textLight, fontWeight: '600' },
  activityStatus: { fontSize: 18 },
  activityGems: { fontSize: 13, fontWeight: '700' },
  storeCta: { margin: 20, borderRadius: 16, overflow: 'hidden' },
  storeCtaGradient: { paddingVertical: 18, alignItems: 'center', borderRadius: 16 },
  storeCtaText: { color: Colors.textLight, fontWeight: '900', fontSize: 17 },
});
