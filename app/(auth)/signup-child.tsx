import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';

type Step = 'code' | 'details';

export default function SignupChild() {
  const { refreshFamily } = useAuth();
  const [step, setStep] = useState<Step>('code');
  const [code, setCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [inviteId, setInviteId] = useState('');
  const [familyId, setFamilyId] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [inviteEmail, setInviteEmail] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function validateCode() {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) {
      Alert.alert('Invalid code', 'The invite code is 6 characters long.');
      return;
    }
    setValidating(true);
    const { data: invite, error } = await supabase
      .from('invites')
      .select('id, family_id, invite_type, email, families(name)')
      .eq('code', trimmed)
      .eq('invite_type', 'child')
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    setValidating(false);
    if (error || !invite) {
      Alert.alert('Code not found', 'This code is invalid, expired, or not a child invite. Ask your parent for a new one!');
      return;
    }
    setInviteId(invite.id);
    setFamilyId(invite.family_id);
    const emailFromInvite: string | null = (invite as any).email ?? null;
    setInviteEmail(emailFromInvite);
    if (emailFromInvite) setEmail(emailFromInvite); // sync so handleSignup sends correct email
    const fn = (invite as any).families?.name ?? 'your family';
    setFamilyName(fn);
    setStep('details');
  }

  async function handleSignup() {
    if (!name || !email || !password) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    if (inviteEmail && email.trim().toLowerCase() !== inviteEmail) {
      Alert.alert(
        'Wrong email',
        `This invite was sent to ${inviteEmail}. Please use that email address to sign up.`
      );
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
      role: 'child',
      avatar_emoji: '🧒',
    });
    if (profileError) {
      setLoading(false);
      Alert.alert('Profile error', profileError.message);
      return;
    }

    const { error: memberError } = await supabase.from('family_members').insert({
      family_id: familyId,
      child_id: data.user.id,
    });
    if (memberError) {
      setLoading(false);
      Alert.alert('Join error', memberError.message);
      return;
    }

    await supabase
      .from('invites')
      .update({ used_by: data.user.id, used_at: new Date().toISOString() })
      .eq('id', inviteId);

    // Refresh auth context so family_members row is visible before navigating
    await refreshFamily();
    setLoading(false);
    router.replace('/(child)/home');
  }

  return (
    <LinearGradient colors={[Colors.childBg, Colors.childCard]} style={styles.bg}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.back} onPress={() => step === 'details' ? setStep('code') : router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          {step === 'code' ? (
            <>
              <Text style={styles.emoji}>🎉</Text>
              <Text style={styles.title}>Enter invite code</Text>
              <Text style={styles.subtitle}>
                Ask your parent for their 6-character invite code
              </Text>

              <View style={styles.codeContainer}>
                <TextInput
                  style={styles.codeInput}
                  value={code}
                  onChangeText={(t) => setCode(t.toUpperCase())}
                  placeholder="ABC123"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  maxLength={6}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  textAlign="center"
                  testID="invite-code-input"
                />
              </View>
              <Text style={styles.hint}>{code.length}/6 characters</Text>

              <TouchableOpacity
                style={[styles.submitBtn, (validating || code.length < 6) && styles.disabled]}
                onPress={validateCode}
                disabled={validating || code.length < 6}
                testID="validate-code-btn"
              >
                <LinearGradient
                  colors={[Colors.gem, Colors.gemGlow]}
                  style={styles.submitGradient}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.submitTextDark}>
                    {validating ? 'Checking…' : 'Next →'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.steps}>
                {[
                  '🤔 Ask your parent for the invite code',
                  '✏️ Type the 6-letter code above',
                  '🎉 Create your account and start earning gems!',
                ].map((s, i) => (
                  <Text key={i} style={styles.step}>{s}</Text>
                ))}
              </View>
            </>
          ) : (
            <>
              <Text style={styles.emoji}>🏆</Text>
              <Text style={styles.title}>Join {familyName}!</Text>
              <Text style={styles.subtitle}>Create your account to start earning gems</Text>

              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Your name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Alex"
                    placeholderTextColor={Colors.textMuted}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={[styles.input, inviteEmail ? styles.inputLocked : null]}
                    placeholder="you@example.com"
                    placeholderTextColor={Colors.textMuted}
                    value={inviteEmail ?? email}
                    onChangeText={inviteEmail ? undefined : setEmail}
                    editable={!inviteEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                  {inviteEmail ? (
                    <Text style={styles.lockedHint}>Email set by your parent's invite</Text>
                  ) : null}
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Min 6 characters"
                    placeholderTextColor={Colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, loading && styles.disabled]}
                  onPress={handleSignup}
                  disabled={loading}
                  testID="create-child-account-btn"
                >
                  <LinearGradient
                    colors={[Colors.gem, Colors.gemGlow]}
                    style={styles.submitGradient}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.submitTextDark}>
                      {loading ? 'Creating account…' : 'Create Account 🚀'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          )}

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
  container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40, alignItems: 'center' },
  back: { alignSelf: 'flex-start', marginBottom: 24 },
  backText: { color: 'rgba(255,255,255,0.6)', fontSize: 16 },
  emoji: { fontSize: 64, marginBottom: 12 },
  title: { fontSize: 30, fontWeight: '800', color: Colors.textLight, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  codeContainer: { width: '100%', marginBottom: 10 },
  codeInput: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20, paddingVertical: 20,
    fontSize: 40, fontWeight: '900',
    color: Colors.gem, letterSpacing: 12,
    borderWidth: 2, borderColor: 'rgba(0,212,255,0.3)',
    width: '100%',
  },
  hint: { color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 28 },
  submitBtn: { width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: 24 },
  disabled: { opacity: 0.4 },
  submitGradient: { paddingVertical: 18, alignItems: 'center' },
  submitTextDark: { color: Colors.textDark, fontSize: 18, fontWeight: '800' },
  steps: {
    gap: 10, width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16, padding: 18, marginBottom: 24,
  },
  step: { color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 20 },
  form: { gap: 18, marginBottom: 28, width: '100%' },
  inputGroup: { gap: 8 },
  label: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    color: Colors.textLight, fontSize: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  inputLocked: { opacity: 0.6 },
  lockedHint: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 4 },
  switchText: { color: 'rgba(255,255,255,0.6)', textAlign: 'center', fontSize: 15 },
  switchLink: { color: Colors.gem, fontWeight: '700' },
});
