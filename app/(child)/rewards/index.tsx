import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Reward } from '@/lib/supabase';
import { Colors } from '@/constants/colors';

const TYPE_COLORS: Record<string, [string, string]> = {
  money: ['#00C853', '#00A04A'],
  gift: ['#FF9FF3', '#E040FB'],
  screen_time: ['#74C0FC', '#339AF0'],
  activity: ['#FFA94D', '#FF6B00'],
};

export default function ChildRewards() {
  const { family, profile, membership, refreshFamily } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [myRedemptions, setMyRedemptions] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!family || !profile) return;
    const [{ data: rw }, { data: redemptions }] = await Promise.all([
      supabase
        .from('rewards')
        .select('*')
        .eq('family_id', family.id)
        .eq('is_active', true)
        .order('gem_cost', { ascending: true }),
      supabase
        .from('redemptions')
        .select('reward_id')
        .eq('child_id', profile.id)
        .eq('status', 'pending'),
    ]);
    setRewards(rw ?? []);
    setMyRedemptions(new Set(redemptions?.map((r) => r.reward_id) ?? []));
  }, [family, profile]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([load(), refreshFamily()]);
    setRefreshing(false);
  };

  async function redeem(reward: Reward) {
    const balance = membership?.gem_balance ?? 0;
    if (balance < reward.gem_cost) {
      Alert.alert(
        'Not enough gems! 💎',
        `You need ${reward.gem_cost} gems but only have ${balance}. Keep completing challenges!`
      );
      return;
    }

    Alert.alert(
      `Redeem ${reward.emoji} ${reward.title}?`,
      `This will cost ${reward.gem_cost} 💎. Your parent will need to confirm it.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem!', onPress: async () => {
            const { error } = await supabase.rpc('spend_gems', {
              p_child_id: profile!.id,
              p_family_id: family!.id,
              p_gems: reward.gem_cost,
            });
            if (error) {
              Alert.alert('Error', error.message.includes('Insufficient') ? 'Not enough gems!' : error.message);
              return;
            }
            await supabase.from('redemptions').insert({
              reward_id: reward.id,
              child_id: profile!.id,
              family_id: family!.id,
              gems_spent: reward.gem_cost,
            });
            await Promise.all([load(), refreshFamily()]);
            Alert.alert('🎉 Redeemed!', 'Your parent will see your request and confirm it soon!');
          },
        },
      ]
    );
  }

  const balance = membership?.gem_balance ?? 0;

  return (
    <View style={styles.container}>
      {/* Header with balance */}
      <LinearGradient
        colors={[Colors.childBg, Colors.childCard]}
        style={styles.header}
      >
        <Text style={styles.title}>🎁 Reward Store</Text>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceEmoji}>💎</Text>
          <Text style={styles.balanceNum}>{balance}</Text>
          <Text style={styles.balanceLabel}>gems to spend</Text>
        </View>
      </LinearGradient>

      <FlatList
        data={rewards}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        numColumns={2}
        columnWrapperStyle={styles.row}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gem} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🛒</Text>
            <Text style={styles.emptyTitle}>No rewards yet</Text>
            <Text style={styles.emptyDesc}>Your parent hasn't set up rewards yet</Text>
          </View>
        }
        renderItem={({ item }) => {
          const canAfford = balance >= item.gem_cost;
          const pending = myRedemptions.has(item.id);
          const colors = TYPE_COLORS[item.reward_type] ?? [Colors.purple, Colors.purpleLight];

          return (
            <TouchableOpacity
              style={[styles.card, !canAfford && styles.cardAffordable]}
              onPress={() => !pending && redeem(item)}
              disabled={pending}
            >
              <LinearGradient
                colors={canAfford ? colors : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <Text style={styles.rewardEmoji}>{item.emoji}</Text>
                <Text style={[styles.rewardTitle, !canAfford && styles.dimText]} numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={styles.costRow}>
                  <Text style={[styles.costText, !canAfford && styles.dimText]}>
                    {item.gem_cost} 💎
                  </Text>
                </View>

                {pending ? (
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>⏳ Pending</Text>
                  </View>
                ) : canAfford ? (
                  <View style={styles.affordBadge}>
                    <Text style={styles.affordBadgeText}>Tap to redeem!</Text>
                  </View>
                ) : (
                  <Text style={styles.needText}>
                    Need {item.gem_cost - balance} more
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.childBg },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 24 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.textLight, marginBottom: 16 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  balanceEmoji: { fontSize: 32 },
  balanceNum: { fontSize: 40, fontWeight: '900', color: Colors.gem },
  balanceLabel: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  list: { padding: 16, paddingBottom: 30 },
  row: { gap: 12, marginBottom: 12 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: Colors.textLight },
  emptyDesc: { fontSize: 15, color: 'rgba(255,255,255,0.5)', marginTop: 6 },
  card: { flex: 1, borderRadius: 20, overflow: 'hidden' },
  cardAffordable: { opacity: 0.65 },
  cardGradient: { padding: 16, minHeight: 160, borderRadius: 20, gap: 6 },
  rewardEmoji: { fontSize: 36, marginBottom: 4 },
  rewardTitle: { fontSize: 14, fontWeight: '700', color: Colors.textLight, lineHeight: 18 },
  dimText: { color: 'rgba(255,255,255,0.4)' },
  costRow: { marginTop: 4 },
  costText: { fontSize: 16, fontWeight: '900', color: Colors.textLight },
  pendingBadge: {
    marginTop: 8, backgroundColor: 'rgba(255,145,0,0.25)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start',
  },
  pendingBadgeText: { color: Colors.pending, fontSize: 11, fontWeight: '700' },
  affordBadge: {
    marginTop: 8, backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start',
  },
  affordBadgeText: { color: Colors.textLight, fontSize: 11, fontWeight: '700' },
  needText: { color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 8 },
});
