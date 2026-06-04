import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';

export default function JoinFamily() {
  const { profile, refreshFamily, signOut } = useAuth();
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);

  async function join() {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) {
      Alert.alert('Invalid code', 'The invite code is 6 characters long.');
      return;
    }

    setJoining(true);

    // Look up invite
    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .select('*')
      .eq('code', trimmed)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (inviteError || !invite) {
      setJoining(false);
      Alert.alert('Code not found', 'This code is invalid or has expired. Ask your parent for a new one!');
      return;
    }

    // Add to family
    const { error: memberError } = await supabase
      .from('family_members')
      .insert({
        family_id: invite.family_id,
        child_id: profile!.id,
      });

    if (memberError) {
      setJoining(false);
      if (memberError.code === '23505') {
        Alert.alert('Already joined!', "You're already in this family.");
      } else {
        Alert.alert('Error', memberError.message);
      }
      return;
    }

    // Mark invite as used
    await supabase
      .from('invites')
      .update({ used_by: profile!.id, used_at: new Date().toISOString() })
      .eq('id', invite.id);

    setJoining(false);
    await refreshFamily();
    // Navigation will happen automatically via dashboard useEffect
  }

  return (
    <LinearGradient
      colors={[Colors.childBg, Colors.childCard, Colors.purple]}
      style={styles.container}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
    >
      {/* Decorative */}
      <Text style={styles.deco1}>💎</Text>
      <Text style={styles.deco2}>⭐</Text>
      <Text style={styles.deco3}>🌟</Text>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.inner}
      >
        <Text style={styles.emoji}>🏆</Text>
        <Text style={styles.title}>Join Your Family!</Text>
        <Text style={styles.subtitle}>
          Ask your parent for the invite code and enter it below
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
          />
        </View>

        <Text style={styles.hint}>
          {code.length}/6 characters
        </Text>

        <TouchableOpacity
          style={[styles.joinBtn, (joining || code.length < 6) && styles.disabled]}
          onPress={join}
          disabled={joining || code.length < 6}
        >
          <LinearGradient
            colors={[Colors.gem, Colors.gemGlow]}
            style={styles.joinBtnGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <Text style={styles.joinBtnText}>
              {joining ? 'Joining…' : "Let's Go! 🚀"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.steps}>
          {[
            '🤔 Ask your parent for the invite code',
            '✏️ Type the 6-letter code above',
            '🎉 Join your family and start earning gems!',
          ].map((s, i) => (
            <Text key={i} style={styles.step}>{s}</Text>
          ))}
        </View>

        <TouchableOpacity onPress={signOut} style={styles.signOutRow}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  deco1: { position: 'absolute', top: 80, right: 28, fontSize: 36, opacity: 0.3 },
  deco2: { position: 'absolute', top: 150, left: 20, fontSize: 28, opacity: 0.25 },
  deco3: { position: 'absolute', top: 220, right: 60, fontSize: 22, opacity: 0.2 },
  inner: {
    flex: 1, paddingHorizontal: 28, paddingTop: 80,
    alignItems: 'center', justifyContent: 'center',
  },
  emoji: { fontSize: 72, marginBottom: 16 },
  title: { fontSize: 32, fontWeight: '900', color: Colors.textLight, textAlign: 'center', marginBottom: 10 },
  subtitle: {
    fontSize: 16, color: 'rgba(255,255,255,0.6)',
    textAlign: 'center', lineHeight: 24, marginBottom: 36,
  },
  codeContainer: {
    width: '100%', marginBottom: 10,
  },
  codeInput: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20, paddingVertical: 20,
    fontSize: 40, fontWeight: '900',
    color: Colors.gem, letterSpacing: 12,
    borderWidth: 2, borderColor: 'rgba(0,212,255,0.3)',
    width: '100%',
  },
  hint: { color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 28 },
  joinBtn: { width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: 32 },
  disabled: { opacity: 0.4 },
  joinBtnGradient: { paddingVertical: 18, alignItems: 'center' },
  joinBtnText: { color: Colors.textDark, fontSize: 20, fontWeight: '900' },
  steps: {
    gap: 10, width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16, padding: 18, marginBottom: 24,
  },
  step: { color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 20 },
  signOutRow: { paddingVertical: 12 },
  signOutText: { color: 'rgba(255,255,255,0.35)', fontSize: 14 },
});
