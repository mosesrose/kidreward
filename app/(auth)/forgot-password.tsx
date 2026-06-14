import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [sent, setSent] = useState(false);

  async function handleReset() {
    setErrorMsg('');
    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.EXPO_PUBLIC_SITE_URL ?? 'https://reward-hazel.vercel.app'}/reset-password`,
    });
    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
    } else {
      setSent(true);
    }
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

          <Text style={styles.title}>Reset password 🔑</Text>
          <Text style={styles.subtitle}>
            Enter your email and we'll send you a reset link
          </Text>

          {sent ? (
            <View style={styles.successBox} testID="reset-sent">
              <Text style={styles.successText}>
                Check your inbox! A password reset link has been sent to{' '}
                <Text style={{ fontWeight: '700' }}>{email}</Text>.
              </Text>
              <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(auth)/login')}>
                <Text style={styles.backBtnText}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              {errorMsg ? (
                <View style={styles.errorBox} testID="reset-error">
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                onPress={handleReset}
                disabled={loading}
              >
                <LinearGradient
                  colors={[Colors.purple, Colors.purpleLight]}
                  style={styles.submitGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.submitText}>
                    {loading ? 'Sending…' : 'Send Reset Link'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  back: { marginBottom: 32 },
  backText: { color: 'rgba(255,255,255,0.6)', fontSize: 16 },
  title: { fontSize: 32, fontWeight: '800', color: Colors.textLight, marginBottom: 8 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.6)', marginBottom: 40 },
  form: { gap: 20 },
  errorBox: {
    backgroundColor: 'rgba(255,61,0,0.15)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.danger,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: { color: '#FF8A65', fontSize: 14 },
  successBox: {
    backgroundColor: 'rgba(0,200,83,0.12)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.success,
    padding: 20,
    gap: 20,
  },
  successText: { color: Colors.textLight, fontSize: 16, lineHeight: 24 },
  backBtn: {
    backgroundColor: Colors.purple,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  backBtnText: { color: Colors.textLight, fontWeight: '700', fontSize: 16 },
  inputGroup: { gap: 8 },
  label: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.textLight,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  submitBtn: { borderRadius: 16, overflow: 'hidden' },
  submitBtnDisabled: { opacity: 0.6 },
  submitGradient: { paddingVertical: 18, alignItems: 'center' },
  submitText: { color: Colors.textLight, fontSize: 18, fontWeight: '700' },
});
