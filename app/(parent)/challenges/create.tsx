import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Switch,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { CHALLENGE_TEMPLATES, CATEGORY_COLORS, ChallengeTemplate } from '@/constants/challenges';

export default function CreateChallenge() {
  const { family, profile } = useAuth();
  const [selected, setSelected] = useState<ChallengeTemplate | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [gems, setGems] = useState('10');
  const [bonus, setBonus] = useState('0');
  const [repeatType, setRepeatType] = useState<'once' | 'daily' | 'weekly'>('once');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  function pickTemplate(t: ChallengeTemplate) {
    setSelected(t);
    setTitle(t.title);
    setDescription(t.description);
    setGems(String(t.defaultGems));
    setBonus(String(t.defaultBonus));
    setRepeatType(t.repeatType);
  }

  async function save() {
    setErrorMsg('');
    if (!title.trim()) { setErrorMsg('Please add a title.'); return; }
    if (!family || !profile) { setErrorMsg('Not ready yet — please try again.'); return; }

    setSaving(true);
    const { error } = await supabase.from('challenges').insert({
      family_id: family.id,
      title: title.trim(),
      description: description.trim() || null,
      category: selected?.category ?? 'homework',
      emoji: selected?.emoji ?? '⭐',
      gem_reward: parseInt(gems, 10) || 10,
      bonus_gems: parseInt(bonus, 10) || 0,
      repeat_type: repeatType,
      status: 'active',
      created_by: profile.id,
    });
    setSaving(false);
    if (error) { setErrorMsg(error.message); return; }
    router.back();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>New Challenge</Text>
        <TouchableOpacity
          testID="save-challenge-btn"
          style={[styles.saveBtn, saving && styles.disabled]}
          onPress={save} disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? '…' : 'Save'}</Text>
        </TouchableOpacity>
      </View>
      {errorMsg ? (
        <View style={styles.errorBanner} testID="challenge-save-error">
          <Text style={styles.errorBannerText}>{errorMsg}</Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Templates */}
        <Text style={styles.sectionLabel}>Choose a template (or customize below)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templates}>
          {CHALLENGE_TEMPLATES.map((t) => (
            <TouchableOpacity
              key={t.title}
              style={[
                styles.templateCard,
                selected?.title === t.title && styles.templateCardActive,
                { borderColor: CATEGORY_COLORS[t.category] },
              ]}
              onPress={() => pickTemplate(t)}
            >
              <Text style={styles.templateEmoji}>{t.emoji}</Text>
              <Text style={styles.templateTitle} numberOfLines={2}>{t.title}</Text>
              <Text style={styles.templateGems}>+{t.defaultGems}💎</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Custom form */}
        <Text style={styles.sectionLabel}>Challenge Details</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Keep room tidy"
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Optional details…"
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>💎 Gems</Text>
            <TextInput
              style={styles.input}
              value={gems}
              onChangeText={setGems}
              keyboardType="number-pad"
            />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>🌟 Bonus</Text>
            <TextInput
              style={styles.input}
              value={bonus}
              onChangeText={setBonus}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Repeat</Text>
          <View style={styles.segmented}>
            {(['once', 'daily', 'weekly'] as const).map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.segment, repeatType === r && styles.segmentActive]}
                onPress={() => setRepeatType(r)}
              >
                <Text style={[styles.segmentText, repeatType === r && styles.segmentTextActive]}>
                  {r === 'once' ? '1x' : r === 'daily' ? 'Daily' : 'Weekly'}
                </Text>
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
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: Colors.parentBg,
    borderBottomWidth: 1, borderBottomColor: Colors.parentBorder,
  },
  back: { color: Colors.purple, fontSize: 16, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '800', color: Colors.textDark },
  saveBtn: {
    backgroundColor: Colors.purple, paddingHorizontal: 18,
    paddingVertical: 8, borderRadius: 12,
  },
  disabled: { opacity: 0.5 },
  saveBtnText: { color: Colors.textLight, fontWeight: '700' },
  errorBanner: {
    backgroundColor: 'rgba(255,61,0,0.10)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.danger,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  errorBannerText: { color: Colors.danger, fontSize: 14, fontWeight: '600' },
  scroll: { padding: 20, gap: 4, paddingBottom: 40 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, marginBottom: 10, marginTop: 16 },
  templates: { marginBottom: 8 },
  templateCard: {
    width: 110, backgroundColor: Colors.parentCard,
    borderRadius: 14, padding: 12, marginRight: 10,
    alignItems: 'center', borderWidth: 2, borderColor: 'transparent',
  },
  templateCardActive: { backgroundColor: 'rgba(108,60,225,0.06)' },
  templateEmoji: { fontSize: 28, marginBottom: 6 },
  templateTitle: { fontSize: 11, fontWeight: '600', color: Colors.textDark, textAlign: 'center', marginBottom: 4 },
  templateGems: { fontSize: 11, color: Colors.gemGlow, fontWeight: '700' },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.textMid, marginBottom: 6 },
  input: {
    backgroundColor: Colors.parentCard, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: Colors.textDark,
    borderWidth: 1, borderColor: Colors.parentBorder,
  },
  textarea: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  segmented: {
    flexDirection: 'row', backgroundColor: Colors.parentCard,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.parentBorder, overflow: 'hidden',
  },
  segment: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  segmentActive: { backgroundColor: Colors.purple },
  segmentText: { fontSize: 14, fontWeight: '600', color: Colors.textMid },
  segmentTextActive: { color: Colors.textLight },
});
