import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';

interface Props {
  mode: 'child' | 'parent';
}

export default function AppHeader({ mode }: Props) {
  const isChild = mode === 'child';
  return (
    <View style={[styles.header, {
      backgroundColor: isChild ? Colors.kidBg : Colors.parentBg,
      borderBottomColor: isChild ? Colors.kidBorder : Colors.parentBorder,
      borderBottomWidth: isChild ? 2 : 1,
    }]}>
      <View style={styles.left}>
        <View style={[
          styles.avatar,
          { borderColor: isChild ? Colors.kidBorder : Colors.parentAccent },
        ]} />
        <Text style={[styles.brand, { color: isChild ? Colors.kidAccent : Colors.parentAccent }]}>
          KidReward
        </Text>
      </View>

      {mode === 'parent' && (
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => router.push('/(parent)/settings')}
        >
          <MaterialIcons name="settings" size={22} color={Colors.parentMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 2,
    backgroundColor: Colors.kidCard,
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
