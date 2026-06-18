import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Challenge } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import GemHeader from '@/components/GemHeader';
import { CHALLENGE_VALUES } from '@/constants/challenges';
import ItemIcon from '@/components/ItemIcon';

function ValueChip({ value }: { value: string | null | undefined }) {
  if (!value) return null;
  const v = CHALLENGE_VALUES.find(x => x.key === value);
  if (!v) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: `${v.color}30`, paddingHorizontal: 8, paddingVertical: 3,
      borderRadius: 20, marginTop: 4, alignSelf: 'flex-start' }}>
      <Text style={{ fontSize: 11 }}>{v.emoji}</Text>
      <Text style={{ fontSize: 11, fontWeight: '700', color: v.color }}>{v.label}</Text>
    </View>
  );
}

export default function ChildChallenges() {
  const { family, profile, membership } = useAuth();
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
    const ids = new Set<string>(comps?.map((c: { challenge_id: string }) => c.challenge_id) ?? []);
    setCompletedIds(ids);
  }, [family, profile]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const visible = challenges.filter(c =>
    filter === 'active' ? !completedIds.has(c.id) : completedIds.has(c.id)
  );
  const todoCount = challenges.filter(c => !completedIds.has(c.id)).length;

  return (
    <View style={styles.container}>
      <GemHeader
        name={profile?.name ?? ''}
        gems={membership?.gem_balance ?? 0}
        lifetime={membership?.total_gems_earned ?? 0}
        compact
      />

      <View style={styles.body}>
        <Text style={styles.h1}>Missions</Text>
        <Text style={styles.h2}>{todoCount} to do</Text>

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

        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
              tintColor={Colors.childAccent}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                {filter === 'active' ? 'No missions yet' : 'Nothing done yet'}
              </Text>
              <Text style={styles.emptyMeta}>
                {filter === 'active' ? 'Ask your parent to add one' : 'Complete a mission to see it here'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const done = completedIds.has(item.id);
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/(child)/challenges/${item.id}`)}
              >
                <View style={styles.iconWrap}>
                  <ItemIcon
                    emoji={item.emoji}
                    size={26}
                    color={done ? Colors.childMuted : Colors.childAccent}
                  />
                </View>
                <View style={styles.cardLeft}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.cardMeta}>
                    {item.repeat_type === 'daily' ? 'Daily' : item.repeat_type === 'weekly' ? 'Weekly' : 'Once'} · {capitalize(item.category)}
                  </Text>
                  <ValueChip value={(item as any).value} />
                </View>
                {done ? (
                  <Text style={styles.cardWaiting}>Waiting</Text>
                ) : (
                  <View style={styles.gemBadge}>
                    <Text style={styles.gemText}>+{item.gem_reward} 💎</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </View>
  );
}

function capitalize(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.childBg },
  body: { flex: 1, paddingHorizontal: 18, paddingTop: 20 },
  h1: { fontSize: 11, color: Colors.childMuted, letterSpacing: 2, fontWeight: '700', marginBottom: 2 },
  h2: { fontSize: 22, fontWeight: '800', color: Colors.childText, marginBottom: 18 },

  segmented: {
    flexDirection: 'row', backgroundColor: Colors.childCard,
    borderRadius: 100, padding: 4, marginBottom: 18,
    borderWidth: 1, borderColor: Colors.childBorder,
  },
  seg: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 100 },
  segOn: { backgroundColor: Colors.childBorder },
  segText: { fontSize: 12, color: Colors.childMuted, fontWeight: '500' },
  segTextOn: { color: Colors.childText, fontWeight: '700' },

  list: { paddingBottom: 30 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.childText, marginBottom: 4 },
  emptyMeta:  { fontSize: 13, color: Colors.childMuted },

  card: {
    backgroundColor: Colors.childCard,
    borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: Colors.childBorder,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: `${Colors.childAccent}10`,
    alignItems: 'center', justifyContent: 'center',
  },
  cardLeft: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.childText, marginBottom: 2 },
  cardMeta:  { fontSize: 11, color: Colors.childMuted },
  gemBadge: {
    backgroundColor: `${Colors.childAccent}15`,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: `${Colors.childAccent}30`,
  },
  gemText: { color: Colors.childAccent, fontWeight: '800', fontSize: 13 },
  cardWaiting: { fontSize: 12, fontWeight: '600', color: Colors.warning },
});
