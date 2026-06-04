import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, FamilyMember } from '@/lib/supabase';
import { Colors } from '@/constants/colors';

export default function ChildrenScreen() {
  const { family } = useAuth();
  const [children, setChildren] = useState<FamilyMember[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!family) return;
    const { data } = await supabase
      .from('family_members')
      .select('*, profiles(*)')
      .eq('family_id', family.id);
    setChildren(data ?? []);
  }, [family]);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Kids 👧</Text>
        <TouchableOpacity
          style={styles.inviteBtn}
          onPress={() => router.push('/(parent)/children/invite')}
        >
          <Text style={styles.inviteBtnText}>+ Invite</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={children}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>👨‍👩‍👧‍👦</Text>
            <Text style={styles.emptyTitle}>No kids connected yet</Text>
            <Text style={styles.emptyDesc}>
              Invite your children to join your family and start earning gems!
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push('/(parent)/children/invite')}
            >
              <Text style={styles.emptyBtnText}>Send Invite →</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const profile = (item as any).profiles;
          return (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <Text style={styles.avatar}>{profile?.avatar_emoji ?? '🧒'}</Text>
                <View>
                  <Text style={styles.name}>{profile?.name}</Text>
                  <Text style={styles.joined}>
                    Joined {new Date(item.joined_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <View style={styles.stats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{item.gem_balance}</Text>
                  <Text style={styles.statLabel}>💎 Balance</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{item.total_gems_earned}</Text>
                  <Text style={styles.statLabel}>🏆 Total</Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.parentBg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '900', color: Colors.textDark },
  inviteBtn: {
    backgroundColor: Colors.purple, paddingHorizontal: 16,
    paddingVertical: 8, borderRadius: 12,
  },
  inviteBtnText: { color: Colors.textLight, fontWeight: '700' },
  list: { padding: 16, gap: 12 },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: Colors.textDark, textAlign: 'center' },
  emptyDesc: { fontSize: 15, color: Colors.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  emptyBtn: {
    marginTop: 24, backgroundColor: Colors.purple,
    paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14,
  },
  emptyBtnText: { color: Colors.textLight, fontWeight: '700', fontSize: 16 },
  card: {
    backgroundColor: Colors.parentCard, borderRadius: 18,
    padding: 18, gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { fontSize: 44 },
  name: { fontSize: 18, fontWeight: '800', color: Colors.textDark },
  joined: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  stats: {
    flexDirection: 'row', backgroundColor: Colors.parentBg,
    borderRadius: 14, padding: 14,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '900', color: Colors.textDark },
  statLabel: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.parentBorder },
});
