import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import { AVATAR_OPTIONS } from '@/constants/challenges';

export default function CompleteProfile() {
  const { profile, refreshProfile, signOut } = useAuth();
  const [avatar, setAvatar] = useState(profile?.avatar_emoji ?? '🧒');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const { supabase } = await import('@/lib/supabase');
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_emoji: avatar })
      .eq('id', profile?.id);
    setSaving(false);
    if (error) { Alert.alert('Error', error.message); return; }
    await refreshProfile();
  }

  return (
    <LinearGradient colors={['#FF8A5B', '#FF6B5C', '#7A3CE1']} style={styles.bg}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Pick your avatar! 🎨</Text>
        <Text style={styles.subtitle}>Choose an emoji that represents you</Text>

        <Text style={styles.preview}>{avatar}</Text>

        <View style={styles.grid}>
          {AVATAR_OPTIONS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={[styles.avatarBtn, avatar === emoji && styles.avatarBtnActive]}
              onPress={() => setAvatar(emoji)}
            >
              <Text style={styles.avatarEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btn, saving && styles.disabled]}
          onPress={save}
          disabled={saving}
        >
          <LinearGradient
            colors={[Colors.purple, Colors.purpleLight]}
            style={styles.btnGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <Text style={styles.btnText}>{saving ? 'Saving…' : "Let's go! 🚀"}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={signOut}>
          <Text style={styles.signOut}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textLight, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.6)', marginBottom: 32, textAlign: 'center' },
  preview: { fontSize: 80, marginBottom: 32 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 40 },
  avatarBtn: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  avatarBtnActive: { borderColor: Colors.gem, backgroundColor: 'rgba(0,212,255,0.15)' },
  avatarEmoji: { fontSize: 32 },
  btn: { width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  disabled: { opacity: 0.6 },
  btnGradient: { paddingVertical: 18, alignItems: 'center' },
  btnText: { color: Colors.textLight, fontSize: 18, fontWeight: '700' },
  signOut: { color: 'rgba(255,255,255,0.4)', fontSize: 15 },
});
