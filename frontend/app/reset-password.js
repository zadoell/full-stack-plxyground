import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../src/utils/api';
import { NoticeBanner, useToast } from '../src/components/UIComponents';
import { useBack } from '../src/hooks/useBack';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const goBack = useBack('/forgot-password');
  const params = useLocalSearchParams();
  const { toast, showToast, hideToast } = useToast();
  const [form, setForm] = useState({
    email: params.email || '',
    code: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    if (!form.email.trim()) return showToast('Email is required', 'error');
    if (!form.code.trim()) return showToast('Reset code is required', 'error');
    if (form.newPassword.length < 8) return showToast('Password must be at least 8 characters', 'error');
    if (form.newPassword !== form.confirmPassword) return showToast('Passwords do not match', 'error');

    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', {
        email: form.email.trim(),
        code: form.code.trim(),
        newPassword: form.newPassword,
      });
      setSuccess(true);
      showToast('Password reset successfully!', 'success');
    } catch (err) {
      if (err.code === 'CODE_EXPIRED') {
        showToast('Reset code has expired. Please request a new one.', 'error');
      } else if (err.code === 'INVALID_CODE') {
        showToast('Invalid reset code. Please check and try again.', 'error');
      } else {
        showToast(err.message || 'Password reset failed', 'error');
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
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter the code sent to your email and choose a new password</Text>

        {!success ? (
          <>
            <Text style={styles.label}>Email Address</Text>
            <TextInput style={styles.input} value={form.email} onChangeText={v => setForm(p => ({...p, email: v}))} placeholder="you@example.com" placeholderTextColor="#9ca3af" keyboardType="email-address" autoCapitalize="none" accessibilityLabel="Email address" />

            <Text style={styles.label}>Reset Code</Text>
            <TextInput style={[styles.input, styles.codeInput]} value={form.code} onChangeText={v => setForm(p => ({...p, code: v.replace(/[^0-9]/g, '').slice(0, 6)}))} placeholder="6-digit code" placeholderTextColor="#9ca3af" keyboardType="number-pad" maxLength={6} accessibilityLabel="Reset code" />

            <Text style={styles.label}>New Password</Text>
            <TextInput style={styles.input} value={form.newPassword} onChangeText={v => setForm(p => ({...p, newPassword: v}))} placeholder="Min 8 characters" placeholderTextColor="#9ca3af" secureTextEntry accessibilityLabel="New password" />

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput style={styles.input} value={form.confirmPassword} onChangeText={v => setForm(p => ({...p, confirmPassword: v}))} placeholder="Re-enter new password" placeholderTextColor="#9ca3af" secureTextEntry accessibilityLabel="Confirm password" />

            <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleReset} disabled={loading} accessibilityRole="button" accessibilityLabel="Reset password">
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Reset Password</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.successBlock}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successTitle}>Password Reset!</Text>
            <Text style={styles.successDesc}>Your password has been changed successfully. You can now log in with your new password.</Text>
            <TouchableOpacity style={styles.submitBtn} onPress={() => router.replace('/login')} accessibilityRole="button" accessibilityLabel="Go to login">
              <Text style={styles.submitBtnText}>Go to Login</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.altRow}>
          <TouchableOpacity onPress={() => router.push('/forgot-password')} accessibilityRole="link">
            <Text style={styles.link}>Request a new code</Text>
          </TouchableOpacity>
        </View>
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
  codeInput: { fontSize: 24, fontWeight: '700', textAlign: 'center', letterSpacing: 8, color: '#FF3D00' },
  submitBtn: { backgroundColor: '#FF3D00', paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 28, shadowColor: '#FF3D00', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 12 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  successBlock: { alignItems: 'center', paddingVertical: 28 },
  successIcon: { fontSize: 48, marginBottom: 18 },
  successTitle: { fontSize: 24, fontWeight: '800', color: '#F0F0FA', marginBottom: 10, letterSpacing: -0.3 },
  successDesc: { fontSize: 14, color: '#8A94B8', textAlign: 'center', lineHeight: 22, marginBottom: 10 },
  altRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  link: { color: '#FF3D00', fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
});
