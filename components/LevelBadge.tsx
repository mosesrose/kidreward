import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { getLevel } from '@/constants/levels';
import LevelCircle from './LevelCircle';

interface Props {
  totalGemsEarned: number;
  compact?: boolean;   // compact=true shows just the pill, no progress ring
}

// LevelBadge is superseded by LevelCircle.
// This wrapper keeps existing imports compiling during the Plan B/C transition.
// If compact=true, render the old pill; otherwise delegate to LevelCircle.
export default function LevelBadge({ totalGemsEarned, compact }: Props) {
  if (compact) {
    const lv = getLevel(totalGemsEarned);
    return (
      <View style={styles.pill}>
        <Text style={styles.pillText}>{lv.emoji} Lvl {lv.level}</Text>
      </View>
    );
  }

  return <LevelCircle totalGemsEarned={totalGemsEarned} />;
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: Colors.childCard,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.childBorder,
  },
  pillText: { fontSize: 11, color: Colors.childMuted, fontWeight: '600' },
});
