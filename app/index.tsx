import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';

export default function Index() {
  const { session, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace('/(auth)/welcome');
      return;
    }

    if (!profile) {
      router.replace('/(auth)/complete-profile');
      return;
    }

    if (profile.role === 'parent') {
      router.replace('/(parent)/dashboard');
    } else {
      router.replace('/(child)/dashboard');
    }
  }, [session, profile, loading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.gem} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.childBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
