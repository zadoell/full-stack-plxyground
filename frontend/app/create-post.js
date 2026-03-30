import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import api from '../src/utils/api';
import { NoticeBanner, useToast } from '../src/components/UIComponents';
import { useBack } from '../src/hooks/useBack';
import { useAuth } from '../src/context/AuthContext';

const CONTENT_TYPES = [
  { value: 'article', label: '📝 Article' },
  { value: 'video_embed', label: '🎬 Video Embed' },
  { value: 'image_story', label: '📸 Image Story' },
];

export default function CreatePostScreen() {
  const router = useRouter();
  const goBack = useBack('/dashboard');
  const { toast, showToast, hideToast } = useToast();
  const { user } = useAuth();
  const isBusiness = user?.role === 'business';
  const availableTypes = isBusiness
    ? [...CONTENT_TYPES, { value: 'campaign_brief', label: '📣 Campaign Brief' }]
    : CONTENT_TYPES;
  const [form, setForm] = useState({ title: '', body: '', media_url: '', content_type: 'article', target_audience: '', budget_range: '', deliverables: '', timeline: '' });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pickedMedia, setPickedMedia] = useState(null); // { uri, type, fileName, mimeType }

  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return showToast('Permission to access media library is required', 'error');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      quality: 0.8,
      videoMaxDuration: 120,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    const fileName = asset.fileName || asset.uri.split('/').pop() || 'upload';
    const mimeType = asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg');

    setPickedMedia({ uri: asset.uri, type: asset.type, fileName, mimeType, width: asset.width, height: asset.height });
    // Clear any manually entered URL since we're using a picked file
    setForm(p => ({ ...p, media_url: '' }));
  };

  const removeMedia = () => {
    setPickedMedia(null);
  };

  const handleCreate = async () => {
    if (!form.title.trim()) return showToast('Title is required', 'error');
    if (!pickedMedia && !form.media_url.trim()) {
      return showToast('Upload media or paste a URL. Every post needs media.', 'error');
    }
    if (!pickedMedia && form.media_url.trim()) {
      try { new URL(form.media_url); } catch { return showToast('Media URL must be a valid URL', 'error'); }
    }

    setLoading(true);
    try {
      let mediaUrl = form.media_url.trim();

      // Upload picked file first
      if (pickedMedia) {
        setUploading(true);
        try {
          const uploadRes = await api.upload(pickedMedia.uri, pickedMedia.fileName, pickedMedia.mimeType);
          mediaUrl = uploadRes.url;
        } catch (err) {
          setUploading(false);
          setLoading(false);
          return showToast(err.message || 'File upload failed', 'error');
        }
        setUploading(false);
      }

      let finalBody = form.body.trim();
      if (form.content_type === 'campaign_brief') {
        const parts = [];
        if (form.target_audience?.trim()) parts.push(`TARGET AUDIENCE\n${form.target_audience.trim()}`);
        if (form.budget_range?.trim()) parts.push(`BUDGET RANGE\n${form.budget_range.trim()}`);
        if (form.deliverables?.trim()) parts.push(`DELIVERABLES\n${form.deliverables.trim()}`);
        if (form.timeline?.trim()) parts.push(`TIMELINE\n${form.timeline.trim()}`);
        if (form.body.trim()) parts.push(`DESCRIPTION\n${form.body.trim()}`);
        finalBody = parts.join('\n\n');
      }

      await api.post('/api/content', {
        title: form.title.trim(),
        body: finalBody,
        media_url: mediaUrl,
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

  const isVideo = pickedMedia?.type === 'video' || pickedMedia?.mimeType?.startsWith('video/');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <NoticeBanner {...toast} onDismiss={hideToast} />

      <TouchableOpacity onPress={() => goBack()} style={styles.backBtn}><Text style={styles.backBtnText}>← Back</Text></TouchableOpacity>

      <View style={styles.form}>
        <Text style={styles.title}>Create New Post</Text>
        <Text style={styles.subtitle}>Share your content with the community</Text>

        <Text style={styles.label}>Content Type</Text>
        <View style={styles.typeRow}>
          {availableTypes.map(ct => (
            <TouchableOpacity key={ct.value} style={[styles.typeBtn, form.content_type === ct.value && styles.typeBtnActive]} onPress={() => setForm(p => ({...p, content_type: ct.value}))} accessibilityRole="radio" accessibilityState={{ selected: form.content_type === ct.value }}>
              <Text style={[styles.typeBtnText, form.content_type === ct.value && styles.typeBtnTextActive]}>{ct.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Title *</Text>
        <TextInput style={styles.input} value={form.title} onChangeText={v => setForm(p => ({...p, title: v}))} placeholder="Give your post a headline" placeholderTextColor="#9ca3af" maxLength={500} accessibilityLabel="Post title" />

        {/* ── Media Upload Section ── */}
        <Text style={styles.label}>Media * <Text style={styles.required}>(required)</Text></Text>

        {pickedMedia ? (
          <View style={styles.mediaPreviewContainer}>
            {isVideo ? (
              <View style={styles.videoPlaceholder}>
                <Text style={styles.videoIcon}>🎬</Text>
                <Text style={styles.videoText}>{pickedMedia.fileName}</Text>
                <Text style={styles.videoSubtext}>Video selected</Text>
              </View>
            ) : (
              <Image source={{ uri: pickedMedia.uri }} style={styles.mediaPreview} resizeMode="cover" />
            )}
            <TouchableOpacity style={styles.removeMediaBtn} onPress={removeMedia}>
              <Text style={styles.removeMediaText}>✕ Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadBtn} onPress={pickMedia} accessibilityRole="button" accessibilityLabel="Choose image or video">
            <Text style={styles.uploadIcon}>📁</Text>
            <Text style={styles.uploadBtnText}>Choose Image or Video</Text>
            <Text style={styles.uploadHint}>JPEG, PNG, GIF, WebP, MP4, WebM · Max 10 MB</Text>
          </TouchableOpacity>
        )}

        <View style={styles.orDivider}>
          <View style={styles.dividerLine} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TextInput
          style={[styles.input, pickedMedia && styles.inputDisabled]}
          value={form.media_url}
          onChangeText={v => { setForm(p => ({...p, media_url: v})); if (v.trim()) setPickedMedia(null); }}
          placeholder="Paste an image/video URL instead"
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          editable={!pickedMedia}
          accessibilityLabel="Media URL"
        />

        {form.content_type === 'campaign_brief' && (
          <>
            <Text style={styles.label}>TARGET AUDIENCE</Text>
            <TextInput
              style={styles.input}
              value={form.target_audience || ''}
              onChangeText={v => setForm(p => ({...p, target_audience: v}))}
              placeholder="Who are you looking to reach?"
              placeholderTextColor="#4A5278"
              accessibilityLabel="Target audience"
            />
            <Text style={styles.label}>BUDGET RANGE</Text>
            <TextInput
              style={styles.input}
              value={form.budget_range || ''}
              onChangeText={v => setForm(p => ({...p, budget_range: v}))}
              placeholder="e.g. £500–£2,000 per post"
              placeholderTextColor="#4A5278"
              accessibilityLabel="Budget range"
            />
            <Text style={styles.label}>DELIVERABLES</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.deliverables || ''}
              onChangeText={v => setForm(p => ({...p, deliverables: v}))}
              placeholder="What do you need from the creator?"
              placeholderTextColor="#4A5278"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              accessibilityLabel="Deliverables"
            />
            <Text style={styles.label}>TIMELINE</Text>
            <TextInput
              style={styles.input}
              value={form.timeline || ''}
              onChangeText={v => setForm(p => ({...p, timeline: v}))}
              placeholder="e.g. 2-week campaign, starting March"
              placeholderTextColor="#4A5278"
              accessibilityLabel="Timeline"
            />
          </>
        )}

        <Text style={styles.label}>Body</Text>
        <TextInput style={[styles.input, styles.textArea]} value={form.body} onChangeText={v => setForm(p => ({...p, body: v}))} placeholder="Write your content here..." placeholderTextColor="#9ca3af" multiline numberOfLines={8} textAlignVertical="top" accessibilityLabel="Post body" />

        <TouchableOpacity style={[styles.submitBtn, (loading || uploading) && styles.submitBtnDisabled]} onPress={handleCreate} disabled={loading || uploading} accessibilityRole="button" accessibilityLabel="Publish post">
          {uploading ? (
            <View style={styles.uploadingRow}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.submitBtnText}> Uploading media...</Text>
            </View>
          ) : loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Create Post</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07070E' },
  scrollContent: { padding: 28, minHeight: '100%' },
  backBtn: { marginBottom: 20 },
  backBtnText: { color: '#FF3D00', fontSize: 14, fontWeight: '600' },
  form: { maxWidth: 600, width: '100%', alignSelf: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#F0F0FA', marginBottom: 6, letterSpacing: -0.3 },
  subtitle: { fontSize: 15, color: '#8A94B8', marginBottom: 28 },
  label: { fontSize: 11, fontWeight: '700', color: '#8A94B8', marginBottom: 8, marginTop: 20, letterSpacing: 1.2, textTransform: 'uppercase' },
  required: { color: '#FF1744', fontWeight: '400', fontSize: 12 },
  input: { borderWidth: 1.5, borderColor: 'rgba(255,61,0,0.2)', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#F0F0FA', backgroundColor: 'rgba(255,61,0,0.04)' },
  inputDisabled: { backgroundColor: 'rgba(255,255,255,0.02)', color: '#4A5278' },
  textArea: { minHeight: 160 },
  typeRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  typeBtn: { paddingHorizontal: 18, paddingVertical: 11, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.03)' },
  typeBtnActive: { backgroundColor: '#FF3D00', borderColor: '#FF3D00' },
  typeBtnText: { fontSize: 13, color: '#8A94B8', fontWeight: '600' },
  typeBtnTextActive: { color: '#FFF' },
  uploadBtn: { borderWidth: 2, borderColor: 'rgba(255,61,0,0.25)', borderStyle: 'dashed', borderRadius: 14, paddingVertical: 32, paddingHorizontal: 24, alignItems: 'center', backgroundColor: 'rgba(255,61,0,0.04)' },
  uploadIcon: { fontSize: 32, marginBottom: 10 },
  uploadBtnText: { fontSize: 15, fontWeight: '700', color: '#FF3D00', marginBottom: 4 },
  uploadHint: { fontSize: 12, color: '#4A5278', textAlign: 'center' },
  mediaPreviewContainer: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', backgroundColor: '#0F0F1D' },
  mediaPreview: { width: '100%', height: 220, borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  videoPlaceholder: { width: '100%', height: 180, backgroundColor: '#0A0A18', justifyContent: 'center', alignItems: 'center', borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  videoIcon: { fontSize: 40, marginBottom: 8 },
  videoText: { color: '#F0F0FA', fontSize: 14, fontWeight: '600' },
  videoSubtext: { color: '#4A5278', fontSize: 12, marginTop: 3 },
  removeMediaBtn: { paddingVertical: 12, alignItems: 'center', backgroundColor: 'rgba(255,23,68,0.08)', borderTopWidth: 1, borderTopColor: 'rgba(255,23,68,0.15)' },
  removeMediaText: { color: '#FF1744', fontSize: 13, fontWeight: '600' },
  orDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  orText: { marginHorizontal: 14, fontSize: 12, color: '#4A5278', fontWeight: '600' },
  uploadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  submitBtn: { backgroundColor: '#FF3D00', paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 32, shadowColor: '#FF3D00', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 12 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
});
