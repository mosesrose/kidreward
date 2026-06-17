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
    const ids = new Set<string>(comps?.map((c: Pick<Completion, 'challenge_id' | 'status'>) => c.challenge_id) ?? []);
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
