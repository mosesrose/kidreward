import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, RefreshControl,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import AppHeader from '@/components/AppHeader';

const CATEGORY_EMOJI: Record<string, string> = {
  homework: '📚', math: '➕', chores: '🧹', cooking: '🍳',
  room: '🛏️', garden: '🌱', morning: '🌅', behavior: '⭐',
  outdoor: '🌳', social: '🤝', family: '🏠', sibling: '👫',
  phone: '📱', other: '🎯',
};

export default function FamilyScreen() {
  const { profile, family } = useAuth();
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

    const stats = Object.entries(catMap)
      .map(([cat, v]) => ({ category: cat, ...v }))
      .sort((a, b) => b.count - a.count);

    setWeekStats(stats);
    setFamilyMembers(members ?? []);
    setWeekTotal((completions ?? []).length);
  }, [profile, family]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader mode="child" />
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={styles.scroll}
      >
        <Text style={styles.pageTitle}>This Week 🗓️</Text>

        <Text style={styles.sectionLabel}>FAMILY GEMS</Text>
        {familyMembers.map((m) => {
          const p = (m as any).profiles;
          return (
            <View key={m.id} style={styles.memberRow}>
              <Text style={styles.memberAvatar}>{p?.avatar_emoji ?? '🧒'}</Text>
              <Text style={styles.memberName}>{p?.name}</Text>
              <View style={styles.gemPill}>
                <Text style={styles.gemPillText}>{m.gem_balance} 💎</Text>
              </View>
            </View>
          );
        })}

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>WHAT WE WORKED ON</Text>
        {weekStats.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No completed challenges yet this week. Keep going! 💪</Text>
          </View>
        ) : (
          weekStats.map((stat) => (
            <View key={stat.category} style={styles.catCard}>
              <Text style={styles.catEmoji}>
                {CATEGORY_EMOJI[stat.category] ?? '🎯'}
              </Text>
              <View style={styles.catBody}>
                <Text style={styles.catName}>
                  {stat.category.charAt(0).toUpperCase() + stat.category.slice(1).replace('_', ' ')}
                </Text>
                <Text style={styles.catMeta}>{stat.count} completed</Text>
              </View>
              <Text style={styles.catGems}>+{stat.gems}💎</Text>
            </View>
          ))
        )}

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total this week</Text>
          <Text style={styles.totalNum}>{weekTotal} challenges completed! 🎉</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.surface },
  scroll: { padding: 20, paddingBottom: 40 },

  pageTitle: { fontFamily: Fonts.kidsH1, fontSize: 28, color: Colors.onSurface, marginBottom: 20 },

  sectionLabel: {
    fontFamily: Fonts.bodyBold, fontSize: 11,
    color: Colors.onSurfaceVariant, letterSpacing: 1.5, marginBottom: 12,
  },

  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white, borderRadius: 12, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03, shadowRadius: 15, elevation: 1,
  },
  memberAvatar: { fontSize: 28 },
  memberName:   { flex: 1, fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.onSurface },
  gemPill: {
    backgroundColor: Colors.tertiaryFixed, borderRadius: 9999,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  gemPillText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.onTertiaryFixed },

  catCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white, borderRadius: 12, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03, shadowRadius: 15, elevation: 1,
  },
  catEmoji: { fontSize: 28 },
  catBody:  { flex: 1 },
  catName:  { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.onSurface },
  catMeta:  { fontFamily: Fonts.body,         fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },
  catGems:  { fontFamily: Fonts.bodyBold,     fontSize: 14, color: Colors.primary },

  totalCard: {
    backgroundColor: Colors.primary, borderRadius: 12, padding: 18,
    alignItems: 'center', marginTop: 16,
  },
  totalLabel: { fontFamily: Fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  totalNum:   { fontFamily: Fonts.kidsH1, fontSize: 20, color: Colors.white, marginTop: 4 },

  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.onSurfaceVariant, textAlign: 'center' },
});
