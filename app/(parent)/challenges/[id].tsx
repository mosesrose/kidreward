import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase, Challenge, Completion } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { FALLBACK_ICON } from '@/constants/icons';
import { sendApprovalPush } from '@/lib/push-notifications';

export default function ChallengeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);
  const [familyChildren, setFamilyChildren] = useState<any[]>([]);
  const [editingAssignee, setEditingAssignee] = useState(false);

  useEffect(() => { load(); }, [id]);

  async function load() {
    setLoading(true);
    const [{ data: ch }, { data: comps }] = await Promise.all([
      supabase.from('challenges').select('*').eq('id', id).single(),
      supabase
        .from('completions')
        .select('*, profiles!completions_child_id_fkey(*)')
        .eq('challenge_id', id)
        .order('submitted_at', { ascending: false }),
    ]);
    setChallenge(ch);
    setCompletions(comps ?? []);
    // Load family children for assignee display
    if (ch?.family_id) {
      const { data: members } = await supabase
        .from('family_members')
        .select('*, profiles(*)')
        .eq('family_id', ch.family_id);
      setFamilyChildren(members ?? []);
    }
    setLoading(false);
  }

  async function approve(completion: Completion) {
    const gems = (challenge?.gem_reward ?? 0) + (challenge?.bonus_gems ?? 0);
    const { error } = await supabase
      .from('completions')
      .update({ status: 'approved', gems_awarded: gems, reviewed_at: new Date().toISOString() })
      .eq('id', completion.id);
    if (error) { Alert.alert('Error', error.message); return; }

    await supabase.rpc('award_gems', {
      p_child_id: completion.child_id,
      p_family_id: challenge?.family_id,
      p_gems: gems,
    });

    // Send push notification to child
    const childPushToken = (completion as any).profiles?.push_token;
    if (childPushToken) {
      sendApprovalPush({
        pushToken: childPushToken,
        parentName: profile?.name ?? 'Your parent',
        challengeTitle: challenge?.title ?? '',
        gems,
      });
    }

    load();
  }

  async function reject(completion: Completion) {
    const { error } = await supabase
      .from('completions')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', completion.id);
    if (error) { Alert.alert('Error', error.message); return; }
    load();
  }

  async function updateAssignee(childId: string | null) {
    await supabase.from('challenges').update({ child_id: childId }).eq('id', id);
    setEditingAssignee(false);
    load();
  }

  async function deleteChallenge() {
    Alert.alert('Delete challenge?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await supabase.from('challenges').delete().eq('id', id);
          router.replace('/(parent)/challenges');
        },
      },
    ]);
  }

  if (loading || !challenge) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.loading}>Loading…</Text>
      </SafeAreaView>
    );
  }

  const pending   = completions.filter(c => c.status === 'pending');
  const past      = completions.filter(c => c.status !== 'pending');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={Colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="delete-challenge-btn" onPress={deleteChallenge}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <View style={styles.heroCircle}>
          <MaterialCommunityIcons
            name={(challenge.emoji || FALLBACK_ICON) as any}
            size={40}
            color={Colors.primary}
          />
        </View>
        <Text style={styles.title}>{challenge.title}</Text>

        {/* Meta chips */}
        <View style={styles.chipsRow}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>
              {challenge.repeat_type === 'daily' ? 'Daily' :
               challenge.repeat_type === 'weekly' ? 'Weekly' : 'Once'}
            </Text>
          </View>
          <View style={styles.gemChip}>
            <Text style={styles.gemChipText}>💎 {challenge.gem_reward}</Text>
          </View>
        </View>

        {challenge.description ? (
          <Text style={styles.desc}>{challenge.description}</Text>
        ) : null}

        {/* Assigned to */}
        <View style={styles.assignSection}>
          <View style={styles.assignHeader}>
            <Text style={styles.sectionTitle}>ASSIGNED TO</Text>
            <TouchableOpacity onPress={() => setEditingAssignee(v => !v)}>
              <Text style={styles.editLink}>{editingAssignee ? 'Done' : 'Change'}</Text>
            </TouchableOpacity>
          </View>
          {!editingAssignee ? (
            <View style={styles.assignChipSingle}>
              <Text style={styles.assignChipText}>
                {(challenge as any).child_id
                  ? (familyChildren.find(m => m.child_id === (challenge as any).child_id) as any)?.profiles?.name ?? 'Specific child'
                  : '👨‍👩‍👧 All Kids'}
              </Text>
            </View>
          ) : (
            <View style={styles.assignRow}>
              <TouchableOpacity
                style={[styles.assignChip, (challenge as any).child_id === null && styles.assignChipActive]}
                onPress={() => updateAssignee(null)}
              >
                <Text style={[styles.assignChipText, (challenge as any).child_id === null && styles.assignChipTextActive]}>
                  👨‍👩‍👧 All Kids
                </Text>
              </TouchableOpacity>
              {familyChildren.map((m) => {
                const p = (m as any).profiles;
                const isSelected = (challenge as any).child_id === m.child_id;
                return (
                  <TouchableOpacity
                    key={m.child_id}
                    style={[styles.assignChip, isSelected && styles.assignChipActive]}
                    onPress={() => updateAssignee(isSelected ? null : m.child_id)}
                  >
                    <Text style={[styles.assignChipText, isSelected && styles.assignChipTextActive]}>
                      {p?.avatar_emoji ?? '🧒'} {p?.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Engagement stats */}
        {completions.length > 0 && (() => {
          const approved = completions.filter(c => c.status === 'approved');
          const byChild: Record<string, { name: string; avatar: string; count: number; gems: number }> = {};
          approved.forEach((c) => {
            const p = (c as any).profiles;
            const key = c.child_id;
            if (!byChild[key]) byChild[key] = { name: p?.name ?? '?', avatar: p?.avatar_emoji ?? '🧒', count: 0, gems: 0 };
            byChild[key].count++;
            byChild[key].gems += c.gems_awarded ?? 0;
          });
          const entries = Object.values(byChild);
          return (
            <>
              <Text style={styles.sectionTitle}>ENGAGEMENT</Text>
              <View style={styles.engagementCard}>
                <View style={styles.engagementRow}>
                  <Text style={styles.engagementBig}>{approved.length}</Text>
                  <Text style={styles.engagementLabel}>times completed</Text>
                  <Text style={styles.engagementBig} />
                  <Text style={styles.engagementBig}>
                    {approved.reduce((s, c) => s + (c.gems_awarded ?? 0), 0)}💎
                  </Text>
                  <Text style={styles.engagementLabel}>gems awarded</Text>
                </View>
                {entries.map((e) => (
                  <View key={e.name} style={styles.engagementChild}>
                    <Text style={styles.engagementAvatar}>{e.avatar}</Text>
                    <Text style={styles.engagementName}>{e.name}</Text>
                    <Text style={styles.engagementCount}>{e.count}×</Text>
                    <Text style={styles.engagementGems}>+{e.gems}💎</Text>
                  </View>
                ))}
              </View>
            </>
          );
        })()}

        {/* Pending submissions */}
        {pending.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Pending ({pending.length})</Text>
            {pending.map((c) => (
              <View key={c.id} style={styles.submissionCard}>
                <View style={styles.submissionTop}>
                  <Text style={styles.submissionAvatar}>
                    {(c as any).profiles?.avatar_emoji ?? '🧒'}
                  </Text>
                  <View style={styles.submissionInfo}>
                    <Text style={styles.submissionName}>{(c as any).profiles?.name}</Text>
                    <Text style={styles.submissionDate}>
                      {new Date(c.submitted_at).toLocaleDateString()}
                    </Text>
                    {c.note && <Text style={styles.submissionNote}>"{c.note}"</Text>}
                  </View>
                </View>
                <View style={styles.submissionBtns}>
                  <TouchableOpacity
                    testID={`reject-btn-${c.id}`}
                    style={styles.rejectBtn}
                    onPress={() => reject(c)}
                  >
                    <Text style={styles.rejectBtnText}>✗ Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID={`approve-btn-${c.id}`}
                    style={styles.approveBtn}
                    onPress={() => approve(c)}
                  >
                    <Text style={styles.approveBtnText}>✓ Approve +{challenge.gem_reward}💎</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Past submissions */}
        {past.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Past ({past.length})</Text>
            {past.map((c) => (
              <View key={c.id} style={styles.pastCard}>
                <Text style={styles.pastAvatar}>
                  {(c as any).profiles?.avatar_emoji ?? '🧒'}
                </Text>
                <Text style={styles.pastName}>{(c as any).profiles?.name}</Text>
                <View style={[
                  styles.statusPill,
                  c.status === 'approved' ? styles.pillGreen : styles.pillRed,
                ]}>
                  <Text style={[
                    styles.statusText,
                    c.status === 'approved' ? styles.statusGreen : styles.statusRed,
                  ]}>
                    {c.status}
                  </Text>
                </View>
                {c.status === 'approved' && c.gems_awarded ? (
                  <Text style={styles.awarded}>+{c.gems_awarded}💎</Text>
                ) : null}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.surface },
  loading: { padding: 40, textAlign: 'center', color: Colors.onSurfaceVariant },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 16, paddingHorizontal: 20, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant,
  },
  backBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText:   { fontFamily: Fonts.bodyBold, fontSize: 15, color: Colors.primary },
  deleteText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.error },
  scroll:     { padding: 20, paddingBottom: 40 },

  heroCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 16,
  },
  title: {
    fontFamily: Fonts.parentH1, fontSize: 24,
    color: Colors.onSurface, textAlign: 'center', marginBottom: 12,
  },
  chipsRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 16 },
  chip: {
    backgroundColor: Colors.primaryFixed, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  chipText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.primary },
  gemChip: {
    backgroundColor: Colors.tertiaryFixed, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  gemChipText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.onTertiaryFixed },
  desc: {
    fontFamily: Fonts.body, fontSize: 14,
    color: Colors.onSurfaceVariant, textAlign: 'center',
    lineHeight: 20, marginBottom: 20,
  },

  sectionTitle: {
    fontFamily: Fonts.bodyBold, fontSize: 11,
    color: Colors.onSurfaceVariant, letterSpacing: 1.5,
    marginBottom: 10, marginTop: 8,
  },

  submissionCard: {
    backgroundColor: Colors.white, borderRadius: 12,
    padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03, shadowRadius: 15, elevation: 1,
  },
  submissionTop:    { flexDirection: 'row', gap: 12, marginBottom: 12 },
  submissionAvatar: { fontSize: 28 },
  submissionInfo:   { flex: 1 },
  submissionName:   { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.onSurface },
  submissionDate:   { fontFamily: Fonts.body, fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },
  submissionNote:   { fontFamily: Fonts.body, fontSize: 12, color: Colors.onSurface, fontStyle: 'italic', marginTop: 4 },
  submissionBtns: { flexDirection: 'row', gap: 8 },
  rejectBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 9999,
    borderWidth: 1, borderColor: Colors.error, alignItems: 'center',
  },
  rejectBtnText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.error },
  approveBtn: {
    flex: 2, paddingVertical: 10, borderRadius: 9999,
    backgroundColor: Colors.success, alignItems: 'center',
  },
  approveBtnText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.white },

  pastCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.white, borderRadius: 10,
    padding: 12, marginBottom: 8,
  },
  pastAvatar:  { fontSize: 22 },
  pastName:    { flex: 1, fontFamily: Fonts.body, fontSize: 13, color: Colors.onSurface },
  statusPill:  { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  pillGreen:   { backgroundColor: Colors.successContainer },
  pillRed:     { backgroundColor: Colors.errorContainer },
  statusText:  { fontFamily: Fonts.bodyBold, fontSize: 11, textTransform: 'capitalize' },
  statusGreen: { color: Colors.success },
  statusRed:   { color: Colors.error },
  awarded:     { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.success },

  assignSection: { marginBottom: 16 },
  assignHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  editLink: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.primary },
  assignChipSingle: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryFixed, borderRadius: 9999,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  assignRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  assignChip: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 9999, borderWidth: 1.5, borderColor: Colors.outlineVariant,
    backgroundColor: Colors.white,
  },
  assignChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  assignChipText: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.onSurfaceVariant },
  assignChipTextActive: { color: Colors.white },

  engagementCard: {
    backgroundColor: Colors.white, borderRadius: 12, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03, shadowRadius: 15, elevation: 1,
  },
  engagementRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 12 },
  engagementBig: { fontFamily: Fonts.parentH1, fontSize: 22, color: Colors.primary },
  engagementLabel: { fontFamily: Fonts.body, fontSize: 12, color: Colors.onSurfaceVariant, marginRight: 8 },
  engagementChild: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.outlineVariant,
  },
  engagementAvatar: { fontSize: 20 },
  engagementName:   { flex: 1, fontFamily: Fonts.body, fontSize: 13, color: Colors.onSurface },
  engagementCount:  { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.onSurface },
  engagementGems:   { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.primary },
});
