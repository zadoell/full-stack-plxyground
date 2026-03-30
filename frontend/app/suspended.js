import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';

export default function SuspendedScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleContactAdmin = () => {
    Linking.openURL('mailto:admin@plxyground.local?subject=Account%20Suspension%20Appeal&body=Account%20email:%20' + (user?.email || ''));
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
        <Text style={styles.icon}>🚫</Text>
        <Text style={styles.title}>Account Suspended</Text>
        <Text style={styles.message}>
          Your PLXYGROUND account has been suspended. This may be due to a violation of our Terms of Service or Community Guidelines.
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>What does this mean?</Text>
          <Text style={styles.infoText}>• You cannot access your content or profile</Text>
          <Text style={styles.infoText}>• Your posts are hidden from other users</Text>
          <Text style={styles.infoText}>• You cannot create new content</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>What can you do?</Text>
          <Text style={styles.infoText}>If you believe this is a mistake, contact our admin team to appeal the suspension. Include your account email and any relevant details.</Text>
        </View>

        <TouchableOpacity style={styles.contactBtn} onPress={handleContactAdmin} accessibilityRole="button" accessibilityLabel="Contact admin">
          <Text style={styles.contactBtnText}>📧 Contact Admin</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} accessibilityRole="button" accessibilityLabel="Log out">
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/terms')} style={styles.termsLink} accessibilityRole="link">
          <Text style={styles.termsLinkText}>Review Terms of Service</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07070E' },
  scrollContent: { padding: 28, minHeight: '100%', justifyContent: 'center' },
  content: { maxWidth: 480, width: '100%', alignSelf: 'center', alignItems: 'center' },
  icon: { fontSize: 64, marginBottom: 18 },
  title: { fontSize: 28, fontWeight: '800', color: '#FF1744', marginBottom: 14, letterSpacing: -0.3 },
  message: { fontSize: 15, color: '#8A94B8', textAlign: 'center', lineHeight: 24, marginBottom: 28 },
  infoCard: { backgroundColor: '#0F0F1D', borderRadius: 14, padding: 24, width: '100%', marginBottom: 18, borderWidth: 1.5, borderColor: 'rgba(255,23,68,0.3)', shadowColor: '#FF1744', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 1 },
  infoTitle: { fontSize: 16, fontWeight: '700', color: '#F0F0FA', marginBottom: 10 },
  infoText: { fontSize: 14, color: '#8A94B8', lineHeight: 23 },
  contactBtn: { backgroundColor: '#FF3D00', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 10, alignItems: 'center', marginTop: 10, width: '100%', shadowColor: '#FF3D00', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 12 },
  contactBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  logoutBtn: { backgroundColor: 'rgba(255,23,68,0.08)', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 10, alignItems: 'center', marginTop: 14, width: '100%', borderWidth: 1.5, borderColor: 'rgba(255,23,68,0.2)' },
  logoutBtnText: { color: '#FF1744', fontSize: 16, fontWeight: '700' },
  termsLink: { marginTop: 20 },
  termsLinkText: { color: '#FF3D00', fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
});
