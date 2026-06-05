import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';

export default function Index() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.gem} />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/welcome" />;
  if (!profile) return <Redirect href="/(auth)/complete-profile" />;

  if (profile.role === 'parent') return <Redirect href="/(parent)/dashboard" />;
  return <Redirect href="/(child)/home" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.childBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
