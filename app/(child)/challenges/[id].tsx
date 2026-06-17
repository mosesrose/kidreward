import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Challenge, Completion } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { FALLBACK_ICON } from '@/constants/icons';
import GemHeader from '@/components/GemHeader';

function capitalize(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

export default function ChildChallengeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, membership } = useAuth();
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
      status: 'pending',
      submitted_at: new Date().toISOString(),
    });
    setSubmitting(false);
    if (error) { Alert.alert('Error', error.message); return; }
    await load();
    Alert.alert('Submitted', 'Your parent will review it soon.');
  }

  if (!challenge) {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>Loading…</Text>
      </View>
    );
  }

  const alreadySubmitted = myCompletion && (myCompletion.status === 'pending' || myCompletion.status === 'approved');

  return (
    <View style={styles.container}>
      <GemHeader
        name={profile?.name ?? ''}
        gems={membership?.gem_balance ?? 0}
        lifetime={membership?.total_gems_earned ?? 0}
        compact
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Missions</Text>
        </TouchableOpacity>

        <MaterialCommunityIcons
          name={(challenge.emoji || FALLBACK_ICON) as any}
          size={56}
          color={Colors.childAccent}
          style={styles.iconHero}
        />

        <Text style={styles.kicker}>
          {challenge.repeat_type === 'daily' ? 'DAILY' : challenge.repeat_type === 'weekly' ? 'WEEKLY' : 'ONCE'} · {capitalize(challenge.category).toUpperCase()}
        </Text>
        <Text style={styles.title}>{challenge.title}</Text>
        {challenge.description ? <Text style={styles.desc}>{challenge.description}</Text> : null}

        {/* Reward card */}
        <View style={styles.rewardCard}>
          <Text style={styles.rewardLabel}>YOU'LL EARN</Text>
          <View style={styles.rewardRow}>
            <Text style={styles.rewardBig}>{challenge.gem_reward}</Text>
            <Text style={styles.rewardUnit}>gems</Text>
          </View>
          {challenge.bonus_gems > 0 && (
            <Text style={styles.bonus}>+ {challenge.bonus_gems} bonus 🌟</Text>
          )}
        </View>

        {alreadySubmitted ? (
          <View style={styles.statusCard}>
            {myCompletion.status === 'pending' && (
              <>
                <Text style={styles.statusTitle}>Waiting for parent</Text>
                <Text style={styles.statusMeta}>You sent this for review. Hang tight!</Text>
              </>
            )}
            {myCompletion.status === 'approved' && (
              <>
                <Text style={[styles.statusTitle, { color: Colors.success }]}>Approved</Text>
                <Text style={styles.statusMeta}>You earned +{myCompletion.gems_awarded} 💎</Text>
              </>
            )}
            {myCompletion.status === 'rejected' && (
              <>
                <Text style={[styles.statusTitle, { color: Colors.danger }]}>Not approved this time</Text>
                <Text style={styles.statusMeta}>Ask your parent and try again.</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => setMyCompletion(null)}>
                  <Text style={styles.retryBtnText}>Try again</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : (
          <>
            <Text style={styles.noteLabel}>TELL YOUR PARENT WHAT YOU DID</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="e.g. I tidied my room and made my bed"
              placeholderTextColor={Colors.childMuted}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />
            <Text style={styles.noteHint}>Optional · {note.length}/200</Text>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.disabled]}
              onPress={submit}
              disabled={submitting}
            >
              <Text style={styles.submitBtnText}>
                {submitting ? 'Submitting…' : 'I did it!'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.childBg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.childBg },
  loading: { color: Colors.childMuted, fontSize: 16 },
  scroll: { padding: 20, paddingBottom: 40 },

  back: { marginBottom: 16 },
  backText: { color: Colors.childMuted, fontSize: 14, fontWeight: '500' },

  iconHero: { alignSelf: 'center', marginBottom: 16 },

  kicker: { fontSize: 11, color: Colors.childMuted, letterSpacing: 2, fontWeight: '700', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: Colors.childText, lineHeight: 34, marginBottom: 10 },
  desc: { fontSize: 14, color: Colors.childMuted, lineHeight: 20, marginBottom: 20 },

  rewardCard: {
    backgroundColor: Colors.childCard,
    borderRadius: 18, padding: 22, alignItems: 'center', marginBottom: 24,
    borderWidth: 1, borderColor: Colors.childBorder,
  },
  rewardLabel: { fontSize: 11, color: Colors.childMuted, letterSpacing: 2, fontWeight: '700', marginBottom: 8 },
  rewardRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  rewardBig: { fontSize: 56, fontWeight: '800', color: Colors.childAccent, lineHeight: 60 },
  rewardUnit: { fontSize: 14, color: Colors.childMuted },
  bonus: { color: Colors.childAccent2, fontWeight: '700', fontSize: 13, marginTop: 8 },

  noteLabel: { fontSize: 11, color: Colors.childMuted, letterSpacing: 2, fontWeight: '700', marginBottom: 8 },
  noteInput: {
    backgroundColor: Colors.childCard,
    borderRadius: 14, padding: 14,
    color: Colors.childText, fontSize: 15,
    textAlignVertical: 'top', minHeight: 90,
    borderWidth: 1, borderColor: Colors.childBorder,
  },
  noteHint: { fontSize: 12, color: Colors.childMuted, marginTop: 6, marginBottom: 20 },

  submitBtn: {
    backgroundColor: Colors.childAccent2,
    borderRadius: 100, paddingVertical: 18, alignItems: 'center',
  },
  disabled: { opacity: 0.5 },
  submitBtnText: { color: Colors.childText, fontWeight: '700', fontSize: 16 },

  cancelBtn: { paddingVertical: 16, alignItems: 'center' },
  cancelBtnText: { color: Colors.childMuted, fontSize: 14 },

  statusCard: {
    backgroundColor: Colors.childCard, borderRadius: 18, padding: 24, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.childBorder,
  },
  statusTitle: { fontSize: 20, fontWeight: '700', color: Colors.childText, marginBottom: 6 },
  statusMeta: { fontSize: 14, color: Colors.childMuted, textAlign: 'center' },
  retryBtn: {
    marginTop: 18, backgroundColor: Colors.purple,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 100,
  },
  retryBtnText: { color: Colors.childText, fontWeight: '600', fontSize: 14 },
});
