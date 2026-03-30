import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import api from '../src/utils/api';
import { NoticeBanner, useToast } from '../src/components/UIComponents';
import { useBack } from '../src/hooks/useBack';

export default function SignupScreen() {
  const router = useRouter();
  const goBack = useBack('/signup-choice');
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

      <TouchableOpacity onPress={() => goBack()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
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
  container: { flex: 1, backgroundColor: '#07070E' },
  scrollContent: { padding: 28, minHeight: '100%', justifyContent: 'center' },
  backBtn: { marginBottom: 20 },
  backBtnText: { color: '#FF3D00', fontSize: 14, fontWeight: '600' },
  form: { maxWidth: 440, width: '100%', alignSelf: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#F0F0FA', marginBottom: 6, letterSpacing: -0.3 },
  subtitle: { fontSize: 15, color: '#8A94B8', marginBottom: 32 },
  label: { fontSize: 11, fontWeight: '700', color: '#8A94B8', marginBottom: 8, marginTop: 18, letterSpacing: 1.2, textTransform: 'uppercase' },
  input: { borderWidth: 1.5, borderColor: 'rgba(255,61,0,0.2)', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#F0F0FA', backgroundColor: 'rgba(255,61,0,0.04)' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: 22, flexWrap: 'wrap' },
  checkbox: { width: 22, height: 22, borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 6, marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#FF3D00', borderColor: '#FF3D00' },
  checkmark: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  checkboxLabel: { fontSize: 13, color: '#8A94B8' },
  link: { color: '#FF3D00', fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },
  submitBtn: { backgroundColor: '#FF3D00', paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 28, shadowColor: '#FF3D00', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 12 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  altRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  altText: { fontSize: 14, color: '#8A94B8' },
});
