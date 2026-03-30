import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../src/utils/api';
import { NoticeBanner, useToast } from '../src/components/UIComponents';
import { useBack } from '../src/hooks/useBack';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const goBack = useBack('/settings');
  const { toast, showToast, hideToast } = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.currentPassword) return showToast('Current password is required', 'error');
    if (form.newPassword.length < 8) return showToast('New password must be at least 8 characters', 'error');
    if (form.newPassword !== form.confirmPassword) return showToast('Passwords do not match', 'error');
    if (form.currentPassword === form.newPassword) return showToast('New password must be different from current password', 'error');

    setLoading(true);
    try {
      await api.post('/api/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      showToast('Password changed successfully!', 'success');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => goBack(), 1500);
    } catch (err) {
      if (err.code === 'INVALID_PASSWORD') {
        showToast('Current password is incorrect', 'error');
      } else {
        showToast(err.message || 'Failed to change password', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <NoticeBanner {...toast} onDismiss={hideToast} />

      <TouchableOpacity onPress={() => goBack()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.form}>
        <Text style={styles.title}>Change Password</Text>
        <Text style={styles.subtitle}>Choose a strong password to keep your account secure</Text>

        <Text style={styles.label}>Current Password</Text>
        <TextInput style={styles.input} value={form.currentPassword} onChangeText={v => setForm(p => ({...p, currentPassword: v}))} placeholder="Enter current password" placeholderTextColor="#9ca3af" secureTextEntry accessibilityLabel="Current password" />

        <Text style={styles.label}>New Password</Text>
        <TextInput style={styles.input} value={form.newPassword} onChangeText={v => setForm(p => ({...p, newPassword: v}))} placeholder="Min 8 characters" placeholderTextColor="#9ca3af" secureTextEntry accessibilityLabel="New password" />

        <Text style={styles.label}>Confirm New Password</Text>
        <TextInput style={styles.input} value={form.confirmPassword} onChangeText={v => setForm(p => ({...p, confirmPassword: v}))} placeholder="Re-enter new password" placeholderTextColor="#9ca3af" secureTextEntry accessibilityLabel="Confirm new password" />

        <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={loading} accessibilityRole="button" accessibilityLabel="Change password">
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Change Password</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07070E' },
  scrollContent: { padding: 28, minHeight: '100%', justifyContent: 'center' },
  backBtn: { marginBottom: 20 },
  backBtnText: { color: '#FF3D00', fontSize: 14, fontWeight: '600' },
  form: { maxWidth: 440, width: '100%', alignSelf: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#F0F0FA', marginBottom: 6, letterSpacing: -0.3 },
  subtitle: { fontSize: 15, color: '#8A94B8', marginBottom: 32 },
  label: { fontSize: 11, fontWeight: '700', color: '#8A94B8', marginBottom: 8, marginTop: 18, letterSpacing: 1.2, textTransform: 'uppercase' },
  input: { borderWidth: 1.5, borderColor: 'rgba(255,61,0,0.2)', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#F0F0FA', backgroundColor: 'rgba(255,61,0,0.04)' },
  submitBtn: { backgroundColor: '#FF3D00', paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 28, shadowColor: '#FF3D00', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 12 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
});
