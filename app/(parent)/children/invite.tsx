import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  Share, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Invite } from '@/lib/supabase';
import { Colors } from '@/constants/colors';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function InviteChild() {
  const { family, profile } = useAuth();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(false);
  const [existingInvites, setExistingInvites] = useState<Invite[]>([]);

  useEffect(() => { loadInvites(); }, [family]);

  async function loadInvites() {
    if (!family) return;
    const { data } = await supabase
      .from('invites')
      .select('*')
      .eq('family_id', family.id)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(3);
    setExistingInvites(data ?? []);
    if (data && data.length > 0) setInvite(data[0]);
  }

  async function createInvite() {
    if (!family || !profile) return;
    setLoading(true);
    const code = generateCode();
    const { data, error } = await supabase
      .from('invites')
      .insert({
        family_id: family.id,
        code,
        created_by: profile.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();
    setLoading(false);
    if (error) { Alert.alert('Error', error.message); return; }
    setInvite(data);
    loadInvites();
  }

  async function shareCode(code: string) {
    try {
      await Share.share({
        message: `Join my family on KidReward! 🏆\n\nUse invite code: ${code}\n\nOpen KidReward and enter this code to join.`,
        title: 'Join KidReward',
      });
    } catch (_) {}
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Invite a Child</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.description}>
          Share an invite code with your child. They enter it in the app to join your family.
        </Text>

        {invite ? (
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>Invite Code</Text>
            <Text style={styles.code}>{invite.code}</Text>
            <Text style={styles.expiry}>
              Expires {new Date(invite.expires_at).toLocaleDateString()}
            </Text>

            <TouchableOpacity
              style={styles.shareBtn}
              onPress={() => shareCode(invite.code)}
            >
              <Text style={styles.shareBtnText}>📤 Share Code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.newCodeBtn}
              onPress={createInvite}
              disabled={loading}
            >
              <Text style={styles.newCodeText}>
                {loading ? 'Creating…' : '+ Create New Code'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noCode}>
            <Text style={styles.noCodeEmoji}>📬</Text>
            <Text style={styles.noCodeTitle}>No active invite yet</Text>
            <TouchableOpacity
              style={[styles.createBtn, loading && styles.disabled]}
              onPress={createInvite}
              disabled={loading}
            >
              <Text style={styles.createBtnText}>
                {loading ? 'Creating…' : 'Create Invite Code'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* How it works */}
        <View style={styles.howTo}>
          <Text style={styles.howToTitle}>How it works</Text>
          {[
            { step: '1', text: 'Tap "Create Invite Code" above' },
            { step: '2', text: 'Share the 6-character code with your child' },
            { step: '3', text: 'Your child signs up and enters the code' },
            { step: '4', text: 'They appear in your Kids list!' },
          ].map((item) => (
            <View key={item.step} style={styles.step}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{item.step}</Text>
              </View>
              <Text style={styles.stepText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.parentBg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.parentBorder,
  },
  back: { color: Colors.purple, fontSize: 16, fontWeight: '600', width: 60 },
  title: { fontSize: 18, fontWeight: '800', color: Colors.textDark },
  scroll: { padding: 24, paddingBottom: 40 },
  description: { fontSize: 15, color: Colors.textMid, lineHeight: 22, marginBottom: 28 },
  codeCard: {
    backgroundColor: Colors.parentCard, borderRadius: 24,
    padding: 28, alignItems: 'center', marginBottom: 28,
    borderWidth: 2, borderColor: Colors.purple,
    shadowColor: Colors.purple, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 4,
  },
  codeLabel: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, letterSpacing: 2, marginBottom: 12 },
  code: {
    fontSize: 48, fontWeight: '900', color: Colors.purple,
    letterSpacing: 8, marginBottom: 8,
  },
  expiry: { fontSize: 13, color: Colors.textMuted, marginBottom: 24 },
  shareBtn: {
    backgroundColor: Colors.purple, paddingHorizontal: 32,
    paddingVertical: 14, borderRadius: 14, width: '100%', alignItems: 'center', marginBottom: 10,
  },
  shareBtnText: { color: Colors.textLight, fontWeight: '700', fontSize: 16 },
  newCodeBtn: { paddingVertical: 12 },
  newCodeText: { color: Colors.textMuted, fontSize: 14 },
  noCode: { alignItems: 'center', paddingVertical: 40 },
  noCodeEmoji: { fontSize: 52, marginBottom: 16 },
  noCodeTitle: { fontSize: 18, fontWeight: '700', color: Colors.textDark, marginBottom: 24 },
  createBtn: {
    backgroundColor: Colors.purple, paddingHorizontal: 32,
    paddingVertical: 16, borderRadius: 14,
  },
  disabled: { opacity: 0.5 },
  createBtnText: { color: Colors.textLight, fontWeight: '700', fontSize: 16 },
  howTo: {
    backgroundColor: Colors.parentCard, borderRadius: 20,
    padding: 20, gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  howToTitle: { fontSize: 16, fontWeight: '800', color: Colors.textDark, marginBottom: 4 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.purple, alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { color: Colors.textLight, fontWeight: '700', fontSize: 13 },
  stepText: { fontSize: 14, color: Colors.textMid, flex: 1 },
});
