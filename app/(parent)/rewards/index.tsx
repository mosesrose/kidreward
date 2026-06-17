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
import { FALLBACK_ICON } from '@/constants/icons';

const TYPE_COLORS: Record<string, string> = {
  money: '#00C853',
  gift: '#FF9FF3',
  screen_time: '#74C0FC',
  activity: '#FFA94D',
};

const TYPE_LABELS: Record<string, string> = {
  money:       'Money',
  gift:        'Gift',
  screen_time: 'Screen Time',
  activity:    'Activity',
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
    Alert.alert(
      'Delete reward?',
      `Delete "${reward.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteReward(reward.id) },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Rewards</Text>
        <TouchableOpacity style={styles.newBtn} onPress={() => router.push('/(parent)/rewards/create')}>
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={rewards}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No rewards yet</Text>
            <Text style={styles.emptyMeta}>Create rewards your kids can buy with their gems</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, !item.is_active && styles.cardInactive]}>
            {/* Type badge strip */}
            <View style={[styles.typeBadge, { backgroundColor: TYPE_COLORS[item.reward_type] + '20' }]}>
              <Text style={[styles.typeText, { color: TYPE_COLORS[item.reward_type] }]}>
                {TYPE_LABELS[item.reward_type]}
              </Text>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.iconBox}>
                <MaterialIcons
                  name={(item.emoji || FALLBACK_ICON) as any}
                  size={28}
                  color={item.is_active ? Colors.primary : Colors.onSurfaceVariant}
                />
              </View>
              <View style={styles.rewardInfo}>
                <Text style={[styles.rewardTitle, !item.is_active && styles.dim]}>{item.title}</Text>
                {item.description ? (
                  <Text style={styles.rewardDesc}>{item.description}</Text>
                ) : null}
              </View>
              <View style={styles.costBadge}>
                <Text style={styles.costText}>{item.gem_cost} 💎</Text>
              </View>
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>
                {item.is_active ? 'Visible to kids' : 'Hidden from kids'}
              </Text>
              <View style={styles.toggleActions}>
                <TouchableOpacity onPress={() => confirmDeleteReward(item)} style={styles.trashBtn}>
                  <MaterialIcons name="delete-outline" size={18} color={Colors.danger} />
                </TouchableOpacity>
                <Switch
                  value={item.is_active}
                  onValueChange={() => toggleActive(item)}
                  trackColor={{ false: Colors.outlineVariant, true: Colors.primary }}
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
  safe:   { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 20, paddingHorizontal: 20, paddingBottom: 16,
  },
  title:      { fontFamily: Fonts.parentH1, fontSize: 28, color: Colors.onSurface },
  newBtn:     { backgroundColor: Colors.primary, borderRadius: 9999, paddingHorizontal: 16, paddingVertical: 8 },
  newBtnText: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.white },
  list:  { padding: 20, gap: 12, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontFamily: Fonts.parentH1, fontSize: 20, color: Colors.onSurface },
  emptyMeta:  { fontFamily: Fonts.body,     fontSize: 14, color: Colors.onSurfaceVariant, marginTop: 6, textAlign: 'center' },

  card: {
    backgroundColor: Colors.white, borderRadius: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03, shadowRadius: 15, elevation: 1,
  },
  cardInactive: { opacity: 0.6 },
  typeBadge: { paddingHorizontal: 12, paddingVertical: 6 },
  typeText:  { fontFamily: Fonts.bodyBold, fontSize: 12 },
  cardBody:  { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  iconBox: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center', justifyContent: 'center',
  },
  dim:         { opacity: 0.45 },
  rewardInfo:  { flex: 1 },
  rewardTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.onSurface },
  rewardDesc:  { fontFamily: Fonts.body, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 3 },
  costBadge: {
    backgroundColor: Colors.tertiaryFixed, borderRadius: 9999,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  costText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.onTertiaryFixed },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: Colors.outlineVariant,
  },
  toggleLabel: { fontFamily: Fonts.body, fontSize: 13, color: Colors.onSurfaceVariant },
  toggleActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trashBtn: { padding: 6 },
});
