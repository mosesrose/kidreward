import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import type { IconName } from '@/constants/icons';

interface IconOption {
  name: IconName;
  label: string;
}

interface Props {
  icons: IconOption[];
  selected: IconName | null;
  onSelect: (name: IconName) => void;
  iconColor?: string;
  activeColor?: string;
}

export default function IconPicker({
  icons,
  selected,
  onSelect,
  iconColor = Colors.textMid,
  activeColor = Colors.parentAccent,
}: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {icons.map((ic) => {
        const active = selected === ic.name;
        return (
          <TouchableOpacity
            key={ic.name}
            testID={`icon-pick-${ic.name}`}
            style={[styles.chip, active && { backgroundColor: activeColor, borderColor: activeColor }]}
            onPress={() => onSelect(ic.name)}
          >
            <MaterialIcons
              name={ic.name as any}
              size={22}
              color={active ? '#fff' : iconColor}
            />
            <Text style={[styles.label, active && styles.labelActive]}>{ic.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 4, gap: 8 },
  chip: {
    alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 14, borderWidth: 1.5, borderColor: Colors.parentBorder,
    backgroundColor: Colors.parentCard, gap: 4,
  },
  label: { fontSize: 10, fontWeight: '600', color: Colors.textMid },
  labelActive: { color: '#fff' },
});
