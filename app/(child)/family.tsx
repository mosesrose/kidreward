import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';

const CATEGORY_EMOJI: Record<string, string> = {
  homework: '📚', math: '➕', chores: '🧹', cooking: '🍳',
  room: '🛏️', garden: '🌱', morning: '🌅', behavior: '⭐',
  outdoor: '🌳', social: '🤝', family: '🏠', sibling: '👫',
  phone: '📱', other: '🎯',
};

const LEVEL_LABELS = ['ROOKIE', 'EXPLORER', 'CHAMPION', 'LEGEND', 'MYTHIC'];
function getLevel(totalGems: number) {
  if (totalGems >= 500) return 4;
  if (totalGems >= 200) return 3;
  if (totalGems >= 100) return 2;
  if (totalGems >= 50)  return 1;
  return 0;
}

export default function FamilyScreen() {
  const { profile, family, membership } = useAuth();
  const [weekStats, setWeekStats] = useState<any[]>([]);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [weekTotal, setWeekTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!profile || !family) return;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: challenges } = await supabase
      .from('challenges')
      .select('id, title, category, emoji, gem_reward, child_id')
      .eq('family_id', family.id)
      .eq('status', 'active');

    if (!challenges) return;
    const challengeIds = challenges.map((c: any) => c.id);

    const [{ data: completions }, { data: members }] = await Promise.all([
      supabase
        .from('completions')
        .select('challenge_id, child_id, gems_awarded')
        .eq('status', 'approved')
        .gte('reviewed_at', weekAgo)
        .in('challenge_id', challengeIds.length ? challengeIds : ['00000000-0000-0000-0000-000000000000']),
      supabase
        .from('family_members')
        .select('*, profiles(*)')
        .eq('family_id', family.id),
    ]);

    const catMap: Record<string, { count: number; gems: number }> = {};
    (completions ?? []).forEach((comp: any) => {
      const ch = challenges.find((c: any) => c.id === comp.challenge_id);
      const cat = ch?.category ?? 'other';
      if (!catMap[cat]) catMap[cat] = { count: 0, gems: 0 };
      catMap[cat].count++;
      catMap[cat].gems += comp.gems_awarded ?? 0;
    });

    setWeekStats(Object.entries(catMap)
      .map(([cat, v]) => ({ category: cat, ...v }))
      .sort((a, b) => b.count - a.count));
    setFamilyMembers(members ?? []);
    setWeekTotal((completions ?? []).length);
  }, [profile, family]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const totalGems = membership?.total_gems_earned ?? 0;
  const level     = getLevel(totalGems);
  const levelLabel = LEVEL_LABELS[level];
  // Progress to next level
  const thresholds = [0, 50, 100, 200, 500];
  const nextThreshold = thresholds[Math.min(level + 1, thresholds.length - 1)];
  const levelPct = level >= 4 ? 1 : Math.min(1, totalGems / nextThreshold);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>YOUR STATUS</Text>
        <Text style={styles.headerTitle}>HERO STATS</Text>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.kidGreen} />}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.avatarBox}>
              <Text style={styles.avatarEmoji}>{profile?.avatar_emoji ?? '🧒'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroName}>{profile?.name ?? 'Hero'}</Text>
              <View style={styles.levelRow}>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>{levelLabel}</Text>
                </View>
                <Text style={styles.levelGems}>{totalGems} 💎 TOTAL</Text>
              </View>
            </View>
          </View>

          {/* XP bar */}
          <View style={styles.xpBarBg}>
            <View style={[styles.xpBarFill, { width: `${Math.round(levelPct * 100)}%` as any }]} />
          </View>
          <Text style={styles.xpLabel}>
            {level < 4 ? `${totalGems} / ${nextThreshold} XP to ${LEVEL_LABELS[level + 1]}` : 'MAX LEVEL'}
          </Text>
        </View>

        {/* Gem balance card */}
        <View style={styles.balanceCard}>
          <MaterialIcons name="account-balance-wallet" size={28} color={Colors.kidGreen} />
          <View style={{ flex: 1 }}>
            <Text style={styles.balanceLabel}>CURRENT BALANCE</Text>
            <Text style={styles.balanceNum}>{membership?.gem_balance ?? 0} 💎</Text>
          </View>
        </View>

        {/* Family leaderboard */}
        <Text style={styles.sectionLabel}>FAMILY GEMS</Text>
        {familyMembers.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No family members yet</Text>
          </View>
        ) : (
          familyMembers.map((m, i) => {
            const p = (m as any).profiles;
            const isMe = p?.id === profile?.id;
            return (
              <View key={m.id} style={[styles.memberCard, isMe && styles.memberCardMe]}>
                <Text style={styles.rankNum}>#{i + 1}</Text>
                <Text style={styles.memberAvatar}>{p?.avatar_emoji ?? '🧒'}</Text>
                <Text style={[styles.memberName, isMe && styles.memberNameMe]}>{p?.name}</Text>
                {isMe && <View style={styles.youChip}><Text style={styles.youChipText}>YOU</Text></View>}
                <View style={styles.memberGems}>
                  <Text style={styles.memberGemsText}>{m.gem_balance} 💎</Text>
                </View>
              </View>
            );
          })
        )}

        {/* Weekly breakdown */}
        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>THIS WEEK'S QUESTS</Text>
        {weekTotal === 0 ? (
          <View style={styles.emptyRow}>
            <MaterialIcons name="hourglass-empty" size={20} color={Colors.kidMuted} />
            <Text style={styles.emptyText}>No completed quests yet</Text>
          </View>
        ) : (
          weekStats.map(stat => (
            <View key={stat.category} style={styles.catCard}>
              <Text style={styles.catEmoji}>{CATEGORY_EMOJI[stat.category] ?? '🎯'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.catName}>
                  {stat.category.charAt(0).toUpperCase() + stat.category.slice(1).replace('_', ' ')}
                </Text>
                <Text style={styles.catMeta}>{stat.count} completed</Text>
              </View>
              <Text style={styles.catGems}>+{stat.gems}💎</Text>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  safe:   { flex: 1, backgroundColor: Colors.kidBg },
  scroll: { padding: 16, paddingBottom: 40 },

  header: {
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 2, borderBottomColor: Colors.kidBorder,
  },
  headerEyebrow: { fontFamily: Fonts.bodyBold, fontSize: 9, color: Colors.kidMuted, letterSpacing: 2 },
  headerTitle:   { fontFamily: Fonts.kidsDisplay, fontSize: 24, color: Colors.kidAccent, fontStyle: 'italic' },

  heroCard: {
    ...CARD_BASE,
    backgroundColor: Colors.kidCard,
    padding: 16, marginBottom: 12,
  },
  heroTop: { flexDirection: 'row', gap: 14, marginBottom: 16 },
  avatarBox: {
    width: 64, height: 64,
    backgroundColor: Colors.kidBorder + '33',
    borderWidth: 2, borderColor: Colors.kidBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 36 },
  heroName: { fontFamily: Fonts.kidsH1, fontSize: 22, color: Colors.kidText, marginBottom: 8 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  levelBadge: {
    backgroundColor: Colors.kidGreen,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  levelBadgeText: { fontFamily: Fonts.bodyBold, fontSize: 9, color: Colors.kidGreenText, letterSpacing: 1.5 },
  levelGems:      { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.kidMuted, letterSpacing: 1 },

  xpBarBg: {
    height: 6, backgroundColor: Colors.kidCardHigh,
    borderWidth: 1, borderColor: Colors.kidBorder,
    marginBottom: 6,
  },
  xpBarFill: { height: '100%', backgroundColor: Colors.kidGreen },
  xpLabel: { fontFamily: Fonts.bodyBold, fontSize: 9, color: Colors.kidMuted, letterSpacing: 1 },

  balanceCard: {
    ...CARD_BASE,
    backgroundColor: Colors.kidCard,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, marginBottom: 20,
    borderColor: Colors.kidGreen,
  },
  balanceLabel: { fontFamily: Fonts.bodyBold, fontSize: 9, color: Colors.kidMuted, letterSpacing: 1.5 },
  balanceNum:   { fontFamily: Fonts.kidsH1,   fontSize: 26, color: Colors.kidGreen },

  sectionLabel: {
    fontFamily: Fonts.bodyBold, fontSize: 9,
    color: Colors.kidMuted, letterSpacing: 2, marginBottom: 10,
  },

  memberCard: {
    ...CARD_BASE,
    backgroundColor: Colors.kidCard,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, marginBottom: 8,
  },
  memberCardMe: { borderColor: Colors.kidGreen, backgroundColor: Colors.kidGreen + '11' },
  rankNum:      { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.kidMuted, width: 24 },
  memberAvatar: { fontSize: 24 },
  memberName:   { flex: 1, fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.kidText },
  memberNameMe: { color: Colors.kidGreen },
  youChip: {
    backgroundColor: Colors.kidGreen,
    paddingHorizontal: 6, paddingVertical: 3,
  },
  youChipText: { fontFamily: Fonts.bodyBold, fontSize: 8, color: Colors.kidGreenText, letterSpacing: 1 },
  memberGems: {
    borderWidth: 1, borderColor: Colors.kidAccent,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  memberGemsText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.kidAccent },

  catCard: {
    ...CARD_BASE,
    backgroundColor: Colors.kidCard,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, marginBottom: 8,
  },
  catEmoji: { fontSize: 24 },
  catName:  { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.kidText },
  catMeta:  { fontFamily: Fonts.body,         fontSize: 11, color: Colors.kidMuted, marginTop: 2 },
  catGems:  { fontFamily: Fonts.bodyBold,     fontSize: 13, color: Colors.kidGreenDim },

  emptyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 20, justifyContent: 'center',
  },
  emptyText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.kidMuted },
});
