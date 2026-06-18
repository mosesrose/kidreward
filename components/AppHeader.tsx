import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';

interface Props {
  mode: 'child' | 'parent';
}

export default function AppHeader({ mode }: Props) {
  return (
    <View style={[styles.header, {
      backgroundColor: mode === 'child' ? Colors.kidHeader : Colors.surfaceContainerLow,
      borderBottomColor: mode === 'child' ? 'rgba(255,255,255,0.08)' : Colors.outlineVariant,
    }]}>
      <View style={styles.left}>
        <View style={styles.avatar} />
        <Text style={[styles.brand, { color: mode === 'child' ? Colors.kidAccent : Colors.primary }]}>
          KidReward
        </Text>
      </View>

      {mode === 'parent' && (
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => router.push('/(parent)/settings')}
        >
          <MaterialIcons name="settings" size={22} color={Colors.onSurfaceVariant} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.secondaryContainer,
  },
  brand: {
    fontFamily: Fonts.kidsH1,
    fontSize: 20,
  },
  settingsBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
});
