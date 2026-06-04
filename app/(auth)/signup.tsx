import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';

type Role = 'parent' | 'child';

export default function Signup() {
  const [role, setRole] = useState<Role>('parent');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      role,
      avatar_emoji: role === 'parent' ? '👨‍👩‍👧' : '🧒',
    });

    if (profileError) {
      setLoading(false);
      Alert.alert('Profile error', profileError.message);
      return;
    }

    // If parent, create their family
    if (role === 'parent') {
      await supabase.from('families').insert({
        name: `${name.trim()}'s Family`,
        parent_id: data.user.id,
      });
    }

    setLoading(false);
    // Auth state change will redirect automatically
  }

  return (
    <LinearGradient colors={[Colors.childBg, Colors.childCard]} style={styles.bg}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Create account 🎉</Text>
          <Text style={styles.subtitle}>Who are you?</Text>

          {/* Role selector */}
          <View style={styles.roleRow}>
            {(['parent', 'child'] as Role[]).map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.roleCard, role === r && styles.roleCardActive]}
                onPress={() => setRole(r)}
              >
                <Text style={styles.roleEmoji}>{r === 'parent' ? '👨‍👩‍👧' : '🧒'}</Text>
                <Text style={[styles.roleLabel, role === r && styles.roleLabelActive]}>
                  {r === 'parent' ? 'Parent' : 'Child'}
                </Text>
                <Text style={styles.roleDesc}>
                  {r === 'parent' ? 'Set challenges & rewards' : 'Complete tasks & earn gems'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Your name</Text>
              <TextInput
                style={styles.input}
                placeholder={role === 'parent' ? 'e.g. Mum or Dad' : 'e.g. Alex'}
                placeholderTextColor={Colors.textMuted}
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
                placeholderTextColor={Colors.textMuted}
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
            >
              <LinearGradient
                colors={[Colors.purple, Colors.purpleLight]}
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
  backText: { color: 'rgba(255,255,255,0.6)', fontSize: 16 },
  title: { fontSize: 32, fontWeight: '800', color: Colors.textLight, marginBottom: 8 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.6)', marginBottom: 20 },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  roleCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleCardActive: { borderColor: Colors.gem, backgroundColor: 'rgba(0,212,255,0.1)' },
  roleEmoji: { fontSize: 32, marginBottom: 6 },
  roleLabel: { color: 'rgba(255,255,255,0.6)', fontWeight: '700', fontSize: 16, marginBottom: 4 },
  roleLabelActive: { color: Colors.gem },
  roleDesc: { color: 'rgba(255,255,255,0.4)', fontSize: 11, textAlign: 'center' },
  form: { gap: 18, marginBottom: 28 },
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
  disabled: { opacity: 0.6 },
  submitGradient: { paddingVertical: 18, alignItems: 'center' },
  submitText: { color: Colors.textLight, fontSize: 18, fontWeight: '700' },
  switchText: { color: 'rgba(255,255,255,0.6)', textAlign: 'center', fontSize: 15 },
  switchLink: { color: Colors.gem, fontWeight: '700' },
});
