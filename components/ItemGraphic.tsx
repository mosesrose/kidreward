import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

interface Props {
  emoji: string | null | undefined;
  size: number;
  color?: string;
  mode?: 'child' | 'parent';
  style?: ViewStyle | ViewStyle[];
}

function isIconName(value: string): boolean {
  return /^[a-z][a-z0-9-]+$/.test(value);
}

export default function ItemGraphic({ emoji, size, color, mode = 'child', style }: Props) {
  const value = emoji?.trim() ?? '';
  const isIcon = value && isIconName(value);

  const containerStyle = [
    styles.container,
    mode === 'child' ? styles.childContainer : styles.parentContainer,
    style,
    { width: size * 1.5, height: size * 1.5 },
  ];

  const renderGraphic = () => {
    if (isIcon) {
      return (
        <MaterialIcons
          name={value as any}
          size={size}
          color={color || (mode === 'child' ? Colors.kidAccent : Colors.parentAccent)}
        />
      );
    }
    return (
      <Text style={{ fontSize: size * 0.85, lineHeight: size }}>
        {value || '⭐'}
      </Text>
    );
  };

  return (
    <View style={containerStyle}>
      {renderGraphic()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  childContainer: {
    backgroundColor: Colors.kidCard,
    borderWidth: 2,
    borderColor: Colors.kidBorder,
    borderRadius: 0,
    // Retro shadow
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  parentContainer: {
    backgroundColor: Colors.parentSecondary,
    borderRadius: 12,
  },
});
