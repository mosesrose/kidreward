import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { getLevel, getLevelProgress, gemsToNextLevel } from '@/constants/levels';

const SIZE = 192;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface Props {
  totalGemsEarned: number;
}

export default function LevelCircle({ totalGemsEarned }: Props) {
  const lv = getLevel(totalGemsEarned);
  const progress = getLevelProgress(totalGemsEarned);
  const toNext = gemsToNextLevel(totalGemsEarned);
  const offset = CIRCUMFERENCE * (1 - progress);

  return (
    <View style={styles.wrapper}>
      {/* SVG progress ring */}
      <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
        <G rotation="-90" origin={`${SIZE / 2}, ${SIZE / 2}`}>
          <Circle
            cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
            stroke={Colors.surfaceContainerHighest}
            strokeWidth={STROKE}
            fill="none"
          />
          <Circle
            cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
            stroke={Colors.tertiaryFixed}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </G>
      </Svg>

      {/* Inner content */}
      <View style={styles.inner}>
        <Text style={styles.emoji}>{lv.emoji}</Text>
        <Text style={styles.level}>{lv.level}</Text>
      </View>

      {/* Below circle */}
      <View style={styles.below}>
        <Text style={styles.title}>Level {lv.level}: {lv.title}</Text>
        {toNext > 0 && (
          <Text style={styles.subtitle}>Only {toNext} more gems to Level {lv.level + 1}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
  },
  inner: {
    width: SIZE, height: SIZE,
    alignItems: 'center', justifyContent: 'center',
  },
  emoji: { fontSize: 48, lineHeight: 56 },
  level: {
    fontFamily: Fonts.kidsDisplay,
    fontSize: 40,
    color: Colors.primary,
    lineHeight: 44,
    marginTop: -4,
  },
  below: { alignItems: 'center', marginTop: 12 },
  title: {
    fontFamily: Fonts.kidsH1,
    fontSize: 20,
    color: Colors.onSurface,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    marginTop: 4,
  },
});
