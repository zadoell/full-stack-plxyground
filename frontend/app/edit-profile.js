import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import api from '../src/utils/api';
import { NoticeBanner, useToast, LoadingSpinner } from '../src/components/UIComponents';
import { useBack } from '../src/hooks/useBack';

export default function EditProfileScreen() {
  const router = useRouter();
  const goBack = useBack('/settings');
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
      setTimeout(() => goBack(), 1000);
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
      <TouchableOpacity onPress={() => goBack()} style={styles.backBtn}><Text style={styles.backBtnText}>← Back</Text></TouchableOpacity>
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
  container: { flex: 1, backgroundColor: '#07070E' },
  scrollContent: { padding: 28 },
  backBtn: { marginBottom: 20 },
  backBtnText: { color: '#FF3D00', fontSize: 14, fontWeight: '600' },
  form: { maxWidth: 500, width: '100%', alignSelf: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#F0F0FA', marginBottom: 28, letterSpacing: -0.3 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#F0F0FA', marginTop: 32, marginBottom: 6, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)', paddingTop: 24, letterSpacing: 0.5, textTransform: 'uppercase' },
  label: { fontSize: 11, fontWeight: '700', color: '#8A94B8', marginBottom: 8, marginTop: 18, letterSpacing: 1.2, textTransform: 'uppercase' },
  input: { borderWidth: 1.5, borderColor: 'rgba(255,61,0,0.2)', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#F0F0FA', backgroundColor: 'rgba(255,61,0,0.04)' },
  textArea: { minHeight: 100 },
  submitBtn: { backgroundColor: '#FF3D00', paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 32, shadowColor: '#FF3D00', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 12 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
});
