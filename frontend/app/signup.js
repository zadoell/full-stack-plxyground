import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import api from '../src/utils/api';
import { NoticeBanner, useToast } from '../src/components/UIComponents';

export default function SignupScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '', agreeTerms: false });
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!form.name.trim()) return showToast('Name is required', 'error');
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return showToast('Valid email is required', 'error');
    if (form.password.length < 8) return showToast('Password must be at least 8 characters', 'error');
    if (!form.agreeTerms) return showToast('You must agree to Terms and Privacy Policy', 'error');

    setLoading(true);
    try {
      const res = await api.post('/api/auth/signup', { name: form.name.trim(), email: form.email.trim(), password: form.password });
      await login(res.token, res.user);
      showToast('Account created successfully!', 'success');
      setTimeout(() => router.replace('/feed'), 500);
    } catch (err) {
      showToast(err.message || 'Signup failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <NoticeBanner {...toast} onDismiss={hideToast} />

      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.form}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Join PLXYGROUND as a creator</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput style={styles.input} value={form.name} onChangeText={v => setForm(p => ({...p, name: v}))} placeholder="Your full name" placeholderTextColor="#9ca3af" accessibilityLabel="Full name" />

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={form.email} onChangeText={v => setForm(p => ({...p, email: v}))} placeholder="you@example.com" placeholderTextColor="#9ca3af" keyboardType="email-address" autoCapitalize="none" accessibilityLabel="Email address" />

        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} value={form.password} onChangeText={v => setForm(p => ({...p, password: v}))} placeholder="Min 8 characters" placeholderTextColor="#9ca3af" secureTextEntry accessibilityLabel="Password" />

        <TouchableOpacity style={styles.checkboxRow} onPress={() => setForm(p => ({...p, agreeTerms: !p.agreeTerms}))} accessibilityRole="checkbox" accessibilityState={{ checked: form.agreeTerms }}>
          <View style={[styles.checkbox, form.agreeTerms && styles.checkboxChecked]}>
            {form.agreeTerms && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            I agree to the{' '}
          </Text>
          <TouchableOpacity onPress={() => router.push('/terms')} accessibilityRole="link"><Text style={styles.link}>Terms of Service</Text></TouchableOpacity>
          <Text style={styles.checkboxLabel}> and </Text>
          <TouchableOpacity onPress={() => router.push('/privacy')} accessibilityRole="link"><Text style={styles.link}>Privacy Policy</Text></TouchableOpacity>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleSignup} disabled={loading} accessibilityRole="button" accessibilityLabel="Create account">
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Create Account</Text>}
        </TouchableOpacity>

        <View style={styles.altRow}>
          <Text style={styles.altText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/login')} accessibilityRole="link"><Text style={styles.link}>Log in</Text></TouchableOpacity>
        </View>

        <View style={styles.altRow}>
          <Text style={styles.altText}>Are you a business? </Text>
          <TouchableOpacity onPress={() => router.push('/business-signup')} accessibilityRole="link"><Text style={styles.link}>Business Signup</Text></TouchableOpacity>
        </View>
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
  subtitle: { fontSize: 15, color: '#6b7280', marginBottom: 28 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 16 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111', backgroundColor: '#fff' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, flexWrap: 'wrap' },
  checkbox: { width: 22, height: 22, borderWidth: 2, borderColor: '#d1d5db', borderRadius: 4, marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  checkboxLabel: { fontSize: 13, color: '#6b7280' },
  link: { color: '#2563eb', fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },
  submitBtn: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 24 },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  altRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  altText: { fontSize: 14, color: '#6b7280' },
});
