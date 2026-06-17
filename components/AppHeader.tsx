import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';

interface Props {
  mode: 'child' | 'parent';
  onSwitchMode?: () => void;  // child mode: "Parent Mode" pill press
  onSettings?: () => void;    // parent mode: settings icon press
}

export default function AppHeader({ mode, onSwitchMode, onSettings }: Props) {
  return (
    <View style={styles.header}>
      {/* Left: avatar + brand */}
      <View style={styles.left}>
        <View style={styles.avatar} />
        <Text style={styles.brand}>KidReward</Text>
      </View>

      {/* Right: child shows switch pill, parent shows settings icon */}
      {mode === 'child' ? (
        <TouchableOpacity style={styles.switchPill} onPress={onSwitchMode}>
          <MaterialCommunityIcons
            name="cog-outline"
            size={14}
            color={Colors.onSurfaceVariant}
            style={{ marginRight: 4 }}
          />
          <Text style={styles.switchPillText}>PARENT MODE</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.settingsBtn} onPress={onSettings}>
          <MaterialCommunityIcons
            name="cog-outline"
            size={22}
            color={Colors.onSurfaceVariant}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    backgroundColor: Colors.surfaceContainerLow,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
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
    color: Colors.primary,
  },
  switchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  switchPillText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1,
    color: Colors.onSurfaceVariant,
  },
  settingsBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
});
