import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
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

    await supabase
      .from('invites')
      .update({ used_by: profile!.id, used_at: new Date().toISOString() })
      .eq('id', invite.id);

    setJoining(false);
    await refreshFamily();
    router.replace('/(child)/home');
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.inner}
      >
        <Text style={styles.title}>Join Your Family!</Text>
        <Text style={styles.subtitle}>
          Ask your parent for the invite code and enter it below
        </Text>

        <TextInput
          style={styles.codeInput}
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase())}
          placeholder="ABC123"
          placeholderTextColor={Colors.textMuted}
          maxLength={6}
          autoCapitalize="characters"
          autoCorrect={false}
          textAlign="center"
        />
        <Text style={styles.hint}>{code.length}/6 characters</Text>

        <TouchableOpacity
          style={[styles.joinBtn, (joining || code.length < 6) && styles.disabled]}
          onPress={join}
          disabled={joining || code.length < 6}
        >
          <Text style={styles.joinBtnText}>
            {joining ? 'Joining…' : "Let's Go!"}
          </Text>
        </TouchableOpacity>

        <View style={styles.steps}>
          <Text style={styles.step}>1. Ask your parent for the invite code</Text>
          <Text style={styles.step}>2. Type the 6-letter code above</Text>
          <Text style={styles.step}>3. Join and start earning gems</Text>
        </View>

        <TouchableOpacity onPress={signOut} style={styles.signOutRow}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.childBg },
  inner: {
    flex: 1, paddingHorizontal: 28, paddingTop: 100,
  },
  title: { fontSize: 30, fontWeight: '700', color: Colors.textDark, marginBottom: 8 },
  subtitle: {
    fontSize: 15, color: Colors.textMuted, lineHeight: 22, marginBottom: 36,
  },

  codeInput: {
    backgroundColor: Colors.childCard,
    borderRadius: 18, paddingVertical: 22,
    fontSize: 36, fontWeight: '700',
    color: Colors.childAccent, letterSpacing: 10,
    borderWidth: 1, borderColor: Colors.border,
    marginBottom: 8,
  },
  hint: { color: Colors.textMuted, fontSize: 13, marginBottom: 28, textAlign: 'center' },

  joinBtn: {
    backgroundColor: Colors.childAccent,
    borderRadius: 100, paddingVertical: 18, alignItems: 'center', marginBottom: 32,
  },
  disabled: { opacity: 0.4 },
  joinBtnText: { color: Colors.textLight, fontSize: 16, fontWeight: '700' },

  steps: {
    gap: 8,
    backgroundColor: Colors.surfaceSoft,
    borderRadius: 16, padding: 18, marginBottom: 24,
  },
  step: { color: '#8A4A00', fontSize: 14, lineHeight: 20 },

  signOutRow: { paddingVertical: 12, alignItems: 'center' },
  signOutText: { color: Colors.textMuted, fontSize: 14 },
});
