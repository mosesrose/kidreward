import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, RefreshControl,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Reward } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import GemHeader from '@/components/GemHeader';

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
      Alert.alert('Redeemed!', 'Your parent will see your request and confirm it soon.');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Something went wrong');
    } finally {
      setRedeeming(null);
    }
  }

  const balance = membership?.gem_balance ?? 0;
  const affordable = rewards.filter(r => balance >= r.gem_cost);
  const locked = rewards.filter(r => balance < r.gem_cost);

  const sections: Array<{ key: string; label: string; data: Reward[] }> = [];
  if (affordable.length) sections.push({ key: 'a', label: 'YOU CAN GET', data: affordable });
  if (locked.length) sections.push({ key: 'l', label: 'KEEP SAVING', data: locked });

  const renderItem = (item: Reward) => {
    const canAfford = balance >= item.gem_cost;
    const pending = myRedemptions.has(item.id);
    const isConfirming = confirmId === item.id;
    const isRedeeming = redeeming === item.id;
    const progress = canAfford ? 1 : balance / item.gem_cost;

    return (
      <View key={item.id} style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.cardLeft}>
            <Text style={[styles.cardTitle, !canAfford && styles.dimText]} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.cardMeta}>{typeLabel(item.reward_type)}</Text>
          </View>
          <Text style={[styles.cardPoints, !canAfford && styles.dimPoints]}>{item.gem_cost} 💎</Text>
        </View>

        {!canAfford && (
          <>
            <View style={styles.progress}>
              <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
            </View>
            <Text style={styles.needText}>{item.gem_cost - balance} more to go</Text>
          </>
        )}

        {pending ? (
          <Text style={styles.statusText}>Waiting for parent</Text>
        ) : isRedeeming ? (
          <Text style={styles.statusText}>Processing…</Text>
        ) : isConfirming ? (
          <View style={styles.confirmRow}>
            <TouchableOpacity style={styles.confirmBtn} onPress={() => confirmRedeem(item)}>
              <Text style={styles.confirmBtnText}>Yes, redeem</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setConfirmId(null)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : canAfford ? (
          <TouchableOpacity style={styles.tapBtn} onPress={() => setConfirmId(item.id)}>
            <Text style={styles.tapBtnText}>Tap to redeem!</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <GemHeader name={profile?.name ?? ''} gems={balance} compact />

      <View style={styles.body}>
        <Text style={styles.h1}>Store</Text>
        <Text style={styles.h2}>
          {affordable.length} you can get
        </Text>

        <FlatList
          data={sections}
          keyExtractor={(s) => s.key}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.childAccent} />}
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
  h1: { fontSize: 13, color: Colors.textMuted, marginBottom: 2 },
  h2: { fontSize: 22, fontWeight: '700', color: Colors.textDark, marginBottom: 18 },

  list: { paddingBottom: 30 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.textMuted,
    letterSpacing: 2, marginTop: 6, marginBottom: 10,
  },

  card: {
    backgroundColor: Colors.childCard,
    borderRadius: 16, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  cardLeft: { flex: 1, paddingRight: 12 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: Colors.textDark, marginBottom: 4 },
  cardMeta: { fontSize: 12, color: Colors.textMuted },
  cardPoints: { fontSize: 14, fontWeight: '700', color: Colors.childAccent },
  dimText: { color: Colors.textMid },
  dimPoints: { color: Colors.textMuted },

  progress: {
    height: 6, backgroundColor: Colors.border, borderRadius: 100,
    overflow: 'hidden', marginTop: 10, marginBottom: 6,
  },
  progressFill: { height: '100%', backgroundColor: Colors.childAccent },
  needText: { fontSize: 12, color: Colors.textMuted },

  statusText: { fontSize: 12, color: Colors.warning, fontWeight: '600', marginTop: 10 },

  tapBtn: {
    marginTop: 10, backgroundColor: Colors.childAccent,
    paddingVertical: 10, borderRadius: 100, alignItems: 'center',
  },
  tapBtnText: { color: Colors.textLight, fontSize: 13, fontWeight: '600' },

  confirmRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  confirmBtn: {
    flex: 1, backgroundColor: Colors.success,
    paddingVertical: 10, borderRadius: 100, alignItems: 'center',
  },
  confirmBtnText: { color: Colors.textLight, fontWeight: '600', fontSize: 13 },
  cancelBtn: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 100, alignItems: 'center',
  },
  cancelBtnText: { color: Colors.textMid, fontWeight: '500', fontSize: 13 },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.textDark, marginBottom: 4 },
  emptyMeta: { fontSize: 13, color: Colors.textMuted },
});
