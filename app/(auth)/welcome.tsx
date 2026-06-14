import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';

const { width } = Dimensions.get('window');

export default function Welcome() {
  return (
    <LinearGradient
      colors={['#FF8A5B', '#FF6B5C', '#7A3CE1']}
      style={styles.container}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
    >
      {/* Stars decoration */}
      <Text style={styles.star1}>⭐</Text>
      <Text style={styles.star2}>💎</Text>
      <Text style={styles.star3}>🌟</Text>

      <View style={styles.hero}>
        <Text style={styles.appIcon}>🏆</Text>
        <Text style={styles.title}>KidReward</Text>
        <Text style={styles.tagline}>
          Turn good habits into{'\n'}
          <Text style={styles.taglineHighlight}>amazing rewards! 💎</Text>
        </Text>
      </View>

      <View style={styles.features}>
        {[
          { emoji: '📋', text: 'Complete challenges set by your parents' },
          { emoji: '💎', text: 'Earn Gems for every task you finish' },
          { emoji: '🎁', text: 'Redeem Gems for gifts, money & more' },
        ].map((item, i) => (
          <View key={i} style={styles.featureRow}>
            <Text style={styles.featureEmoji}>{item.emoji}</Text>
            <Text style={styles.featureText}>{item.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push('/(auth)/signup')}
        >
          <LinearGradient
            colors={[Colors.purple, Colors.purpleLight]}
            style={styles.primaryBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.primaryBtnText}>I'm a Parent 👨‍👩‍👧</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.inviteBtn}
          onPress={() => router.push('/(auth)/signup-child' as any)}
        >
          <LinearGradient
            colors={['#FFB84D', '#FF8A5B']}
            style={styles.primaryBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.inviteBtnText}>Join with invite code 🎉</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.secondaryBtnText}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 60 },
  star1: { position: 'absolute', top: 80, right: 30, fontSize: 32, opacity: 0.5 },
  star2: { position: 'absolute', top: 140, left: 20, fontSize: 24, opacity: 0.4 },
  star3: { position: 'absolute', top: 200, right: 60, fontSize: 20, opacity: 0.3 },
  hero: { alignItems: 'center', marginTop: 40, marginBottom: 40 },
  appIcon: { fontSize: 72 },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: Colors.textLight,
    marginTop: 8,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 26,
  },
  taglineHighlight: { color: Colors.gem, fontWeight: '700' },
  features: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    marginBottom: 40,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureEmoji: { fontSize: 24 },
  featureText: { color: 'rgba(255,255,255,0.9)', fontSize: 15, flex: 1 },
  buttons: { gap: 12 },
  primaryBtn: { borderRadius: 16, overflow: 'hidden' },
  inviteBtn: { borderRadius: 16, overflow: 'hidden' },
  primaryBtnGradient: { paddingVertical: 18, alignItems: 'center' },
  primaryBtnText: { color: Colors.textLight, fontSize: 18, fontWeight: '800' },
  inviteBtnText: { color: Colors.textDark, fontSize: 18, fontWeight: '800' },
  secondaryBtn: { paddingVertical: 16, alignItems: 'center' },
  secondaryBtnText: { color: 'rgba(255,255,255,0.7)', fontSize: 16 },
});
