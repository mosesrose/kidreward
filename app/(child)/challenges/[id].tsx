import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Challenge, Completion } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { CATEGORY_COLORS } from '@/constants/challenges';

export default function ChildChallengeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [myCompletion, setMyCompletion] = useState<Completion | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { load(); }, [id]);

  async function load() {
    if (!profile) return;
    const [{ data: ch }, { data: comp }] = await Promise.all([
      supabase.from('challenges').select('*').eq('id', id).single(),
      supabase
        .from('completions')
        .select('*')
        .eq('challenge_id', id)
        .eq('child_id', profile.id)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    setChallenge(ch);
    setMyCompletion(comp);
  }

  async function submit() {
    if (!profile || !challenge) return;
    setSubmitting(true);
    const { error } = await supabase.from('completions').insert({
      challenge_id: id,
      child_id: profile.id,
      note: note.trim() || null,
    });
    setSubmitting(false);
    if (error) { Alert.alert('Error', error.message); return; }
    await load();
    Alert.alert('🎉 Submitted!', 'Your parent will review it soon. Fingers crossed! 🤞');
  }

  if (!challenge) {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>Loading…</Text>
      </View>
    );
  }

  const catColor = CATEGORY_COLORS[challenge.category] ?? Colors.purple;
  const alreadySubmitted = myCompletion && (myCompletion.status === 'pending' || myCompletion.status === 'approved');

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.childBg, Colors.childCard]}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Challenge hero */}
        <View style={styles.hero}>
          <View style={[styles.emojiCircle, { backgroundColor: `${catColor}30`, borderColor: catColor }]}>
            <Text style={styles.heroEmoji}>{challenge.emoji}</Text>
          </View>
          <Text style={styles.heroTitle}>{challenge.title}</Text>
          {challenge.description && (
            <Text style={styles.heroDesc}>{challenge.description}</Text>
          )}

          {/* Rewards preview */}
          <View style={styles.rewardsRow}>
            <View style={styles.rewardPill}>
              <Text style={styles.rewardPillLabel}>Complete</Text>
              <Text style={styles.rewardPillValue}>+{challenge.gem_reward} 💎</Text>
            </View>
            {challenge.bonus_gems > 0 && (
              <View style={[styles.rewardPill, styles.bonusPill]}>
                <Text style={styles.rewardPillLabel}>Bonus</Text>
                <Text style={[styles.rewardPillValue, { color: Colors.childAccent2 }]}>
                  +{challenge.bonus_gems} 🌟
                </Text>
              </View>
            )}
          </View>

          <View style={styles.repeatBadge}>
            <Text style={styles.repeatText}>
              {challenge.repeat_type === 'daily' ? '🔄 Repeats daily' :
               challenge.repeat_type === 'weekly' ? '📆 Repeats weekly' :
               '1️⃣ One-time challenge'}
            </Text>
          </View>
        </View>

        {/* Submission area */}
        {alreadySubmitted ? (
          <View style={styles.submittedCard}>
            {myCompletion.status === 'pending' && (
              <>
                <Text style={styles.submittedEmoji}>⏳</Text>
                <Text style={styles.submittedTitle}>Waiting for review!</Text>
                <Text style={styles.submittedDesc}>Your parent hasn't reviewed it yet. Hang tight!</Text>
              </>
            )}
            {myCompletion.status === 'approved' && (
              <>
                <Text style={styles.submittedEmoji}>🎉</Text>
                <Text style={styles.submittedTitle}>Approved!</Text>
                <Text style={[styles.submittedDesc, { color: Colors.childGreen }]}>
                  You earned +{myCompletion.gems_awarded} 💎
                </Text>
              </>
            )}
            {myCompletion.status === 'rejected' && (
              <>
                <Text style={styles.submittedEmoji}>😔</Text>
                <Text style={styles.submittedTitle}>Not approved this time</Text>
                <Text style={styles.submittedDesc}>Ask your parent and try again!</Text>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={() => setMyCompletion(null)}
                >
                  <Text style={styles.retryBtnText}>Try Again</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : (
          <View style={styles.submitArea}>
            <Text style={styles.submitTitle}>Mark as complete</Text>
            <Text style={styles.submitDesc}>
              Done? Tell your parent what you did and submit for review!
            </Text>

            <Text style={styles.noteLabel}>Add a note (optional)</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="e.g. I tidied my room and made my bed! 🛏️"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.disabled]}
              onPress={submit}
              disabled={submitting}
            >
              <LinearGradient
                colors={[Colors.childGreen, '#00A04A']}
                style={styles.submitBtnGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <Text style={styles.submitBtnText}>
                  {submitting ? 'Submitting…' : `✓ I Did It! (+${challenge.gem_reward}💎)`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.childBg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.childBg },
  loading: { color: 'rgba(255,255,255,0.5)', fontSize: 16 },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16 },
  back: {},
  backText: { color: 'rgba(255,255,255,0.6)', fontSize: 16, fontWeight: '600' },
  scroll: { padding: 20, paddingBottom: 40 },
  hero: { alignItems: 'center', marginBottom: 28 },
  emojiCircle: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, marginBottom: 16,
  },
  heroEmoji: { fontSize: 52 },
  heroTitle: { fontSize: 24, fontWeight: '900', color: Colors.textLight, textAlign: 'center', marginBottom: 10 },
  heroDesc: { fontSize: 15, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  rewardsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  rewardPill: {
    backgroundColor: 'rgba(0,212,255,0.15)',
    borderRadius: 14, padding: 14, alignItems: 'center',
    minWidth: 100,
  },
  bonusPill: { backgroundColor: 'rgba(255,215,0,0.12)' },
  rewardPillLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 },
  rewardPillValue: { fontSize: 20, fontWeight: '900', color: Colors.gem },
  repeatBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10,
  },
  repeatText: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  submittedCard: {
    backgroundColor: Colors.childCard, borderRadius: 20,
    padding: 28, alignItems: 'center',
  },
  submittedEmoji: { fontSize: 52, marginBottom: 12 },
  submittedTitle: { fontSize: 22, fontWeight: '800', color: Colors.textLight, marginBottom: 6 },
  submittedDesc: { fontSize: 15, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  retryBtn: {
    marginTop: 20, backgroundColor: Colors.purple,
    paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12,
  },
  retryBtnText: { color: Colors.textLight, fontWeight: '700', fontSize: 15 },
  submitArea: {
    backgroundColor: Colors.childCard, borderRadius: 20, padding: 20,
  },
  submitTitle: { fontSize: 20, fontWeight: '800', color: Colors.textLight, marginBottom: 6 },
  submitDesc: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 18, lineHeight: 20 },
  noteLabel: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
  noteInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14, padding: 14,
    color: Colors.textLight, fontSize: 15,
    textAlignVertical: 'top', marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  submitBtn: { borderRadius: 16, overflow: 'hidden' },
  disabled: { opacity: 0.5 },
  submitBtnGradient: { paddingVertical: 18, alignItems: 'center' },
  submitBtnText: { color: Colors.textLight, fontWeight: '900', fontSize: 17 },
});
