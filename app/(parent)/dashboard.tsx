import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Completion, FamilyMember } from '@/lib/supabase';
import { Colors } from '@/constants/colors';

export default function ParentDashboard() {
  const { profile, family, signOut } = useAuth();
  const [children, setChildren] = useState<FamilyMember[]>([]);
  const [pendingCompletions, setPendingCompletions] = useState<Completion[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!family) return;

    const [{ data: members }, { data: completions }] = await Promise.all([
      supabase
        .from('family_members')
        .select('*, profiles(*)')
        .eq('family_id', family.id),
      supabase
        .from('completions')
        .select('*, challenges(*), profiles(*)')
        .eq('status', 'pending')
        .in(
          'challenge_id',
          (await supabase
            .from('challenges')
            .select('id')
            .eq('family_id', family.id)).data?.map((c: { id: string }) => c.id) ?? []
        )
        .order('submitted_at', { ascending: false })
        .limit(5),
    ]);

    setChildren(members ?? []);
    setPendingCompletions(completions ?? []);
  }, [family]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.childBg, Colors.childCard]}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Hello, {profile?.name}! 👋</Text>
            <Text style={styles.familyName}>{family?.name}</Text>
          </View>
          <TouchableOpacity onPress={signOut} style={styles.signOutBtn}>
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </View>

        {/* Quick stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{children.length}</Text>
            <Text style={styles.statLabel}>Kids</Text>
          </View>
          <View style={[styles.statCard, pendingCompletions.length > 0 && styles.statCardAlert]}>
            <Text style={styles.statNum}>{pendingCompletions.length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>
              {children.reduce((sum, m) => sum + m.gem_balance, 0)}
            </Text>
            <Text style={styles.statLabel}>💎 Total</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gem} />}
      >
        {/* Kids overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Kids</Text>
            <TouchableOpacity onPress={() => router.push('/(parent)/children/invite')}>
              <Text style={styles.sectionAction}>+ Invite</Text>
            </TouchableOpacity>
          </View>

          {children.length === 0 ? (
            <TouchableOpacity
              style={styles.emptyCard}
              onPress={() => router.push('/(parent)/children/invite')}
            >
              <Text style={styles.emptyEmoji}>👧</Text>
              <Text style={styles.emptyTitle}>No kids yet</Text>
              <Text style={styles.emptyDesc}>Invite your child to join your family</Text>
              <View style={styles.emptyBtn}>
                <Text style={styles.emptyBtnText}>Send Invite →</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childScroll}>
              {children.map((m) => (
                <View key={m.id} style={styles.childCard}>
                  <Text style={styles.childAvatar}>{(m as any).profiles?.avatar_emoji ?? '🧒'}</Text>
                  <Text style={styles.childName}>{(m as any).profiles?.name}</Text>
                  <View style={styles.gemRow}>
                    <Text style={styles.gemIcon}>💎</Text>
                    <Text style={styles.gemCount}>{m.gem_balance}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Pending approvals */}
        {pendingCompletions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>⏳ Needs Review</Text>
              <TouchableOpacity onPress={() => router.push('/(parent)/challenges/index')}>
                <Text style={styles.sectionAction}>See all</Text>
              </TouchableOpacity>
            </View>
            {pendingCompletions.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.pendingCard}
                onPress={() => router.push(`/(parent)/challenges/${c.challenge_id}`)}
              >
                <Text style={styles.pendingEmoji}>{(c as any).challenges?.emoji ?? '⭐'}</Text>
                <View style={styles.pendingInfo}>
                  <Text style={styles.pendingTitle}>{(c as any).challenges?.title}</Text>
                  <Text style={styles.pendingChild}>
                    by {(c as any).profiles?.name}
                  </Text>
                </View>
                <View style={styles.pendingGems}>
                  <Text style={styles.pendingGemsText}>
                    +{(c as any).challenges?.gem_reward} 💎
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {[
              { emoji: '📋', label: 'New Challenge', route: '/(parent)/challenges/create' },
              { emoji: '🎁', label: 'New Reward', route: '/(parent)/rewards/create' },
              { emoji: '📬', label: 'Invite Child', route: '/(parent)/children/invite' },
              { emoji: '🏆', label: 'Redemptions', route: '/(parent)/redemptions' },
            ].map((a) => (
              <TouchableOpacity
                key={a.label}
                style={styles.actionCard}
                onPress={() => router.push(a.route as any)}
              >
                <Text style={styles.actionEmoji}>{a.emoji}</Text>
                <Text style={styles.actionLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.parentBg },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting: { fontSize: 24, fontWeight: '800', color: Colors.textLight },
  familyName: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  signOutBtn: { padding: 8 },
  signOutText: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14, padding: 14, alignItems: 'center',
  },
  statCardAlert: { backgroundColor: 'rgba(255,145,0,0.2)', borderWidth: 1, borderColor: Colors.pending },
  statNum: { fontSize: 26, fontWeight: '900', color: Colors.textLight },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  scroll: { flex: 1 },
  section: { padding: 20, paddingBottom: 0 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.textDark },
  sectionAction: { color: Colors.purple, fontWeight: '700', fontSize: 14 },
  emptyCard: {
    backgroundColor: Colors.parentCard,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.parentBorder,
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textDark },
  emptyDesc: { fontSize: 14, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
  emptyBtn: {
    marginTop: 16, backgroundColor: Colors.purple,
    paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12,
  },
  emptyBtnText: { color: Colors.textLight, fontWeight: '700' },
  childScroll: { marginBottom: 20 },
  childCard: {
    backgroundColor: Colors.parentCard,
    borderRadius: 16, padding: 16,
    alignItems: 'center', marginRight: 12,
    width: 100, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  childAvatar: { fontSize: 36, marginBottom: 6 },
  childName: { fontSize: 13, fontWeight: '700', color: Colors.textDark, textAlign: 'center' },
  gemRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  gemIcon: { fontSize: 14 },
  gemCount: { fontSize: 14, fontWeight: '700', color: Colors.gemGlow },
  pendingCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.parentCard,
    borderRadius: 14, padding: 14, marginBottom: 10,
    borderLeftWidth: 4, borderLeftColor: Colors.pending,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  pendingEmoji: { fontSize: 28, marginRight: 12 },
  pendingInfo: { flex: 1 },
  pendingTitle: { fontSize: 15, fontWeight: '700', color: Colors.textDark },
  pendingChild: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  pendingGems: {
    backgroundColor: 'rgba(0,200,83,0.1)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  pendingGemsText: { color: Colors.success, fontWeight: '700', fontSize: 13 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 30 },
  actionCard: {
    width: '47%', backgroundColor: Colors.parentCard,
    borderRadius: 16, padding: 18, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  actionEmoji: { fontSize: 32, marginBottom: 8 },
  actionLabel: { fontSize: 13, fontWeight: '700', color: Colors.textDark, textAlign: 'center' },
});
