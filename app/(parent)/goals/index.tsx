import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, RefreshControl, TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import ItemGraphic from '@/components/ItemGraphic';

const CATEGORY_EMOJI: Record<string, string> = {
  homework: '📚', math: '➕', chores: '🧹', cooking: '🍳',
  room: '🛏️', garden: '🌱', morning: '🌅', behavior: '⭐',
  outdoor: '🌳', social: '🤝', family: '🏠', sibling: '👫',
  phone: '📱',
};

const CATEGORY_VALUES: Record<string, string> = {
  homework: 'Learning & Education', math: 'Learning & Education',
  chores: 'Responsibility',         cooking: 'Life Skills',
  room: 'Responsibility',           garden: 'Nature & Care',
  morning: 'Discipline',            behavior: 'Character',
  outdoor: 'Health & Fitness',      social: 'Social Skills',
  family: 'Family Bonds',           sibling: 'Family Bonds',
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

    setCategoryData(Object.entries(cats)
      .map(([cat, data]) => ({ category: cat, ...data }))
      .sort((a, b) => b.weekCount - a.weekCount));
  }, [family]);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>APYX LEGEND</Text>
        <Text style={styles.headerTitle}>Value Goals</Text>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.parentAccent} />}
        contentContainerStyle={styles.scroll}
      >
        <Text style={styles.intro}>
          Challenges grouped by the values they build. Tap a category to manage.
        </Text>

        {categoryData.length === 0 ? (
          <View style={styles.empty}>
            <MaterialIcons name="auto-awesome" size={48} color={Colors.parentMuted} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyTitle}>No active challenges</Text>
            <Text style={styles.emptyMeta}>Create challenges to see them grouped by value here</Text>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => router.push('/(parent)/challenges/create')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="add" size={16} color={Colors.white} />
              <Text style={styles.createBtnText}>Create a Challenge</Text>
            </TouchableOpacity>
          </View>
        ) : (
          categoryData.map((item) => (
            <TouchableOpacity
              key={item.category}
              style={styles.card}
              onPress={() => router.push('/(parent)/challenges')}
              activeOpacity={0.7}
            >
              <View style={styles.cardTop}>
                <ItemGraphic
                  emoji={CATEGORY_EMOJI[item.category] ?? '🎯'}
                  size={24}
                  mode="parent"
                  style={{ marginRight: 12 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.catName}>
                    {item.category.charAt(0).toUpperCase() + item.category.slice(1).replace(/_/g, ' ')}
                  </Text>
                  <Text style={styles.catValue}>{CATEGORY_VALUES[item.category] ?? 'Family Values'}</Text>
                </View>
                <View style={styles.countBadge}>
                  <Text style={styles.countNum}>{item.challenges.length}</Text>
                  <Text style={styles.countLabel}>quests</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={Colors.parentMuted} />
              </View>
              {item.weekCount > 0 && (
                <View style={styles.weekRow}>
                  <MaterialIcons name="check-circle" size={14} color={Colors.parentAccent} />
                  <Text style={styles.weekText}>
                    {item.weekCount} completed this week · +{item.weekGems}💎
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
  safe:   { flex: 1, backgroundColor: Colors.parentBg },

  header: {
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.parentBorder,
    backgroundColor: Colors.parentCard,
  },
  headerEyebrow: { fontFamily: Fonts.bodyBold, fontSize: 9, color: Colors.parentMuted, letterSpacing: 2 },
  headerTitle:   { fontFamily: Fonts.parentH1, fontSize: 28, color: Colors.parentText },

  scroll: { padding: 16, paddingBottom: 40 },
  intro: {
    fontFamily: Fonts.body, fontSize: 13, color: Colors.parentMuted,
    lineHeight: 20, marginBottom: 16,
  },

  card: {
    backgroundColor: Colors.parentCard, borderRadius: 16, marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  catEmoji: { fontSize: 32 },
  catName:  { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.parentText },
  catValue: { fontFamily: Fonts.body, fontSize: 12, color: Colors.parentMuted, marginTop: 2 },
  countBadge: { alignItems: 'center', marginRight: 4 },
  countNum:   { fontFamily: Fonts.parentH1, fontSize: 22, color: Colors.parentAccent },
  countLabel: { fontFamily: Fonts.body, fontSize: 9, color: Colors.parentMuted, letterSpacing: 0.5 },

  weekRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.parentSecondary,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  weekText: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.parentSecText },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontFamily: Fonts.parentH1, fontSize: 20, color: Colors.parentText, marginBottom: 8 },
  emptyMeta:  { fontFamily: Fonts.body, fontSize: 14, color: Colors.parentMuted, textAlign: 'center', marginBottom: 24 },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.parentAccent, borderRadius: 9999,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  createBtnText: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.white },
});
