import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, SafeAreaView, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, FamilyMember } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';

export default function MyFamilyScreen() {
  const { family, profile } = useAuth();
  const [children, setChildren] = useState<FamilyMember[]>([]);
  const [coParents, setCoParents] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = family?.parent_id === profile?.id;

  const load = useCallback(async () => {
    if (!family) return;
    const { data } = await supabase
      .from('family_members')
      .select('*, profiles(*)')
      .eq('family_id', family.id);
    setChildren(data ?? []);

    const { data: cops } = await supabase
      .from('family_co_parents')
      .select('*, profiles(*)')
      .eq('family_id', family.id);
    setCoParents(cops ?? []);
  }, [family]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  async function removeChild(childId: string) {
    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('child_id', childId)
      .eq('family_id', family!.id);
    if (!error) await load();
  }

  async function removeCoParent(coParentId: string) {
    const { error } = await supabase
      .from('family_co_parents')
      .delete()
      .eq('co_parent_id', coParentId)
      .eq('family_id', family!.id);
    if (!error) await load();
  }

  function confirmRemoveChild(childName: string, childId: string) {
    Alert.alert(
      'Remove child?',
      `Remove ${childName} from your family? Their gem balance will be lost.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeChild(childId) },
      ]
    );
  }

  function confirmRemoveCoParent(name: string, coParentId: string) {
    Alert.alert(
      'Remove co-parent?',
      `Remove ${name} from your family? They will lose access.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeCoParent(coParentId) },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>My Family</Text>
      </View>

      <FlatList
        data={children}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <>
            <Text style={styles.sectionLabel}>KIDS</Text>
          </>
        }
        ListFooterComponent={
          <>
            {/* Invite a Child */}
            <TouchableOpacity
              style={styles.inviteBtn}
              onPress={() => router.push('/(parent)/children/invite')}
            >
              <Text style={styles.inviteBtnText}>+ Invite a Child</Text>
            </TouchableOpacity>

            {/* Co-Parents section */}
            <Text style={[styles.sectionLabel, { marginTop: 28 }]}>CO-PARENTS</Text>
            {coParents.map((cp) => {
              const p = (cp as any).profiles;
              return (
                <View key={cp.co_parent_id} style={styles.kidCard}>
                  <View style={styles.kidLeft}>
                    <Text style={styles.avatar}>{p?.avatar_emoji ?? '👤'}</Text>
                    <View>
                      <Text style={styles.kidName}>{p?.name}</Text>
                      <Text style={styles.kidJoined}>
                        Co-parent since {new Date(cp.joined_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  {isAdmin && (
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => confirmRemoveCoParent(p?.name ?? 'co-parent', cp.co_parent_id)}
                    >
                      <Text style={styles.removeBtnText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
            <TouchableOpacity
              style={styles.coParentBtn}
              onPress={() => router.push('/(parent)/children/invite')}
            >
              <Text style={styles.coParentBtnText}>+ Invite a Co-Parent</Text>
            </TouchableOpacity>
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No kids connected yet</Text>
            <Text style={styles.emptyMeta}>Tap "Invite a Child" below to get started</Text>
          </View>
        }
        renderItem={({ item }) => {
          const p = (item as any).profiles;
          const childId = (item as any).child_id;
          return (
            <View style={styles.kidCard}>
              <View style={styles.kidLeft}>
                <Text style={styles.avatar}>{p?.avatar_emoji ?? '🧒'}</Text>
                <View>
                  <Text style={styles.kidName}>{p?.name}</Text>
                  <Text style={styles.kidJoined}>
                    Joined {new Date(item.joined_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <View style={styles.kidStats}>
                <View style={styles.kidStat}>
                  <Text style={styles.kidStatNum}>{item.gem_balance}</Text>
                  <Text style={styles.kidStatLabel}>💎 Balance</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.kidStat}>
                  <Text style={styles.kidStatNum}>{item.total_gems_earned}</Text>
                  <Text style={styles.kidStatLabel}>🏆 Total</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => confirmRemoveChild(p?.name ?? 'child', childId)}
              >
                <Text style={styles.removeBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.surface },
  header: { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 16 },
  title:  { fontFamily: Fonts.parentH1, fontSize: 28, color: Colors.onSurface },
  list:   { padding: 20, paddingBottom: 40 },

  sectionLabel: {
    fontFamily: Fonts.bodyBold, fontSize: 11,
    color: Colors.onSurfaceVariant, letterSpacing: 1.5, marginBottom: 12,
  },

  kidCard: {
    backgroundColor: Colors.white, borderRadius: 12, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03, shadowRadius: 15, elevation: 1,
  },
  kidLeft:  { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  avatar:   { fontSize: 40 },
  kidName:  { fontFamily: Fonts.bodySemiBold, fontSize: 17, color: Colors.onSurface },
  kidJoined: { fontFamily: Fonts.body, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },
  kidStats:  { flexDirection: 'row', backgroundColor: Colors.surfaceContainerLow, borderRadius: 10, padding: 12 },
  kidStat:   { flex: 1, alignItems: 'center' },
  kidStatNum: { fontFamily: Fonts.parentH1, fontSize: 22, color: Colors.onSurface },
  kidStatLabel: { fontFamily: Fonts.body, fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.outlineVariant },

  empty:      { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontFamily: Fonts.parentH1, fontSize: 18, color: Colors.onSurface },
  emptyMeta:  { fontFamily: Fonts.body, fontSize: 14, color: Colors.onSurfaceVariant, marginTop: 4, textAlign: 'center' },

  inviteBtn: {
    marginTop: 12,
    backgroundColor: Colors.primary, borderRadius: 9999,
    paddingVertical: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 0, elevation: 4,
  },
  inviteBtnText: { fontFamily: Fonts.bodyBold, fontSize: 15, color: Colors.white },

  coParentBtn: {
    borderWidth: 1, borderColor: Colors.outlineVariant,
    borderRadius: 9999, paddingVertical: 14, alignItems: 'center',
  },
  coParentBtnText: { fontFamily: Fonts.body, fontSize: 15, color: Colors.onSurfaceVariant },

  removeBtn: {
    alignSelf: 'flex-end', marginTop: 8,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 9999, borderWidth: 1, borderColor: Colors.danger,
  },
  removeBtnText: {
    fontFamily: Fonts.body, fontSize: 12, color: Colors.danger,
  },
});
