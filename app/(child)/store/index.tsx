import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Reward } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import GemHeader from '@/components/GemHeader';
import { FALLBACK_ICON } from '@/constants/icons';

function typeLabel(t: string) {
  return t === 'screen_time' ? 'Screen time' : t === 'money' ? 'Money' : t === 'activity' ? 'Activity' : 'Gift';
}

export default function ChildRewards() {
  const { family, profile, membership, refreshFamily } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [myRedemptions, setMyRedemptions] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!family || !profile) return;
    const [{ data: rw }, { data: redemptions }] = await Promise.all([
      supabase.from('rewards').select('*').eq('family_id', family.id).eq('is_active', true).order('gem_cost', { ascending: true }),
      supabase.from('redemptions').select('reward_id').eq('child_id', profile.id).eq('status', 'pending'),
    ]);
    setRewards(rw ?? []);
    setMyRedemptions(new Set<string>(redemptions?.map((r: { reward_id: string }) => r.reward_id) ?? []));
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
      Alert.alert('Redeemed! 🎉', 'Your parent will see your request and confirm it soon.');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Something went wrong');
    } finally {
      setRedeeming(null);
    }
  }

  const balance = membership?.gem_balance ?? 0;
  const affordable = rewards.filter(r => balance >= r.gem_cost);
  const locked = rewards.filter(r => balance < r.gem_cost);
  const sections = [
    ...(affordable.length ? [{ key: 'a', label: 'YOU CAN GET', data: affordable }] : []),
    ...(locked.length    ? [{ key: 'l', label: 'KEEP SAVING',  data: locked    }] : []),
  ];

  const renderItem = (item: Reward) => {
    const canAfford = balance >= item.gem_cost;
    const pending = myRedemptions.has(item.id);
    const isConfirming = confirmId === item.id;
    const isRedeeming = redeeming === item.id;
    const need = item.gem_cost - balance;

    return (
      <View key={item.id} style={[styles.card, !canAfford && styles.cardLocked]}>
        <View style={styles.cardRow}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name={(item.emoji || FALLBACK_ICON) as any}
              size={28}
              color={canAfford ? Colors.childAccent : Colors.childMuted}
            />
          </View>
          <View style={styles.cardLeft}>
            <Text style={[styles.cardTitle, !canAfford && styles.dimText]} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.cardMeta}>{typeLabel(item.reward_type)}</Text>
          </View>
          <View style={[styles.costBadge, !canAfford && styles.costBadgeLocked]}>
            <Text style={[styles.costText, !canAfford && styles.costTextLocked]}>
              {item.gem_cost} 💎
            </Text>
          </View>
        </View>

        {!canAfford && (
          <View style={styles.lockRow}>
            <Text style={styles.lockText}>🔒 Need {need} more gems</Text>
          </View>
        )}

        {canAfford && (
          pending ? (
            <Text style={styles.statusText}>⏳ Waiting for parent</Text>
          ) : isRedeeming ? (
            <Text style={styles.statusText}>Processing…</Text>
          ) : isConfirming ? (
            <View style={styles.confirmRow}>
              <TouchableOpacity style={styles.confirmBtn} onPress={() => confirmRedeem(item)}>
                <Text style={styles.confirmBtnText}>Yes, redeem!</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setConfirmId(null)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.redeemBtn} onPress={() => setConfirmId(item.id)}>
              <Text style={styles.redeemBtnText}>Redeem 🎁</Text>
            </TouchableOpacity>
          )
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <GemHeader
        name={profile?.name ?? ''}
        gems={balance}
        lifetime={membership?.total_gems_earned ?? 0}
        compact
      />

      <View style={styles.body}>
        <Text style={styles.h1}>Treasure Chest</Text>
        <Text style={styles.h2}>{affordable.length} you can get</Text>

        <FlatList
          data={sections}
          keyExtractor={(s) => s.key}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.childAccent} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No rewards yet</Text>
              <Text style={styles.emptyMeta}>Your parent hasn't set up rewards yet</Text>
            </View>
          }
          renderItem={({ item: section }) => (
            <>
              <Text style={styles.sectionLabel}>{section.label}</Text>
              {section.data.map(renderItem)}
            </>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.childBg },
  body: { flex: 1, paddingHorizontal: 18, paddingTop: 20 },
  h1: { fontSize: 11, color: Colors.childMuted, letterSpacing: 2, fontWeight: '700', marginBottom: 2 },
  h2: { fontSize: 22, fontWeight: '800', color: Colors.childText, marginBottom: 18 },
  list: { paddingBottom: 30 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.childMuted,
    letterSpacing: 2, marginTop: 8, marginBottom: 10,
  },
  card: {
    backgroundColor: Colors.childCard, borderRadius: 16, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: Colors.childBorder,
  },
  cardLocked: { opacity: 0.65 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: `${Colors.childAccent}12`,
    alignItems: 'center', justifyContent: 'center',
  },
  cardLeft: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.childText, marginBottom: 2 },
  cardMeta: { fontSize: 11, color: Colors.childMuted },
  dimText: { color: Colors.childMuted },
  costBadge: {
    backgroundColor: `${Colors.childAccent}15`, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: `${Colors.childAccent}30`,
  },
  costBadgeLocked: { backgroundColor: `${Colors.childBorder}50`, borderColor: Colors.childBorder },
  costText: { color: Colors.childAccent, fontWeight: '800', fontSize: 13 },
  costTextLocked: { color: Colors.childMuted },
  lockRow: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.childBorder },
  lockText: { fontSize: 12, color: Colors.childMuted, fontWeight: '600' },
  statusText: { fontSize: 12, color: Colors.warning, fontWeight: '600', marginTop: 10 },
  redeemBtn: {
    marginTop: 10, backgroundColor: Colors.childAccent2,
    paddingVertical: 10, borderRadius: 100, alignItems: 'center',
  },
  redeemBtnText: { color: Colors.childText, fontSize: 13, fontWeight: '700' },
  confirmRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  confirmBtn: {
    flex: 1, backgroundColor: Colors.success,
    paddingVertical: 10, borderRadius: 100, alignItems: 'center',
  },
  confirmBtnText: { color: Colors.childText, fontWeight: '700', fontSize: 13 },
  cancelBtn: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.childBorder,
    borderRadius: 100, alignItems: 'center',
  },
  cancelBtnText: { color: Colors.childMuted, fontWeight: '500', fontSize: 13 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.childText, marginBottom: 4 },
  emptyMeta: { fontSize: 13, color: Colors.childMuted },
});
