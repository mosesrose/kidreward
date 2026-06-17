import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { REWARD_ICONS, FALLBACK_ICON } from '@/constants/icons';
import IconPicker from '@/components/IconPicker';

type RewardType = 'money' | 'gift' | 'screen_time' | 'activity';

const REWARD_TYPES: { type: RewardType; label: string; icon: string; desc: string }[] = [
  { type: 'money',       label: 'Money',       icon: 'payments',        desc: 'Real cash or pocket money' },
  { type: 'gift',        label: 'Gift',        icon: 'card-giftcard',   desc: 'A toy, book, or surprise' },
  { type: 'screen_time', label: 'Screen Time', icon: 'tv',              desc: 'Extra gaming or TV time' },
  { type: 'activity',    label: 'Activity',    icon: 'directions-bike', desc: 'A trip, outing, or experience' },
];

const SUGGESTED_REWARDS = [
  { title: '£1 pocket money',          icon: 'payments',       type: 'money'       as RewardType, cost: 50,  desc: '' },
  { title: '£5 pocket money',          icon: 'payments',       type: 'money'       as RewardType, cost: 200, desc: '' },
  { title: '30 min extra screen time', icon: 'tv',             type: 'screen_time' as RewardType, cost: 30,  desc: 'Extra gaming or TV time' },
  { title: 'Choose dinner tonight',    icon: 'local-pizza',    type: 'activity'    as RewardType, cost: 40,  desc: 'Pick what the family eats!' },
  { title: 'Movie night pick',         icon: 'movie',          type: 'activity'    as RewardType, cost: 60,  desc: 'Choose the movie' },
  { title: 'Trip to the park',         icon: 'directions-bike', type: 'activity'   as RewardType, cost: 80,  desc: 'A fun trip out' },
  { title: 'Small toy or book',        icon: 'card-giftcard',  type: 'gift'        as RewardType, cost: 100, desc: 'Up to £5 toy or book' },
  { title: 'New video game',           icon: 'videogame-asset', type: 'gift'       as RewardType, cost: 500, desc: 'A new game of their choice' },
];

export default function CreateReward() {
  const { family, profile } = useAuth();
  const [type, setType] = useState<RewardType>('gift');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState<string>('card-giftcard');
  const [cost, setCost] = useState('50');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  function pickSuggestion(s: typeof SUGGESTED_REWARDS[0]) {
    setTitle(s.title);
    setIcon(s.icon);
    setType(s.type);
    setCost(String(s.cost));
    setDescription(s.desc);
  }

  async function save() {
    setErrorMsg('');
    if (!title.trim()) { setErrorMsg('Please add a title.'); return; }
    if (!family || !profile) { setErrorMsg('Not ready yet — please try again.'); return; }
    setSaving(true);
    const { error } = await supabase.from('rewards').insert({
      family_id: family.id,
      title: title.trim(),
      description: description.trim() || null,
      emoji: icon,
      gem_cost: parseInt(cost, 10) || 50,
      reward_type: type,
      created_by: profile.id,
    });
    setSaving(false);
    if (error) { setErrorMsg(error.message); return; }
    router.back();
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>New Reward</Text>
        <TouchableOpacity
          testID="save-reward-btn"
          style={[styles.saveBtn, saving && styles.disabled]}
          onPress={save} disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? '…' : 'Save'}</Text>
        </TouchableOpacity>
      </View>
      {errorMsg ? (
        <View style={styles.errorBanner} testID="reward-save-error">
          <Text style={styles.errorBannerText}>{errorMsg}</Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionLabel}>Suggestions</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestions}>
          {SUGGESTED_REWARDS.map((s) => (
            <TouchableOpacity
              key={s.title}
              style={styles.suggCard}
              onPress={() => pickSuggestion(s)}
            >
              <MaterialIcons name={(s.icon || FALLBACK_ICON) as any} size={28} color={Colors.primary} style={{ marginBottom: 6 }} />
              <Text style={styles.suggTitle} numberOfLines={2}>{s.title}</Text>
              <Text style={styles.suggCost}>{s.cost} 💎</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionLabel}>Reward Type</Text>
        <View style={styles.typeGrid}>
          {REWARD_TYPES.map((rt) => (
            <TouchableOpacity
              key={rt.type}
              style={[styles.typeCard, type === rt.type && styles.typeCardActive]}
              onPress={() => { setType(rt.type); setIcon(rt.icon); }}
            >
              <MaterialIcons name={(rt.icon || FALLBACK_ICON) as any} size={24} color={type === rt.type ? Colors.white : Colors.onSurfaceVariant} style={{ marginBottom: 4 }} />
              <Text style={[styles.typeLabel, type === rt.type && styles.typeLabelActive]}>
                {rt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Extra screen time"
            placeholderTextColor={Colors.onSurfaceVariant}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Icon</Text>
          <IconPicker
            icons={REWARD_ICONS}
            selected={icon}
            onSelect={setIcon}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>💎 Gem Cost</Text>
          <TextInput
            style={styles.input}
            value={cost}
            onChangeText={setCost}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Optional details…"
            placeholderTextColor={Colors.onSurfaceVariant}
            multiline
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant,
  },
  back: { color: Colors.primary, fontSize: 16, fontWeight: '600', fontFamily: Fonts.bodySemiBold },
  title: { fontSize: 18, fontWeight: '800', color: Colors.onSurface, fontFamily: Fonts.parentH1 },
  saveBtn: { backgroundColor: Colors.primary, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 9999 },
  disabled: { opacity: 0.5 },
  saveBtnText: { color: Colors.white, fontWeight: '700', fontFamily: Fonts.bodyBold },
  errorBanner: {
    backgroundColor: 'rgba(255,61,0,0.10)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.danger,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  errorBannerText: { color: Colors.danger, fontSize: 14, fontWeight: '600', fontFamily: Fonts.bodySemiBold },
  scroll: { padding: 20, paddingBottom: 40 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: Colors.onSurfaceVariant, marginBottom: 10, marginTop: 16, fontFamily: Fonts.bodyBold },
  suggestions: { marginBottom: 8 },
  suggCard: {
    width: 100, backgroundColor: Colors.primaryFixed,
    borderRadius: 14, padding: 12, marginRight: 10, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.primaryFixedDim,
  },
  suggTitle: { fontSize: 11, fontWeight: '600', color: Colors.onSurface, textAlign: 'center', marginBottom: 4, fontFamily: Fonts.bodySemiBold },
  suggCost: { fontSize: 11, color: Colors.onSurfaceVariant, fontWeight: '700', fontFamily: Fonts.bodyBold },
  typeGrid: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  typeCard: {
    flex: 1, backgroundColor: Colors.white,
    borderRadius: 14, padding: 12, alignItems: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  typeCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  typeLabel: { fontSize: 11, fontWeight: '700', color: Colors.onSurfaceVariant, fontFamily: Fonts.bodyBold },
  typeLabelActive: { color: Colors.white },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.onSurfaceVariant, marginBottom: 6, fontFamily: Fonts.bodyBold },
  input: {
    backgroundColor: Colors.white, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: Colors.onSurface,
    borderWidth: 1, borderColor: Colors.outlineVariant,
    fontFamily: Fonts.body,
  },
  textarea: { height: 80, textAlignVertical: 'top' },
});
