import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';

// Persistent status header used on every child screen.
// Always shows current gem balance — never have to hunt for it.
interface Props {
  name: string;
  gems: number;
  lifetime?: number;
  compact?: boolean;
  onSignOut?: () => void;
}

export default function GemHeader({ name, gems, lifetime, compact, onSignOut }: Props) {
  return (
    <LinearGradient
      colors={['#FF8A5B', '#FF6B5C', '#B94AAA']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, compact && styles.headerCompact]}
    >
      {compact ? (
        <View style={styles.row}>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.gemPill}>
            <Text style={styles.gemBig}>{gems}</Text>
            <Text style={styles.gemPillLbl}>GEMS</Text>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.row}>
            <Text style={styles.greeting}>Hi {name}</Text>
            {onSignOut ? (
              <TouchableOpacity onPress={onSignOut}>
                <Text style={styles.signOut}>Sign out</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.statsRow}>
            <View>
              <Text style={styles.statLabel}>YOUR GEMS</Text>
              <Text style={styles.statBig}>{gems}</Text>
            </View>
            {typeof lifetime === 'number' && (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.statLabel}>LIFETIME</Text>
                <Text style={styles.statMed}>{lifetime}</Text>
              </View>
            )}
          </View>
        </>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 22 },
  headerCompact: { paddingTop: 50, paddingBottom: 14 },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { color: '#fff', fontSize: 22, fontWeight: '600' },
  signOut: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  name: { color: '#fff', fontSize: 14, opacity: 0.9 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 14 },
  statLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 11, letterSpacing: 1.5, fontWeight: '600', marginBottom: 4 },
  statBig: { color: '#fff', fontSize: 44, fontWeight: '700', lineHeight: 46 },
  statMed: { color: '#fff', fontSize: 20, fontWeight: '600' },

  gemPill: { alignItems: 'flex-end' },
  gemBig: { color: '#fff', fontSize: 24, fontWeight: '700', lineHeight: 26 },
  gemPillLbl: { color: 'rgba(255,255,255,0.85)', fontSize: 10, letterSpacing: 1, fontWeight: '600' },
});
