# Stitch Visual Rework — Plan A: Design System

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dark child theme with the Stitch light palette and create the shared components (AppHeader, GemBadge, SquishButton, LevelCircle) that Plans B and C will use.

**Architecture:** Update `constants/colors.ts` to the new unified light token set (keeping legacy keys so existing screens don't break), install Google Fonts, then create five new shared components and update both tab layouts. Plans B and C depend on this plan — execute A first.

**Tech Stack:** React Native + Expo SDK 54, Expo Router, TypeScript, `@expo/vector-icons` (MaterialCommunityIcons), `react-native-svg` (new), `@expo-google-fonts/*` (new)

**Spec:** `docs/superpowers/specs/2026-06-17-stitch-visual-rework-spec.md`

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Modify | `constants/colors.ts` | New token set + legacy aliases |
| Create | `constants/fonts.ts` | Font family name constants |
| Install pkg | — | react-native-svg, three Google Font packages |
| Modify | `app/_layout.tsx` | Load fonts before render |
| Create | `components/AppHeader.tsx` | Shared top bar (child + parent modes) |
| Create | `components/GemBadge.tsx` | Amber gem count pill |
| Create | `components/SquishButton.tsx` | 3D squish CTA button |
| Create | `components/LevelCircle.tsx` | 192px SVG progress circle |
| Modify | `app/(child)/_layout.tsx` | 2 tabs: Home + Store |
| Modify | `app/(parent)/_layout.tsx` | 4 tabs: Dashboard + Challenges + Rewards + Family |

---

## Task 1: Replace color tokens

**Files:**
- Modify: `constants/colors.ts`

- [ ] **Step 1: Replace the file contents**

```typescript
// Stitch MD3 token set — both parent and child use the same light surface (#fdf7ff).
// Legacy keys (childBg, purple, etc.) kept so existing screens compile during transition.
export const Colors = {
  // ── New semantic tokens ────────────────────────────────────────────────────
  surface:                 '#fdf7ff',
  surfaceContainerLow:     '#f8f2fa',
  surfaceContainer:        '#f2ecf4',
  surfaceContainerHigh:    '#ece6ee',
  surfaceContainerHighest: '#e6e0e9',
  white:                   '#ffffff',

  primary:          '#4f378a',
  primaryContainer: '#6750a4',
  primaryFixed:     '#e9ddff',
  primaryFixedDim:  '#cfbcff',

  secondary:          '#63597c',
  secondaryContainer: '#e1d4fd',
  onSecondaryFixed:   '#1f1635',

  tertiary:               '#765b00',
  tertiaryFixed:          '#ffdf93',
  onTertiaryFixed:        '#241a00',
  onTertiaryFixedVariant: '#594400',
  radiantAmber:           '#FFB800',

  onSurface:        '#1d1b20',
  onSurfaceVariant: '#494551',
  outline:          '#7a7582',
  outlineVariant:   '#cbc4d2',

  error:            '#ba1a1a',
  errorContainer:   '#ffdad6',
  success:          '#1a7a4a',
  successContainer: '#d4f7e1',
  warning:          '#b45309',
  warningContainer: '#ffdf93',

  // ── Legacy keys — existing screens reference these; keep until Plans B & C replace them ──
  purple:       '#4f378a',
  purpleLight:  '#6750a4',
  purpleDark:   '#4f378a',

  childBg:      '#fdf7ff',
  childCard:    '#ffffff',
  childBorder:  '#cbc4d2',
  childAccent:  '#4f378a',
  childAccent2: '#FFB800',
  childText:    '#1d1b20',
  childMuted:   '#494551',

  parentBg:     '#fdf7ff',
  parentCard:   '#ffffff',
  parentBorder: '#cbc4d2',

  gem:     '#4f378a',
  gemGlow: '#6750a4',

  pending: '#b45309',
  danger:  '#ba1a1a',

  textDark:  '#1d1b20',
  textMid:   '#494551',
  textLight: '#ffffff',
  textMuted: '#494551',

  border:      '#cbc4d2',
  surfaceSoft: '#e9ddff',

  // ── Challenge category colours (unchanged) ────────────────────────────────
  cat: {
    phone:    '#FF8E8E',
    outdoor:  '#7DCC8F',
    social:   '#F5A8D8',
    family:   '#FFB07A',
    morning:  '#FFD66B',
    sibling:  '#9DBFE8',
    chores:   '#8FD9C2',
    room:     '#C2DE85',
    garden:   '#94D89E',
    cooking:  '#FFA0A0',
    math:     '#A4B0F0',
    homework: '#C99CE2',
    behavior: '#F0A0BC',
  },
} as const;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | head -30
```

Expected: 0 errors (existing screens still compile because legacy keys are preserved).

- [ ] **Step 3: Commit**

```bash
git add constants/colors.ts
git commit -m "feat: replace color tokens with Stitch MD3 palette (legacy keys preserved)"
```

---

## Task 2: Install packages

**Files:** none (package.json auto-updated)

- [ ] **Step 1: Install react-native-svg**

```bash
cd /mnt/c/work/reward && npx expo install react-native-svg
```

Expected: adds `react-native-svg` to dependencies. No errors.

- [ ] **Step 2: Install Google Font packages**

```bash
cd /mnt/c/work/reward && npx expo install @expo-google-fonts/bricolage-grotesque @expo-google-fonts/source-serif-4 @expo-google-fonts/plus-jakarta-sans
```

Expected: three packages added. No errors.

- [ ] **Step 3: Create `constants/fonts.ts`**

```typescript
// Font family name constants — use these as fontFamily values in StyleSheet.
// Fonts are loaded in app/_layout.tsx via useFonts().
export const Fonts = {
  kidsDisplay:  'BricolageGrotesque-ExtraBold', // 40px headlines, child mode
  kidsH1:       'BricolageGrotesque-Bold',       // 32px section headers
  parentH1:     'SourceSerif4-SemiBold',          // 28px parent headings
  body:         'PlusJakartaSans-Regular',         // 16px body text
  bodySemiBold: 'PlusJakartaSans-SemiBold',       // 18px child body
  bodyBold:     'PlusJakartaSans-Bold',            // 14px bold labels
} as const;
```

- [ ] **Step 4: Commit**

```bash
git add package.json constants/fonts.ts
git commit -m "feat: install react-native-svg + Google Fonts packages"
```

---

## Task 3: Wire fonts in root layout

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Update the file**

Replace `app/_layout.tsx` with:

```typescript
import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  BricolageGrotesque_800ExtraBold,
  BricolageGrotesque_700Bold,
} from '@expo-google-fonts/bricolage-grotesque';
import { SourceSerif4_600SemiBold } from '@expo-google-fonts/source-serif-4';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { MockAuthProvider } from '@/contexts/MockAuthContext';

SplashScreen.preventAutoHideAsync();

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

function DemoBanner() {
  const { profile, signOut } = useAuth();
  if (!USE_MOCK) return null;
  return (
    <View style={styles.banner} pointerEvents="box-none">
      <Text style={styles.bannerText}>
        DEMO · {profile?.role === 'parent' ? '👩 Parent' : '🧒 Child'} view
      </Text>
      <Text style={styles.bannerSwitch} onPress={signOut}>
        Switch →
      </Text>
    </View>
  );
}

const Provider = USE_MOCK ? MockAuthProvider : AuthProvider;

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'BricolageGrotesque-ExtraBold': BricolageGrotesque_800ExtraBold,
    'BricolageGrotesque-Bold':      BricolageGrotesque_700Bold,
    'SourceSerif4-SemiBold':        SourceSerif4_600SemiBold,
    'PlusJakartaSans-Regular':      PlusJakartaSans_400Regular,
    'PlusJakartaSans-SemiBold':     PlusJakartaSans_600SemiBold,
    'PlusJakartaSans-Bold':         PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <Provider>
      <StatusBar style="dark" />
      <DemoBanner />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(parent)" />
        <Stack.Screen name="(child)" />
      </Stack>
    </Provider>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 999,
    backgroundColor: 'rgba(79,55,138,0.92)',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8,
  },
  bannerText:   { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  bannerSwitch: { color: '#fff', fontSize: 12, fontWeight: '900', textDecorationLine: 'underline' },
});
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | head -20
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: load Stitch Google Fonts in root layout"
```

---

## Task 4: Create GemBadge component

**Files:**
- Create: `components/GemBadge.tsx`

- [ ] **Step 1: Create the file**

```typescript
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';

interface Props {
  gems: number;
  size?: 'sm' | 'md';
}

export default function GemBadge({ gems, size = 'md' }: Props) {
  return (
    <View style={[styles.pill, size === 'sm' && styles.pillSm]}>
      <Text style={[styles.text, size === 'sm' && styles.textSm]}>
        💎 {gems}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: Colors.tertiaryFixed,
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  pillSm: { paddingHorizontal: 10, paddingVertical: 4 },
  text: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 18,
    color: Colors.onTertiaryFixed,
  },
  textSm: { fontSize: 13 },
});
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | head -10
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/GemBadge.tsx
git commit -m "feat: add GemBadge component (amber gem pill)"
```

---

## Task 5: Create SquishButton component

**Files:**
- Create: `components/SquishButton.tsx`

- [ ] **Step 1: Create the file**

```typescript
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
    // 3D squish shadow — rest state
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
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | head -10
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/SquishButton.tsx
git commit -m "feat: add SquishButton component (3D animated CTA)"
```

---

## Task 6: Create LevelCircle component

**Files:**
- Create: `components/LevelCircle.tsx`
- Remove: `components/LevelBadge.tsx` (replaced — but keep file to avoid breaking existing imports; update it to re-export LevelCircle)

- [ ] **Step 1: Create LevelCircle.tsx**

```typescript
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import { getLevel, getLevelProgress, gemsToNextLevel } from '@/constants/levels';

const SIZE = 192;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface Props {
  totalGemsEarned: number;
}

export default function LevelCircle({ totalGemsEarned }: Props) {
  const lv = getLevel(totalGemsEarned);
  const progress = getLevelProgress(totalGemsEarned);
  const toNext = gemsToNextLevel(totalGemsEarned);
  const offset = CIRCUMFERENCE * (1 - progress);

  return (
    <View style={styles.wrapper}>
      {/* SVG progress ring */}
      <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
        <G rotation="-90" origin={`${SIZE / 2}, ${SIZE / 2}`}>
          <Circle
            cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
            stroke={Colors.surfaceContainerHighest}
            strokeWidth={STROKE}
            fill="none"
          />
          <Circle
            cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
            stroke={Colors.tertiaryFixed}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </G>
      </Svg>

      {/* Inner content */}
      <View style={styles.inner}>
        <Text style={styles.emoji}>{lv.emoji}</Text>
        <Text style={styles.level}>{lv.level}</Text>
      </View>

      {/* Below circle */}
      <View style={styles.below}>
        <Text style={styles.title}>Level {lv.level}: {lv.title}</Text>
        {toNext > 0 && (
          <Text style={styles.subtitle}>Only {toNext} more gems to Level {lv.level + 1}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    // Shadow per spec: 0 20px 60px rgba(0,0,0,0.15)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
  },
  inner: {
    width: SIZE, height: SIZE,
    alignItems: 'center', justifyContent: 'center',
  },
  emoji: { fontSize: 48, lineHeight: 56 },
  level: {
    fontFamily: Fonts.kidsDisplay,
    fontSize: 40,
    color: Colors.primary,
    lineHeight: 44,
    marginTop: -4,
  },
  below: { alignItems: 'center', marginTop: 12 },
  title: {
    fontFamily: Fonts.kidsH1,
    fontSize: 20,
    color: Colors.onSurface,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    marginTop: 4,
  },
});
```

- [ ] **Step 2: Update LevelBadge.tsx to re-export LevelCircle (backward compat)**

Replace `components/LevelBadge.tsx` with:

```typescript
// LevelBadge is superseded by LevelCircle.
// This re-export keeps existing imports compiling during the Plan B/C transition.
export { default } from './LevelCircle';
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | head -20
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add components/LevelCircle.tsx components/LevelBadge.tsx
git commit -m "feat: add LevelCircle (SVG progress ring) replacing LevelBadge pill"
```

---

## Task 7: Create AppHeader component

**Files:**
- Create: `components/AppHeader.tsx`

- [ ] **Step 1: Create the file**

```typescript
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
    // Note: paddingTop handled by SafeAreaView in screen
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
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | head -10
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/AppHeader.tsx
git commit -m "feat: add AppHeader component (child/parent mode)"
```

---

## Task 8: Update child tab layout

**Files:**
- Modify: `app/(child)/_layout.tsx`

Spec: 2 tabs — Home (home icon) + Store (storefront icon). Missions are on the Home screen. The old `challenges/index` tab is removed (hidden route still needed for navigation).

- [ ] **Step 1: Replace the file**

```typescript
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

function TabIcon({
  name, focused,
}: { name: IconName; focused: boolean }) {
  const icon: IconName = focused ? name : (`${name}-outline` as IconName);
  return (
    <MaterialCommunityIcons
      name={icon}
      size={24}
      color={focused ? Colors.primary : Colors.onSurfaceVariant}
    />
  );
}

export default function ChildLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.outlineVariant,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
        },
        tabBarActiveTintColor:   Colors.primary,
        tabBarInactiveTintColor: Colors.onSurfaceVariant,
        tabBarLabelStyle: {
          fontFamily: Fonts.bodyBold,
          fontSize: 10,
          letterSpacing: 1,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="store/index"
        options={{
          title: 'Store',
          tabBarIcon: ({ focused }) => <TabIcon name="store" focused={focused} />,
        }}
      />
      {/* Hidden routes */}
      <Tabs.Screen name="challenges/index" options={{ href: null }} />
      <Tabs.Screen name="challenges/[id]"  options={{ href: null }} />
      <Tabs.Screen name="join"             options={{ href: null }} />
    </Tabs>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | head -10
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(child)/_layout.tsx"
git commit -m "feat: update child tab bar — 2 tabs (Home + Store) with MCIcons"
```

---

## Task 9: Update parent tab layout

**Files:**
- Modify: `app/(parent)/_layout.tsx`

Spec: 4 tabs — Dashboard | Challenges | Rewards | Family. The old "My Kids" (3rd) is replaced by "Family".

- [ ] **Step 1: Replace the file**

```typescript
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

function TabIcon({
  name, focused,
}: { name: IconName; focused: boolean }) {
  const icon: IconName = focused ? name : (`${name}-outline` as IconName);
  return (
    <MaterialCommunityIcons
      name={icon}
      size={24}
      color={focused ? Colors.primary : Colors.onSurfaceVariant}
    />
  );
}

export default function ParentLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.outlineVariant,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
        },
        tabBarActiveTintColor:   Colors.primary,
        tabBarInactiveTintColor: Colors.onSurfaceVariant,
        tabBarLabelStyle: {
          fontFamily: Fonts.bodyBold,
          fontSize: 10,
          letterSpacing: 1,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabIcon name="view-dashboard" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="challenges/index"
        options={{
          title: 'Challenges',
          tabBarIcon: ({ focused }) => <TabIcon name="clipboard-check" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="rewards/index"
        options={{
          title: 'Rewards',
          tabBarIcon: ({ focused }) => <TabIcon name="gift" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="children/index"
        options={{
          title: 'Family',
          tabBarIcon: ({ focused }) => <TabIcon name="account-group" focused={focused} />,
        }}
      />
      {/* Hidden routes */}
      <Tabs.Screen name="challenges/create" options={{ href: null }} />
      <Tabs.Screen name="challenges/[id]"   options={{ href: null }} />
      <Tabs.Screen name="children/invite"   options={{ href: null }} />
      <Tabs.Screen name="rewards/create"    options={{ href: null }} />
      <Tabs.Screen name="redemptions"       options={{ href: null }} />
    </Tabs>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /mnt/c/work/reward && npx tsc --noEmit 2>&1 | head -10
```

Expected: 0 errors.

- [ ] **Step 3: Verify app starts**

```bash
cd /mnt/c/work/reward && timeout 20 npx expo export --platform web 2>&1 | tail -5
```

Expected: exits without fatal errors (may warn about missing assets, that is OK).

- [ ] **Step 4: Commit**

```bash
git add "app/(parent)/_layout.tsx"
git commit -m "feat: update parent tab bar — 4 tabs (Dashboard + Challenges + Rewards + Family)"
```

---

## Done

Plan A deliverables:
- Updated color tokens (Stitch palette, light for both modes)
- 3 Google Font families loaded in root layout
- 4 new components: `GemBadge`, `SquishButton`, `LevelCircle`, `AppHeader`
- Updated child layout (2 tabs: Home + Store)
- Updated parent layout (4 tabs: Dashboard + Challenges + Rewards + Family)

**Proceed to Plan B** (`2026-06-17-stitch-b-child-screens.md`) to restyle child screens.
