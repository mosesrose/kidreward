import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleLogin() {
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg('Please enter your email and password.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      setErrorMsg(error.message);
      return;
    }
    // Navigate to root so index.tsx can redirect to the correct dashboard by role
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Fixed header bar ── */}
      <View style={styles.topBar}>
        <MaterialCommunityIcons name="shield-account" size={20} color={Colors.parentAccent} />
        <Text style={styles.topBarText}>APYX SECURE</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back link */}
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={18} color={Colors.parentMuted} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          {/* ── Main card ── */}
          <View style={styles.card}>
            {/* Logo circle */}
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons name="shield-account" size={40} color={Colors.parentAccent} />
            </View>

            <Text style={styles.cardTitle}>Parent Terminal</Text>
            <Text style={styles.cardSubtitle}>
              Sign in to manage your family's rewards and challenges
            </Text>

            {/* Error box */}
            {errorMsg ? (
              <View style={styles.errorBox} testID="login-error">
                <MaterialIcons name="error-outline" size={16} color={Colors.danger} style={{ marginRight: 6 }} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Email input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={Colors.parentMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            {/* Password input */}
            <View style={styles.inputGroup}>
              <View style={styles.passwordHeader}>
                <Text style={styles.label}>Password</Text>
                <TouchableOpacity onPress={() => router.push('/forgot-password' as any)}>
                  <Text style={styles.forgotLink}>Forgot password?</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Your password"
                placeholderTextColor={Colors.parentMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {/* CTA button */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.submitText}>
                {loading ? 'SIGNING IN…' : 'ACCESS TERMINAL'}
              </Text>
            </TouchableOpacity>

            {/* Switch to kid mode */}
            <TouchableOpacity
              style={styles.kidModeBtn}
              onPress={() => router.push('/(auth)/signup-child' as any)}
            >
              <MaterialIcons name="sports-esports" size={16} color={Colors.parentMuted} style={{ marginRight: 6 }} />
              <Text style={styles.kidModeBtnText}>SWITCH TO KID MODE</Text>
            </TouchableOpacity>
          </View>

          {/* Sign-up link */}
          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text style={styles.switchText}>
              Don't have an account?{' '}
              <Text style={styles.switchLink}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.parentBg },

  // ── Top bar ──────────────────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.parentBg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.parentBorder,
  },
  topBarText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.parentAccent,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  container: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  back: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 24 },
  backText: { color: Colors.parentMuted, fontSize: 14, fontFamily: Fonts.body },

  // ── Card ─────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: Colors.parentCard,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 24,
    alignItems: 'center',
  },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.parentSecondary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: Fonts.kidsH1,
    fontSize: 26,
    color: Colors.parentText,
    marginBottom: 6,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.parentMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },

  // ── Error ─────────────────────────────────────────────────────────────────
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff0f0',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.danger,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'stretch',
    marginBottom: 16,
  },
  errorText: { color: Colors.danger, fontSize: 14, fontFamily: Fonts.body, flex: 1 },

  // ── Inputs ────────────────────────────────────────────────────────────────
  inputGroup: { gap: 6, alignSelf: 'stretch', marginBottom: 16 },
  passwordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: {
    color: Colors.parentText,
    fontSize: 13,
    fontFamily: Fonts.bodyBold,
    letterSpacing: 0.5,
  },
  forgotLink: { color: Colors.parentAccent, fontSize: 12, fontFamily: Fonts.bodyBold },
  input: {
    backgroundColor: Colors.parentSurface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: Colors.parentText,
    fontSize: 15,
    fontFamily: Fonts.body,
    alignSelf: 'stretch',
  },

  // ── CTA button ────────────────────────────────────────────────────────────
  submitBtn: {
    backgroundColor: Colors.parentAccent,
    borderRadius: 9999,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    alignSelf: 'stretch',
    marginBottom: 12,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: {
    color: Colors.white,
    fontSize: 15,
    fontFamily: Fonts.bodyBold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // ── Kid mode pill ─────────────────────────────────────────────────────────
  kidModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.parentMuted,
    borderRadius: 9999,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  kidModeBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.parentMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // ── Sign-up link ──────────────────────────────────────────────────────────
  switchText: {
    color: Colors.parentMuted,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: Fonts.body,
  },
  switchLink: { color: Colors.parentAccent, fontFamily: Fonts.bodyBold },
});
