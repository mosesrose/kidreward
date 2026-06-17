import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, RefreshControl, TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';

const CATEGORY_EMOJI: Record<string, string> = {
  homework: '📚', math: '➕', chores: '🧹', cooking: '🍳',
  room: '🛏️', garden: '🌱', morning: '🌅', behavior: '⭐',
  outdoor: '🌳', social: '🤝', family: '🏠', sibling: '👫',
  phone: '📱',
};

const CATEGORY_VALUES: Record<string, string> = {
  homework: 'Learning & Education',
  math: 'Learning & Education',
  chores: 'Responsibility',
  cooking: 'Life Skills',
  room: 'Responsibility',
  garden: 'Nature & Care',
  morning: 'Discipline',
  behavior: 'Character',
  outdoor: 'Health & Fitness',
  social: 'Social Skills',
  family: 'Family Bonds',
  sibling: 'Family Bonds',
  phone: 'Balance',
};

export default function GoalsScreen() {
  const { family } = useAuth();
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!family) return;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: challenges } = await supabase
      .from('challenges')
      .select('id, title, category, gem_reward, child_id')
      .eq('family_id', family.id)
      .eq('status', 'active');

    if (!challenges) return;
    const challengeIds = challenges.map((c: any) => c.id);

    const { data: completions } = await supabase
      .from('completions')
      .select('challenge_id, gems_awarded, reviewed_at')
      .eq('status', 'approved')
      .gte('reviewed_at', weekAgo)
      .in('challenge_id', challengeIds.length ? challengeIds : ['00000000-0000-0000-0000-000000000000']);

    const cats: Record<string, { challenges: any[]; weekCount: number; weekGems: number }> = {};
    challenges.forEach((ch: any) => {
      const cat = ch.category ?? 'other';
      if (!cats[cat]) cats[cat] = { challenges: [], weekCount: 0, weekGems: 0 };
      cats[cat].challenges.push(ch);
    });
    (completions ?? []).forEach((comp: any) => {
      const ch = challenges.find((c: any) => c.id === comp.challenge_id);
      const cat = ch?.category ?? 'other';
      if (cats[cat]) {
        cats[cat].weekCount++;
        cats[cat].weekGems += comp.gems_awarded ?? 0;
      }
    });

    const sorted = Object.entries(cats)
      .map(([cat, data]) => ({ category: cat, ...data }))
      .sort((a, b) => b.weekCount - a.weekCount);

    setCategoryData(sorted);
  }, [family]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Goals</Text>
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={styles.scroll}
      >
        <Text style={styles.intro}>
          Your challenges grouped by the values they build. Tap a category to manage its challenges.
        </Text>

        {categoryData.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No active challenges</Text>
            <Text style={styles.emptyMeta}>Create challenges to see them grouped by value here</Text>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => router.push('/(parent)/challenges/create')}
            >
              <Text style={styles.createBtnText}>+ Create a Challenge</Text>
            </TouchableOpacity>
          </View>
        ) : (
          categoryData.map((item) => (
            <TouchableOpacity
              key={item.category}
              style={styles.card}
              onPress={() => router.push('/(parent)/challenges')}
            >
              <View style={styles.cardTop}>
                <Text style={styles.catEmoji}>
                  {CATEGORY_EMOJI[item.category] ?? '🎯'}
                </Text>
                <View style={styles.catInfo}>
                  <Text style={styles.catName}>
                    {item.category.charAt(0).toUpperCase() + item.category.slice(1).replace(/_/g, ' ')}
                  </Text>
                  <Text style={styles.catValue}>
                    {CATEGORY_VALUES[item.category] ?? 'Family Values'}
                  </Text>
                </View>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{item.challenges.length}</Text>
                  <Text style={styles.countLabel}>challenges</Text>
                </View>
              </View>
              {item.weekCount > 0 && (
                <View style={styles.weekRow}>
                  <Text style={styles.weekText}>
                    ✓ {item.weekCount} completed this week · +{item.weekGems}💎
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.surface },
  header: { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 8 },
  title:  { fontFamily: Fonts.parentH1, fontSize: 28, color: Colors.onSurface },
  scroll: { padding: 20, paddingBottom: 40 },

  intro: {
    fontFamily: Fonts.body, fontSize: 13, color: Colors.onSurfaceVariant,
    lineHeight: 20, marginBottom: 20,
  },

  card: {
    backgroundColor: Colors.white, borderRadius: 12, marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03, shadowRadius: 15, elevation: 1,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  catEmoji: { fontSize: 32 },
  catInfo:  { flex: 1 },
  catName:  { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.onSurface },
  catValue: { fontFamily: Fonts.body, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },
  countBadge: { alignItems: 'center' },
  countText:  { fontFamily: Fonts.parentH1, fontSize: 22, color: Colors.primary },
  countLabel: { fontFamily: Fonts.body, fontSize: 10, color: Colors.onSurfaceVariant },

  weekRow: {
    backgroundColor: Colors.successContainer,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  weekText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.success },

  empty:      { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontFamily: Fonts.parentH1, fontSize: 20, color: Colors.onSurface },
  emptyMeta:  { fontFamily: Fonts.body, fontSize: 14, color: Colors.onSurfaceVariant, marginTop: 6, textAlign: 'center' },
  createBtn:  { marginTop: 20, backgroundColor: Colors.primary, borderRadius: 9999, paddingHorizontal: 24, paddingVertical: 12 },
  createBtnText: { fontFamily: Fonts.bodyBold, fontSize: 15, color: Colors.white },
});
