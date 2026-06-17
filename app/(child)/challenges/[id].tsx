import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, ScrollView, SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Challenge, Completion } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { FALLBACK_ICON } from '@/constants/icons';
import CelebrationOverlay from '@/components/CelebrationOverlay';
import SquishButton from '@/components/SquishButton';

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
  const [showCelebration, setShowCelebration] = useState(false);

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
    setShowCelebration(true);
    await load();
  }

  const onCelebrationDismiss = () => setShowCelebration(false);

  if (!challenge) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.loading}>Loading…</Text>
      </SafeAreaView>
    );
  }

  const status = myCompletion?.status;
  const isPending  = status === 'pending';
  const isApproved = status === 'approved';
  const isRejected = status === 'rejected';
  const canSubmit  = !isPending && !isApproved;

  return (
    <SafeAreaView style={styles.safe}>
      <CelebrationOverlay
        visible={showCelebration}
        mode="submitted"
        onDismiss={onCelebrationDismiss}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={Colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {/* Hero icon */}
        <View style={styles.heroCircle}>
          <MaterialCommunityIcons
            name={(challenge.emoji || FALLBACK_ICON) as any}
            size={48}
            color={Colors.primary}
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>{challenge.title}</Text>

        {/* Chips row */}
        <View style={styles.chipsRow}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{capitalize(challenge.category)}</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>
              {challenge.repeat_type === 'daily' ? 'Daily' :
               challenge.repeat_type === 'weekly' ? 'Weekly' : 'Once'}
            </Text>
          </View>
          <View style={styles.gemChip}>
            <Text style={styles.gemChipText}>💎 {challenge.gem_reward} Gems</Text>
          </View>
        </View>

        {/* Description */}
        {challenge.description ? (
          <Text style={styles.desc}>{challenge.description}</Text>
        ) : null}

        {/* Status chip or submit form */}
        {isPending && (
          <View style={styles.statusChip}>
            <Text style={styles.statusChipText}>⏳ Waiting for your parent</Text>
          </View>
        )}

        {isApproved && (
          <View style={[styles.statusChip, styles.statusChipGreen]}>
            <Text style={[styles.statusChipText, styles.statusChipTextGreen]}>
              ✓ Approved — +{myCompletion?.gems_awarded} 💎
            </Text>
          </View>
        )}

        {isRejected && (
          <View style={[styles.statusChip, styles.statusChipRed]}>
            <Text style={[styles.statusChipText, styles.statusChipTextRed]}>
              ✗ Rejected — try again
            </Text>
          </View>
        )}

        {canSubmit && (
          <>
            <Text style={styles.noteLabel}>ADD A NOTE</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Tell your parent what you did…"
              placeholderTextColor={Colors.outline}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />

            <SquishButton
              label={submitting ? 'Submitting…' : 'I Did It! 🎉'}
              onPress={submit}
              disabled={submitting}
              style={styles.submitBtn}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.surface },
  loading: { padding: 40, textAlign: 'center', color: Colors.onSurfaceVariant },
  scroll:  { padding: 20, paddingBottom: 40 },

  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 },
  backText: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.primary },

  heroCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.secondaryContainer,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 20,
  },

  title: {
    fontFamily: Fonts.kidsH1,
    fontSize: 28,
    color: Colors.onSurface,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },

  chipsRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 8, justifyContent: 'center', marginBottom: 16,
  },
  chip: {
    backgroundColor: Colors.primaryFixed,
    borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  chipText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.primary },
  gemChip: {
    backgroundColor: Colors.tertiaryFixed,
    borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  gemChipText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.onTertiaryFixed },

  desc: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.onSurfaceVariant,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },

  statusChip: {
    backgroundColor: Colors.warningContainer,
    borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 12,
    alignItems: 'center', marginBottom: 20,
  },
  statusChipGreen:  { backgroundColor: Colors.successContainer },
  statusChipRed:    { backgroundColor: Colors.errorContainer },
  statusChipText:   { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.warning },
  statusChipTextGreen: { color: Colors.success },
  statusChipTextRed:   { color: Colors.error },

  noteLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    letterSpacing: 1,
    marginBottom: 8,
  },
  noteInput: {
    backgroundColor: Colors.white,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: 14,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.onSurface,
    textAlignVertical: 'top',
    minHeight: 90,
    marginBottom: 24,
  },

  submitBtn: { marginTop: 0 },
});
