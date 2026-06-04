import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Redemption } from '@/lib/supabase';
import { Colors } from '@/constants/colors';

export default function RedemptionsScreen() {
  const { family } = useAuth();
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!family) return;
    const { data } = await supabase
      .from('redemptions')
      .select('*, rewards(*), profiles(*)')
      .eq('family_id', family.id)
      .order('requested_at', { ascending: false });
    setRedemptions(data ?? []);
  }, [family]);

  useEffect(() => { load(); }, [load]);

  async function fulfill(r: Redemption) {
    const { error } = await supabase
      .from('redemptions')
      .update({ status: 'fulfilled', fulfilled_at: new Date().toISOString() })
      .eq('id', r.id);
    if (error) { Alert.alert('Error', error.message); return; }
    load();
  }

  async function reject(r: Redemption) {
    Alert.alert('Reject redemption?', 'The gems will be refunded.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive', onPress: async () => {
          const { error } = await supabase
            .from('redemptions')
            .update({ status: 'rejected' })
            .eq('id', r.id);
          if (error) { Alert.alert('Error', error.message); return; }
          // Refund gems
          await supabase.rpc('award_gems', {
            p_child_id: r.child_id,
            p_family_id: r.family_id,
            p_gems: r.gems_spent,
          });
          load();
        },
      },
    ]);
  }

  const statusColor = (s: string) =>
    s === 'fulfilled' ? Colors.success : s === 'rejected' ? Colors.danger : Colors.pending;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Redemptions 🏆</Text>
        <View style={{ width: 60 }} />
      </View>

      <FlatList
        data={redemptions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🏆</Text>
            <Text style={styles.emptyTitle}>No redemptions yet</Text>
            <Text style={styles.emptyDesc}>When your kids redeem gems, requests appear here</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.rewardEmoji}>{(item as any).rewards?.emoji ?? '🎁'}</Text>
              <View style={styles.cardInfo}>
                <Text style={styles.rewardTitle}>{(item as any).rewards?.title}</Text>
                <Text style={styles.childName}>
                  {(item as any).profiles?.avatar_emoji} {(item as any).profiles?.name}
                </Text>
                <Text style={styles.date}>
                  {new Date(item.requested_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.gemsSpent}>
                <Text style={styles.gemsSpentText}>-{item.gems_spent} 💎</Text>
              </View>
            </View>

            <View style={[styles.statusRow]}>
              <View style={[styles.statusPill, { backgroundColor: `${statusColor(item.status)}20` }]}>
                <Text style={[styles.statusText, { color: statusColor(item.status) }]}>
                  {item.status}
                </Text>
              </View>
            </View>

            {item.status === 'pending' && (
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => reject(item)}>
                  <Text style={styles.rejectText}>✗ Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.fulfillBtn} onPress={() => fulfill(item)}>
                  <Text style={styles.fulfillText}>✓ Mark Fulfilled</Text>
                </TouchableOpacity>
              </View>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.parentBorder,
  },
  back: { color: Colors.purple, fontSize: 16, fontWeight: '600', width: 60 },
  title: { fontSize: 20, fontWeight: '800', color: Colors.textDark },
  list: { padding: 16, gap: 12 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textDark },
  emptyDesc: { fontSize: 14, color: Colors.textMuted, marginTop: 6, textAlign: 'center' },
  card: {
    backgroundColor: Colors.parentCard, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  rewardEmoji: { fontSize: 36 },
  cardInfo: { flex: 1 },
  rewardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textDark },
  childName: { fontSize: 13, color: Colors.textMid, marginTop: 2 },
  date: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  gemsSpent: {
    backgroundColor: 'rgba(0,212,255,0.1)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  gemsSpentText: { color: Colors.gemGlow, fontWeight: '700', fontSize: 13 },
  statusRow: { marginBottom: 10 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  statusText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  actionRow: { flexDirection: 'row', gap: 10 },
  rejectBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.danger, alignItems: 'center',
  },
  rejectText: { color: Colors.danger, fontWeight: '700' },
  fulfillBtn: {
    flex: 2, paddingVertical: 10, borderRadius: 10,
    backgroundColor: Colors.success, alignItems: 'center',
  },
  fulfillText: { color: Colors.textLight, fontWeight: '700' },
});
