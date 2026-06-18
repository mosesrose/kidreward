import { Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FALLBACK_ICON } from '@/constants/icons';

interface Props {
  emoji: string | null | undefined;
  size: number;
  color: string;
}

// Some early challenges/rewards stored real emoji chars (e.g. '📚') instead of
// MaterialIcons names (e.g. 'menu-book'). Detect which type and render correctly.
function isIconName(value: string): boolean {
  return /^[a-z][a-z0-9-]+$/.test(value);
}

export default function ItemIcon({ emoji, size, color }: Props) {
  const value = emoji?.trim() ?? '';
  if (!value || !isIconName(value)) {
    // Emoji character or empty — render as text, fall back to ⭐
    return (
      <Text style={{ fontSize: size * 0.85, lineHeight: size }}>
        {value || '⭐'}
      </Text>
    );
  }
  return <MaterialIcons name={value as any} size={size} color={color} />;
}
