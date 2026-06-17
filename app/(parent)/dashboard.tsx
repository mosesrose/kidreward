import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Completion, FamilyMember } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import ActivityFeed from '@/components/ActivityFeed';

export default function ParentDashboard() {
  const { profile, family, signOut } = useAuth();
  const [children, setChildren] = useState<FamilyMember[]>([]);
  const [pendingCompletions, setPendingCompletions] = useState<Completion[]>([]);
  const [weekCompleted, setWeekCompleted] = useState(0);
  const [weekGems, setWeekGems] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!family) return;

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const challengeIds = (await supabase
      .from('challenges')
      .select('id')
      .eq('family_id', family.id)).data?.map((c: { id: string }) => c.id) ?? [];

    const [{ data: members }, { data: pending }, { data: weekComps }] = await Promise.all([
      supabase
        .from('family_members')
        .select('*, profiles(*)')
        .eq('family_id', family.id),
      supabase
        .from('completions')
        .select('*, challenges(*), profiles!completions_child_id_fkey(*)')
        .eq('status', 'pending')
        .in('challenge_id', challengeIds)
        .order('submitted_at', { ascending: false })
        .limit(5),
      supabase
        .from('completions')
        .select('gems_awarded')
        .eq('status', 'approved')
        .gte('reviewed_at', weekAgo)
        .in('challenge_id', challengeIds),
    ]);

    setChildren(members ?? []);
    setPendingCompletions(pending ?? []);
    setWeekCompleted(weekComps?.length ?? 0);
    setWeekGems((weekComps ?? []).reduce((s, c: any) => s + (c.gems_awarded ?? 0), 0));
  }, [family]);

  // Tab screens stay mounted across navigation, so a plain useEffect-on-mount
  // would never re-run when coming back from approving/rejecting a
  // submission elsewhere. Refetch every time this tab regains focus instead.
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.name}>{profile?.name}</Text>
              <Text style={styles.familyName}>{family?.name}</Text>
            </View>
            <TouchableOpacity onPress={signOut} style={styles.signOutBtn}>
              <Text style={styles.signOutText}>Sign out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Family this week */}
        <View style={styles.section}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>FAMILY THIS WEEK</Text>
            <View style={styles.statsRow}>
              <View>
                <Text style={styles.statBig}>{weekCompleted}</Text>
                <Text style={styles.statMeta}>completed</Text>
              </View>
              <View>
                <Text style={[styles.statBig, { color: Colors.purple }]}>{pendingCompletions.length}</Text>
                <Text style={styles.statMeta}>to review</Text>
              </View>
              <View>
                <Text style={styles.statBig}>{weekGems}</Text>
                <Text style={styles.statMeta}>gems out</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Primary CTA — Review */}
        {pendingCompletions.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.primaryCta}
              onPress={() => router.push('/(parent)/challenges')}
            >
              <Text style={styles.primaryCtaText}>Review {pendingCompletions.length} submission{pendingCompletions.length === 1 ? '' : 's'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Activity feed */}
        {family && (
          <ActivityFeed familyId={family.id} />
        )}

        {/* Kids list */}
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardLabel}>KIDS</Text>
              <TouchableOpacity onPress={() => router.push('/(parent)/children/invite')}>
                <Text style={styles.linkAction}>+ Invite</Text>
              </TouchableOpacity>
            </View>

            {children.length === 0 ? (
              <TouchableOpacity
                style={styles.emptyKids}
                onPress={() => router.push('/(parent)/children/invite')}
              >
                <Text style={styles.emptyKidsTitle}>No kids yet</Text>
                <Text style={styles.emptyKidsMeta}>Send Invite →</Text>
              </TouchableOpacity>
            ) : (
              children.map((m, i) => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.kidRow, i < children.length - 1 && styles.kidRowBorder]}
                  onPress={() => router.push('/(parent)/children')}
                >
                  <Text style={styles.kidName}>{(m as any).profiles?.name ?? 'Child'}</Text>
                  <Text style={styles.kidGems}>{m.gem_balance} gems</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
          <View style={styles.actionsGrid}>
            {[
              { label: 'New challenge', route: '/(parent)/challenges/create' },
              { label: 'New reward', route: '/(parent)/rewards/create' },
              { label: 'Invite child', route: '/(parent)/children/invite' },
              { label: 'Redemptions', route: '/(parent)/redemptions' },
            ].map((a) => (
              <TouchableOpacity
                key={a.label}
                style={styles.actionCard}
                onPress={() => router.push(a.route as any)}
              >
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

  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 13, color: Colors.textMuted, marginBottom: 4 },
  name: { fontSize: 26, fontWeight: '700', color: Colors.textDark },
  familyName: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  signOutBtn: { padding: 8 },
  signOutText: { color: Colors.textMuted, fontSize: 13 },

  section: { paddingHorizontal: 20, paddingTop: 16 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.textMuted,
    letterSpacing: 2, marginBottom: 12,
  },

  card: {
    backgroundColor: Colors.parentCard,
    borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: Colors.parentBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  cardLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.textMuted,
    letterSpacing: 2, marginBottom: 14,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  linkAction: { color: Colors.purple, fontWeight: '600', fontSize: 13 },

  statsRow: { flexDirection: 'row', gap: 28 },
  statBig: { fontSize: 32, fontWeight: '700', color: Colors.textDark, lineHeight: 36 },
  statMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },

  primaryCta: {
    backgroundColor: Colors.purple,
    borderRadius: 14, padding: 16, alignItems: 'center',
  },
  primaryCtaText: { color: Colors.textLight, fontWeight: '600', fontSize: 15 },

  kidRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12,
  },
  kidRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.parentBorder },
  kidName: { fontSize: 15, fontWeight: '600', color: Colors.textDark },
  kidGems: { fontSize: 14, color: Colors.textMuted },

  emptyKids: { paddingVertical: 16, alignItems: 'center' },
  emptyKidsTitle: { fontSize: 15, fontWeight: '600', color: Colors.textDark, marginBottom: 4 },
  emptyKidsMeta: { fontSize: 13, color: Colors.purple, fontWeight: '600' },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 30 },
  actionCard: {
    flexBasis: '48%', flexGrow: 1,
    backgroundColor: Colors.parentCard,
    borderRadius: 14, padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.parentBorder,
  },
  actionLabel: { fontSize: 14, fontWeight: '600', color: Colors.textDark },
});
