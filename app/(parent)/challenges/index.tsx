import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Challenge, Completion } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { CATEGORY_COLORS } from '@/constants/challenges';

type ChallengeWithPending = Challenge & { pending_count: number };

export default function ChallengesScreen() {
  const { family } = useAuth();
  const [challenges, setChallenges] = useState<ChallengeWithPending[]>([]);
  const [pendingMap, setPendingMap] = useState<Record<string, number>>({});
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!family) return;
    const { data: ch } = await supabase
      .from('challenges')
      .select('*')
      .eq('family_id', family.id)
      .neq('status', 'archived')
      .order('created_at', { ascending: false });

    if (!ch) return;

    const { data: completions } = await supabase
      .from('completions')
      .select('challenge_id')
      .eq('status', 'pending')
      .in('challenge_id', ch.map((c) => c.id));

    const map: Record<string, number> = {};
    completions?.forEach((c) => {
      map[c.challenge_id] = (map[c.challenge_id] ?? 0) + 1;
    });

    setPendingMap(map);
    setChallenges(ch.map((c) => ({ ...c, pending_count: map[c.id] ?? 0 })));
  }, [family]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Challenges 📋</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/(parent)/challenges/create')}
        >
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={challenges}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>No challenges yet</Text>
            <Text style={styles.emptyDesc}>Create your first challenge for your kids</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/(parent)/challenges/${item.id}`)}
          >
            <View style={[styles.categoryBar, { backgroundColor: CATEGORY_COLORS[item.category] ?? Colors.purple }]} />
            <View style={styles.cardBody}>
              <View style={styles.cardTop}>
                <Text style={styles.cardEmoji}>{item.emoji}</Text>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardMeta}>
                    {item.repeat_type === 'daily' ? '🔄 Daily' :
                     item.repeat_type === 'weekly' ? '📆 Weekly' : '1️⃣ Once'}
                    {item.due_date ? `  •  Due ${item.due_date}` : ''}
                  </Text>
                </View>
                <View style={styles.gemBadge}>
                  <Text style={styles.gemText}>+{item.gem_reward}💎</Text>
                </View>
              </View>
              {item.pending_count > 0 && (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>
                    ⏳ {item.pending_count} waiting for review
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.parentBg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: Colors.parentBg,
  },
  title: { fontSize: 28, fontWeight: '900', color: Colors.textDark },
  addBtn: {
    backgroundColor: Colors.purple, paddingHorizontal: 16,
    paddingVertical: 8, borderRadius: 12,
  },
  addBtnText: { color: Colors.textLight, fontWeight: '700', fontSize: 15 },
  list: { padding: 16, gap: 12 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textDark },
  emptyDesc: { fontSize: 14, color: Colors.textMuted, marginTop: 6, textAlign: 'center' },
  card: {
    flexDirection: 'row', backgroundColor: Colors.parentCard,
    borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  categoryBar: { width: 5 },
  cardBody: { flex: 1, padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardEmoji: { fontSize: 28 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textDark },
  cardMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 3 },
  gemBadge: {
    backgroundColor: 'rgba(0,212,255,0.1)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  gemText: { color: Colors.gemGlow, fontWeight: '700', fontSize: 13 },
  pendingBadge: {
    marginTop: 10, backgroundColor: 'rgba(255,145,0,0.1)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  pendingBadgeText: { color: Colors.pending, fontWeight: '600', fontSize: 12 },
});
