import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
    <LinearGradient colors={['#FF8A5B', '#FF6B5C', '#7A3CE1']} style={styles.bg}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Welcome back! 👋</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          <View style={styles.form}>
            {errorMsg ? (
              <View style={styles.errorBox} testID="login-error">
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

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
                autoComplete="email"
              />
            </View>

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
                placeholderTextColor={Colors.onSurfaceVariant}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryContainer]}
                style={styles.submitGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.submitText}>
                  {loading ? 'Signing in…' : 'Sign In'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text style={styles.switchText}>
              Don't have an account?{' '}
              <Text style={styles.switchLink}>Sign up</Text>
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
  back: { marginBottom: 32 },
  backText: { color: 'rgba(255,255,255,0.6)', fontSize: 16, fontFamily: Fonts.body },
  title: { fontSize: 32, fontFamily: Fonts.parentH1, color: Colors.white, marginBottom: 8 },
  subtitle: { fontSize: 16, fontFamily: Fonts.body, color: 'rgba(255,255,255,0.6)', marginBottom: 40 },
  form: { gap: 20, marginBottom: 32 },
  errorBox: {
    backgroundColor: 'rgba(255,61,0,0.15)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.danger,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: { color: '#FF8A65', fontSize: 14, fontFamily: Fonts.body },
  inputGroup: { gap: 8 },
  passwordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontFamily: Fonts.bodyBold },
  forgotLink: { color: Colors.primary, fontSize: 13, fontFamily: Fonts.bodyBold },
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
  submitBtnDisabled: { opacity: 0.6 },
  submitGradient: { paddingVertical: 18, alignItems: 'center' },
  submitText: { color: Colors.white, fontSize: 18, fontFamily: Fonts.bodyBold },
  switchText: { color: 'rgba(255,255,255,0.6)', textAlign: 'center', fontSize: 15, fontFamily: Fonts.body },
  switchLink: { color: Colors.primary, fontFamily: Fonts.bodyBold },
});
