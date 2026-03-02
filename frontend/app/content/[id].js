import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../src/utils/api';
import { LoadingSpinner, ErrorState } from '../../src/components/UIComponents';

export default function ContentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/api/content/${id}`);
        setItem(res);
      } catch (err) {
        setError(err.status === 404 ? 'Content not found' : err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={() => { setLoading(true); setError(null); }} />;
  if (!item) return <ErrorState message="Content not found" />;

  const typePillColor = item.content_type === 'article' ? '#2563eb' : item.content_type === 'video_embed' ? '#7c3aed' : '#059669';

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>

      {item.media_url && (
        <View style={styles.heroMedia}>
          <img
            src={item.media_url}
            alt={item.title}
            style={{ width: '100%', height: 300, objectFit: 'cover' }}
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1461896836934-bd45ba8fcb36?w=800'; }}
          />
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.meta}>
          <View style={[styles.pill, { backgroundColor: typePillColor }]}>
            <Text style={styles.pillText}>{item.content_type?.replace('_', ' ')}</Text>
          </View>
          {item.is_published ? (
            <View style={[styles.pill, { backgroundColor: '#059669' }]}><Text style={styles.pillText}>Published</Text></View>
          ) : (
            <View style={[styles.pill, { backgroundColor: '#d97706' }]}><Text style={styles.pillText}>Pending</Text></View>
          )}
        </View>

        <Text style={styles.title}>{item.title}</Text>

        <TouchableOpacity
          style={styles.creatorChip}
          onPress={() => router.push(`/profile/${item.creator_id}`)}
          accessibilityRole="link"
        >
          <View style={styles.avatar}><Text style={styles.avatarText}>{(item.creator_name || 'U')[0]}</Text></View>
          <View>
            <Text style={styles.creatorName}>{item.creator_name}</Text>
            <Text style={styles.creatorRole}>{item.creator_role || 'Creator'}</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.timestamp}>
          {item.published_at ? `Published ${new Date(item.published_at).toLocaleDateString()}` : `Created ${new Date(item.created_at).toLocaleDateString()}`}
        </Text>

        <Text style={styles.body}>{item.body}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  backBtn: { padding: 16 },
  backBtnText: { color: '#2563eb', fontSize: 14, fontWeight: '600' },
  heroMedia: { width: '100%', height: 300, backgroundColor: '#e5e7eb' },
  content: { padding: 20, maxWidth: 700, alignSelf: 'center', width: '100%' },
  meta: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  pill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  pillText: { color: '#fff', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  title: { fontSize: 28, fontWeight: '800', color: '#111', marginBottom: 16, lineHeight: 36 },
  creatorChip: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f3f4f6', marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  creatorName: { fontSize: 15, fontWeight: '600', color: '#111' },
  creatorRole: { fontSize: 12, color: '#6b7280', textTransform: 'capitalize' },
  timestamp: { fontSize: 13, color: '#9ca3af', marginBottom: 20 },
  body: { fontSize: 16, color: '#374151', lineHeight: 26 },
});
