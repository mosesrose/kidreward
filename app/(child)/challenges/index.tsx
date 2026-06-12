import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Challenge } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { CATEGORY_COLORS } from '@/constants/challenges';

export default function ChildChallenges() {
  const { family, profile } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

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
    const ids = new Set<string>(comps?.map((c: { challenge_id: string }) => c.challenge_id) ?? []);
    setCompletedIds(ids);
  }, [family, profile]);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⚔️ Missions</Text>
      </View>

      <FlatList
        data={challenges}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={Colors.gem} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎮</Text>
            <Text style={styles.emptyTitle}>No missions yet!</Text>
            <Text style={styles.emptyDesc}>Your parent will add challenges soon</Text>
          </View>
        }
        renderItem={({ item }) => {
          const done = completedIds.has(item.id);
          const catColor = CATEGORY_COLORS[item.category] ?? Colors.purple;
          return (
            <TouchableOpacity
              style={[styles.card, done && styles.cardDone]}
              onPress={() => router.push(`/(child)/challenges/${item.id}`)}
            >
              <View style={[styles.cardLeft, { backgroundColor: `${catColor}25` }]}>
                <Text style={styles.emoji}>{item.emoji}</Text>
              </View>
              <View style={styles.info}>
                <Text style={[styles.challengeTitle, done && styles.doneText]}>
                  {item.title}
                </Text>
                <View style={styles.metaRow}>
                  <View style={[styles.gemPill, { backgroundColor: `${catColor}20` }]}>
                    <Text style={[styles.gemPillText, { color: catColor }]}>
                      +{item.gem_reward} 💎
                    </Text>
                  </View>
                  {item.bonus_gems > 0 && (
                    <View style={styles.bonusPill}>
                      <Text style={styles.bonusPillText}>+{item.bonus_gems} 🌟</Text>
                    </View>
                  )}
                  <Text style={styles.repeatTag}>
                    {item.repeat_type === 'daily' ? '🔄 Daily' : item.repeat_type === 'weekly' ? '📆 Weekly' : '1️⃣'}
                  </Text>
                </View>
              </View>
              {done ? (
                <View style={styles.doneBadge}>
                  <Text style={styles.doneBadgeText}>✓</Text>
                </View>
              ) : (
                <View style={styles.arrow}>
                  <Text style={styles.arrowText}>→</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.childBg },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.textLight },
  list: { padding: 16, gap: 12, paddingBottom: 30 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: Colors.textLight },
  emptyDesc: { fontSize: 15, color: 'rgba(255,255,255,0.5)', marginTop: 6 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.childCard, borderRadius: 18, overflow: 'hidden', gap: 14,
  },
  cardDone: { opacity: 0.6 },
  cardLeft: {
    width: 72, height: 72, alignItems: 'center', justifyContent: 'center',
  },
  emoji: { fontSize: 32 },
  info: { flex: 1, paddingVertical: 14 },
  challengeTitle: { fontSize: 15, fontWeight: '700', color: Colors.textLight, marginBottom: 6 },
  doneText: { textDecorationLine: 'line-through', color: 'rgba(255,255,255,0.4)' },
  metaRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  gemPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  gemPillText: { fontSize: 12, fontWeight: '700' },
  bonusPill: {
    backgroundColor: 'rgba(255,215,0,0.15)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  bonusPillText: { color: Colors.childAccent2, fontSize: 12, fontWeight: '700' },
  repeatTag: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  doneBadge: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.childGreen,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  doneBadgeText: { color: Colors.textLight, fontWeight: '900', fontSize: 18 },
  arrow: { marginRight: 16 },
  arrowText: { color: 'rgba(255,255,255,0.3)', fontSize: 20 },
});
