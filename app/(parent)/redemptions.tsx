import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, RefreshControl, SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Redemption } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import ItemGraphic from '@/components/ItemGraphic';

const STATUS_CONFIG = {
  pending:   { label: 'PENDING',   bg: Colors.parentSecondary, text: Colors.parentSecText },
  fulfilled: { label: 'FULFILLED', bg: '#d4f7e1',              text: Colors.success },
  rejected:  { label: 'REJECTED',  bg: '#ffdad6',              text: Colors.error },
  consumed:  { label: 'CONSUMED',  bg: Colors.parentSurface,   text: Colors.parentMuted },
};

export default function RedemptionsScreen() {
  const { family } = useAuth();
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'fulfilled'>('all');

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
    Alert.alert('Reject redemption?', 'The gems will be refunded to the child.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('redemptions').update({ status: 'rejected' }).eq('id', r.id);
          if (error) { Alert.alert('Error', error.message); return; }
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

  const filtered = filter === 'all' ? redemptions
    : redemptions.filter(r => r.status === filter);

  const pendingCount = redemptions.filter(r => r.status === 'pending').length;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.parentText} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerEyebrow}>APYX LEGEND</Text>
          <Text style={styles.headerTitle}>Reward Vault</Text>
        </View>
        {pendingCount > 0 ? (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
          </View>
        ) : <View style={{ width: 40 }} />}
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(['all', 'pending', 'fulfilled'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, filter === tab && styles.filterTabActive]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.filterTabText, filter === tab && styles.filterTabTextActive]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={Colors.parentAccent} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="redeem" size={48} color={Colors.parentMuted} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No redemptions</Text>
            <Text style={styles.emptyMeta}>When your kids redeem gems, requests appear here</Text>
          </View>
        }
        renderItem={({ item }) => {
          const sc = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
          return (
            <View style={styles.card}>
              {/* Top row */}
              <View style={styles.cardTop}>
                <ItemGraphic
                  emoji={(item as any).rewards?.emoji}
                  size={28}
                  mode="parent"
                  style={{ marginRight: 12 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rewardTitle}>{(item as any).rewards?.title}</Text>
                  <Text style={styles.childName}>
                    {(item as any).profiles?.avatar_emoji} {(item as any).profiles?.name}
                  </Text>
                  <Text style={styles.date}>{new Date(item.requested_at).toLocaleDateString()}</Text>
                </View>
                <View style={styles.gemBadge}>
                  <Text style={styles.gemBadgeText}>{item.gems_spent}💎</Text>
                </View>
              </View>

              {/* Status + actions */}
              <View style={styles.cardBottom}>
                <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
                  <Text style={[styles.statusText, { color: sc.text }]}>{sc.label}</Text>
                </View>

                {item.status === 'pending' && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => reject(item)}>
                      <MaterialIcons name="cancel" size={14} color={Colors.error} />
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.fulfillBtn} onPress={() => fulfill(item)}>
                      <MaterialIcons name="check-circle" size={14} color={Colors.white} />
                      <Text style={styles.fulfillBtnText}>Mark Fulfilled</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.parentBg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.parentBorder,
    backgroundColor: Colors.parentCard,
  },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerEyebrow: { fontFamily: Fonts.bodyBold, fontSize: 9, color: Colors.parentMuted, letterSpacing: 2 },
  headerTitle:   { fontFamily: Fonts.parentH1, fontSize: 22, color: Colors.parentText },
  pendingBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.parentAccent, alignItems: 'center', justifyContent: 'center',
  },
  pendingBadgeText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.white },

  filterRow: {
    flexDirection: 'row', gap: 0,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.parentBorder,
    backgroundColor: Colors.parentCard,
  },
  filterTab: {
    flex: 1, paddingVertical: 8, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  filterTabActive:     { borderBottomColor: Colors.parentAccent },
  filterTabText:       { fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.parentMuted, letterSpacing: 1 },
  filterTabTextActive: { color: Colors.parentAccent },

  list: { padding: 16, paddingBottom: 40, gap: 12 },

  card: {
    backgroundColor: Colors.parentCard, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  cardTop:    { flexDirection: 'row', gap: 12, marginBottom: 12 },
  rewardIconBox: {
    width: 52, height: 52, borderRadius: 12,
    backgroundColor: Colors.parentSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  rewardTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.parentText },
  childName:   { fontFamily: Fonts.body, fontSize: 12, color: Colors.parentMuted, marginTop: 2 },
  date:        { fontFamily: Fonts.body, fontSize: 11, color: Colors.parentMuted, marginTop: 2 },
  gemBadge: {
    backgroundColor: Colors.parentSecondary, borderRadius: 9999,
    paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start',
  },
  gemBadgeText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.parentSecText },

  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9999 },
  statusText: { fontFamily: Fonts.bodyBold, fontSize: 9, letterSpacing: 1 },

  actionRow: { flex: 1, flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  rejectBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9999,
    borderWidth: 1, borderColor: Colors.error,
  },
  rejectBtnText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.error },
  fulfillBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9999,
    backgroundColor: Colors.parentAccent,
  },
  fulfillBtnText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.white },

  empty:      { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontFamily: Fonts.parentH1, fontSize: 18, color: Colors.parentText },
  emptyMeta:  { fontFamily: Fonts.body, fontSize: 14, color: Colors.parentMuted, marginTop: 6, textAlign: 'center' },
});
