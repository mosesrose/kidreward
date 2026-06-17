import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, RefreshControl, SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Reward } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import AppHeader from '@/components/AppHeader';
import GemBadge from '@/components/GemBadge';
import { FALLBACK_ICON } from '@/constants/icons';

function typeLabel(t: string) {
  if (t === 'screen_time') return 'Screen Time';
  if (t === 'money')       return 'Money';
  if (t === 'activity')    return 'Activity';
  return 'Gift';
}

export default function ChildStore() {
  const { family, profile, membership, refreshFamily, signOut } = useAuth();
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

  const balance   = membership?.gem_balance ?? 0;
  const affordable = rewards.filter(r => balance >= r.gem_cost);
  const locked     = rewards.filter(r => balance < r.gem_cost);

  const sections = [
    ...(affordable.length ? [{ key: 'a', label: 'YOU CAN GET',  data: affordable }] : []),
    ...(locked.length     ? [{ key: 'l', label: 'KEEP SAVING',  data: locked     }] : []),
  ];

  const renderReward = (item: Reward) => {
    const canAfford    = balance >= item.gem_cost;
    const pending      = myRedemptions.has(item.id);
    const isConfirming = confirmId === item.id;
    const isRedeeming  = redeeming === item.id;
    const need         = item.gem_cost - balance;

    return (
      <View key={item.id} style={[styles.rewardCard, !canAfford && styles.rewardCardLocked]}>
        {/* Cost badge top-right */}
        <View style={styles.costBadge}>
          <Text style={styles.costText}>{item.gem_cost} 💎</Text>
        </View>

        {/* Icon circle */}
        <View style={[styles.rewardIconCircle, !canAfford && styles.rewardIconCircleLocked]}>
          <MaterialCommunityIcons
            name={(item.emoji || FALLBACK_ICON) as any}
            size={56}
            color={canAfford ? Colors.radiantAmber : Colors.onSurfaceVariant}
          />
        </View>

        <Text style={[styles.rewardTitle, !canAfford && styles.rewardTitleLocked]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.rewardType}>{typeLabel(item.reward_type)}</Text>

        {/* CTA area */}
        {pending ? (
          <View style={styles.pendingChip}>
            <Text style={styles.pendingChipText}>⏳ Waiting for parent</Text>
          </View>
        ) : isRedeeming ? (
          <Text style={styles.processingText}>Processing…</Text>
        ) : isConfirming ? (
          <View style={styles.confirmRow}>
            <TouchableOpacity style={styles.confirmBtn} onPress={() => confirmRedeem(item)}>
              <Text style={styles.confirmBtnText}>Yes, redeem!</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setConfirmId(null)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : canAfford ? (
          <TouchableOpacity style={styles.unlockBtn} onPress={() => setConfirmId(item.id)}>
            <Text style={styles.unlockBtnText}>Unlock Now!</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.needMoreBtn}>
            <Text style={styles.needMoreText}>Need {need} more 💎</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader mode="child" />

      {/* Hero row */}
      <View style={styles.heroRow}>
        <View style={styles.heroIcon}>
          <MaterialCommunityIcons name="star-four-points" size={80} color={Colors.radiantAmber} />
        </View>
        <Text style={styles.heroTitle}>Reward Shop</Text>
        <GemBadge gems={balance} />
      </View>

      <FlatList
        data={sections}
        keyExtractor={(s) => s.key}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
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
            {section.data.map(renderReward)}
          </>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },

  heroRow: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  heroIcon:  { marginBottom: 4 },
  heroTitle: { fontFamily: Fonts.kidsDisplay, fontSize: 32, color: Colors.primary },

  list: { padding: 20, paddingBottom: 40 },
  sectionLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    letterSpacing: 1.5,
    marginTop: 8,
    marginBottom: 12,
  },

  rewardCard: {
    backgroundColor: Colors.white,
    borderRadius: 40,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    position: 'relative',
    shadowColor: 'rgba(103,80,164,1)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 3,
  },
  rewardCardLocked: { opacity: 0.6 },

  costBadge: {
    position: 'absolute',
    top: 16, right: 16,
    backgroundColor: Colors.tertiaryFixed,
    borderRadius: 9999,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  costText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.onTertiaryFixed },

  rewardIconCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: Colors.tertiaryFixed,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  rewardIconCircleLocked: { backgroundColor: Colors.surfaceContainerHigh },

  rewardTitle: { fontFamily: Fonts.kidsH1, fontSize: 20, color: Colors.onSurface, textAlign: 'center', marginBottom: 4 },
  rewardTitleLocked: { color: Colors.onSurfaceVariant },
  rewardType: { fontFamily: Fonts.body, fontSize: 13, color: Colors.onSurfaceVariant, marginBottom: 16 },

  pendingChip: {
    backgroundColor: Colors.warningContainer,
    borderRadius: 9999,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  pendingChipText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.warning },
  processingText:  { fontFamily: Fonts.body, fontSize: 13, color: Colors.onSurfaceVariant },

  confirmRow:  { flexDirection: 'row', gap: 8, width: '100%' },
  confirmBtn: {
    flex: 1, backgroundColor: Colors.radiantAmber,
    borderRadius: 9999, paddingVertical: 12, alignItems: 'center',
  },
  confirmBtnText: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.onTertiaryFixed },
  cancelBtn: {
    flex: 1, borderRadius: 9999, paddingVertical: 12, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  cancelBtnText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.onSurfaceVariant },

  unlockBtn: {
    width: '100%', backgroundColor: Colors.primary,
    borderRadius: 9999, paddingVertical: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 0,
    elevation: 4,
  },
  unlockBtnText: { fontFamily: Fonts.bodyBold, fontSize: 16, color: Colors.white },

  needMoreBtn: {
    width: '100%', backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 9999, paddingVertical: 14, alignItems: 'center',
  },
  needMoreText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.onSurfaceVariant },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontFamily: Fonts.kidsH1, fontSize: 18, color: Colors.onSurface, marginBottom: 4 },
  emptyMeta:  { fontFamily: Fonts.body,   fontSize: 14, color: Colors.onSurfaceVariant },
});
