import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Challenge } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { FALLBACK_ICON } from '@/constants/icons';

type ChallengeWithPending = Challenge & { pending_count: number };

export default function ChallengesScreen() {
  const { family } = useAuth();
  const [challenges, setChallenges] = useState<ChallengeWithPending[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!family) return;
    const { data: ch } = await supabase
      .from('challenges').select('*').eq('family_id', family.id)
      .neq('status', 'archived').order('created_at', { ascending: false });
    if (!ch) return;

    const { data: completions } = await supabase
      .from('completions').select('challenge_id').eq('status', 'pending')
      .in('challenge_id', ch.map((c: Challenge) => c.id));

    const map: Record<string, number> = {};
    completions?.forEach((c: { challenge_id: string }) => {
      map[c.challenge_id] = (map[c.challenge_id] ?? 0) + 1;
    });

    setChallenges(ch.map((c: Challenge) => ({ ...c, pending_count: map[c.id] ?? 0 })));
  }, [family]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Challenges</Text>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => router.push('/(parent)/challenges/create')}
        >
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={challenges}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No challenges yet</Text>
            <Text style={styles.emptyMeta}>Create your first challenge for your kids</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/(parent)/challenges/${item.id}`)}
          >
            <View style={styles.iconBox}>
              <MaterialCommunityIcons
                name={(item.emoji || FALLBACK_ICON) as any}
                size={26}
                color={Colors.primary}
              />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardMeta}>
                {item.repeat_type === 'daily' ? 'Daily' :
                 item.repeat_type === 'weekly' ? 'Weekly' : 'Once'}
              </Text>
            </View>
            <View style={styles.gemBadge}>
              <Text style={styles.gemBadgeText}>💎 {item.gem_reward}</Text>
            </View>
            {item.pending_count > 0 && (
              <View style={styles.pendingDot}>
                <Text style={styles.pendingDotText}>{item.pending_count}</Text>
              </View>
            )}
            <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.outline} />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 20, paddingHorizontal: 20, paddingBottom: 16,
  },
  title: { fontFamily: Fonts.parentH1, fontSize: 28, color: Colors.onSurface },
  newBtn: {
    backgroundColor: Colors.primary, borderRadius: 9999,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  newBtnText: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.white },
  list:  { padding: 20, gap: 10 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontFamily: Fonts.parentH1, fontSize: 20, color: Colors.onSurface },
  emptyMeta:  { fontFamily: Fonts.body,     fontSize: 14, color: Colors.onSurfaceVariant, marginTop: 6 },

  card: {
    backgroundColor: Colors.white, borderRadius: 12,
    padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03, shadowRadius: 15, elevation: 1,
  },
  iconBox: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center', justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.onSurface },
  cardMeta:  { fontFamily: Fonts.body,         fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },
  gemBadge: {
    backgroundColor: Colors.tertiaryFixed,
    borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4,
  },
  gemBadgeText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.onTertiaryFixed },
  pendingDot: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.warning, alignItems: 'center', justifyContent: 'center',
  },
  pendingDotText: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.white },
});
