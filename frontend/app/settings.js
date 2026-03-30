import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useBack } from '../src/hooks/useBack';
import api from '../src/utils/api';
import { useToast, NoticeBanner } from '../src/components/UIComponents';

export default function SettingsScreen() {
  const router = useRouter();
  const goBack = useBack('/dashboard');
  const { user, logout } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your content. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Account',
          style: 'destructive',
          onPress: async () => {
            setDeletingAccount(true);
            try {
              await api.delete('/api/auth/account');
              await logout();
              router.replace('/');
            } catch (err) {
              setDeletingAccount(false);
              showToast(err.message || 'Failed to delete account', 'error');
            }
          },
        },
      ]
    );
  };

  const roleLabel = user?.role === 'business' ? '🏢 Business' : user?.role === 'fan' ? '🏟️ Fan' : user?.role === 'athlete' ? '🏆 Athlete' : '🎨 Creator';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <NoticeBanner {...toast} onDismiss={hideToast} />
      <TouchableOpacity onPress={() => goBack()} style={styles.backBtn}><Text style={styles.backBtnText}>← Back</Text></TouchableOpacity>
      <Text style={styles.title}>Settings</Text>

      {user && (
        <View style={styles.userCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{(user.name || 'U')[0]}</Text></View>
          <View>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.userRole}>{roleLabel}</Text>
          </View>
        </View>
      )}

      <Text style={styles.sectionLabel}>Account</Text>
      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/edit-profile')} accessibilityRole="link">
          <Text style={styles.menuIcon}>👤</Text><Text style={styles.menuText}>Edit Profile</Text><Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/change-password')} accessibilityRole="link">
          <Text style={styles.menuIcon}>🔑</Text><Text style={styles.menuText}>Change Password</Text><Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/notifications')} accessibilityRole="link">
          <Text style={styles.menuIcon}>🔔</Text><Text style={styles.menuText}>Notifications</Text><Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {user?.role !== 'fan' && (
        <>
          <Text style={styles.sectionLabel}>Insights</Text>
          <View style={styles.menuSection}>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/analytics')} accessibilityRole="link">
              <Text style={styles.menuIcon}>📈</Text><Text style={styles.menuText}>Analytics</Text><Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <Text style={styles.sectionLabel}>Support</Text>
      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/terms')} accessibilityRole="link">
          <Text style={styles.menuIcon}>📄</Text><Text style={styles.menuText}>Terms of Service</Text><Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/privacy')} accessibilityRole="link">
          <Text style={styles.menuIcon}>🔒</Text><Text style={styles.menuText}>Privacy Policy</Text><Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/support')} accessibilityRole="link">
          <Text style={styles.menuIcon}>💬</Text><Text style={styles.menuText}>Help & Support</Text><Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} accessibilityRole="button" accessibilityLabel="Log out">
        <Text style={styles.logoutBtnText}>Log Out</Text>
      </TouchableOpacity>

      <Text style={styles.sectionLabel}>Danger Zone</Text>
      <View style={styles.menuSection}>
        <TouchableOpacity
          style={[styles.menuItem, styles.menuItemDanger]}
          onPress={handleDeleteAccount}
          disabled={deletingAccount}
          accessibilityRole="button"
          accessibilityLabel="Delete account"
        >
          <Text style={styles.menuIcon}>🗑️</Text>
          <Text style={styles.menuTextDanger}>{deletingAccount ? 'Deleting...' : 'Delete Account'}</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07070E' },
  content: { padding: 28, maxWidth: 500, alignSelf: 'center', width: '100%' },
  backBtn: { marginBottom: 20 },
  backBtnText: { color: '#FF3D00', fontSize: 14, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '800', color: '#F0F0FA', marginBottom: 28, letterSpacing: -0.3 },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: 18, padding: 22, backgroundColor: '#0F0F1D', borderRadius: 14, marginBottom: 28, shadowColor: '#FF3D00', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  avatar: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#FF3D00', justifyContent: 'center', alignItems: 'center', shadowColor: '#FF3D00', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 12 },
  avatarText: { color: '#FFFFFF', fontWeight: '800', fontSize: 24 },
  userName: { fontSize: 18, fontWeight: '800', color: '#F0F0FA' },
  userEmail: { fontSize: 13, color: '#8A94B8', marginTop: 3 },
  userRole: { fontSize: 12, color: '#FF3D00', marginTop: 4, fontWeight: '600' },
  menuSection: { backgroundColor: '#0F0F1D', borderRadius: 14, overflow: 'hidden', marginBottom: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  menuIcon: { fontSize: 18, marginRight: 14 },
  menuText: { flex: 1, fontSize: 15, color: '#8A94B8', fontWeight: '500' },
  menuArrow: { fontSize: 20, color: '#4A5278' },
  logoutBtn: { backgroundColor: 'rgba(255,23,68,0.08)', paddingVertical: 16, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,23,68,0.2)' },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#4A5278', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10, marginTop: 10 },
  logoutBtnText: { color: '#FF1744', fontSize: 16, fontWeight: '700' },
  menuItemDanger: { borderBottomWidth: 0 },
  menuTextDanger: { flex: 1, fontSize: 15, color: '#FF1744', fontWeight: '500' },
});
