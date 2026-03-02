import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backBtnText}>← Back</Text></TouchableOpacity>
      <Text style={styles.title}>Settings</Text>

      {user && (
        <View style={styles.userCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{(user.name || 'U')[0]}</Text></View>
          <View>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.userRole}>{user.role === 'business' ? '🏢 Business' : '🎨 Creator'}</Text>
          </View>
        </View>
      )}

      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/terms')} accessibilityRole="link">
          <Text style={styles.menuIcon}>📋</Text><Text style={styles.menuText}>Help Center</Text><Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/terms')} accessibilityRole="link">
          <Text style={styles.menuIcon}>📄</Text><Text style={styles.menuText}>Terms of Service</Text><Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/privacy')} accessibilityRole="link">
          <Text style={styles.menuIcon}>🔒</Text><Text style={styles.menuText}>Privacy Policy</Text><Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} accessibilityRole="button" accessibilityLabel="Log out">
        <Text style={styles.logoutBtnText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 24, maxWidth: 500, alignSelf: 'center', width: '100%' },
  backBtn: { marginBottom: 16 },
  backBtnText: { color: '#2563eb', fontSize: 14, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '800', color: '#111', marginBottom: 24 },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, backgroundColor: '#fff', borderRadius: 12, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 22 },
  userName: { fontSize: 18, fontWeight: '700', color: '#111' },
  userEmail: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  userRole: { fontSize: 12, color: '#2563eb', marginTop: 4 },
  menuSection: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', marginBottom: 24 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  menuIcon: { fontSize: 18, marginRight: 12 },
  menuText: { flex: 1, fontSize: 15, color: '#374151' },
  menuArrow: { fontSize: 20, color: '#9ca3af' },
  logoutBtn: { backgroundColor: '#fef2f2', paddingVertical: 14, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#fecaca' },
  logoutBtnText: { color: '#dc2626', fontSize: 16, fontWeight: '700' },
});
