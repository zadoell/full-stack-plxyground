import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../src/utils/api';
import { NoticeBanner, useToast } from '../src/components/UIComponents';

const CONTENT_TYPES = [
  { value: 'article', label: '📝 Article' },
  { value: 'video_embed', label: '🎬 Video Embed' },
  { value: 'image_story', label: '📸 Image Story' },
];

export default function CreatePostScreen() {
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();
  const [form, setForm] = useState({ title: '', body: '', media_url: '', content_type: 'article' });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!form.title.trim()) return showToast('Title is required', 'error');
    if (!form.media_url.trim()) return showToast('Media URL is required. Every post needs media.', 'error');
    try { new URL(form.media_url); } catch { return showToast('Media URL must be a valid URL', 'error'); }

    setLoading(true);
    try {
      await api.post('/api/content', {
        title: form.title.trim(),
        body: form.body.trim(),
        media_url: form.media_url.trim(),
        content_type: form.content_type,
      });
      showToast('Post created! It will appear in the feed after review.', 'success');
      setTimeout(() => router.replace('/feed'), 1000);
    } catch (err) {
      showToast(err.message || 'Failed to create post', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <NoticeBanner {...toast} onDismiss={hideToast} />

      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backBtnText}>← Back</Text></TouchableOpacity>

      <View style={styles.form}>
        <Text style={styles.title}>Create New Post</Text>
        <Text style={styles.subtitle}>Share your content with the community</Text>

        <Text style={styles.label}>Content Type</Text>
        <View style={styles.typeRow}>
          {CONTENT_TYPES.map(ct => (
            <TouchableOpacity key={ct.value} style={[styles.typeBtn, form.content_type === ct.value && styles.typeBtnActive]} onPress={() => setForm(p => ({...p, content_type: ct.value}))} accessibilityRole="radio" accessibilityState={{ selected: form.content_type === ct.value }}>
              <Text style={[styles.typeBtnText, form.content_type === ct.value && styles.typeBtnTextActive]}>{ct.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Title *</Text>
        <TextInput style={styles.input} value={form.title} onChangeText={v => setForm(p => ({...p, title: v}))} placeholder="Give your post a headline" placeholderTextColor="#9ca3af" maxLength={500} accessibilityLabel="Post title" />

        <Text style={styles.label}>Media URL * <Text style={styles.required}>(required)</Text></Text>
        <TextInput style={styles.input} value={form.media_url} onChangeText={v => setForm(p => ({...p, media_url: v}))} placeholder="https://example.com/image.jpg" placeholderTextColor="#9ca3af" autoCapitalize="none" accessibilityLabel="Media URL" />
        <Text style={styles.hint}>Paste an image/video URL. Every post requires media content.</Text>

        <Text style={styles.label}>Body</Text>
        <TextInput style={[styles.input, styles.textArea]} value={form.body} onChangeText={v => setForm(p => ({...p, body: v}))} placeholder="Write your content here..." placeholderTextColor="#9ca3af" multiline numberOfLines={8} textAlignVertical="top" accessibilityLabel="Post body" />

        <TouchableOpacity style={[styles.submitBtn, loading && styles.submitBtnDisabled]} onPress={handleCreate} disabled={loading} accessibilityRole="button" accessibilityLabel="Publish post">
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Create Post</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 24, minHeight: '100%' },
  backBtn: { marginBottom: 16 },
  backBtnText: { color: '#2563eb', fontSize: 14, fontWeight: '600' },
  form: { maxWidth: 600, width: '100%', alignSelf: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#111', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#6b7280', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 18 },
  required: { color: '#dc2626', fontWeight: '400', fontSize: 12 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111', backgroundColor: '#fff' },
  textArea: { minHeight: 160 },
  hint: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  typeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  typeBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff' },
  typeBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  typeBtnText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  typeBtnTextActive: { color: '#fff' },
  submitBtn: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 28 },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
