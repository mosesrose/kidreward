import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase, Challenge, Completion } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import ItemIcon from '@/components/ItemIcon';
import { sendApprovalPush } from '@/lib/push-notifications';
import { ParentSounds } from '@/lib/sounds';

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
    ParentSounds.approval();
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
    await supabase.rpc('update_streak', { p_child_id: completion.child_id });
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
    ParentSounds.reject();
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
    Alert.alert('Delete quest?', 'This cannot be undone.', [
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

  const pending = completions.filter(c => c.status === 'pending');
  const past    = completions.filter(c => c.status !== 'pending');

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.parentText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Quest Detail</Text>
        <TouchableOpacity testID="delete-challenge-btn" onPress={deleteChallenge} style={styles.deleteBtn}>
          <MaterialIcons name="delete-outline" size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Quest card */}
        <View style={styles.questCard}>
          <View style={styles.questIconRow}>
            <View style={styles.questIconBox}>
              <ItemIcon emoji={challenge.emoji} size={36} color={Colors.parentAccent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.questTitle}>{challenge.title}</Text>
              <View style={styles.chipsRow}>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>
                    {challenge.repeat_type === 'daily' ? 'DAILY' :
                     challenge.repeat_type === 'weekly' ? 'WEEKLY' : 'ONCE'}
                  </Text>
                </View>
                <View style={styles.gemChip}>
                  <Text style={styles.gemChipText}>💎 {challenge.gem_reward}</Text>
                </View>
              </View>
            </View>
          </View>
          {challenge.description ? (
            <Text style={styles.desc}>{challenge.description}</Text>
          ) : null}
        </View>

        {/* Assigned to */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardLabel}>ASSIGNED TO</Text>
            <TouchableOpacity onPress={() => setEditingAssignee(v => !v)}>
              <Text style={styles.editLink}>{editingAssignee ? 'Done' : 'Change'}</Text>
            </TouchableOpacity>
          </View>
          {!editingAssignee ? (
            <View style={styles.assignPill}>
              <Text style={styles.assignPillText}>
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
            <View style={styles.card}>
              <Text style={styles.cardLabel}>ENGAGEMENT</Text>
              <View style={styles.engRow}>
                <View style={styles.engStat}>
                  <Text style={styles.engNum}>{approved.length}</Text>
                  <Text style={styles.engMeta}>completions</Text>
                </View>
                <View style={styles.engDivider} />
                <View style={styles.engStat}>
                  <Text style={[styles.engNum, { color: Colors.parentAccent }]}>
                    {approved.reduce((s, c) => s + (c.gems_awarded ?? 0), 0)}💎
                  </Text>
                  <Text style={styles.engMeta}>gems awarded</Text>
                </View>
              </View>
              {entries.map((e) => (
                <View key={e.name} style={styles.engChild}>
                  <Text style={styles.engAvatar}>{e.avatar}</Text>
                  <Text style={styles.engName}>{e.name}</Text>
                  <Text style={styles.engCount}>{e.count}×</Text>
                  <Text style={styles.engGems}>+{e.gems}💎</Text>
                </View>
              ))}
            </View>
          );
        })()}

        {/* Pending submissions */}
        {pending.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>PENDING REVIEW ({pending.length})</Text>
            {pending.map((c) => (
              <View key={c.id} style={[styles.card, styles.pendingCard]}>
                <View style={styles.subTop}>
                  <Text style={styles.subAvatar}>{(c as any).profiles?.avatar_emoji ?? '🧒'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subName}>{(c as any).profiles?.name}</Text>
                    <Text style={styles.subDate}>{new Date(c.submitted_at).toLocaleDateString()}</Text>
                    {c.note ? <Text style={styles.subNote}>"{c.note}"</Text> : null}
                  </View>
                </View>
                <View style={styles.subBtns}>
                  <TouchableOpacity
                    testID={`reject-btn-${c.id}`}
                    style={styles.rejectBtn}
                    onPress={() => reject(c)}
                  >
                    <MaterialIcons name="cancel" size={16} color={Colors.error} />
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID={`approve-btn-${c.id}`}
                    style={styles.approveBtn}
                    onPress={() => approve(c)}
                  >
                    <MaterialIcons name="check-circle" size={16} color={Colors.white} />
                    <Text style={styles.approveBtnText}>Approve +{challenge.gem_reward}💎</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Past submissions */}
        {past.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 8 }]}>HISTORY ({past.length})</Text>
            {past.map((c) => (
              <View key={c.id} style={styles.pastCard}>
                <Text style={styles.pastAvatar}>{(c as any).profiles?.avatar_emoji ?? '🧒'}</Text>
                <Text style={styles.pastName}>{(c as any).profiles?.name}</Text>
                <Text style={styles.pastDate}>{new Date(c.submitted_at).toLocaleDateString()}</Text>
                <View style={[
                  styles.statusPill,
                  c.status === 'approved' ? styles.pillGreen : styles.pillRed,
                ]}>
                  <Text style={[styles.statusText, c.status === 'approved' ? styles.statusGreen : styles.statusRed]}>
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

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.parentBg },
  loading: { padding: 40, textAlign: 'center', color: Colors.parentMuted },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.parentBorder,
    backgroundColor: Colors.parentCard,
  },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontFamily: Fonts.parentH1, fontSize: 18, color: Colors.parentText, textAlign: 'center' },
  deleteBtn:   { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  scroll: { padding: 16, gap: 12 },

  questCard: {
    backgroundColor: Colors.parentCard, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  questIconRow: { flexDirection: 'row', gap: 14, marginBottom: 10 },
  questIconBox: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: Colors.parentSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  questTitle: { fontFamily: Fonts.parentH1, fontSize: 20, color: Colors.parentText, marginBottom: 8 },
  chipsRow:   { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    backgroundColor: Colors.parentSurface, borderRadius: 9999,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.parentBorder,
  },
  chipText: { fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.parentMuted, letterSpacing: 1 },
  gemChip: {
    backgroundColor: Colors.parentSecondary, borderRadius: 9999,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  gemChipText: { fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.parentSecText },
  desc: { fontFamily: Fonts.body, fontSize: 14, color: Colors.parentMuted, lineHeight: 20, marginTop: 4 },

  card: {
    backgroundColor: Colors.parentCard, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  pendingCard: { borderLeftWidth: 3, borderLeftColor: Colors.parentAccent },

  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardLabel: { fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.parentMuted, letterSpacing: 1.5 },
  editLink:  { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.parentAccent },

  assignPill: {
    alignSelf: 'flex-start', backgroundColor: Colors.parentSecondary,
    borderRadius: 9999, paddingHorizontal: 14, paddingVertical: 8,
  },
  assignPillText: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.parentSecText },
  assignRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  assignChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9999,
    borderWidth: 1.5, borderColor: Colors.parentBorder,
    backgroundColor: Colors.parentSurface,
  },
  assignChipActive:     { backgroundColor: Colors.parentAccent, borderColor: Colors.parentAccent },
  assignChipText:       { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.parentMuted },
  assignChipTextActive: { color: Colors.white },

  engRow:     { flexDirection: 'row', gap: 12, marginBottom: 12 },
  engStat:    { flex: 1, alignItems: 'center' },
  engNum:     { fontFamily: Fonts.parentH1, fontSize: 26, color: Colors.parentText },
  engMeta:    { fontFamily: Fonts.body, fontSize: 11, color: Colors.parentMuted, marginTop: 2 },
  engDivider: { width: 1, backgroundColor: Colors.parentBorder },
  engChild: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.parentBorder,
  },
  engAvatar: { fontSize: 20 },
  engName:   { flex: 1, fontFamily: Fonts.body, fontSize: 13, color: Colors.parentText },
  engCount:  { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.parentText },
  engGems:   { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.parentAccent },

  sectionLabel: {
    fontFamily: Fonts.bodyBold, fontSize: 10,
    color: Colors.parentMuted, letterSpacing: 1.5,
  },

  subTop:    { flexDirection: 'row', gap: 12, marginBottom: 12 },
  subAvatar: { fontSize: 28 },
  subName:   { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.parentText },
  subDate:   { fontFamily: Fonts.body, fontSize: 11, color: Colors.parentMuted, marginTop: 2 },
  subNote:   { fontFamily: Fonts.body, fontSize: 12, color: Colors.parentText, fontStyle: 'italic', marginTop: 4 },
  subBtns:   { flexDirection: 'row', gap: 8 },

  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 9999,
    borderWidth: 1.5, borderColor: Colors.error,
  },
  rejectBtnText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.error },
  approveBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 9999,
    backgroundColor: Colors.parentAccent,
  },
  approveBtnText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.white },

  pastCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.parentCard, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.parentBorder,
    padding: 12,
  },
  pastAvatar: { fontSize: 20 },
  pastName:   { flex: 1, fontFamily: Fonts.body, fontSize: 13, color: Colors.parentText },
  pastDate:   { fontFamily: Fonts.body, fontSize: 11, color: Colors.parentMuted },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9999 },
  pillGreen:  { backgroundColor: '#d4f7e1' },
  pillRed:    { backgroundColor: '#ffdad6' },
  statusText: { fontFamily: Fonts.bodyBold, fontSize: 10, textTransform: 'capitalize' },
  statusGreen: { color: Colors.success },
  statusRed:   { color: Colors.error },
  awarded:     { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.parentAccent },
});
