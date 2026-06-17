import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Web Audio synthesis — only works on web platform
function ctx(): AudioContext | null {
  if (Platform.OS !== 'web') return null;
  if (typeof window === 'undefined') return null;
  const C = (window as any).AudioContext || (window as any).webkitAudioContext;
  return C ? new C() : null;
}

function tone(
  ac: AudioContext,
  freq: number,
  startAt: number,
  dur: number,
  type: OscillatorType = 'sine',
  vol = 0.3
) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, startAt);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + dur);
  osc.start(startAt);
  osc.stop(startAt + dur + 0.01);
}

// ──────────────────────────────────────────────────────────────────────
// CHILD SOUND ENGINE — Bright, organic, playful game
// ──────────────────────────────────────────────────────────────────────
export const ChildSounds = {
  /** Success / task checked off — ascending C-E-G major arpeggio */
  async success() {
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    const ac = ctx(); if (!ac) return;
    const t = ac.currentTime;
    tone(ac, 523.25, t,        0.12, 'sine', 0.4);  // C5
    tone(ac, 659.25, t + 0.09, 0.12, 'sine', 0.4);  // E5
    tone(ac, 783.99, t + 0.18, 0.20, 'sine', 0.4);  // G5
  },

  /** Gems earned — ascending pentatonic sparkle */
  async gemEarned() {
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    const ac = ctx(); if (!ac) return;
    const t = ac.currentTime;
    [523, 659, 784, 1047].forEach((f, i) =>
      tone(ac, f, t + i * 0.065, 0.10, 'sine', 0.35)
    );
  },

  /** App welcome / login — warm rising sweep */
  async welcome() {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    const ac = ctx(); if (!ac) return;
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.linearRampToValueAtTime(660, t + 0.55);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.28, t + 0.08);
    gain.gain.linearRampToValueAtTime(0, t + 0.6);
    osc.start(t); osc.stop(t + 0.65);
  },

  /** Error / boundary — gentle low double-tap, non-punitive */
  async error() {
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    const ac = ctx(); if (!ac) return;
    const t = ac.currentTime;
    tone(ac, 220, t,        0.09, 'sine', 0.22);
    tone(ac, 196, t + 0.16, 0.11, 'sine', 0.18);
  },

  /** Tab navigation — subtle tick */
  async tab() {
    if (Platform.OS !== 'web') {
      await Haptics.selectionAsync();
      return;
    }
    const ac = ctx(); if (!ac) return;
    tone(ac, 900, ac.currentTime, 0.04, 'sine', 0.12);
  },
};

// ──────────────────────────────────────────────────────────────────────
// PARENT SOUND ENGINE — Premium, minimalist, calming smart-home
// ──────────────────────────────────────────────────────────────────────
export const ParentSounds = {
  /** Approval / action confirmed — single crisp physical tap */
  async approval() {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return;
    }
    const ac = ctx(); if (!ac) return;
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = 'sine';
    osc.frequency.value = 1200;
    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    osc.start(t); osc.stop(t + 0.05);
  },

  /** System notification / update — warm ambient dual-tone chime */
  async notification() {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    const ac = ctx(); if (!ac) return;
    const t = ac.currentTime;
    tone(ac, 880,  t,        0.30, 'sine', 0.20);
    tone(ac, 1109, t + 0.18, 0.30, 'sine', 0.15);
  },

  /** Alert / intervention required — minor-third two-tone chime */
  async alert() {
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    const ac = ctx(); if (!ac) return;
    const t = ac.currentTime;
    tone(ac, 440,    t,        0.28, 'sine', 0.25);  // A4
    tone(ac, 523.25, t + 0.30, 0.28, 'sine', 0.22);  // C5 — minor third
  },

  /** Reject — low soft thud */
  async reject() {
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    const ac = ctx(); if (!ac) return;
    const t = ac.currentTime;
    tone(ac, 160, t, 0.18, 'sine', 0.22);
  },
};
