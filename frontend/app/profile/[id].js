import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/utils/api';
import { ContentCard, LoadingSpinner, EmptyState, ErrorState } from '../../src/components/UIComponents';

export default function ProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [creator, setCreator] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isOwn = user && String(user.id) === String(id);

  useEffect(() => {
    (async () => {
      try {
        const c = await api.get(`/api/creators/${id}`);
        setCreator(c);
        const contentRes = await api.get(`/api/content?limit=50&search=`);
        setPosts(contentRes.data.filter(p => p.creator_id === parseInt(id)));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;
  if (!creator) return <ErrorState message="Profile not found" />;

  let socials = {};
  try { socials = typeof creator.social_links === 'string' ? JSON.parse(creator.social_links) : creator.social_links || {}; } catch {}

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backBtnText}>← Back</Text></TouchableOpacity>

      <View style={styles.profileHeader}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{(creator.name || 'U')[0]}</Text></View>
        <Text style={styles.name}>{creator.name}</Text>
        <View style={styles.roleBadge}><Text style={styles.roleBadgeText}>{creator.role === 'business' ? '🏢 Business' : '🎨 Creator'}</Text></View>
        {creator.location && <Text style={styles.location}>📍 {creator.location}</Text>}
        {creator.bio && <Text style={styles.bio}>{creator.bio}</Text>}

        {Object.keys(socials).length > 0 && (
          <View style={styles.socials}>
            {Object.entries(socials).map(([key, val]) => (
              <View key={key} style={styles.socialItem}>
                <Text style={styles.socialLabel}>{key}:</Text>
                <Text style={styles.socialValue}>{val}</Text>
              </View>
            ))}
          </View>
        )}

        {isOwn && (
          <TouchableOpacity style={styles.editProfileBtn} onPress={() => router.push('/edit-profile')} accessibilityRole="button">
            <Text style={styles.editProfileBtnText}>✏️ Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.postsSection}>
        <Text style={styles.sectionTitle}>Posts ({posts.length})</Text>
        {posts.length === 0 ? (
          <EmptyState message="No posts yet" />
        ) : (
          posts.map(item => (
            <ContentCard key={item.id} item={item} onPress={() => router.push(`/content/${item.id}`)} isOwner={false} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  backBtn: { padding: 16 },
  backBtnText: { color: '#2563eb', fontSize: 14, fontWeight: '600' },
  profileHeader: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 32 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 32 },
  name: { fontSize: 24, fontWeight: '800', color: '#111' },
  roleBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 8 },
  roleBadgeText: { color: '#2563eb', fontSize: 13, fontWeight: '600' },
  location: { color: '#6b7280', fontSize: 14, marginTop: 8 },
  bio: { color: '#374151', fontSize: 15, textAlign: 'center', marginTop: 12, lineHeight: 22, maxWidth: 500 },
  socials: { marginTop: 16, gap: 4 },
  socialItem: { flexDirection: 'row', gap: 6 },
  socialLabel: { color: '#9ca3af', fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  socialValue: { color: '#2563eb', fontSize: 13 },
  editProfileBtn: { marginTop: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  editProfileBtnText: { color: '#374151', fontWeight: '600', fontSize: 14 },
  postsSection: { padding: 16, maxWidth: 700, alignSelf: 'center', width: '100%' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 16 },
});
