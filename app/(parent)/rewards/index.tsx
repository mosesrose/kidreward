import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Switch, SafeAreaView, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Reward } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import ItemIcon from '@/components/ItemIcon';

const TYPE_COLORS: Record<string, string> = {
  money:       '#00C853',
  gift:        '#FF9FF3',
  screen_time: '#74C0FC',
  activity:    '#FFA94D',
};

const TYPE_LABELS: Record<string, string> = {
  money:       'Money',
  gift:        'Gift',
  screen_time: 'Screen Time',
  activity:    'Activity',
};

export default function RewardsScreen() {
  const { family } = useAuth();
  const [rewards, setRewards]       = useState<Reward[]>([]);
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

  async function toggleActive(reward: Reward) {
    const next = !reward.is_active;
    setRewards(prev => prev.map(r => r.id === reward.id ? { ...r, is_active: next } : r));
    await supabase.from('rewards').update({ is_active: next }).eq('id', reward.id);
  }

  async function deleteReward(rewardId: string) {
    await supabase.from('rewards').delete().eq('id', rewardId);
    setRewards(prev => prev.filter(r => r.id !== rewardId));
  }

  function confirmDeleteReward(reward: Reward) {
    Alert.alert('Delete reward?', `Delete "${reward.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteReward(reward.id) },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>APYX LEGEND</Text>
          <Text style={styles.headerTitle}>Rewards</Text>
        </View>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => router.push('/(parent)/rewards/create')}
          activeOpacity={0.8}
        >
          <MaterialIcons name="add" size={16} color={Colors.white} />
          <Text style={styles.newBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={rewards}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={Colors.parentAccent} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="card-giftcard" size={48} color={Colors.parentMuted} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyTitle}>No rewards yet</Text>
            <Text style={styles.emptyMeta}>Create rewards your kids can buy with their gems</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, !item.is_active && styles.cardInactive]}>
            {/* Type strip */}
            <View style={[styles.typeBadge, { backgroundColor: TYPE_COLORS[item.reward_type] + '20' }]}>
              <Text style={[styles.typeText, { color: TYPE_COLORS[item.reward_type] }]}>
                {TYPE_LABELS[item.reward_type] ?? item.reward_type}
              </Text>
            </View>

            {/* Body */}
            <View style={styles.cardBody}>
              <View style={styles.iconBox}>
                <ItemIcon
                  emoji={item.emoji}
                  size={28}
                  color={item.is_active ? Colors.parentAccent : Colors.parentMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rewardTitle, !item.is_active && styles.dim]}>{item.title}</Text>
                {item.description ? (
                  <Text style={styles.rewardDesc}>{item.description}</Text>
                ) : null}
              </View>
              <View style={styles.costBadge}>
                <Text style={styles.costText}>{item.gem_cost}💎</Text>
              </View>
            </View>

            {/* Toggle row */}
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>
                {item.is_active ? 'Visible to kids' : 'Hidden from kids'}
              </Text>
              <View style={styles.toggleActions}>
                <TouchableOpacity onPress={() => confirmDeleteReward(item)} style={styles.trashBtn}>
                  <MaterialIcons name="delete-outline" size={18} color={Colors.error} />
                </TouchableOpacity>
                <Switch
                  value={item.is_active}
                  onValueChange={() => toggleActive(item)}
                  trackColor={{ false: Colors.parentBorder, true: Colors.parentAccent }}
                  thumbColor={Colors.white}
                />
              </View>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.parentBg },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
    backgroundColor: Colors.parentCard,
    borderBottomWidth: 1, borderBottomColor: Colors.parentBorder,
  },
  headerEyebrow: { fontFamily: Fonts.bodyBold, fontSize: 9, color: Colors.parentMuted, letterSpacing: 2 },
  headerTitle:   { fontFamily: Fonts.parentH1, fontSize: 28, color: Colors.parentText },
  newBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.parentAccent, borderRadius: 9999,
    paddingHorizontal: 16, paddingVertical: 9,
  },
  newBtnText: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.white },

  list:  { padding: 16, gap: 10, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontFamily: Fonts.parentH1, fontSize: 20, color: Colors.parentText, marginBottom: 8 },
  emptyMeta:  { fontFamily: Fonts.body, fontSize: 14, color: Colors.parentMuted, textAlign: 'center' },

  card: {
    backgroundColor: Colors.parentCard, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  cardInactive: { opacity: 0.55 },
  typeBadge: { paddingHorizontal: 14, paddingVertical: 7 },
  typeText:  { fontFamily: Fonts.bodyBold, fontSize: 11, letterSpacing: 0.5 },
  cardBody:  { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  iconBox: {
    width: 50, height: 50, borderRadius: 12,
    backgroundColor: Colors.parentSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  dim:         { opacity: 0.45 },
  rewardTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.parentText },
  rewardDesc:  { fontFamily: Fonts.body, fontSize: 12, color: Colors.parentMuted, marginTop: 3 },
  costBadge: {
    backgroundColor: Colors.parentSecondary, borderRadius: 9999,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  costText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.parentSecText },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: Colors.parentBorder,
  },
  toggleLabel:   { fontFamily: Fonts.body, fontSize: 13, color: Colors.parentMuted },
  toggleActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trashBtn:      { padding: 6 },
});
