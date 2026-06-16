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
  const [childInvites, setChildInvites] = useState<Invite[]>([]);
  const [parentInvite, setParentInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [childEmail, setChildEmail] = useState('');

  useEffect(() => { loadInvites(); }, [family]);

  async function loadInvites() {
    if (!family) return;
    const { data } = await supabase
      .from('invites')
      .select('*')
      .eq('family_id', family.id)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    const all = data ?? [];
    setChildInvites(all.filter((i: any) => i.invite_type === 'child' && i.email));
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
      status: 'pending',
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

    if (type === 'child') {
      setChildInvites(prev => [data, ...prev]);
      setShowForm(false);
      setChildEmail('');
    } else {
      setParentInvite(data);
    }

    if (type === 'child' && emailToUse) {
      supabase.functions.invoke('send-invite-email', {
        body: { email: emailToUse, code, familyName: family?.name },
      }).then(({ error: emailErr }) => {
        if (emailErr) console.warn('Invite email failed:', emailErr.message);
      });
    }
  }

  async function cancelInvite(inviteId: string) {
    await supabase.from('invites').update({ status: 'cancelled' }).eq('id', inviteId);
    setChildInvites(prev => prev.filter(i => i.id !== inviteId));
  }

  async function resendInvite(invite: Invite) {
    setLoading(true);
    await supabase.from('invites').update({ status: 'cancelled' }).eq('id', invite.id);
    setChildInvites(prev => prev.filter(i => i.id !== invite.id));
    await createInvite('child', invite.email ?? '');
  }

  async function shareCode(code: string, type: TabType) {
    const msg = type === 'child'
      ? `Join my family on KidReward! 🏆\n\nUse invite code: ${code}\n\nSign up as a child and enter this code.`
      : `You're invited to co-manage our family on KidReward! 👨‍👩‍👧\n\nUse invite code: ${code}\n\nSign up as a parent and enter this code.`;
    try { await Share.share({ message: msg, title: 'Join KidReward' }); } catch (_) {}
  }

  const isChild = tab === 'child';

  const parentSteps = [
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
            ? 'Invite each child by email. They receive a locked invite code only usable with that email.'
            : 'Invite another parent to co-manage your family. They can approve challenges and manage rewards.'}
        </Text>

        {isChild ? (
          <>
            {/* Invite a Child button */}
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setShowForm(f => !f)}
              testID="add-child-invite-btn"
            >
              <Text style={styles.addBtnText}>{showForm ? '✕ Cancel' : '+ Invite a Child'}</Text>
            </TouchableOpacity>

            {/* Inline new-invite form */}
            {showForm && (
              <View style={styles.formCard}>
                <Text style={styles.emailLabel}>Child's email (required)</Text>
                <TextInput
                  style={styles.emailInput}
                  value={childEmail}
                  onChangeText={setChildEmail}
                  placeholder="child@example.com"
                  placeholderTextColor="#AAA"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoFocus
                  testID="child-email-input"
                />
                <TouchableOpacity
                  style={[styles.createBtn, (loading || !childEmail.trim()) && styles.disabled]}
                  onPress={() => createInvite('child')}
                  disabled={loading || !childEmail.trim()}
                  testID="create-invite-btn"
                >
                  <Text style={styles.createBtnText}>{loading ? 'Creating…' : 'Send Invite'}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Pending invite list */}
            {childInvites.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>PENDING INVITES</Text>
                {childInvites.map(invite => (
                  <View key={invite.id} style={styles.codeCard} testID={`invite-card-${invite.code}`}>
                    <View style={styles.emailBadge}>
                      <Text style={styles.emailBadgeLabel}>LOCKED TO EMAIL</Text>
                      <Text style={styles.emailBadgeValue} testID={`invite-email-${invite.code}`}>{invite.email}</Text>
                    </View>
                    <Text style={styles.code} testID={`invite-code-${invite.code}`}>{invite.code}</Text>
                    <Text style={styles.expiry}>
                      Expires {new Date(invite.expires_at).toLocaleDateString()}
                    </Text>
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.shareBtn}
                        onPress={() => shareCode(invite.code, 'child')}
                        testID={`share-btn-${invite.code}`}
                      >
                        <Text style={styles.actionBtnText}>📤 Share</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.resendBtn}
                        onPress={() => resendInvite(invite)}
                        disabled={loading}
                        testID={`resend-btn-${invite.code}`}
                      >
                        <Text style={styles.actionBtnText}>🔄 Resend</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => {
                          Alert.alert('Cancel invite?', `Remove the invite for ${invite.email}?`, [
                            { text: 'Keep', style: 'cancel' },
                            { text: 'Cancel invite', style: 'destructive', onPress: () => cancelInvite(invite.id) },
                          ]);
                        }}
                        testID={`cancel-btn-${invite.code}`}
                      >
                        <Text style={styles.cancelBtnText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            )}

            {childInvites.length === 0 && !showForm && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📬</Text>
                <Text style={styles.emptyTitle}>No pending invites</Text>
                <Text style={styles.emptySubtitle}>Tap "+ Invite a Child" above to get started.</Text>
              </View>
            )}
          </>
        ) : (
          /* Co-parent tab — unchanged single invite UI */
          parentInvite ? (
            <View style={[styles.codeCard, styles.codeCardParent]}>
              <Text style={styles.codeLabel}>Parent Invite Code</Text>
              <Text style={[styles.code, styles.codeParent]}>{parentInvite.code}</Text>
              <Text style={styles.expiry}>
                Expires {new Date(parentInvite.expires_at).toLocaleDateString()}
              </Text>
              <TouchableOpacity style={[styles.shareBtn, styles.shareBtnParent]} onPress={() => shareCode(parentInvite.code, 'parent')}>
                <Text style={styles.actionBtnText}>📤 Share Code</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.newCodeBtn} onPress={() => createInvite('parent')} disabled={loading}>
                <Text style={styles.newCodeText}>{loading ? 'Creating…' : '+ New Code'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>👨‍👩‍👧</Text>
              <Text style={styles.emptyTitle}>No active invite yet</Text>
              <TouchableOpacity
                style={[styles.createBtn, styles.createBtnParent, loading && styles.disabled]}
                onPress={() => createInvite('parent')}
                disabled={loading}
                testID="create-invite-btn"
              >
                <Text style={styles.createBtnText}>{loading ? 'Creating…' : 'Create Invite Code'}</Text>
              </TouchableOpacity>
            </View>
          )
        )}

        {!isChild && (
          <View style={styles.howTo}>
            <Text style={styles.howToTitle}>How it works</Text>
            {parentSteps.map((text, i) => (
              <View key={i} style={styles.step}>
                <View style={styles.stepNumParent}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{text}</Text>
              </View>
            ))}
          </View>
        )}
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
  description: { fontSize: 15, color: Colors.textMid, lineHeight: 22, marginBottom: 20 },
  addBtn: {
    backgroundColor: Colors.purple, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginBottom: 16,
  },
  addBtnText: { color: Colors.textLight, fontWeight: '700', fontSize: 16 },
  formCard: {
    backgroundColor: Colors.parentCard, borderRadius: 20, padding: 20,
    marginBottom: 20, borderWidth: 1, borderColor: Colors.parentBorder,
  },
  emailLabel: { fontSize: 13, fontWeight: '600', color: Colors.textMid, marginBottom: 8 },
  emailInput: {
    borderWidth: 1, borderColor: Colors.parentBorder, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: Colors.textDark, backgroundColor: Colors.parentBg,
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1.5,
    marginBottom: 12,
  },
  codeCard: {
    backgroundColor: Colors.parentCard, borderRadius: 20, padding: 20, marginBottom: 16,
    borderWidth: 2, borderColor: Colors.purple,
    shadowColor: Colors.purple, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 3,
  },
  codeCardParent: { borderColor: '#FF9500' },
  codeLabel: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, letterSpacing: 2, marginBottom: 12, textAlign: 'center' },
  emailBadge: {
    backgroundColor: Colors.purple + '18',
    borderRadius: 10, paddingVertical: 6, paddingHorizontal: 14,
    marginBottom: 10, alignItems: 'center',
  },
  emailBadgeLabel: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 2 },
  emailBadgeValue: { fontSize: 13, fontWeight: '700', color: Colors.purple },
  code: { fontSize: 36, fontWeight: '900', color: Colors.purple, letterSpacing: 6, marginBottom: 4, textAlign: 'center' },
  codeParent: { color: '#FF9500' },
  expiry: { fontSize: 12, color: Colors.textMuted, marginBottom: 14, textAlign: 'center' },
  actionRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  shareBtn: {
    flex: 1, backgroundColor: Colors.purple, paddingVertical: 10,
    borderRadius: 10, alignItems: 'center',
  },
  shareBtnParent: { backgroundColor: '#FF9500' },
  resendBtn: {
    flex: 1, backgroundColor: Colors.purple + '22', paddingVertical: 10,
    borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.purple,
  },
  cancelBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FF3B3022', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#FF3B30',
  },
  cancelBtnText: { color: '#FF3B30', fontWeight: '700', fontSize: 14 },
  actionBtnText: { color: Colors.purple, fontWeight: '700', fontSize: 13 },
  newCodeBtn: { paddingVertical: 10, alignItems: 'center' },
  newCodeText: { color: Colors.textMuted, fontSize: 14 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.textDark, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  createBtn: {
    backgroundColor: Colors.purple, paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: 14, marginTop: 16, alignItems: 'center', width: '100%',
  },
  createBtnParent: { backgroundColor: '#FF9500' },
  disabled: { opacity: 0.5 },
  createBtnText: { color: Colors.textLight, fontWeight: '700', fontSize: 16 },
  howTo: { backgroundColor: Colors.parentCard, borderRadius: 20, padding: 20, gap: 16, marginTop: 24 },
  howToTitle: { fontSize: 16, fontWeight: '800', color: Colors.textDark, marginBottom: 4 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepNumParent: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#FF9500', alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { color: Colors.textLight, fontWeight: '700', fontSize: 13 },
  stepText: { fontSize: 14, color: Colors.textMid, flex: 1 },
});
