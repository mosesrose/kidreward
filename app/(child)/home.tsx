import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Challenge, Completion } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import CelebrationOverlay from '@/components/CelebrationOverlay';
import ItemGraphic from '@/components/ItemGraphic';
import { getLevel } from '@/constants/levels';

export default function ChildHome() {
  const { profile, family, membership, refreshFamily, loading } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'active' | 'done'>('active');
  const [celebration, setCelebration] = useState<{
    gems: number;
    challengeTitle: string;
    levelUp: boolean;
    newLevel: number;
  } | null>(null);

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

  useFocusEffect(useCallback(() => {
    if (loading) return;
    if (!family) { router.replace('/(child)/join'); return; }
    load();
    checkOfflineApprovals();
  }, [family, load, loading, membership]));

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

          await Promise.all([load(), refreshFamily()]);

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

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([load(), refreshFamily()]);
    setRefreshing(false);
  };

  const gemBalance  = membership?.gem_balance ?? 0;
  const totalEarned = membership?.total_gems_earned ?? 0;
  const levelInfo   = getLevel(totalEarned);

  const visible   = challenges.filter(c => filter === 'active' ? !completedIds.has(c.id) : completedIds.has(c.id));
  const todoCount = challenges.filter(c => !completedIds.has(c.id)).length;

  return (
    <SafeAreaView style={styles.safe}>
      <CelebrationOverlay
        visible={!!celebration}
        mode="approved"
        gems={celebration?.gems}
        challengeTitle={celebration?.challengeTitle}
        levelUp={celebration?.levelUp}
        newLevel={celebration?.newLevel}
        onDismiss={() => { setCelebration(null); load(); refreshFamily(); }}
      />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="account-balance-wallet" size={20} color={Colors.kidAccent} />
          <Text style={styles.headerGems}>{gemBalance} 💎</Text>
        </View>
        <Text style={styles.headerBrand} numberOfLines={1}>
          {family?.name ?? 'KidReward'}
        </Text>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarEmoji}>{profile?.avatar_emoji ?? '🧒'}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.kidBorder} />
        }
      >
        {/* ── Status Card ── */}
        <View style={styles.statusCard}>
          <View style={styles.statusTop}>
            <View style={styles.statusLeft}>
              <Text style={styles.statusLabel}>CURRENT STATUS</Text>
              <Text style={styles.statusTitle} numberOfLines={1}>
                {profile?.name ?? 'Hero'}
              </Text>
            </View>
            <Text style={styles.streakText}>DAILY STREAK: 3 🔥</Text>
          </View>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(100, (gemBalance / Math.max(1, totalEarned + 1)) * 100)}%` },
              ]}
            />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabelLeft}>LVL {levelInfo.level}</Text>
            <Text style={styles.progressLabelRight}>{gemBalance} / {totalEarned} XP</Text>
          </View>
        </View>

        {/* ── Active Quests ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="rocket-launch" size={18} color={Colors.kidActionGreen} />
            <Text style={styles.sectionTitle}>Active Quests</Text>
            <Text style={styles.sectionCount}>{todoCount} remaining</Text>
          </View>

          {/* Active / Done toggle */}
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

          {visible.length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="sword-cross" size={40} color={Colors.kidMuted} />
              <Text style={styles.emptyTitle}>
                {filter === 'active' ? 'No quests yet' : 'Nothing done yet'}
              </Text>
              <Text style={styles.emptyMeta}>
                {filter === 'active' ? 'Ask your parent to add one' : 'Complete a quest to see it here'}
              </Text>
            </View>
          ) : (
            visible.map((c, idx) => {
              const done = completedIds.has(c.id);
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.questCard, done && styles.questCardDone]}
                  onPress={() => router.push(`/(child)/challenges/${c.id}`)}
                  activeOpacity={0.85}
                >
                  {/* Item Graphic */}
                  <ItemGraphic
                    emoji={c.emoji}
                    size={32}
                    mode="child"
                    style={styles.questGraphic}
                  />

                  <View style={styles.questBody}>
                    {/* Quest number badge */}
                    <View style={styles.questNumBadge}>
                      <Text style={styles.questNumText}>#{String(idx + 1).padStart(2, '0')}</Text>
                    </View>

                    {/* Quest title */}
                    <Text style={styles.questTitle} numberOfLines={2}>{c.title}</Text>

                    {/* Meta row */}
                    <View style={styles.questMeta}>
                      <View style={styles.gemBadge}>
                        <Text style={styles.gemBadgeText}>💎 {c.gem_reward}</Text>
                      </View>
                      <View style={styles.repeatBadge}>
                        <Text style={styles.repeatBadgeText}>
                          {c.repeat_type === 'daily' ? 'DAILY' : c.repeat_type === 'weekly' ? 'WEEKLY' : 'ONCE'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* GO / Done button */}
                  {done ? (
                    <View style={styles.doneBtn}>
                      <MaterialIcons name="check" size={20} color={Colors.kidGreenText} />
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.goBtn}
                      onPress={() => router.push(`/(child)/challenges/${c.id}`)}
                    >
                      <Text style={styles.goBtnText}>GO!</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* ── Recent Loot ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="card-giftcard" size={18} color={Colors.kidAccent} />
            <Text style={styles.sectionTitle}>Recent Loot</Text>
          </View>

          <View style={styles.lootGrid}>
            {[
              { icon: 'shield' as const, label: 'Shield' },
              { icon: 'bolt' as const, label: 'Power' },
              { icon: 'star' as const, label: 'Star' },
              { icon: 'lock' as const, label: 'Locked' },
            ].map((item) => (
              <View key={item.label} style={styles.lootItem}>
                <MaterialIcons name={item.icon} size={28} color={Colors.kidAccent} />
                <Text style={styles.lootLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Loot Store CTA ── */}
        <TouchableOpacity style={styles.storeCta} onPress={() => router.push('/(child)/store')}>
          <MaterialIcons name="card-giftcard" size={20} color={Colors.kidGreenText} style={{ marginRight: 8 }} />
          <Text style={styles.storeCtaText}>VISIT LOOT STORE</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.kidBg },
  scroll: { flex: 1, backgroundColor: Colors.kidBg },
  content: { paddingBottom: 40 },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    height: 64,
    backgroundColor: Colors.kidBg,
    borderBottomWidth: 2,
    borderBottomColor: Colors.kidBorder,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  headerGems: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.kidAccent,
    letterSpacing: 0.5,
  },
  headerBrand: {
    fontFamily: Fonts.kidsH1,
    fontSize: 16,
    color: Colors.kidAccent,
    fontStyle: 'italic',
    flex: 2,
    textAlign: 'center',
  },
  headerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 2, borderColor: Colors.kidBorder,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.kidCard,
    flex: 1,
    alignSelf: 'center',
    maxWidth: 40,
  },
  headerAvatarEmoji: { fontSize: 20 },

  // ── Status Card ──────────────────────────────────────────────────────────
  statusCard: {
    margin: 16,
    backgroundColor: Colors.kidCard,
    borderWidth: 2,
    borderColor: Colors.kidBorder,
    borderRadius: 0,
    padding: 16,
    shadowOffset: { width: 4, height: 4 },
    shadowColor: Colors.kidDark,
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  statusTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  statusLeft: { flex: 1 },
  statusLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: Colors.kidMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statusTitle: {
    fontFamily: Fonts.kidsH1,
    fontSize: 28,
    color: Colors.kidAccent,
    fontStyle: 'italic',
    textTransform: 'uppercase',
    lineHeight: 32,
  },
  streakText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: Colors.kidGreenDim,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'right',
    marginTop: 4,
  },
  progressTrack: {
    height: 10,
    backgroundColor: Colors.kidDark,
    borderRadius: 0,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.kidGreen,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabelLeft: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: Colors.kidMuted,
    letterSpacing: 1,
  },
  progressLabelRight: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: Colors.kidMuted,
    letterSpacing: 1,
  },

  // ── Section ──────────────────────────────────────────────────────────────
  section: { paddingHorizontal: 16, marginBottom: 8 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: Fonts.kidsH1,
    fontSize: 18,
    color: Colors.kidText,
    fontStyle: 'italic',
    textTransform: 'uppercase',
    flex: 1,
  },
  sectionCount: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: Colors.kidMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // ── Segmented control ────────────────────────────────────────────────────
  segmented: {
    flexDirection: 'row',
    backgroundColor: Colors.kidSegBg,
    borderWidth: 1,
    borderColor: Colors.kidBorderSoft,
    borderRadius: 0,
    padding: 3,
    marginBottom: 16,
  },
  seg:       { flex: 1, paddingVertical: 8, alignItems: 'center' },
  segOn:     { backgroundColor: Colors.kidBorderSoft },
  segText:   { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.kidMuted, letterSpacing: 1.5, textTransform: 'uppercase' },
  segTextOn: { color: Colors.kidAccent },

  // ── Quest card ───────────────────────────────────────────────────────────
  questCard: {
    backgroundColor: Colors.kidCardHigh,
    borderWidth: 2,
    borderColor: Colors.kidBorder,
    borderRadius: 0,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'stretch',
    shadowOffset: { width: 4, height: 4 },
    shadowColor: Colors.kidDark,
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    overflow: 'hidden',
  },
  questCardDone: {
    opacity: 0.55,
    shadowOpacity: 0,
    elevation: 0,
  },
  questGraphic: {
    width: 80,
    height: 80,
    borderWidth: 0,
    borderRightWidth: 2,
  },
  questBody: { flex: 1, padding: 12, gap: 6 },
  questNumBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.kidAccent,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  questNumText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: Colors.kidDark,
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  questTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.kidText,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  questMeta: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  gemBadge: {
    backgroundColor: Colors.kidAccent,
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  gemBadgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.kidDark,
  },
  repeatBadge: {
    backgroundColor: Colors.kidGreenDim,
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  repeatBadgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: Colors.kidGreenText,
    letterSpacing: 1,
  },
  goBtn: {
    backgroundColor: Colors.kidGreen,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 2,
    borderLeftColor: Colors.kidBorder,
    borderBottomWidth: 4,
    borderBottomColor: '#000',
  },
  goBtnText: {
    fontFamily: Fonts.kidsH1,
    fontSize: 14,
    color: Colors.kidGreenText,
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  doneBtn: {
    backgroundColor: Colors.kidGreen,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
  },

  // ── Empty state ──────────────────────────────────────────────────────────
  empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyTitle: {
    fontFamily: Fonts.kidsH1,
    fontSize: 18,
    color: Colors.kidText,
    textTransform: 'uppercase',
    fontStyle: 'italic',
  },
  emptyMeta: { fontFamily: Fonts.body, fontSize: 13, color: Colors.kidMuted },

  // ── Loot grid ────────────────────────────────────────────────────────────
  lootGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  lootItem: {
    flex: 1,
    backgroundColor: Colors.kidCard,
    borderWidth: 2,
    borderColor: Colors.kidBorder,
    borderRadius: 0,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowOffset: { width: 2, height: 2 },
    shadowColor: Colors.kidDark,
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  lootLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    color: Colors.kidMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // ── Store CTA ────────────────────────────────────────────────────────────
  storeCta: {
    margin: 16,
    marginTop: 20,
    backgroundColor: Colors.kidGreen,
    borderRadius: 0,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowColor: Colors.kidDark,
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  storeCtaText: {
    fontFamily: Fonts.kidsH1,
    fontSize: 16,
    color: Colors.kidGreenText,
    fontStyle: 'italic',
    letterSpacing: 2,
  },
});
