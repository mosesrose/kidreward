import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { getLevel, getLevelProgress, gemsToNextLevel } from '@/constants/levels';
import ProgressBar from './ProgressBar';

interface Props {
  totalGemsEarned: number;
  compact?: boolean;   // compact=true shows just the pill, no progress bar
}

export default function LevelBadge({ totalGemsEarned, compact }: Props) {
  const lv = getLevel(totalGemsEarned);
  const progress = getLevelProgress(totalGemsEarned);
  const toNext = gemsToNextLevel(totalGemsEarned);

  if (compact) {
    return (
      <View style={styles.pill}>
        <Text style={styles.pillText}>{lv.emoji} Lvl {lv.level}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View>
          <Text style={styles.levelLabel}>YOUR LEVEL</Text>
          <Text style={styles.levelTitle}>{lv.emoji} Level {lv.level} — {lv.title}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeNum}>{lv.level}</Text>
        </View>
      </View>
      <View style={{ marginTop: 12 }}>
        <ProgressBar
          progress={progress}
          color={Colors.childAccent}
          trackColor={Colors.childBg}
        />
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerLeft}>{totalGemsEarned} total gems</Text>
        {toNext > 0 && (
          <Text style={styles.footerRight}>{toNext} to Level {lv.level + 1}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.childCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.childBorder,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  levelLabel: {
    fontSize: 10, fontWeight: '700', color: Colors.childMuted,
    letterSpacing: 1.5, marginBottom: 4,
  },
  levelTitle: { fontSize: 15, fontWeight: '800', color: Colors.childAccent },
  badge: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: `${Colors.childAccent}20`,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeNum: { fontSize: 18, fontWeight: '900', color: Colors.childAccent },
  footer: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 8,
  },
  footerLeft:  { fontSize: 11, color: Colors.childMuted },
  footerRight: { fontSize: 11, color: Colors.childAccent, fontWeight: '600' },
  pill: {
    backgroundColor: Colors.childCard,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.childBorder,
  },
  pillText: { fontSize: 11, color: Colors.childMuted, fontWeight: '600' },
});
