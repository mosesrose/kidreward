import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase, Challenge, Completion } from '@/lib/supabase';
import { Colors } from '@/constants/colors';

export default function ChallengeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    setLoading(true);
    const [{ data: ch }, { data: comps }] = await Promise.all([
      supabase.from('challenges').select('*').eq('id', id).single(),
      supabase
        .from('completions')
        .select('*, profiles(*)')
        .eq('challenge_id', id)
        .order('submitted_at', { ascending: false }),
    ]);
    setChallenge(ch);
    setCompletions(comps ?? []);
    setLoading(false);
  }

  async function approve(completion: Completion) {
    const gems = (challenge?.gem_reward ?? 0) + (completion.status === 'approved' ? 0 : challenge?.bonus_gems ?? 0);
    const { error } = await supabase
      .from('completions')
      .update({ status: 'approved', gems_awarded: gems, reviewed_at: new Date().toISOString() })
      .eq('id', completion.id);
    if (error) { Alert.alert('Error', error.message); return; }

    // Award gems
    await supabase.rpc('award_gems', {
      p_child_id: completion.child_id,
      p_family_id: challenge?.family_id,
      p_gems: gems,
    });
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

  async function archiveChallenge() {
    Alert.alert('Archive challenge?', 'This will hide it from your kids.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive', style: 'destructive',
        onPress: async () => {
          await supabase.from('challenges').update({ status: 'archived' }).eq('id', id);
          router.back();
        },
      },
    ]);
  }

  if (loading || !challenge) {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>Loading…</Text>
      </View>
    );
  }

  const statusColor = (s: string) =>
    s === 'approved' ? Colors.success : s === 'rejected' ? Colors.danger : Colors.pending;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={archiveChallenge}>
          <Text style={styles.archiveText}>Archive</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Challenge info */}
        <View style={styles.challengeCard}>
          <Text style={styles.emoji}>{challenge.emoji}</Text>
          <Text style={styles.challengeTitle}>{challenge.title}</Text>
          {challenge.description && (
            <Text style={styles.desc}>{challenge.description}</Text>
          )}
          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Text style={styles.metaBadgeText}>+{challenge.gem_reward} 💎</Text>
            </View>
            {challenge.bonus_gems > 0 && (
              <View style={[styles.metaBadge, styles.bonusBadge]}>
                <Text style={styles.metaBadgeText}>+{challenge.bonus_gems} 🌟 bonus</Text>
              </View>
            )}
            <View style={[styles.metaBadge, styles.repeatBadge]}>
              <Text style={styles.metaBadgeText}>
                {challenge.repeat_type === 'daily' ? '🔄 Daily' :
                 challenge.repeat_type === 'weekly' ? '📆 Weekly' : '1️⃣ Once'}
              </Text>
            </View>
          </View>
        </View>

        {/* Completions */}
        <Text style={styles.sectionTitle}>
          Submissions ({completions.length})
        </Text>

        {completions.length === 0 ? (
          <Text style={styles.noSubmissions}>No submissions yet</Text>
        ) : (
          completions.map((c) => (
            <View key={c.id} style={styles.completionCard}>
              <View style={styles.completionTop}>
                <Text style={styles.completionAvatar}>
                  {(c as any).profiles?.avatar_emoji ?? '🧒'}
                </Text>
                <View style={styles.completionInfo}>
                  <Text style={styles.completionName}>{(c as any).profiles?.name}</Text>
                  <Text style={styles.completionDate}>
                    {new Date(c.submitted_at).toLocaleDateString()}
                  </Text>
                  {c.note && <Text style={styles.completionNote}>"{c.note}"</Text>}
                </View>
                <View style={[styles.statusPill, { backgroundColor: `${statusColor(c.status)}20` }]}>
                  <Text style={[styles.statusText, { color: statusColor(c.status) }]}>
                    {c.status}
                  </Text>
                </View>
              </View>

              {c.status === 'pending' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => reject(c)}
                  >
                    <Text style={styles.rejectText}>✗ Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => approve(c)}
                  >
                    <Text style={styles.approveText}>✓ Approve +{challenge.gem_reward}💎</Text>
                  </TouchableOpacity>
                </View>
              )}

              {c.status === 'approved' && c.gems_awarded && (
                <Text style={styles.awardedText}>+{c.gems_awarded} 💎 awarded</Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.parentBg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loading: { color: Colors.textMuted, fontSize: 16 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.parentBorder,
  },
  back: { color: Colors.purple, fontSize: 16, fontWeight: '600' },
  archiveText: { color: Colors.danger, fontSize: 14, fontWeight: '600' },
  scroll: { padding: 20, paddingBottom: 40 },
  challengeCard: {
    backgroundColor: Colors.parentCard, borderRadius: 20,
    padding: 24, alignItems: 'center', marginBottom: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  emoji: { fontSize: 52, marginBottom: 12 },
  challengeTitle: { fontSize: 22, fontWeight: '800', color: Colors.textDark, textAlign: 'center', marginBottom: 8 },
  desc: { fontSize: 14, color: Colors.textMid, textAlign: 'center', marginBottom: 14 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  metaBadge: {
    backgroundColor: 'rgba(0,212,255,0.1)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
  },
  bonusBadge: { backgroundColor: 'rgba(255,215,0,0.15)' },
  repeatBadge: { backgroundColor: 'rgba(108,60,225,0.1)' },
  metaBadgeText: { fontSize: 13, fontWeight: '700', color: Colors.textDark },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.textDark, marginBottom: 14 },
  noSubmissions: { color: Colors.textMuted, textAlign: 'center', paddingTop: 20, fontSize: 15 },
  completionCard: {
    backgroundColor: Colors.parentCard, borderRadius: 16,
    padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  completionTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  completionAvatar: { fontSize: 30 },
  completionInfo: { flex: 1 },
  completionName: { fontSize: 15, fontWeight: '700', color: Colors.textDark },
  completionDate: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  completionNote: { fontSize: 13, color: Colors.textMid, fontStyle: 'italic', marginTop: 4 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  actionRow: { flexDirection: 'row', gap: 10 },
  rejectBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: 'rgba(255,61,0,0.08)',
    alignItems: 'center', borderWidth: 1, borderColor: Colors.danger,
  },
  rejectText: { color: Colors.danger, fontWeight: '700' },
  approveBtn: {
    flex: 2, paddingVertical: 10, borderRadius: 10,
    backgroundColor: Colors.success, alignItems: 'center',
  },
  approveText: { color: Colors.textLight, fontWeight: '700' },
  awardedText: { fontSize: 13, color: Colors.success, fontWeight: '700', textAlign: 'center', marginTop: 4 },
});
