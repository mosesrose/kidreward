import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, RefreshControl, SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Reward } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import ItemGraphic from '@/components/ItemGraphic';
import { ChildSounds } from '@/lib/sounds';

const TYPE_LABEL: Record<string, string> = {
  screen_time: 'SCREEN TIME',
  money: 'MONEY',
  activity: 'ACTIVITY',
  gift: 'GIFT',
};

export default function ChildStore() {
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
        .from('rewards').select('*')
        .eq('family_id', family.id).eq('is_active', true)
        .order('gem_cost', { ascending: true }),
      supabase
        .from('redemptions').select('reward_id')
        .eq('child_id', profile.id).eq('status', 'pending'),
    ]);
    setRewards(rw ?? []);
    setMyRedemptions(new Set<string>(redemptions?.map((r: { reward_id: string }) => r.reward_id) ?? []));
  }, [family, profile]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

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
      ChildSounds.success();
      await supabase.from('redemptions').insert({
        reward_id: reward.id,
        child_id: profile!.id,
        family_id: family!.id,
        gems_spent: reward.gem_cost,
        status: 'pending',
        requested_at: new Date().toISOString(),
      });
      await Promise.all([load(), refreshFamily()]);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Something went wrong');
    } finally {
      setRedeeming(null);
    }
  }

  const balance    = membership?.gem_balance ?? 0;
  const affordable = rewards.filter(r => balance >= r.gem_cost);
  const locked     = rewards.filter(r => balance < r.gem_cost);

  const sections = [
    ...(affordable.length ? [{ key: 'a', label: 'UNLOCKABLE', data: affordable }] : []),
    ...(locked.length     ? [{ key: 'l', label: 'SAVING FOR',  data: locked }]     : []),
  ];

  function renderReward(item: Reward) {
    const canAfford    = balance >= item.gem_cost;
    const pending      = myRedemptions.has(item.id);
    const isConfirming = confirmId === item.id;
    const isRedeeming  = redeeming === item.id;
    const need         = item.gem_cost - balance;

    return (
      <View key={item.id} style={[styles.card, !canAfford && styles.cardLocked]}>
        {/* Icon + cost row */}
        <View style={styles.cardTop}>
          <ItemGraphic
            emoji={item.emoji}
            size={36}
            mode="child"
            color={canAfford ? Colors.kidAccent : Colors.kidMuted}
            style={!canAfford && { opacity: 0.5 }}
          />
          <View style={styles.costBadge}>
            <Text style={styles.costText}>{item.gem_cost} 💎</Text>
          </View>
        </View>

        <Text style={[styles.rewardTitle, !canAfford && styles.rewardTitleLocked]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.rewardType}>{TYPE_LABEL[item.reward_type] ?? 'GIFT'}</Text>

        {/* CTA */}
        {pending ? (
          <View style={styles.pendingChip}>
            <Text style={styles.pendingChipText}>⏳ WAITING FOR PARENT</Text>
          </View>
        ) : isRedeeming ? (
          <Text style={styles.processingText}>PROCESSING…</Text>
        ) : isConfirming ? (
          <View style={styles.confirmRow}>
            <TouchableOpacity style={styles.confirmBtn} onPress={() => confirmRedeem(item)}>
              <Text style={styles.confirmBtnText}>YES!</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setConfirmId(null)}>
              <Text style={styles.cancelBtnText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        ) : canAfford ? (
          <TouchableOpacity style={styles.unlockBtn} onPress={() => setConfirmId(item.id)}>
            <Text style={styles.unlockBtnText}>UNLOCK NOW!</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.needMoreBtn}>
            <Text style={styles.needMoreText}>NEED {need} MORE 💎</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>LOOT VAULT</Text>
          <Text style={styles.headerTitle}>APYX LEGEND</Text>
        </View>
        <View style={styles.balanceBadge}>
          <Text style={styles.balanceText}>{balance}</Text>
          <Text style={styles.balanceGem}>💎</Text>
        </View>
      </View>

      <FlatList
        data={sections}
        keyExtractor={s => s.key}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.kidGreen} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="inventory" size={48} color={Colors.kidMuted} />
            <Text style={styles.emptyTitle}>VAULT EMPTY</Text>
            <Text style={styles.emptyMeta}>Your parent hasn't added rewards yet</Text>
          </View>
        }
        renderItem={({ item: section }) => (
          <>
            <Text style={styles.sectionLabel}>{section.label}</Text>
            {section.data.map(renderReward)}
          </>
        )}
      />
    </SafeAreaView>
  );
}

const CARD_BASE = {
  borderWidth: 2,
  borderColor: Colors.kidBorder,
  borderRadius: 0,
  shadowColor: Colors.kidDark,
  shadowOffset: { width: 4, height: 4 },
  shadowOpacity: 1 as number,
  shadowRadius: 0,
  elevation: 4,
} as const;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.kidBg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 2, borderBottomColor: Colors.kidBorder,
    backgroundColor: Colors.kidBg,
  },
  headerEyebrow: { fontFamily: Fonts.bodyBold, fontSize: 9, color: Colors.kidMuted, letterSpacing: 2 },
  headerTitle:   { fontFamily: Fonts.kidsDisplay, fontSize: 22, color: Colors.kidAccent, fontStyle: 'italic' },
  balanceBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.kidCardHigh,
    borderWidth: 2, borderColor: Colors.kidBorder,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  balanceText: { fontFamily: Fonts.kidsH1, fontSize: 20, color: Colors.kidGreen },
  balanceGem:  { fontSize: 18 },

  list:         { padding: 16, paddingBottom: 40 },
  sectionLabel: {
    fontFamily: Fonts.bodyBold, fontSize: 9,
    color: Colors.kidMuted, letterSpacing: 2,
    marginTop: 12, marginBottom: 10,
  },

  card: {
    ...CARD_BASE,
    backgroundColor: Colors.kidCard,
    padding: 16, marginBottom: 12,
  },
  cardLocked: { opacity: 0.55 },

  cardTop: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  iconBox: {
    width: 64, height: 64,
    backgroundColor: Colors.kidBorder + '22',
    borderWidth: 1, borderColor: Colors.kidBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBoxLocked: { borderColor: Colors.kidMuted, backgroundColor: 'rgba(255,255,255,0.04)' },

  costBadge: {
    backgroundColor: Colors.kidCardHigh,
    borderWidth: 1, borderColor: Colors.kidAccent,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  costText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.kidAccent },

  rewardTitle:       { fontFamily: Fonts.kidsH1, fontSize: 18, color: Colors.kidText, marginBottom: 4 },
  rewardTitleLocked: { color: Colors.kidMuted },
  rewardType: {
    fontFamily: Fonts.bodyBold, fontSize: 9,
    color: Colors.kidMuted, letterSpacing: 1.5, marginBottom: 14,
  },

  pendingChip: {
    borderWidth: 2, borderColor: Colors.kidAccent,
    paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center',
  },
  pendingChipText: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.kidAccent, letterSpacing: 1 },
  processingText:  { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.kidMuted, textAlign: 'center', letterSpacing: 1 },

  confirmRow: { flexDirection: 'row', gap: 8 },
  confirmBtn: {
    flex: 1, backgroundColor: Colors.kidGreen,
    borderBottomWidth: 3, borderBottomColor: '#000',
    paddingVertical: 12, alignItems: 'center',
  },
  confirmBtnText: { fontFamily: Fonts.kidsH1, fontSize: 14, color: Colors.kidGreenText, fontStyle: 'italic' },
  cancelBtn: {
    flex: 1, borderWidth: 2, borderColor: Colors.kidBorder,
    paddingVertical: 12, alignItems: 'center',
  },
  cancelBtnText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.kidMuted },

  unlockBtn: {
    backgroundColor: Colors.kidGreen,
    borderBottomWidth: 4, borderBottomColor: '#000',
    paddingVertical: 14, alignItems: 'center',
  },
  unlockBtnText: { fontFamily: Fonts.kidsH1, fontSize: 15, color: Colors.kidGreenText, fontStyle: 'italic', letterSpacing: 1 },

  needMoreBtn: {
    backgroundColor: Colors.kidCardHigh,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 14, alignItems: 'center',
  },
  needMoreText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.kidMuted, letterSpacing: 1 },

  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontFamily: Fonts.kidsH1, fontSize: 16, color: Colors.kidText, letterSpacing: 1 },
  emptyMeta:  { fontFamily: Fonts.body,   fontSize: 13, color: Colors.kidMuted },
});
