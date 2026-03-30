import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import api from '../src/utils/api';
import { NoticeBanner, useToast } from '../src/components/UIComponents';
import { useBack } from '../src/hooks/useBack';

export default function BusinessLoginScreen() {
  const router = useRouter();
  const goBack = useBack('/login');
  const { login } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!form.email.trim()) return showToast('Email is required', 'error');
    if (!form.password) return showToast('Password is required', 'error');

    setLoading(true);
    try {
      const res = await api.post('/api/auth/business/login', { email: form.email.trim(), password: form.password });
      await login(res.token, res.user);
      showToast('Welcome back!', 'success');
      setTimeout(() => router.replace('/feed'), 500);
    } catch (err) {
      if (err.code === 'ACCOUNT_SUSPENDED') {
        showToast(err.message || 'Your account has been suspended.', 'error');
      } else {
        showToast(err.message || 'Invalid credentials', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <NoticeBanner {...toast} onDismiss={hideToast} />
      <TouchableOpacity onPress={() => goBack()} style={styles.backBtn}><Text style={styles.backBtnText}>← Back</Text></TouchableOpacity>
      <View style={styles.form}>
        <Text style={styles.title}>Business Login</Text>
        <Text style={styles.subtitle}>Access your PLXYGROUND business account</Text>
        <View style={styles.brandBadge}><Text style={styles.brandBadgeText}>🏢 Business Account</Text></View>
        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={form.email} onChangeText={v => setForm(p => ({...p, email: v}))} placeholder="contact@company.com" placeholderTextColor="#9ca3af" keyboardType="email-address" autoCapitalize="none" accessibilityLabel="Email" />
        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} value={form.password} onChangeText={v => setForm(p => ({...p, password: v}))} placeholder="Enter password" placeholderTextColor="#9ca3af" secureTextEntry accessibilityLabel="Password" />
        <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Log In</Text>}
        </TouchableOpacity>
        <View style={styles.altRow}><Text style={styles.altText}>New business? </Text><TouchableOpacity onPress={() => router.push('/business-signup')}><Text style={styles.link}>Register here</Text></TouchableOpacity></View>
        <View style={styles.altRow}><Text style={styles.altText}>Creator? </Text><TouchableOpacity onPress={() => router.push('/login')}><Text style={styles.link}>Creator Login</Text></TouchableOpacity></View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07070E' },
  scrollContent: { padding: 28, minHeight: '100%', justifyContent: 'center' },
  backBtn: { marginBottom: 20 },
  backBtnText: { color: '#00CFFF', fontSize: 14, fontWeight: '600' },
  form: { maxWidth: 440, width: '100%', alignSelf: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#F0F0FA', marginBottom: 6, letterSpacing: -0.3 },
  subtitle: { fontSize: 15, color: '#8A94B8', marginBottom: 24 },
  brandBadge: { backgroundColor: 'rgba(0,207,255,0.08)', padding: 14, borderRadius: 10, marginBottom: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,207,255,0.25)' },
  brandBadgeText: { color: '#00CFFF', fontWeight: '700', fontSize: 14 },
  label: { fontSize: 11, fontWeight: '700', color: '#8A94B8', marginBottom: 8, marginTop: 18, letterSpacing: 1.2, textTransform: 'uppercase' },
  input: { borderWidth: 1.5, borderColor: 'rgba(0,207,255,0.2)', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#F0F0FA', backgroundColor: 'rgba(0,207,255,0.04)' },
  submitBtn: { backgroundColor: '#00CFFF', paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 28, shadowColor: '#00CFFF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 12 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#07070E', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  altRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  altText: { fontSize: 14, color: '#8A94B8' },
  link: { color: '#FF3D00', fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
});
