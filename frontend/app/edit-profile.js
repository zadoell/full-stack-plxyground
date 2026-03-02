import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import api from '../src/utils/api';
import { NoticeBanner, useToast, LoadingSpinner } from '../src/components/UIComponents';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const [form, setForm] = useState({ name: '', bio: '', location: '', twitter: '', instagram: '', website: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const c = await api.get(`/api/creators/${user?.id}`);
        let socials = {};
        try { socials = typeof c.social_links === 'string' ? JSON.parse(c.social_links) : c.social_links || {}; } catch {}
        setForm({ name: c.name || '', bio: c.bio || '', location: c.location || '', twitter: socials.twitter || '', instagram: socials.instagram || '', website: socials.website || '' });
      } catch (err) {
        showToast('Failed to load profile', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const social_links = {};
      if (form.twitter.trim()) social_links.twitter = form.twitter.trim();
      if (form.instagram.trim()) social_links.instagram = form.instagram.trim();
      if (form.website.trim()) social_links.website = form.website.trim();

      const res = await api.put('/api/creators/me', {
        name: form.name.trim(),
        bio: form.bio.trim(),
        location: form.location.trim(),
        social_links,
      });
      if (res.data) await updateUser({ ...user, name: res.data.name });
      showToast('Profile updated!', 'success');
      setTimeout(() => router.back(), 1000);
    } catch (err) {
      showToast(err.message || 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <NoticeBanner {...toast} onDismiss={hideToast} />
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backBtnText}>← Back</Text></TouchableOpacity>
      <View style={styles.form}>
        <Text style={styles.title}>Edit Profile</Text>

        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={form.name} onChangeText={v => setForm(p => ({...p, name: v}))} accessibilityLabel="Name" />

        <Text style={styles.label}>Bio</Text>
        <TextInput style={[styles.input, styles.textArea]} value={form.bio} onChangeText={v => setForm(p => ({...p, bio: v}))} multiline numberOfLines={4} textAlignVertical="top" accessibilityLabel="Bio" />

        <Text style={styles.label}>Location</Text>
        <TextInput style={styles.input} value={form.location} onChangeText={v => setForm(p => ({...p, location: v}))} placeholder="City, Country" placeholderTextColor="#9ca3af" accessibilityLabel="Location" />

        <Text style={styles.sectionTitle}>Social Links</Text>

        <Text style={styles.label}>Twitter</Text>
        <TextInput style={styles.input} value={form.twitter} onChangeText={v => setForm(p => ({...p, twitter: v}))} placeholder="@handle" placeholderTextColor="#9ca3af" autoCapitalize="none" accessibilityLabel="Twitter handle" />

        <Text style={styles.label}>Instagram</Text>
        <TextInput style={styles.input} value={form.instagram} onChangeText={v => setForm(p => ({...p, instagram: v}))} placeholder="@handle" placeholderTextColor="#9ca3af" autoCapitalize="none" accessibilityLabel="Instagram handle" />

        <Text style={styles.label}>Website</Text>
        <TextInput style={styles.input} value={form.website} onChangeText={v => setForm(p => ({...p, website: v}))} placeholder="https://..." placeholderTextColor="#9ca3af" autoCapitalize="none" accessibilityLabel="Website URL" />

        <TouchableOpacity style={[styles.submitBtn, saving && styles.submitBtnDisabled]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Save Profile</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 24 },
  backBtn: { marginBottom: 16 },
  backBtnText: { color: '#2563eb', fontSize: 14, fontWeight: '600' },
  form: { maxWidth: 500, width: '100%', alignSelf: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#111', marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginTop: 28, marginBottom: 4, borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 16 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111', backgroundColor: '#fff' },
  textArea: { minHeight: 100 },
  submitBtn: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 28 },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
