import { useRef } from 'react';
import {
  Animated, TouchableWithoutFeedback,
  Text, StyleSheet, ViewStyle,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  color?: string;
  textColor?: string;
  style?: ViewStyle;
}

export default function SquishButton({
  label, onPress, disabled = false,
  color = Colors.primary,
  textColor = Colors.white,
  style,
}: Props) {
  const translateY = useRef(new Animated.Value(0)).current;

  const onPressIn = () => {
    Animated.spring(translateY, { toValue: 4, useNativeDriver: true, speed: 50 }).start();
  };

  const onPressOut = () => {
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 50 }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
    >
      <Animated.View
        style={[
          styles.btn,
          { backgroundColor: color, transform: [{ translateY }] },
          disabled && styles.disabled,
          style,
        ]}
      >
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 9999,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 4,
  },
  label: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  disabled: { opacity: 0.5 },
});
