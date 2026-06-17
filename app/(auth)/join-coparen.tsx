import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';

export default function JoinAsCoParent() {
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

    const { data: invite, error: invErr } = await supabase
      .from('invites')
      .select('*')
      .eq('code', trimmed)
      .eq('invite_type', 'parent')
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (invErr || !invite) {
      setJoining(false);
      Alert.alert('Code not found', 'This co-parent invite code is invalid or has expired. Ask the family owner for a new one.');
      return;
    }

    const { error: joinErr } = await supabase
      .from('family_co_parents')
      .insert({
        family_id: invite.family_id,
        co_parent_id: profile!.id,
        invited_by: invite.created_by,
      });

    if (joinErr) {
      setJoining(false);
      if (joinErr.code === '23505') {
        Alert.alert("Already joined!", "You're already co-managing this family.");
      } else {
        Alert.alert('Error', joinErr.message);
      }
      return;
    }

    await supabase
      .from('invites')
      .update({ used_by: profile!.id, used_at: new Date().toISOString(), status: 'used' })
      .eq('id', invite.id);

    setJoining(false);
    await refreshFamily();
    router.replace('/(parent)/dashboard');
  }

  return (
    <LinearGradient colors={['#FF8A5B', '#FF6B5C', '#7A3CE1']} style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.container}>
          <Text style={styles.title}>Join as Co-Parent 👨‍👩‍👧</Text>
          <Text style={styles.subtitle}>
            Enter the invite code from the family owner to start co-managing together
          </Text>

          <TextInput
            style={styles.codeInput}
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase())}
            placeholder="ABC123"
            placeholderTextColor="rgba(255,255,255,0.4)"
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
            <Text style={styles.joinBtnText}>{joining ? 'Joining…' : 'Join Family'}</Text>
          </TouchableOpacity>

          <View style={styles.steps}>
            {[
              'Ask the family owner to go to Family → Invite → Co-Parent tab',
              'They create and share a 6-letter code',
              'Enter the code above to join their family',
            ].map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity onPress={signOut} style={styles.signOutRow}>
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 28, paddingTop: 80, paddingBottom: 40 },
  title:    { fontSize: 30, fontFamily: Fonts.parentH1, color: Colors.white, marginBottom: 8 },
  subtitle: { fontSize: 15, fontFamily: Fonts.body, color: 'rgba(255,255,255,0.7)', lineHeight: 22, marginBottom: 36 },
  codeInput: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 18, paddingVertical: 22,
    fontSize: 36, fontFamily: Fonts.bodyBold,
    color: Colors.white, letterSpacing: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 8,
  },
  hint:    { color: 'rgba(255,255,255,0.5)', fontFamily: Fonts.body, fontSize: 13, marginBottom: 28, textAlign: 'center' },
  joinBtn: {
    backgroundColor: Colors.white, borderRadius: 9999,
    paddingVertical: 18, alignItems: 'center', marginBottom: 32,
  },
  disabled: { opacity: 0.4 },
  joinBtnText: { color: Colors.primary, fontSize: 16, fontFamily: Fonts.bodyBold },
  steps: {
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: 20, gap: 16, marginBottom: 24,
  },
  stepRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  stepNum:    { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: Colors.primary, fontFamily: Fonts.bodyBold, fontSize: 13 },
  stepText:   { color: 'rgba(255,255,255,0.85)', fontFamily: Fonts.body, fontSize: 14, flex: 1, lineHeight: 20 },
  signOutRow: { paddingVertical: 12, alignItems: 'center' },
  signOutText: { color: 'rgba(255,255,255,0.5)', fontFamily: Fonts.body, fontSize: 14 },
});
