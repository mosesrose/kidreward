import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';

interface Props {
  gems: number;
  size?: 'sm' | 'md';
}

export default function GemBadge({ gems, size = 'md' }: Props) {
  return (
    <View style={[styles.pill, size === 'sm' && styles.pillSm]}>
      <Text style={[styles.text, size === 'sm' && styles.textSm]}>
        💎 {gems}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: Colors.tertiaryFixed,
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  pillSm: { paddingHorizontal: 10, paddingVertical: 4 },
  text: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 18,
    color: Colors.onTertiaryFixed,
  },
  textSm: { fontSize: 13 },
});
