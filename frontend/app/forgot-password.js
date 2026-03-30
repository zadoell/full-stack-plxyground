import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../src/utils/api';
import { NoticeBanner, useToast } from '../src/components/UIComponents';
import { useBack } from '../src/hooks/useBack';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const goBack = useBack('/login');
  const { toast, showToast, hideToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return showToast('Please enter a valid email address', 'error');
    }

    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { email: email.trim() });
      setSent(true);
      showToast('If an account exists, a reset code has been sent', 'success');
    } catch (err) {
      showToast(err.message || 'Request failed. Please try again.', 'error');
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
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>Enter your email and we'll send you a reset code</Text>

        {!sent ? (
          <>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              accessibilityLabel="Email address"
            />

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Send reset code"
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Send Reset Code</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.successBlock}>
            <Text style={styles.successIcon}>📧</Text>
            <Text style={styles.successTitle}>Check your email</Text>
            <Text style={styles.successDesc}>
              We sent a 6-digit reset code to {email}. Enter it on the next screen to set a new password.
            </Text>
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={() => router.push(`/reset-password?email=${encodeURIComponent(email.trim())}`)}
              accessibilityRole="button"
              accessibilityLabel="Enter reset code"
            >
              <Text style={styles.submitBtnText}>Enter Reset Code</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resendBtn} onPress={() => { setSent(false); }} accessibilityRole="button">
              <Text style={styles.resendBtnText}>Didn't receive it? Try again</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.altRow}>
          <Text style={styles.altText}>Remember your password? </Text>
          <TouchableOpacity onPress={() => router.push('/login')} accessibilityRole="link">
            <Text style={styles.link}>Log in</Text>
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
  submitBtn: { backgroundColor: '#FF3D00', paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 28, shadowColor: '#FF3D00', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 12 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  successBlock: { alignItems: 'center', paddingVertical: 28 },
  successIcon: { fontSize: 48, marginBottom: 18 },
  successTitle: { fontSize: 24, fontWeight: '800', color: '#F0F0FA', marginBottom: 8, letterSpacing: -0.3 },
  successDesc: { fontSize: 14, color: '#8A94B8', textAlign: 'center', lineHeight: 21, marginBottom: 8 },
  resendBtn: { marginTop: 18 },
  resendBtnText: { color: '#FF3D00', fontSize: 14, fontWeight: '600' },
  altRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  altText: { fontSize: 14, color: '#8A94B8' },
  link: { color: '#FF3D00', fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
});
