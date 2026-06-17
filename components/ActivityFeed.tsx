import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/colors';
import { FALLBACK_ICON } from '@/constants/icons';

type FeedItem = {
  id: string;
  kind: 'completion' | 'redemption';
  title: string;
  childName: string;
  icon: string;
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  gemsChange: number | null;
  updatedAt: string;
};

interface Props {
  familyId: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ActivityFeed({ familyId }: Props) {
  const [items, setItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    load();
  }, [familyId]);

  async function load() {
    const [{ data: comps }, { data: redemps }] = await Promise.all([
      supabase
        .from('completions')
        .select('id, status, gems_awarded, updated_at, challenges(title, emoji, family_id), profiles!completions_child_id_fkey(name)')
        .eq('challenges.family_id', familyId)
        .not('challenges', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(15),
      supabase
        .from('redemptions')
        .select('id, status, gems_spent, updated_at, rewards(title, emoji), profiles!redemptions_child_id_fkey(name)')
        .eq('family_id', familyId)
        .order('updated_at', { ascending: false })
        .limit(10),
    ]);

    const feed: FeedItem[] = [
      ...(comps ?? []).map((c: any) => ({
        id: `c-${c.id}`,
        kind: 'completion' as const,
        title: c.challenges?.title ?? 'Challenge',
        childName: c.profiles?.name ?? 'Child',
        icon: c.challenges?.emoji ?? FALLBACK_ICON,
        status: c.status,
        gemsChange: c.status === 'approved' ? c.gems_awarded : null,
        updatedAt: c.updated_at,
      })),
      ...(redemps ?? []).map((r: any) => ({
        id: `r-${r.id}`,
        kind: 'redemption' as const,
        title: r.rewards?.title ?? 'Reward',
        childName: r.profiles?.name ?? 'Child',
        icon: r.rewards?.emoji ?? FALLBACK_ICON,
        status: r.status,
        gemsChange: r.status === 'fulfilled' ? -r.gems_spent : null,
        updatedAt: r.updated_at,
      })),
    ]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 20);

    setItems(feed);
  }

  if (items.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Recent Activity</Text>
      {items.map((item) => (
        <View key={item.id} style={styles.row}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name={item.icon as any}
              size={22}
              color={Colors.purple}
            />
          </View>
          <View style={styles.body}>
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.meta}>{item.childName} · {timeAgo(item.updatedAt)}</Text>
          </View>
          <StatusChip item={item} />
        </View>
      ))}
    </View>
  );
}

function StatusChip({ item }: { item: FeedItem }) {
  if (item.kind === 'completion') {
    if (item.status === 'pending') {
      return (
        <View style={[styles.chip, { backgroundColor: 'rgba(255,184,77,0.12)', borderColor: 'rgba(255,184,77,0.3)' }]}>
          <Text style={[styles.chipText, { color: Colors.warning }]}>⏳ Review</Text>
        </View>
      );
    }
    if (item.status === 'approved') {
      return (
        <View style={[styles.chip, { backgroundColor: 'rgba(61,183,138,0.12)', borderColor: 'rgba(61,183,138,0.3)' }]}>
          <Text style={[styles.chipText, { color: Colors.success }]}>✓ +{item.gemsChange}💎</Text>
        </View>
      );
    }
    return (
      <View style={[styles.chip, { backgroundColor: 'rgba(229,85,69,0.1)', borderColor: 'rgba(229,85,69,0.3)' }]}>
        <Text style={[styles.chipText, { color: Colors.danger }]}>Rejected</Text>
      </View>
    );
  }
  // redemption
  if (item.status === 'pending') {
    return (
      <View style={[styles.chip, { backgroundColor: 'rgba(122,60,225,0.08)', borderColor: 'rgba(122,60,225,0.2)' }]}>
        <Text style={[styles.chipText, { color: Colors.purple }]}>Pending</Text>
      </View>
    );
  }
  return (
    <View style={[styles.chip, { backgroundColor: 'rgba(122,60,225,0.08)', borderColor: 'rgba(122,60,225,0.2)' }]}>
      <Text style={[styles.chipText, { color: Colors.purple }]}>{item.gemsChange}💎</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 4 },
  heading: { fontSize: 15, fontWeight: '800', color: Colors.textDark, marginBottom: 12 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.parentCard, borderRadius: 14, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: Colors.parentBorder,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(122,60,225,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  body: { flex: 1 },
  title: { fontSize: 13, fontWeight: '700', color: Colors.textDark },
  meta:  { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  chip: {
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5,
    borderWidth: 1,
  },
  chipText: { fontSize: 11, fontWeight: '700' },
});
