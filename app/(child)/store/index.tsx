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
  // confirmId = reward being confirmed; redeeming = currently processing payment
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState<string | null>(null);

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

  async function confirmRedeem(reward: Reward) {
    setRedeeming(reward.id);
    setConfirmId(null);
    try {
      const { error } = await supabase.rpc('spend_gems', {
        p_child_id: profile!.id,
        p_family_id: family!.id,
        p_gems: reward.gem_cost,
      });
      if (error) {
        Alert.alert('Error', error.message.includes('Insufficient') ? 'Not enough gems!' : error.message);
        setRedeeming(null);
        return;
      }
      await supabase.from('redemptions').insert({
        reward_id: reward.id,
        child_id: profile!.id,
        family_id: family!.id,
        gems_spent: reward.gem_cost,
        status: 'pending',
        requested_at: new Date().toISOString(),
      });
      await Promise.all([load(), refreshFamily()]);
      Alert.alert('🎉 Redeemed!', 'Your parent will see your request and confirm it soon!');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Something went wrong');
    } finally {
      setRedeeming(null);
    }
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
          const isConfirming = confirmId === item.id;
          const isRedeeming = redeeming === item.id;
          const colors = TYPE_COLORS[item.reward_type] ?? [Colors.purple, Colors.purpleLight];

          return (
            <View style={[styles.card, !canAfford && styles.cardDim]}>
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
                ) : isRedeeming ? (
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>⌛ Processing…</Text>
                  </View>
                ) : isConfirming ? (
                  <View style={styles.confirmRow}>
                    <TouchableOpacity style={styles.confirmBtn} onPress={() => confirmRedeem(item)}>
                      <Text style={styles.confirmBtnText}>✓ Yes!</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setConfirmId(null)}>
                      <Text style={styles.cancelBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : canAfford ? (
                  <TouchableOpacity style={styles.affordBadge} onPress={() => setConfirmId(item.id)}>
                    <Text style={styles.affordBadgeText}>Tap to redeem!</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.needText}>
                    Need {item.gem_cost - balance} more
                  </Text>
                )}
              </LinearGradient>
            </View>
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
  cardDim: { opacity: 0.65 },
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
  confirmRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  confirmBtn: {
    flex: 1, backgroundColor: 'rgba(0,200,83,0.35)',
    paddingVertical: 6, borderRadius: 8, alignItems: 'center',
  },
  confirmBtnText: { color: '#00C853', fontWeight: '800', fontSize: 12 },
  cancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignItems: 'center',
  },
  cancelBtnText: { color: 'rgba(255,255,255,0.7)', fontWeight: '800', fontSize: 12 },
});
