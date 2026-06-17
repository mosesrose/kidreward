import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';

export default function SettingsScreen() {
  const { profile, family, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={Colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.body}>
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Name</Text>
            <Text style={styles.rowValue}>{profile?.name}</Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.rowLabel}>Family</Text>
            <Text style={styles.rowValue}>{family?.name}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant,
  },
  backBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, width: 60 },
  backText: { fontFamily: Fonts.bodyBold, fontSize: 15, color: Colors.primary },
  title:    { fontFamily: Fonts.parentH1, fontSize: 18, color: Colors.onSurface },

  body: { padding: 20 },
  card: {
    backgroundColor: Colors.white, borderRadius: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03, shadowRadius: 15, elevation: 1,
    marginBottom: 24,
  },
  sectionLabel: {
    fontFamily: Fonts.bodyBold, fontSize: 11,
    color: Colors.onSurfaceVariant, letterSpacing: 1.5,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant,
  },
  rowLabel: { fontFamily: Fonts.body, fontSize: 15, color: Colors.onSurface },
  rowValue: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.onSurfaceVariant },

  signOutBtn: {
    backgroundColor: Colors.error, borderRadius: 9999,
    paddingVertical: 14, alignItems: 'center',
  },
  signOutText: { fontFamily: Fonts.bodyBold, fontSize: 15, color: Colors.white },
});
