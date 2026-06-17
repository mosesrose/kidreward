import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert, // eslint-disable-line
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
      // Co-parent path: validate code and join family
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
      // Primary parent path: create new family
      await supabase.from('families').insert({
        name: `${name.trim()}'s Family`,
        parent_id: data.user.id,
      });
    }

    setLoading(false);
    router.replace('/(parent)/dashboard');
  }

  return (
    <LinearGradient colors={['#FF8A5B', '#FF6B5C', '#7A3CE1']} style={styles.bg}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Parent sign up 👨‍👩‍👧</Text>
          <Text style={styles.subtitle}>Create your account to get started</Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Your name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Mum or Dad"
                placeholderTextColor={Colors.onSurfaceVariant}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={Colors.onSurfaceVariant}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Min 6 characters"
                placeholderTextColor={Colors.onSurfaceVariant}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Co-parent invite code (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. ABC123 — leave blank to create a new family"
                placeholderTextColor={Colors.onSurfaceVariant}
                value={inviteCode}
                onChangeText={(t) => setInviteCode(t.toUpperCase())}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.disabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryContainer]}
                style={styles.submitGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.submitText}>
                  {loading ? 'Creating account…' : 'Create Account 🚀'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.switchText}>
              Already have an account?{' '}
              <Text style={styles.switchLink}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  back: { marginBottom: 24 },
  backText: { color: 'rgba(255,255,255,0.6)', fontSize: 16, fontFamily: Fonts.body },
  title: { fontSize: 32, fontFamily: Fonts.parentH1, color: Colors.white, marginBottom: 8 },
  subtitle: { fontSize: 16, fontFamily: Fonts.body, color: 'rgba(255,255,255,0.6)', marginBottom: 20 },
  form: { gap: 18, marginBottom: 28 },
  inputGroup: { gap: 8 },
  label: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontFamily: Fonts.bodyBold },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.white,
    fontSize: 16,
    fontFamily: Fonts.body,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  submitBtn: { borderRadius: 9999, overflow: 'hidden' },
  disabled: { opacity: 0.6 },
  submitGradient: { paddingVertical: 18, alignItems: 'center' },
  submitText: { color: Colors.white, fontSize: 18, fontFamily: Fonts.bodyBold },
  switchText: { color: 'rgba(255,255,255,0.6)', textAlign: 'center', fontSize: 15, fontFamily: Fonts.body },
  switchLink: { color: Colors.primary, fontFamily: Fonts.bodyBold },
});
