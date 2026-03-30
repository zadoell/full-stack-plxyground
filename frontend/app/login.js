import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import api from '../src/utils/api';
import { NoticeBanner, useToast } from '../src/components/UIComponents';
import { useBack } from '../src/hooks/useBack';

export default function LoginScreen() {
  const router = useRouter();
  const goBack = useBack('/');
  const { login } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!form.email.trim()) return showToast('Email is required', 'error');
    if (!form.password) return showToast('Password is required', 'error');

    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email: form.email.trim(), password: form.password });
      await login(res.token, res.user);
      showToast('Welcome back!', 'success');
      setTimeout(() => router.replace('/feed'), 500);
    } catch (err) {
      if (err.code === 'ACCOUNT_SUSPENDED') {
        showToast(err.message || 'Your account has been suspended. Please contact support.', 'error');
      } else {
        showToast(err.message || 'Invalid email or password', 'error');
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
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Log in to your PLXYGROUND account</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={form.email} onChangeText={v => setForm(p => ({...p, email: v}))} placeholder="you@example.com" placeholderTextColor="#9ca3af" keyboardType="email-address" autoCapitalize="none" accessibilityLabel="Email address" />

        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} value={form.password} onChangeText={v => setForm(p => ({...p, password: v}))} placeholder="Enter your password" placeholderTextColor="#9ca3af" secureTextEntry accessibilityLabel="Password" />

        <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleLogin} disabled={loading} accessibilityRole="button" accessibilityLabel="Log in">
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Log In</Text>}
        </TouchableOpacity>

        <View style={styles.altRow}>
          <Text style={styles.altText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/signup')} accessibilityRole="link"><Text style={styles.link}>Sign up</Text></TouchableOpacity>
        </View>

        <View style={styles.altRow}>
          <Text style={styles.altText}>Are you a business? </Text>
          <TouchableOpacity onPress={() => router.push('/business-login')} accessibilityRole="link"><Text style={styles.link}>Business Login</Text></TouchableOpacity>
        </View>

        <View style={styles.altRow}>
          <TouchableOpacity onPress={() => router.push('/forgot-password')} accessibilityRole="link">
            <Text style={styles.link}>Forgot Password?</Text>
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
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  altRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  altText: { fontSize: 14, color: '#8A94B8' },
  link: { color: '#FF3D00', fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
});
