import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  Share, ScrollView, TextInput,
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

type TabType = 'child' | 'parent';

export default function InviteScreen() {
  const { family, profile } = useAuth();
  const [tab, setTab] = useState<TabType>('child');
  const [childInvite, setChildInvite] = useState<Invite | null>(null);
  const [parentInvite, setParentInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(false);
  const [childEmail, setChildEmail] = useState('');

  useEffect(() => { loadInvites(); }, [family]);

  async function loadInvites() {
    if (!family) return;
    const { data } = await supabase
      .from('invites')
      .select('*')
      .eq('family_id', family.id)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    const all = data ?? [];
    setChildInvite(all.find((i: { invite_type: string }) => i.invite_type === 'child') ?? null);
    setParentInvite(all.find((i: { invite_type: string }) => i.invite_type === 'parent') ?? null);
  }

  async function createInvite(type: TabType, emailOverride?: string) {
    if (!family || !profile) return;
    const emailToUse = (emailOverride ?? childEmail).trim();
    if (type === 'child' && emailToUse && !emailToUse.includes('@')) {
      Alert.alert('Invalid email', 'Please enter a valid email address for your child.');
      return;
    }
    setLoading(true);
    const code = generateCode();
    const insertPayload: Record<string, any> = {
      family_id: family.id,
      code,
      invite_type: type,
      created_by: profile.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    if (type === 'child' && emailToUse) {
      insertPayload.email = emailToUse.toLowerCase();
    }
    const { data, error } = await supabase
      .from('invites')
      .insert(insertPayload)
      .select()
      .single();
    setLoading(false);
    if (error) { Alert.alert('Error', error.message); return; }
    if (type === 'child') setChildInvite(data);
    else setParentInvite(data);
  }

  async function shareCode(code: string, type: TabType) {
    const msg = type === 'child'
      ? `Join my family on KidReward! 🏆\n\nUse invite code: ${code}\n\nSign up as a child and enter this code.`
      : `You're invited to co-manage our family on KidReward! 👨‍👩‍👧\n\nUse invite code: ${code}\n\nSign up as a parent and enter this code.`;
    try { await Share.share({ message: msg, title: 'Join KidReward' }); } catch (_) {}
  }

  const invite = tab === 'child' ? childInvite : parentInvite;
  const isChild = tab === 'child';

  const steps = isChild
    ? [
        'Tap "Create Invite Code" below',
        'Share the 6-character code with your child',
        'Your child signs up and enters the code',
        'They appear in your Kids list!',
      ]
    : [
        'Tap "Create Invite Code" below',
        'Share the code with the other parent',
        'They sign up as a parent and enter the code',
        'They can manage challenges and rewards too',
      ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Invite</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Tab selector */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'child' && styles.tabActive]}
          onPress={() => setTab('child')}
        >
          <Text style={[styles.tabText, tab === 'child' && styles.tabTextActive]}>👶 Child</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'parent' && styles.tabActive]}
          onPress={() => setTab('parent')}
        >
          <Text style={[styles.tabText, tab === 'parent' && styles.tabTextActive]}>👨‍👩‍👧 Co-Parent</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.description}>
          {isChild
            ? 'Share an invite code with your child. They enter it in the app to join your family.'
            : 'Invite another parent to co-manage your family. They can approve challenges and manage rewards.'}
        </Text>

        {invite ? (
          <View style={[styles.codeCard, !isChild && styles.codeCardParent]}>
            <Text style={styles.codeLabel}>
              {isChild ? 'Child Invite Code' : 'Parent Invite Code'}
            </Text>
            {isChild && invite.email ? (
              <View style={styles.emailBadge}>
                <Text style={styles.emailBadgeLabel}>LOCKED TO EMAIL</Text>
                <Text style={styles.emailBadgeValue}>{invite.email}</Text>
              </View>
            ) : null}
            <Text style={[styles.code, !isChild && styles.codeParent]}>{invite.code}</Text>
            <Text style={styles.expiry}>
              Expires {new Date(invite.expires_at).toLocaleDateString()}
            </Text>
            <TouchableOpacity style={[styles.shareBtn, !isChild && styles.shareBtnParent]} onPress={() => shareCode(invite.code, tab)}>
              <Text style={styles.shareBtnText}>📤 Share Code</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.newCodeBtn} onPress={() => createInvite(tab, isChild ? (invite.email ?? '') : undefined)} disabled={loading}>
              <Text style={styles.newCodeText}>{loading ? 'Creating…' : '+ New Code'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noCode}>
            <Text style={styles.noCodeEmoji}>{isChild ? '📬' : '👨‍👩‍👧'}</Text>
            <Text style={styles.noCodeTitle}>No active invite yet</Text>
            {isChild && (
              <View style={styles.emailRow}>
                <Text style={styles.emailLabel}>Child's email (required)</Text>
                <TextInput
                  style={styles.emailInput}
                  value={childEmail}
                  onChangeText={setChildEmail}
                  placeholder="child@example.com"
                  placeholderTextColor="#AAA"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  testID="child-email-input"
                />
              </View>
            )}
            <TouchableOpacity
              style={[styles.createBtn, !isChild && styles.createBtnParent, (loading || (isChild && !childEmail.trim())) && styles.disabled]}
              onPress={() => createInvite(tab)}
              disabled={loading || (isChild && !childEmail.trim())}
              testID="create-invite-btn"
            >
              <Text style={styles.createBtnText}>{loading ? 'Creating…' : 'Create Invite Code'}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.howTo}>
          <Text style={styles.howToTitle}>How it works</Text>
          {steps.map((text, i) => (
            <View key={i} style={styles.step}>
              <View style={[styles.stepNum, !isChild && styles.stepNumParent]}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{text}</Text>
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
  tabs: {
    flexDirection: 'row', margin: 20, marginBottom: 0,
    backgroundColor: Colors.parentCard, borderRadius: 14, padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: Colors.purple },
  tabText: { fontSize: 14, fontWeight: '700', color: Colors.textMuted },
  tabTextActive: { color: Colors.textLight },
  scroll: { padding: 24, paddingBottom: 40 },
  description: { fontSize: 15, color: Colors.textMid, lineHeight: 22, marginBottom: 28 },
  codeCard: {
    backgroundColor: Colors.parentCard, borderRadius: 24, padding: 28, alignItems: 'center', marginBottom: 28,
    borderWidth: 2, borderColor: Colors.purple,
    shadowColor: Colors.purple, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 4,
  },
  codeCardParent: { borderColor: '#FF9500' },
  codeLabel: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, letterSpacing: 2, marginBottom: 12 },
  code: { fontSize: 48, fontWeight: '900', color: Colors.purple, letterSpacing: 8, marginBottom: 8 },
  codeParent: { color: '#FF9500' },
  expiry: { fontSize: 13, color: Colors.textMuted, marginBottom: 24 },
  shareBtn: {
    backgroundColor: Colors.purple, paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: 14, width: '100%', alignItems: 'center', marginBottom: 10,
  },
  shareBtnParent: { backgroundColor: '#FF9500' },
  shareBtnText: { color: Colors.textLight, fontWeight: '700', fontSize: 16 },
  newCodeBtn: { paddingVertical: 12 },
  newCodeText: { color: Colors.textMuted, fontSize: 14 },
  noCode: { alignItems: 'center', paddingVertical: 40 },
  noCodeEmoji: { fontSize: 52, marginBottom: 16 },
  noCodeTitle: { fontSize: 18, fontWeight: '700', color: Colors.textDark, marginBottom: 16 },
  emailRow: { width: '100%', marginBottom: 20 },
  emailLabel: { fontSize: 13, fontWeight: '600', color: Colors.textMid, marginBottom: 8 },
  emailInput: {
    borderWidth: 1, borderColor: Colors.parentBorder, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: Colors.textDark, backgroundColor: Colors.parentCard,
  },
  emailBadge: {
    backgroundColor: Colors.purple + '18',
    borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16,
    marginBottom: 14, alignItems: 'center', width: '100%',
  },
  emailBadgeLabel: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 3 },
  emailBadgeValue: { fontSize: 14, fontWeight: '700', color: Colors.purple },
  createBtn: { backgroundColor: Colors.purple, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 14 },
  createBtnParent: { backgroundColor: '#FF9500' },
  disabled: { opacity: 0.5 },
  createBtnText: { color: Colors.textLight, fontWeight: '700', fontSize: 16 },
  howTo: { backgroundColor: Colors.parentCard, borderRadius: 20, padding: 20, gap: 16 },
  howToTitle: { fontSize: 16, fontWeight: '800', color: Colors.textDark, marginBottom: 4 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.purple, alignItems: 'center', justifyContent: 'center',
  },
  stepNumParent: { backgroundColor: '#FF9500' },
  stepNumText: { color: Colors.textLight, fontWeight: '700', fontSize: 13 },
  stepText: { fontSize: 14, color: Colors.textMid, flex: 1 },
});
