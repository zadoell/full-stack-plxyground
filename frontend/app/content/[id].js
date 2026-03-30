import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../src/utils/api';
import { LoadingSpinner, ErrorState } from '../../src/components/UIComponents';
import { useBack } from '../../src/hooks/useBack';

export default function ContentDetailScreen() {
  const router = useRouter();
  const goBack = useBack('/feed');
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

  const typePillColor = item.content_type === 'article' ? '#FF3D00' : item.content_type === 'video_embed' ? '#00CFFF' : '#FFD100';

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => goBack()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
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
            <View style={[styles.pill, { backgroundColor: '#00E676' }]}><Text style={styles.pillText}>Published</Text></View>
          ) : (
            <View style={[styles.pill, { backgroundColor: '#FF9100' }]}><Text style={styles.pillText}>Pending</Text></View>
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
  container: { flex: 1, backgroundColor: '#07070E' },
  backBtn: { padding: 18 },
  backBtnText: { color: '#FF3D00', fontSize: 14, fontWeight: '600' },
  heroMedia: { width: '100%', height: 320, backgroundColor: '#0F0F1D' },
  content: { padding: 24, maxWidth: 700, alignSelf: 'center', width: '100%' },
  meta: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  pill: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 6 },
  pillText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  title: { fontSize: 28, fontWeight: '800', color: '#F0F0FA', marginBottom: 18, lineHeight: 36, letterSpacing: -0.3 },
  creatorChip: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.07)', marginBottom: 14 },
  avatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FF3D00', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  creatorName: { fontSize: 15, fontWeight: '700', color: '#F0F0FA' },
  creatorRole: { fontSize: 12, color: '#8A94B8', textTransform: 'capitalize' },
  timestamp: { fontSize: 13, color: '#4A5278', marginBottom: 22 },
  body: { fontSize: 15, color: '#8A94B8', lineHeight: 28 },
});
