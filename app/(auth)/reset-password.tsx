import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [done, setDone] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // Supabase JS v2 automatically picks up the recovery tokens from the URL hash.
    // Wait for the SIGNED_IN / PASSWORD_RECOVERY event to confirm the token is valid.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setHasSession(true);
      }
    });

    // Also check if session is already set (user revisiting after hydration)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setHasSession(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleUpdate() {
    setErrorMsg('');
    if (!password) {
      setErrorMsg('Please enter a new password.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setLoading(false);
      setErrorMsg(error.message);
      return;
    }
    // Clear the recovery session so the login page starts fresh
    await supabase.auth.signOut();
    setLoading(false);
    setDone(true);
  }

  if (done) {
    return (
      <LinearGradient colors={[Colors.childBg, Colors.childCard]} style={styles.bg}>
        <View style={styles.container}>
          <View style={styles.successBox} testID="reset-done">
            <Text style={styles.successTitle}>Password updated! 🎉</Text>
            <Text style={styles.successText}>You can now sign in with your new password.</Text>
            <TouchableOpacity style={styles.signInBtn} onPress={() => router.replace('/login' as any)}>
              <Text style={styles.signInBtnText}>Go to Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    );
  }

  if (!hasSession) {
    return (
      <LinearGradient colors={[Colors.childBg, Colors.childCard]} style={styles.bg}>
        <View style={styles.container}>
          <View style={styles.errorBox} testID="reset-invalid">
            <Text style={styles.errorTitle}>Link expired or invalid</Text>
            <Text style={styles.errorText}>
              This reset link has expired or already been used.
            </Text>
            <TouchableOpacity style={styles.signInBtn} onPress={() => router.replace('/forgot-password' as any)}>
              <Text style={styles.signInBtnText}>Request a new link</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[Colors.childBg, Colors.childCard]} style={styles.bg}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Set new password 🔒</Text>
          <Text style={styles.subtitle}>Choose a strong password for your account</Text>

          <View style={styles.form}>
            {errorMsg ? (
              <View style={styles.errorBox} testID="reset-pw-error">
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New password</Text>
              <TextInput
                style={styles.input}
                placeholder="Min 6 characters"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm password</Text>
              <TextInput
                style={styles.input}
                placeholder="Repeat your password"
                placeholderTextColor={Colors.textMuted}
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleUpdate}
              disabled={loading}
            >
              <LinearGradient
                colors={[Colors.purple, Colors.purpleLight]}
                style={styles.submitGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.submitText}>
                  {loading ? 'Updating…' : 'Update Password'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40 },
  title: { fontSize: 32, fontWeight: '800', color: Colors.textLight, marginBottom: 8 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.6)', marginBottom: 40 },
  form: { gap: 20 },
  errorBox: {
    backgroundColor: 'rgba(255,61,0,0.15)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.danger,
    padding: 16,
    gap: 8,
  },
  errorTitle: { color: Colors.textLight, fontWeight: '700', fontSize: 16 },
  errorText: { color: '#FF8A65', fontSize: 14 },
  successBox: {
    backgroundColor: 'rgba(0,200,83,0.12)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.success,
    padding: 24,
    gap: 16,
  },
  successTitle: { color: Colors.textLight, fontWeight: '800', fontSize: 20 },
  successText: { color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 22 },
  signInBtn: {
    backgroundColor: Colors.purple,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signInBtnText: { color: Colors.textLight, fontWeight: '700', fontSize: 16 },
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
