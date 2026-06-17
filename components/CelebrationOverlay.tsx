import { useEffect, useRef } from 'react';
import {
  Modal, View, Text, StyleSheet,
  Animated, TouchableOpacity,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';

export type CelebrationMode = 'submitted' | 'approved';

interface Props {
  visible: boolean;
  mode: CelebrationMode;
  gems?: number;            // required for 'approved'
  challengeTitle?: string;  // required for 'approved'
  levelUp?: boolean;
  newLevel?: number;
  onDismiss: () => void;
}

export default function CelebrationOverlay({
  visible, mode, gems, challengeTitle, levelUp, newLevel, onDismiss,
}: Props) {
  const opacity   = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) return;

    // Fade + scale in
    Animated.parallel([
      Animated.timing(opacity,   { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();

    // Mode A: auto-dismiss after 2 seconds
    if (mode === 'submitted') {
      timerRef.current = setTimeout(onDismiss, 2000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, mode, onDismiss]);

  if (!visible) return null;

  const isApproved = mode === 'approved';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <Animated.View
        style={[
          styles.backdrop,
          { opacity },
          isApproved && styles.backdropApproved,
        ]}
      >
        <Animated.View style={[styles.content, { transform: [{ scale: scaleAnim }] }]}>
          {isApproved ? (
            // Mode B — full woohoo (wired up in Plan C)
            <>
              <Text style={styles.gemIcon}>💎</Text>
              <Text style={styles.gemsText}>+{gems} 💎</Text>
              <Text style={styles.heading}>WOOHOO! 🎉</Text>
              {challengeTitle ? (
                <Text style={styles.subheading}>{challengeTitle}</Text>
              ) : null}
              {levelUp && newLevel ? (
                <View style={styles.levelUpBanner}>
                  <Text style={styles.levelUpText}>⬆️ Level up! You're now Level {newLevel}</Text>
                </View>
              ) : null}
              <TouchableOpacity style={styles.collectBtn} onPress={onDismiss}>
                <Text style={styles.collectBtnText}>Collect my gems! →</Text>
              </TouchableOpacity>
            </>
          ) : (
            // Mode A — soft submitted feedback (auto-dismisses)
            <>
              <Text style={styles.starIcon}>🌟</Text>
              <Text style={styles.heading}>Submitted! 🌟</Text>
              <Text style={styles.body}>
                Great work — waiting for your parent to approve
              </Text>
            </>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(79,55,138,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  backdropApproved: {
    backgroundColor: Colors.primaryContainer,
  },
  content: {
    alignItems: 'center',
    gap: 12,
    maxWidth: 320,
    width: '100%',
  },
  starIcon: { fontSize: 80 },
  gemIcon:  { fontSize: 100 },
  heading: {
    fontFamily: Fonts.kidsDisplay,
    fontSize: 40,
    color: Colors.white,
    textAlign: 'center',
  },
  subheading: {
    fontFamily: Fonts.kidsH1,
    fontSize: 22,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  gemsText: {
    fontFamily: Fonts.kidsDisplay,
    fontSize: 56,
    color: Colors.radiantAmber,
    lineHeight: 64,
  },
  body: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 26,
  },
  levelUpBanner: {
    backgroundColor: Colors.tertiaryFixed,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 8,
  },
  levelUpText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.primary,
    textAlign: 'center',
  },
  collectBtn: {
    marginTop: 16,
    backgroundColor: Colors.radiantAmber,
    borderRadius: 9999,
    paddingVertical: 18,
    paddingHorizontal: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 4,
  },
  collectBtnText: {
    fontFamily: Fonts.kidsH1,
    fontSize: 20,
    color: Colors.onTertiaryFixed,
  },
});
