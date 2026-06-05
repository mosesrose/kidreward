import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { MockAuthProvider } from '@/contexts/MockAuthContext';

SplashScreen.preventAutoHideAsync();

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

/** Floating banner shown only in mock/demo mode. */
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
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <Provider>
      <StatusBar style="light" />
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
    backgroundColor: 'rgba(108,60,225,0.92)',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8,
  },
  bannerText: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  bannerSwitch: { color: '#fff', fontSize: 12, fontWeight: '900', textDecorationLine: 'underline' },
});
