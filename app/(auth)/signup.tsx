import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert, SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!name || !email || !password) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error || !data.user) {
      setLoading(false);
      Alert.alert('Sign up failed', error?.message ?? 'Unknown error');
      return;
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      name: name.trim(),
      role: 'parent',
      avatar_emoji: '👨‍👩‍👧',
    });

    if (profileError) {
      setLoading(false);
      Alert.alert('Profile error', profileError.message);
      return;
    }

    const trimmedCode = inviteCode.trim().toUpperCase();

    if (trimmedCode.length === 6) {
      const { data: invite } = await supabase
        .from('invites')
        .select('*')
        .eq('code', trimmedCode)
        .eq('invite_type', 'parent')
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (!invite) {
        setLoading(false);
        Alert.alert('Invalid invite code', 'This co-parent invite code is invalid or expired.');
        return;
      }

      await supabase.from('family_co_parents').insert({
        family_id: invite.family_id,
        co_parent_id: data.user.id,
        invited_by: invite.created_by,
      });

      await supabase.from('invites').update({
        used_by: data.user.id,
        used_at: new Date().toISOString(),
        status: 'used',
      }).eq('id', invite.id);

    } else {
      const { data: familyData } = await supabase.from('families').insert({
        name: `${name.trim()}'s Family`,
        parent_id: data.user.id,
      }).select().single();

      const newFamilyId = familyData?.id;

      if (newFamilyId) {
        const defaultRewards = [
          { family_id: newFamilyId, title: '€1 pocket money',          emoji: 'payments',      gem_cost: 50,  reward_type: 'money',       is_active: true, created_by: data.user.id },
          { family_id: newFamilyId, title: '€2 pocket money',          emoji: 'payments',      gem_cost: 100, reward_type: 'money',       is_active: true, created_by: data.user.id },
          { family_id: newFamilyId, title: '€5 pocket money',          emoji: 'payments',      gem_cost: 250, reward_type: 'money',       is_active: true, created_by: data.user.id },
          { family_id: newFamilyId, title: '30 min extra screen time', emoji: 'tv',            gem_cost: 30,  reward_type: 'screen_time', is_active: true, created_by: data.user.id },
          { family_id: newFamilyId, title: 'Movie night pick',         emoji: 'movie',         gem_cost: 75,  reward_type: 'activity',    is_active: true, created_by: data.user.id },
        ];

        const defaultChallenges = [
          { family_id: newFamilyId, child_id: null, title: 'Do homework',         category: 'homework', emoji: 'menu-book',          gem_reward: 15, bonus_gems: 5,  repeat_type: 'daily',  status: 'active', created_by: data.user.id },
          { family_id: newFamilyId, child_id: null, title: 'Tidy your room',      category: 'room',     emoji: 'bed',                gem_reward: 10, bonus_gems: 0,  repeat_type: 'daily',  status: 'active', created_by: data.user.id },
          { family_id: newFamilyId, child_id: null, title: 'Help prepare dinner', category: 'cooking',  emoji: 'restaurant',         gem_reward: 20, bonus_gems: 5,  repeat_type: 'weekly', status: 'active', created_by: data.user.id },
          { family_id: newFamilyId, child_id: null, title: 'Family time',         category: 'family',   emoji: 'family-restroom',    gem_reward: 10, bonus_gems: 0,  repeat_type: 'daily',  status: 'active', created_by: data.user.id },
          { family_id: newFamilyId, child_id: null, title: 'Play outside',        category: 'outdoor',  emoji: 'park',               gem_reward: 15, bonus_gems: 5,  repeat_type: 'daily',  status: 'active', created_by: data.user.id },
          { family_id: newFamilyId, child_id: null, title: 'Read for 20 minutes', category: 'homework', emoji: 'menu-book',          gem_reward: 10, bonus_gems: 0,  repeat_type: 'daily',  status: 'active', created_by: data.user.id },
          { family_id: newFamilyId, child_id: null, title: 'Be kind to everyone', category: 'social',   emoji: 'volunteer-activism', gem_reward: 10, bonus_gems: 0,  repeat_type: 'daily',  status: 'active', created_by: data.user.id },
          { family_id: newFamilyId, child_id: null, title: 'Wake up on time',     category: 'morning',  emoji: 'wb-sunny',           gem_reward: 15, bonus_gems: 5,  repeat_type: 'daily',  status: 'active', created_by: data.user.id },
        ];

        await Promise.all([
          supabase.from('rewards').insert(defaultRewards),
          supabase.from('challenges').insert(defaultChallenges),
        ]);
      }
    }

    setLoading(false);
    router.replace('/(parent)/dashboard');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <MaterialIcons name="arrow-back" size={22} color={Colors.parentText} />
            </TouchableOpacity>
            <View style={styles.headerBadge}>
              <MaterialCommunityIcons name="shield-account" size={16} color={Colors.parentAccent} />
              <Text style={styles.headerBadgeText}>PARENT SETUP</Text>
            </View>
          </View>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Set up your family command centre</Text>

          {/* Form card */}
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>YOUR NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Mum or Dad"
                placeholderTextColor={Colors.parentMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={Colors.parentMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                style={styles.input}
                placeholder="Min 6 characters"
                placeholderTextColor={Colors.parentMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>CO-PARENT CODE <Text style={styles.optional}>(optional)</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. ABC123 — leave blank for new family"
                placeholderTextColor={Colors.parentMuted}
                value={inviteCode}
                onChangeText={t => setInviteCode(t.toUpperCase())}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.submitBtnText}>
              {loading ? 'CREATING ACCOUNT…' : 'ACCESS GRANTED →'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginLinkText}>Already have an account? SIGN IN →</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.parentBg },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 24,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.parentSecondary,
    borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 6,
  },
  headerBadgeText: { fontFamily: Fonts.bodyBold, fontSize: 10, color: Colors.parentAccent, letterSpacing: 1 },

  title:    { fontFamily: Fonts.parentH1, fontSize: 30, color: Colors.parentText, marginBottom: 6 },
  subtitle: { fontFamily: Fonts.body,     fontSize: 15, color: Colors.parentMuted, marginBottom: 24 },

  card: {
    backgroundColor: Colors.parentCard,
    borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    gap: 16,
  },
  divider: { height: 1, backgroundColor: Colors.parentBorder, marginVertical: 4 },

  inputGroup: { gap: 6 },
  label: {
    fontFamily: Fonts.bodyBold, fontSize: 10,
    color: Colors.parentMuted, letterSpacing: 1.5,
  },
  optional: { fontFamily: Fonts.body, fontSize: 10, color: Colors.parentMuted, letterSpacing: 0 },
  input: {
    backgroundColor: Colors.parentSurface,
    borderRadius: 8, borderWidth: 1, borderColor: Colors.parentBorder,
    paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: Fonts.body, fontSize: 15,
    color: Colors.parentText,
  },

  submitBtn: {
    backgroundColor: Colors.parentAccent,
    borderRadius: 9999, paddingVertical: 18,
    alignItems: 'center', marginBottom: 16,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: {
    fontFamily: Fonts.bodyBold, fontSize: 14,
    color: Colors.white, letterSpacing: 1.5,
  },

  loginLink: { alignItems: 'center', paddingVertical: 8 },
  loginLinkText: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.parentMuted, letterSpacing: 1 },
});
