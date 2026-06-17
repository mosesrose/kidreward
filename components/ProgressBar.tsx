import { View, StyleSheet, DimensionValue } from 'react-native';

interface Props {
  progress: number;   // 0–1
  color?: string;
  trackColor?: string;
  height?: number;
}

export default function ProgressBar({
  progress,
  color = '#00D4FF',
  trackColor = '#1A0A3C',
  height = 8,
}: Props) {
  const pct = `${Math.min(1, Math.max(0, progress)) * 100}%` as DimensionValue;
  return (
    <View style={[styles.track, { backgroundColor: trackColor, height, borderRadius: height / 2 }]}>
      <View style={[styles.fill, { width: pct, backgroundColor: color, height, borderRadius: height / 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { overflow: 'hidden' },
  fill:  {},
});
