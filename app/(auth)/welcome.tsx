import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';

export default function Welcome() {
  return (
    <SafeAreaView style={styles.safe}>
      {/* Top hero: dark gaming */}
      <View style={styles.heroSection}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>APYX LEGEND</Text>
        </View>
        <Text style={styles.heroTagline}>TURN GOOD HABITS INTO</Text>
        <Text style={styles.heroHighlight}>LEGENDARY REWARDS</Text>

        <View style={styles.featuresBlock}>
          {[
            { icon: 'extension',        label: 'COMPLETE QUESTS' },
            { icon: 'account-balance-wallet', label: 'EARN GEMS 💎' },
            { icon: 'card-giftcard',    label: 'UNLOCK REAL REWARDS' },
          ].map(({ icon, label }) => (
            <View key={label} style={styles.featureRow}>
              <MaterialIcons name={icon as any} size={18} color={Colors.kidGreen} />
              <Text style={styles.featureText}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bottom: parent portal */}
      <View style={styles.portalSection}>
        <Text style={styles.portalLabel}>CHOOSE YOUR MODE</Text>

        <TouchableOpacity
          style={styles.parentBtn}
          onPress={() => router.push('/(auth)/signup')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="shield-account" size={22} color={Colors.parentAccent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.parentBtnTitle}>I'M A PARENT</Text>
            <Text style={styles.parentBtnSub}>Create & manage your family</Text>
          </View>
          <MaterialIcons name="arrow-forward" size={18} color={Colors.parentAccent} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.childBtn}
          onPress={() => router.push('/(auth)/signup-child' as any)}
          activeOpacity={0.8}
        >
          <MaterialIcons name="sports-esports" size={22} color={Colors.kidGreen} />
          <View style={{ flex: 1 }}>
            <Text style={styles.childBtnTitle}>I'M A KID</Text>
            <Text style={styles.childBtnSub}>Join with an invite code</Text>
          </View>
          <MaterialIcons name="arrow-forward" size={18} color={Colors.kidGreen} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.loginLinkText}>Already have an account? SIGN IN →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.kidBg },

  heroSection: {
    flex: 1,
    paddingHorizontal: 24, paddingTop: 40, paddingBottom: 32,
    borderBottomWidth: 2, borderBottomColor: Colors.kidBorder,
    justifyContent: 'center',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.kidBorder + '33',
    borderWidth: 2, borderColor: Colors.kidBorder,
    paddingHorizontal: 12, paddingVertical: 6,
    marginBottom: 20,
  },
  heroBadgeText: {
    fontFamily: Fonts.bodyBold, fontSize: 10,
    color: Colors.kidAccent, letterSpacing: 3,
  },
  heroTagline: {
    fontFamily: Fonts.bodyBold, fontSize: 13,
    color: Colors.kidMuted, letterSpacing: 2, marginBottom: 6,
  },
  heroHighlight: {
    fontFamily: Fonts.kidsDisplay,
    fontSize: 38, color: Colors.kidText,
    fontStyle: 'italic', lineHeight: 44, marginBottom: 28,
  },

  featuresBlock: { gap: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureText: {
    fontFamily: Fonts.bodyBold, fontSize: 12,
    color: Colors.kidText, letterSpacing: 1.5,
  },

  portalSection: {
    backgroundColor: Colors.parentBg,
    paddingHorizontal: 24, paddingVertical: 28,
    gap: 12,
  },
  portalLabel: {
    fontFamily: Fonts.bodyBold, fontSize: 9,
    color: Colors.parentMuted, letterSpacing: 2, marginBottom: 4,
  },

  parentBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.parentCard,
    borderWidth: 1, borderColor: Colors.parentAccent + '66',
    borderRadius: 0,
    paddingHorizontal: 16, paddingVertical: 18,
    shadowColor: Colors.parentAccent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  parentBtnTitle: {
    fontFamily: Fonts.bodyBold, fontSize: 13,
    color: Colors.parentText, letterSpacing: 1.5,
  },
  parentBtnSub: { fontFamily: Fonts.body, fontSize: 12, color: Colors.parentMuted, marginTop: 2 },

  childBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.kidCard,
    borderWidth: 2, borderColor: Colors.kidGreen,
    borderRadius: 0,
    paddingHorizontal: 16, paddingVertical: 18,
    shadowColor: Colors.kidDark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  childBtnTitle: {
    fontFamily: Fonts.kidsH1, fontSize: 15,
    color: Colors.kidGreen, letterSpacing: 1,
  },
  childBtnSub: { fontFamily: Fonts.body, fontSize: 12, color: Colors.kidMuted, marginTop: 2 },

  loginLink: { alignItems: 'center', paddingVertical: 8, marginTop: 4 },
  loginLinkText: {
    fontFamily: Fonts.bodyBold, fontSize: 11,
    color: Colors.parentMuted, letterSpacing: 1,
  },
});
