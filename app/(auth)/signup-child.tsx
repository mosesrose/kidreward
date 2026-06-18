import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';

type Step = 'code' | 'verifying' | 'details';

export default function SignupChild() {
  const { refreshFamily } = useAuth();
  const params = useLocalSearchParams<{ code?: string }>();
  const [step, setStep] = useState<Step>('code');
  const [code, setCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [inviteId, setInviteId] = useState('');
  const [familyId, setFamilyId] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [inviteEmail, setInviteEmail] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const incoming = typeof params.code === 'string' ? params.code.trim().toUpperCase() : '';
    if (incoming.length === 6) {
      setCode(incoming);
      setStep('verifying');
      validateCode(incoming);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function validateCode(codeOverride?: string) {
    const trimmed = (codeOverride ?? code).trim().toUpperCase();
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
      .eq('status', 'pending')
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    setValidating(false);
    if (error || !invite) {
      if (codeOverride) {
        setLinkError("That invite link didn't work — it may be expired. Enter your code below.");
        setStep('code');
      } else {
        Alert.alert('Code not found', 'This code is invalid, expired, or not a child invite. Ask your parent for a new one!');
      }
      return;
    }
    setInviteId(invite.id);
    setFamilyId(invite.family_id);
    const emailFromInvite: string | null = (invite as any).email ?? null;
    setInviteEmail(emailFromInvite);
    if (emailFromInvite) setEmail(emailFromInvite);
    const fn = (invite as any).families?.name ?? 'your family';
    setFamilyName(fn);
    setLinkError('');
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
      Alert.alert('Wrong email', `This invite was sent to ${inviteEmail}. Please use that email address to sign up.`);
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

    await refreshFamily();
    setLoading(false);
    router.replace('/(child)/home');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {step !== 'verifying' && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => step === 'details' ? setStep('code') : router.back()}
            >
              <MaterialIcons name="arrow-back" size={22} color={Colors.kidText} />
            </TouchableOpacity>
          )}

          {/* --- VERIFYING --- */}
          {step === 'verifying' && (
            <View style={styles.verifyingBox} testID="verifying-invite">
              <Text style={styles.verifyingEmoji}>🔎</Text>
              <Text style={styles.verifyingTitle}>VERIFYING INVITE…</Text>
              <ActivityIndicator color={Colors.kidGreen} size="large" style={{ marginTop: 20 }} />
            </View>
          )}

          {/* --- CODE ENTRY --- */}
          {step === 'code' && (
            <>
              <View style={styles.stepHeader}>
                <Text style={styles.stepEyebrow}>STEP 1 OF 2</Text>
                <Text style={styles.stepTitle}>ENTER YOUR CODE</Text>
                <Text style={styles.stepSub}>Ask your parent for the 6-character invite code</Text>
              </View>

              {linkError ? (
                <View style={styles.errorBox}>
                  <MaterialIcons name="error-outline" size={16} color="#ff6b6b" />
                  <Text style={styles.errorText} testID="link-error-text">{linkError}</Text>
                </View>
              ) : null}

              <View style={styles.codeCard}>
                <TextInput
                  style={styles.codeInput}
                  value={code}
                  onChangeText={t => setCode(t.toUpperCase())}
                  placeholder="ABC123"
                  placeholderTextColor={Colors.kidMuted}
                  maxLength={6}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  textAlign="center"
                  testID="invite-code-input"
                />
                <Text style={styles.codeHint}>{code.length}/6</Text>
              </View>

              <View style={styles.stepsCard}>
                {[
                  '💬  Ask your parent for the invite code',
                  '✏️  Type the 6-letter code above',
                  '🏆  Create your account and start earning gems!',
                ].map((s, i) => (
                  <Text key={i} style={styles.step}>{s}</Text>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, (validating || code.length < 6) && styles.btnDisabled]}
                onPress={() => validateCode()}
                disabled={validating || code.length < 6}
                testID="validate-code-btn"
              >
                <Text style={styles.primaryBtnText}>
                  {validating ? 'CHECKING…' : 'NEXT →'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* --- DETAILS --- */}
          {step === 'details' && (
            <>
              <View style={styles.stepHeader}>
                <Text style={styles.stepEyebrow}>STEP 2 OF 2</Text>
                <Text style={styles.stepTitle}>JOIN {familyName.toUpperCase()}!</Text>
                <Text style={styles.stepSub}>Create your account to start earning gems</Text>
              </View>

              <View style={styles.formCard}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>YOUR NAME</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Alex"
                    placeholderTextColor={Colors.kidMuted}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>EMAIL</Text>
                  <TextInput
                    style={[styles.input, inviteEmail && styles.inputLocked]}
                    placeholder="you@example.com"
                    placeholderTextColor={Colors.kidMuted}
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
                  <Text style={styles.label}>PASSWORD</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Min 6 characters"
                    placeholderTextColor={Colors.kidMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.btnDisabled]}
                onPress={handleSignup}
                disabled={loading}
                testID="create-child-account-btn"
              >
                <Text style={styles.primaryBtnText}>
                  {loading ? 'CREATING ACCOUNT…' : 'ENTER THE ARENA →'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.loginLink} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginLinkText}>Already have an account? SIGN IN →</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const CARD_BASE = {
  borderWidth: 2,
  borderColor: Colors.kidBorder,
  borderRadius: 0,
  shadowColor: Colors.kidDark,
  shadowOffset: { width: 4, height: 4 },
  shadowOpacity: 1 as number,
  shadowRadius: 0,
  elevation: 4,
} as const;

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.kidBg },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },

  verifyingBox:   { alignItems: 'center', paddingTop: 80 },
  verifyingEmoji: { fontSize: 48, marginBottom: 16 },
  verifyingTitle: { fontFamily: Fonts.kidsH1, fontSize: 20, color: Colors.kidText, letterSpacing: 2 },

  stepHeader: { marginBottom: 20 },
  stepEyebrow: { fontFamily: Fonts.bodyBold, fontSize: 9, color: Colors.kidMuted, letterSpacing: 2, marginBottom: 4 },
  stepTitle:   { fontFamily: Fonts.kidsDisplay, fontSize: 30, color: Colors.kidText, fontStyle: 'italic', lineHeight: 36, marginBottom: 6 },
  stepSub:     { fontFamily: Fonts.body, fontSize: 13, color: Colors.kidMuted },

  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.kidErrorBg + '33',
    borderWidth: 1, borderColor: '#ff6b6b',
    padding: 12, marginBottom: 16,
  },
  errorText: { fontFamily: Fonts.body, fontSize: 13, color: '#ff6b6b', flex: 1, lineHeight: 18 },

  codeCard: {
    ...CARD_BASE,
    backgroundColor: Colors.kidCard,
    padding: 20, alignItems: 'center', marginBottom: 16,
  },
  codeInput: {
    width: '100%',
    backgroundColor: Colors.kidDark,
    borderWidth: 2, borderColor: Colors.kidBorder,
    paddingVertical: 18,
    fontSize: 36, fontFamily: Fonts.kidsDisplay,
    color: Colors.kidAccent, letterSpacing: 12,
    textAlign: 'center',
  },
  codeHint: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.kidMuted, letterSpacing: 1, marginTop: 10 },

  stepsCard: {
    ...CARD_BASE,
    backgroundColor: Colors.kidCard,
    padding: 16, gap: 10, marginBottom: 20,
  },
  step: { fontFamily: Fonts.body, fontSize: 13, color: Colors.kidText, lineHeight: 20 },

  formCard: {
    ...CARD_BASE,
    backgroundColor: Colors.kidCard,
    padding: 16, gap: 16, marginBottom: 20,
  },
  inputGroup: { gap: 6 },
  label: { fontFamily: Fonts.bodyBold, fontSize: 9, color: Colors.kidMuted, letterSpacing: 2 },
  input: {
    backgroundColor: Colors.kidDark,
    borderWidth: 1, borderColor: Colors.kidBorder,
    padding: 12,
    fontFamily: Fonts.body, fontSize: 14,
    color: Colors.kidText,
  },
  inputLocked: { opacity: 0.5 },
  lockedHint: { fontFamily: Fonts.body, fontSize: 11, color: Colors.kidMuted, marginTop: 4 },

  primaryBtn: {
    backgroundColor: Colors.kidGreen,
    borderBottomWidth: 4, borderBottomColor: '#000',
    paddingVertical: 18, alignItems: 'center',
    marginBottom: 16,
  },
  btnDisabled: { opacity: 0.4 },
  primaryBtnText: {
    fontFamily: Fonts.kidsH1, fontSize: 15,
    color: Colors.kidGreenText, fontStyle: 'italic', letterSpacing: 1,
  },

  loginLink: { alignItems: 'center', paddingVertical: 8 },
  loginLinkText: { fontFamily: Fonts.bodyBold, fontSize: 11, color: Colors.kidMuted, letterSpacing: 1 },
});
