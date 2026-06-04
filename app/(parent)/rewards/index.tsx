import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Reward } from '@/lib/supabase';
import { Colors } from '@/constants/colors';

const TYPE_COLORS: Record<string, string> = {
  money: '#00C853',
  gift: '#FF9FF3',
  screen_time: '#74C0FC',
  activity: '#FFA94D',
};

const TYPE_LABELS: Record<string, string> = {
  money: '💵 Money',
  gift: '🎁 Gift',
  screen_time: '📱 Screen Time',
  activity: '🎡 Activity',
};

export default function RewardsScreen() {
  const { family } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!family) return;
    const { data } = await supabase
      .from('rewards')
      .select('*')
      .eq('family_id', family.id)
      .order('gem_cost', { ascending: true });
    setRewards(data ?? []);
  }, [family]);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rewards 🎁</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/(parent)/rewards/create')}
        >
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={rewards}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎁</Text>
            <Text style={styles.emptyTitle}>No rewards yet</Text>
            <Text style={styles.emptyDesc}>
              Create rewards your kids can buy with their gems
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={[styles.typeBadge, { backgroundColor: `${TYPE_COLORS[item.reward_type]}20` }]}>
              <Text style={[styles.typeText, { color: TYPE_COLORS[item.reward_type] }]}>
                {TYPE_LABELS[item.reward_type]}
              </Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.rewardEmoji}>{item.emoji}</Text>
              <View style={styles.rewardInfo}>
                <Text style={styles.rewardTitle}>{item.title}</Text>
                {item.description && (
                  <Text style={styles.rewardDesc}>{item.description}</Text>
                )}
              </View>
              <View style={styles.costBadge}>
                <Text style={styles.costText}>{item.gem_cost} 💎</Text>
              </View>
            </View>
            {!item.is_active && (
              <Text style={styles.inactiveLabel}>Inactive</Text>
            )}
          </View>
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
  emptyDesc: { fontSize: 14, color: Colors.textMuted, marginTop: 6, textAlign: 'center', paddingHorizontal: 32 },
  card: {
    backgroundColor: Colors.parentCard, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  typeBadge: { paddingHorizontal: 12, paddingVertical: 6 },
  typeText: { fontSize: 12, fontWeight: '700' },
  cardBody: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  rewardEmoji: { fontSize: 32 },
  rewardInfo: { flex: 1 },
  rewardTitle: { fontSize: 16, fontWeight: '700', color: Colors.textDark },
  rewardDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 3 },
  costBadge: {
    backgroundColor: 'rgba(0,212,255,0.1)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
  },
  costText: { color: Colors.gemGlow, fontWeight: '800', fontSize: 14 },
  inactiveLabel: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 14, paddingVertical: 6,
    fontSize: 12, color: Colors.textMuted, fontWeight: '600',
  },
});
