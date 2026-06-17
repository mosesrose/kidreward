import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/colors';
import LevelBadge from './LevelBadge';

interface Props {
  name: string;
  gems: number;
  lifetime?: number;
  compact?: boolean;
  onSignOut?: () => void;
}

export default function GemHeader({ name, gems, lifetime, compact, onSignOut }: Props) {
  if (compact) {
    return (
      <View style={styles.headerCompact}>
        <View style={styles.row}>
          <View>
            <Text style={styles.nameSmall}>{name}</Text>
            <Text style={styles.gemCompact}>🔮 {gems} gems</Text>
          </View>
          {typeof lifetime === 'number' && (
            <LevelBadge totalGemsEarned={lifetime} compact />
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.header}>
      <View style={styles.row}>
        <View>
          <Text style={styles.greeting}>Hi {name} 👋</Text>
          {onSignOut ? (
            <TouchableOpacity onPress={onSignOut} style={{ marginTop: 4 }}>
              <Text style={styles.signOut}>Sign out</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.gemPill}>
          <Text style={styles.gemAmount}>🔮 {gems}</Text>
          <Text style={styles.gemLabel}>GEMS</Text>
        </View>
      </View>

      {typeof lifetime === 'number' && (
        <View style={{ marginTop: 16 }}>
          <LevelBadge totalGemsEarned={lifetime} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.childBg,
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: Colors.childBorder,
  },
  headerCompact: {
    backgroundColor: Colors.childBg,
    paddingTop: 50, paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.childBorder,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 22, fontWeight: '800', color: Colors.childText },
  signOut: { fontSize: 13, color: Colors.childMuted },
  nameSmall: { fontSize: 13, color: Colors.childMuted, marginBottom: 2 },
  gemCompact: { fontSize: 16, fontWeight: '800', color: Colors.childAccent },
  gemPill: { alignItems: 'flex-end' },
  gemAmount: { fontSize: 22, fontWeight: '900', color: Colors.childAccent },
  gemLabel: { fontSize: 10, color: Colors.childMuted, letterSpacing: 1, fontWeight: '600' },
});
