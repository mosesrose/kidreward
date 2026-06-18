import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, SafeAreaView, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
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
    Alert.alert('Remove child?', `Remove ${childName} from your family? Their gem balance will be lost.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeChild(childId) },
    ]);
  }

  function confirmRemoveCoParent(name: string, coParentId: string) {
    Alert.alert('Remove co-parent?', `Remove ${name} from your family? They will lose access.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeCoParent(coParentId) },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>APYX LEGEND</Text>
        <Text style={styles.headerTitle}>My Family</Text>
      </View>

      <FlatList
        data={children}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.parentAccent} />}
        ListHeaderComponent={
          <Text style={styles.sectionLabel}>HEROES ({children.length})</Text>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="people-outline" size={48} color={Colors.parentMuted} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No heroes yet</Text>
            <Text style={styles.emptyMeta}>Invite your kids to get started</Text>
          </View>
        }
        ListFooterComponent={
          <>
            <TouchableOpacity
              style={styles.inviteBtn}
              onPress={() => router.push('/(parent)/children/invite')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="person-add" size={18} color={Colors.white} />
              <Text style={styles.inviteBtnText}>Invite a Child</Text>
            </TouchableOpacity>

            {/* Co-Parents */}
            <Text style={[styles.sectionLabel, { marginTop: 28 }]}>CO-PARENTS ({coParents.length})</Text>
            {coParents.map((cp) => {
              const p = (cp as any).profiles;
              return (
                <View key={cp.co_parent_id} style={styles.memberCard}>
                  <Text style={styles.avatar}>{p?.avatar_emoji ?? '👤'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>{p?.name}</Text>
                    <Text style={styles.memberMeta}>
                      Co-parent since {new Date(cp.joined_at).toLocaleDateString()}
                    </Text>
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
              style={styles.secondaryBtn}
              onPress={() => router.push('/(parent)/children/invite')}
            >
              <MaterialIcons name="group-add" size={16} color={Colors.parentAccent} />
              <Text style={styles.secondaryBtnText}>Invite a Co-Parent</Text>
            </TouchableOpacity>
          </>
        }
        renderItem={({ item }) => {
          const p = (item as any).profiles;
          const childId = (item as any).child_id;
          return (
            <View style={styles.kidCard}>
              <View style={styles.kidTop}>
                <Text style={styles.avatar}>{p?.avatar_emoji ?? '🧒'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{p?.name}</Text>
                  <Text style={styles.memberMeta}>
                    Joined {new Date(item.joined_at).toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => confirmRemoveChild(p?.name ?? 'child', childId)}
                >
                  <Text style={styles.removeBtnText}>Remove</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statNum}>{item.gem_balance}</Text>
                  <Text style={styles.statLabel}>💎 Balance</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statNum}>{item.total_gems_earned}</Text>
                  <Text style={styles.statLabel}>🏆 All-time</Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.parentBg },

  header: {
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.parentBorder,
    backgroundColor: Colors.parentCard,
  },
  headerEyebrow: { fontFamily: Fonts.bodyBold, fontSize: 9, color: Colors.parentMuted, letterSpacing: 2 },
  headerTitle:   { fontFamily: Fonts.parentH1, fontSize: 28, color: Colors.parentText },

  list: { padding: 16, paddingBottom: 40 },
  sectionLabel: {
    fontFamily: Fonts.bodyBold, fontSize: 10,
    color: Colors.parentMuted, letterSpacing: 1.5, marginBottom: 12,
  },

  kidCard: {
    backgroundColor: Colors.parentCard, borderRadius: 16, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  kidTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },

  memberCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.parentCard, borderRadius: 16, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  avatar:     { fontSize: 36 },
  memberName: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: Colors.parentText },
  memberMeta: { fontFamily: Fonts.body, fontSize: 12, color: Colors.parentMuted, marginTop: 2 },

  statsRow: {
    flexDirection: 'row', backgroundColor: Colors.parentSurface,
    borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: Colors.parentBorder,
  },
  stat:        { flex: 1, alignItems: 'center' },
  statNum:     { fontFamily: Fonts.parentH1, fontSize: 22, color: Colors.parentText },
  statLabel:   { fontFamily: Fonts.body, fontSize: 11, color: Colors.parentMuted, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.parentBorder },

  empty:      { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontFamily: Fonts.parentH1, fontSize: 18, color: Colors.parentText },
  emptyMeta:  { fontFamily: Fonts.body, fontSize: 14, color: Colors.parentMuted, marginTop: 4, textAlign: 'center' },

  inviteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.parentAccent, borderRadius: 9999,
    paddingVertical: 14, marginBottom: 8,
  },
  inviteBtnText: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.white },

  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: Colors.parentAccent,
    borderRadius: 9999, paddingVertical: 13, marginTop: 8,
  },
  secondaryBtnText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.parentAccent },

  removeBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 9999, borderWidth: 1, borderColor: Colors.error,
  },
  removeBtnText: { fontFamily: Fonts.body, fontSize: 12, color: Colors.error },
});
