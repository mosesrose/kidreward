import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, ScrollView, SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Challenge, Completion } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import CelebrationOverlay from '@/components/CelebrationOverlay';
import ItemGraphic from '@/components/ItemGraphic';

const CATEGORY_COLOR: Record<string, string> = {
  homework: '#c99ce2', math: '#a4b0f0', chores: '#8fd9c2', cooking: '#ffa0a0',
  room: '#c2de85', garden: '#94d89e', morning: '#ffd66b', behavior: '#f0a0bc',
  outdoor: '#7dcc8f', social: '#f5a8d8', family: '#ffb07a', sibling: '#9dbfe8',
  phone: '#ff8e8e', other: '#ebb2ff',
};

function capitalize(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

export default function ChildChallengeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
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
  const catColor   = CATEGORY_COLOR[challenge.category] ?? Colors.kidAccent;

  return (
    <SafeAreaView style={styles.safe}>
      <CelebrationOverlay
        visible={showCelebration}
        mode="submitted"
        onDismiss={() => setShowCelebration(false)}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.kidText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QUEST DETAIL</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Banner card */}
        <View style={styles.bannerCard}>
          <View style={[styles.bannerBg, { backgroundColor: catColor + '22' }]}>
            <ItemGraphic emoji={challenge.emoji} size={64} color={catColor} mode="child" />
          </View>
          <View style={styles.bannerOverlay}>
            <View style={styles.catChip}>
              <Text style={styles.catChipText}>{capitalize(challenge.category).toUpperCase()}</Text>
            </View>
            <Text style={styles.bannerTitle}>{challenge.title}</Text>
          </View>
        </View>

        {/* Reward strip */}
        <View style={styles.rewardStrip}>
          <View>
            <Text style={styles.rewardLabel}>REWARD</Text>
            <Text style={styles.rewardGems}>+{challenge.gem_reward} 💎 GEMS</Text>
          </View>
          <View style={styles.repeatChip}>
            <Text style={styles.repeatChipText}>
              {challenge.repeat_type === 'daily' ? 'DAILY' :
               challenge.repeat_type === 'weekly' ? 'WEEKLY' : 'ONCE'}
            </Text>
          </View>
        </View>

        {/* Description */}
        {challenge.description ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>MISSION BRIEFING</Text>
            <Text style={styles.cardBody}>{challenge.description}</Text>
          </View>
        ) : null}

        {/* Status / Submit area */}
        {isPending && (
          <View style={styles.pendingCard}>
            <MaterialIcons name="hourglass-empty" size={24} color={Colors.kidAccent} />
            <Text style={styles.pendingText}>⏳ AWAITING PARENT APPROVAL</Text>
          </View>
        )}

        {isApproved && (
          <View style={styles.approvedCard}>
            <MaterialIcons name="check-circle" size={24} color={Colors.kidGreen} />
            <Text style={styles.approvedText}>✓ APPROVED — +{myCompletion?.gems_awarded} 💎</Text>
          </View>
        )}

        {isRejected && (
          <View style={styles.rejectedCard}>
            <MaterialIcons name="cancel" size={24} color="#ff6b6b" />
            <Text style={styles.rejectedText}>✗ REJECTED — TRY AGAIN</Text>
          </View>
        )}

        {canSubmit && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>SUBMIT YOUR PROOF</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Tell your parent what you did…"
              placeholderTextColor={Colors.kidMuted}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={4}
            />
            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={submit}
              disabled={submitting}
              activeOpacity={0.8}
            >
              <Text style={styles.submitBtnText}>
                {submitting ? 'SUBMITTING…' : 'COMPLETE QUEST!'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const CARD = {
  backgroundColor: Colors.kidCard,
  borderWidth: 2,
  borderColor: Colors.kidBorder,
  borderRadius: 0,
  shadowColor: Colors.kidDark,
  shadowOffset: { width: 4, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 4,
} as const;

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.kidBg },
  loading: { padding: 40, textAlign: 'center', color: Colors.kidMuted },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 2, borderBottomColor: Colors.kidBorder,
    backgroundColor: Colors.kidBg,
  },
  backBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    fontFamily: Fonts.bodyBold, fontSize: 12,
    color: Colors.kidText, letterSpacing: 2,
  },

  scroll: { padding: 16, gap: 12 },

  bannerCard: {
    ...CARD,
    overflow: 'hidden',
    height: 180,
  },
  bannerBg: {
    position: 'absolute', inset: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  bannerOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 14,
    backgroundColor: 'rgba(21,6,41,0.7)',
  },
  catChip: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.kidAccent + '33',
    borderWidth: 1, borderColor: Colors.kidAccent,
    paddingHorizontal: 8, paddingVertical: 3,
    marginBottom: 6,
  },
  catChipText: { fontFamily: Fonts.bodyBold, fontSize: 9, color: Colors.kidAccent, letterSpacing: 1.5 },
  bannerTitle: { fontFamily: Fonts.kidsH1, fontSize: 22, color: Colors.kidText, lineHeight: 28 },

  rewardStrip: {
    ...CARD,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16,
  },
  rewardLabel: { fontFamily: Fonts.bodyBold, fontSize: 9, color: Colors.kidMuted, letterSpacing: 2, marginBottom: 4 },
  rewardGems:  { fontFamily: Fonts.kidsH1, fontSize: 22, color: Colors.kidGreen },
  repeatChip: {
    backgroundColor: Colors.kidCardHigh,
    borderWidth: 1, borderColor: Colors.kidBorder,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  repeatChipText: { fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.kidMuted, letterSpacing: 1 },

  card: { ...CARD, padding: 16 },
  cardLabel: {
    fontFamily: Fonts.bodyBold, fontSize: 9,
    color: Colors.kidMuted, letterSpacing: 2, marginBottom: 10,
  },
  cardBody: { fontFamily: Fonts.body, fontSize: 14, color: Colors.kidText, lineHeight: 22 },

  pendingCard: {
    ...CARD,
    borderColor: Colors.kidAccent,
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16,
  },
  pendingText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.kidAccent, letterSpacing: 1 },

  approvedCard: {
    ...CARD,
    borderColor: Colors.kidGreen,
    backgroundColor: Colors.kidGreen + '18',
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16,
  },
  approvedText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: Colors.kidGreen, letterSpacing: 1 },

  rejectedCard: {
    ...CARD,
    borderColor: '#ff6b6b',
    backgroundColor: Colors.kidErrorBg + '33',
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16,
  },
  rejectedText: { fontFamily: Fonts.bodyBold, fontSize: 13, color: '#ff6b6b', letterSpacing: 1 },

  noteInput: {
    backgroundColor: Colors.kidDark,
    borderWidth: 1, borderColor: Colors.kidBorder,
    padding: 12,
    fontFamily: Fonts.body, fontSize: 14,
    color: Colors.kidText,
    textAlignVertical: 'top',
    minHeight: 100,
    marginBottom: 14,
  },

  submitBtn: {
    backgroundColor: Colors.kidGreen,
    borderRadius: 0,
    borderBottomWidth: 4, borderBottomColor: '#000',
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: {
    fontFamily: Fonts.kidsH1,
    fontSize: 16, color: Colors.kidGreenText,
    fontStyle: 'italic', letterSpacing: 1,
  },
});
