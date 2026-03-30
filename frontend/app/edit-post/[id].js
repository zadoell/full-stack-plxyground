import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import api from '../../src/utils/api';
import { NoticeBanner, useToast, LoadingSpinner } from '../../src/components/UIComponents';
import { useBack } from '../../src/hooks/useBack';

const CONTENT_TYPES = [
  { value: 'article', label: '📝 Article' },
  { value: 'video_embed', label: '🎬 Video Embed' },
  { value: 'image_story', label: '📸 Image Story' },
];

export default function EditPostScreen() {
  const router = useRouter();
  const goBack = useBack('/my-content');
  const { id } = useLocalSearchParams();
  const { toast, showToast, hideToast } = useToast();
  const [form, setForm] = useState({ title: '', body: '', media_url: '', content_type: 'article' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pickedMedia, setPickedMedia] = useState(null);
  const [existingMediaUrl, setExistingMediaUrl] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/api/content/${id}`);
        setForm({ title: res.title, body: res.body || '', media_url: res.media_url, content_type: res.content_type });
        setExistingMediaUrl(res.media_url || '');
      } catch (err) {
        showToast('Failed to load post', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

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

    setPickedMedia({ uri: asset.uri, type: asset.type, fileName, mimeType });
    setForm(p => ({ ...p, media_url: '' }));
  };

  const removeMedia = () => {
    setPickedMedia(null);
  };

  const handleUpdate = async () => {
    if (!form.title.trim()) return showToast('Title is required', 'error');
    if (!pickedMedia && !form.media_url.trim()) {
      return showToast('Upload media or paste a URL', 'error');
    }
    if (!pickedMedia && form.media_url.trim()) {
      try { new URL(form.media_url); } catch { return showToast('Media URL must be a valid URL', 'error'); }
    }

    setSaving(true);
    try {
      let mediaUrl = form.media_url.trim();

      if (pickedMedia) {
        setUploading(true);
        try {
          const uploadRes = await api.upload(pickedMedia.uri, pickedMedia.fileName, pickedMedia.mimeType);
          mediaUrl = uploadRes.url;
        } catch (err) {
          setUploading(false);
          setSaving(false);
          return showToast(err.message || 'File upload failed', 'error');
        }
        setUploading(false);
      }

      await api.put(`/api/content/${id}`, {
        title: form.title.trim(),
        body: form.body.trim(),
        media_url: mediaUrl,
        content_type: form.content_type,
      });
      showToast('Post updated successfully!', 'success');
      setTimeout(() => goBack(), 1000);
    } catch (err) {
      showToast(err.message || 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading post..." />;

  const isVideo = pickedMedia?.type === 'video' || pickedMedia?.mimeType?.startsWith('video/');
  const showExistingMedia = !pickedMedia && existingMediaUrl && form.media_url === existingMediaUrl;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <NoticeBanner {...toast} onDismiss={hideToast} />
      <TouchableOpacity onPress={() => goBack()} style={styles.backBtn}><Text style={styles.backBtnText}>← Back</Text></TouchableOpacity>
      <View style={styles.form}>
        <Text style={styles.title}>Edit Post</Text>

        <Text style={styles.label}>Content Type</Text>
        <View style={styles.typeRow}>
          {CONTENT_TYPES.map(ct => (
            <TouchableOpacity key={ct.value} style={[styles.typeBtn, form.content_type === ct.value && styles.typeBtnActive]} onPress={() => setForm(p => ({...p, content_type: ct.value}))}>
              <Text style={[styles.typeBtnText, form.content_type === ct.value && styles.typeBtnTextActive]}>{ct.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Title *</Text>
        <TextInput style={styles.input} value={form.title} onChangeText={v => setForm(p => ({...p, title: v}))} maxLength={500} accessibilityLabel="Post title" />

        {/* ── Media Section ── */}
        <Text style={styles.label}>Media * <Text style={styles.required}>(required)</Text></Text>

        {pickedMedia ? (
          <View style={styles.mediaPreviewContainer}>
            {isVideo ? (
              <View style={styles.videoPlaceholder}>
                <Text style={styles.videoIcon}>🎬</Text>
                <Text style={styles.videoText}>{pickedMedia.fileName}</Text>
                <Text style={styles.videoSubtext}>New video selected</Text>
              </View>
            ) : (
              <Image source={{ uri: pickedMedia.uri }} style={styles.mediaPreview} resizeMode="cover" />
            )}
            <TouchableOpacity style={styles.removeMediaBtn} onPress={removeMedia}>
              <Text style={styles.removeMediaText}>✕ Remove new media</Text>
            </TouchableOpacity>
          </View>
        ) : showExistingMedia ? (
          <View style={styles.mediaPreviewContainer}>
            <Image source={{ uri: existingMediaUrl }} style={styles.mediaPreview} resizeMode="cover" />
            <View style={styles.existingMediaLabel}>
              <Text style={styles.existingMediaText}>Current media</Text>
            </View>
          </View>
        ) : null}

        <TouchableOpacity style={styles.uploadBtn} onPress={pickMedia} accessibilityRole="button">
          <Text style={styles.uploadBtnText}>{pickedMedia || showExistingMedia ? '🔄 Replace with new file' : '📁 Choose Image or Video'}</Text>
          <Text style={styles.uploadHint}>JPEG, PNG, GIF, WebP, MP4, WebM · Max 50 MB</Text>
        </TouchableOpacity>

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

        <Text style={styles.label}>Body</Text>
        <TextInput style={[styles.input, styles.textArea]} value={form.body} onChangeText={v => setForm(p => ({...p, body: v}))} multiline numberOfLines={8} textAlignVertical="top" accessibilityLabel="Post body" />

        <TouchableOpacity style={[styles.submitBtn, (saving || uploading) && styles.submitBtnDisabled]} onPress={handleUpdate} disabled={saving || uploading}>
          {uploading ? (
            <View style={styles.uploadingRow}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.submitBtnText}> Uploading media...</Text>
            </View>
          ) : saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Save Changes</Text>
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
  title: { fontSize: 28, fontWeight: '800', color: '#F0F0FA', marginBottom: 28, letterSpacing: -0.3 },
  label: { fontSize: 11, fontWeight: '700', color: '#8A94B8', marginBottom: 8, marginTop: 20, letterSpacing: 1.2, textTransform: 'uppercase' },
  required: { color: '#FF1744', fontWeight: '400', fontSize: 12 },
  input: { borderWidth: 1.5, borderColor: 'rgba(255,61,0,0.2)', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#F0F0FA', backgroundColor: 'rgba(255,61,0,0.04)' },
  inputDisabled: { backgroundColor: '#0A0A18', color: '#4A5278' },
  textArea: { minHeight: 160 },
  typeRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  typeBtn: { paddingHorizontal: 18, paddingVertical: 11, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.07)', backgroundColor: '#0F0F1D' },
  typeBtnActive: { backgroundColor: '#FF3D00', borderColor: '#FF3D00' },
  typeBtnText: { fontSize: 13, color: '#8A94B8', fontWeight: '600' },
  typeBtnTextActive: { color: '#FFF' },
  // Media upload
  uploadBtn: { borderWidth: 2, borderColor: 'rgba(255,61,0,0.25)', borderStyle: 'dashed', borderRadius: 14, paddingVertical: 22, paddingHorizontal: 24, alignItems: 'center', backgroundColor: 'rgba(255,61,0,0.04)', marginTop: 12 },
  uploadBtnText: { fontSize: 14, fontWeight: '700', color: '#FF3D00', marginBottom: 2 },
  uploadHint: { fontSize: 12, color: '#4A5278', textAlign: 'center' },
  mediaPreviewContainer: { borderRadius: 14, overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.07)', backgroundColor: '#0F0F1D' },
  mediaPreview: { width: '100%', height: 200, borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  videoPlaceholder: { width: '100%', height: 160, backgroundColor: '#0A0A18', justifyContent: 'center', alignItems: 'center', borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  videoIcon: { fontSize: 36, marginBottom: 6 },
  videoText: { color: '#F0F0FA', fontSize: 14, fontWeight: '600' },
  videoSubtext: { color: '#4A5278', fontSize: 12, marginTop: 2 },
  removeMediaBtn: { paddingVertical: 12, alignItems: 'center', backgroundColor: 'rgba(255,23,68,0.08)', borderTopWidth: 1, borderTopColor: 'rgba(255,23,68,0.2)' },
  removeMediaText: { color: '#FF1744', fontSize: 13, fontWeight: '600' },
  existingMediaLabel: { paddingVertical: 10, alignItems: 'center', backgroundColor: 'rgba(0,230,118,0.08)', borderTopWidth: 1, borderTopColor: 'rgba(0,230,118,0.2)' },
  existingMediaText: { color: '#00E676', fontSize: 12, fontWeight: '600' },
  orDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  orText: { marginHorizontal: 12, fontSize: 12, color: '#4A5278', fontWeight: '600' },
  uploadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  submitBtn: { backgroundColor: '#FF3D00', paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 32, shadowColor: '#FF3D00', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 12 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
});
