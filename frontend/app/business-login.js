import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import api from '../src/utils/api';
import { NoticeBanner, useToast } from '../src/components/UIComponents';

export default function BusinessLoginScreen() {
  const router = useRouter();
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
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backBtnText}>← Back</Text></TouchableOpacity>
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
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 24, minHeight: '100%', justifyContent: 'center' },
  backBtn: { marginBottom: 16 },
  backBtnText: { color: '#2563eb', fontSize: 14, fontWeight: '600' },
  form: { maxWidth: 440, width: '100%', alignSelf: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#111', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#6b7280', marginBottom: 20 },
  brandBadge: { backgroundColor: '#eff6ff', padding: 12, borderRadius: 8, marginBottom: 20, alignItems: 'center' },
  brandBadgeText: { color: '#2563eb', fontWeight: '700', fontSize: 14 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 16 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111', backgroundColor: '#fff' },
  submitBtn: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 24 },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  altRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  altText: { fontSize: 14, color: '#6b7280' },
  link: { color: '#2563eb', fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
});
