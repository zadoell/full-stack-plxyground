import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/utils/api';
import { ContentCard, LoadingSpinner, EmptyState, ErrorState } from '../../src/components/UIComponents';
import { useBack } from '../../src/hooks/useBack';

export default function ProfileScreen() {
  const router = useRouter();
  const goBack = useBack('/discover');
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [creator, setCreator] = useState(null);
  const [posts, setPosts] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isOwn = user && String(user.id) === String(id);

  useEffect(() => {
    (async () => {
      try {
        const c = await api.get(`/api/creators/${id}`);
        setCreator(c);

        // Fetch posts
        if (user && String(user.id) === String(id)) {
          const contentRes = await api.get('/api/content/mine?limit=100');
          setPosts(contentRes.data || []);
        } else {
          const contentRes = await api.get(`/api/content?limit=100`);
          setPosts((contentRes.data || []).filter(p => String(p.creator_id) === String(id)));
        }

        // Fetch opportunities if business profile (public published ones)
        if (c.role === 'business') {
          try {
            const oppRes = await api.get('/api/opportunities?limit=50');
            setOpportunities((oppRes.data || []).filter(o => String(o.creator_id) === String(id)));
          } catch { /* non-fatal */ }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;
  if (!creator) return <ErrorState message="Profile not found" />;

  let socials = {};
  try { socials = typeof creator.social_links === 'string' ? JSON.parse(creator.social_links) : creator.social_links || {}; } catch {}

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => goBack()} style={styles.backBtn}><Text style={styles.backBtnText}>← Back</Text></TouchableOpacity>

      <View style={styles.profileHeader}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{(creator.name || 'U')[0]}</Text></View>
        <Text style={styles.name}>{creator.name}</Text>
        <View style={creator.role === 'business' ? styles.roleBadgeBusiness : styles.roleBadge}>
          <Text style={creator.role === 'business' ? styles.roleBadgeBusinessText : styles.roleBadgeText}>
            {creator.role === 'business' ? '🏢 Business' : creator.role === 'athlete' ? '🏆 Athlete' : creator.role === 'fan' ? '🏟️ Fan' : '🎨 Creator'}
          </Text>
        </View>
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

      {creator.role === 'business' && (
        <View style={styles.opportunitiesSection}>
          <Text style={styles.sectionTitle}>Active Opportunities ({opportunities.length})</Text>
          {opportunities.length === 0 ? (
            <View style={styles.emptyOpp}><Text style={styles.emptyOppText}>No active opportunities posted yet.</Text></View>
          ) : (
            opportunities.map(opp => (
              <TouchableOpacity
                key={opp.id}
                style={styles.oppCard}
                onPress={() => router.push('/opportunities')}
                accessibilityRole="button"
              >
                <View style={styles.oppCardTop}>
                  <Text style={styles.oppTitle}>{opp.title}</Text>
                  {opp.role_type ? (
                    <View style={styles.oppBadge}><Text style={styles.oppBadgeText}>{opp.role_type}</Text></View>
                  ) : null}
                </View>
                {opp.body ? <Text style={styles.oppBody} numberOfLines={2}>{opp.body}</Text> : null}
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      <View style={styles.postsSection}>
        <Text style={styles.sectionTitle}>Posts ({posts.length})</Text>
        {posts.length === 0 ? (
          <EmptyState message="No posts yet" />
        ) : (
          posts.map(item => (
            <ContentCard key={item.id} item={item} onPress={() => router.push(`/content/${item.id}`)} isOwner={isOwn} onEdit={(it) => router.push(`/edit-post/${it.id}`)} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07070E' },
  backBtn: { padding: 18 },
  backBtnText: { color: '#FF3D00', fontSize: 14, fontWeight: '600' },
  profileHeader: { alignItems: 'center', paddingHorizontal: 28, paddingBottom: 36 },
  avatar: { width: 88, height: 88, borderRadius: 12, backgroundColor: '#FF3D00', justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: '#FF3D00', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 12 },
  avatarText: { color: '#FFFFFF', fontWeight: '800', fontSize: 34 },
  name: { fontSize: 26, fontWeight: '800', color: '#F0F0FA', letterSpacing: -0.3 },
  roleBadge: { backgroundColor: 'rgba(255,61,0,0.12)', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 6, marginTop: 10 },
  roleBadgeText: { color: '#FF3D00', fontSize: 13, fontWeight: '600' },
  location: { color: '#8A94B8', fontSize: 14, marginTop: 8 },
  bio: { color: '#8A94B8', fontSize: 15, textAlign: 'center', marginTop: 14, lineHeight: 23, maxWidth: 500 },
  socials: { marginTop: 18, gap: 6 },
  socialItem: { flexDirection: 'row', gap: 6 },
  socialLabel: { color: '#4A5278', fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  socialValue: { color: '#FF3D00', fontSize: 13 },
  editProfileBtn: { marginTop: 18, backgroundColor: 'rgba(255,61,0,0.08)', borderWidth: 1.5, borderColor: 'rgba(255,61,0,0.2)', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  editProfileBtnText: { color: '#FF3D00', fontWeight: '600', fontSize: 14 },
  postsSection: { padding: 18, maxWidth: 700, alignSelf: 'center', width: '100%' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#F0F0FA', marginBottom: 18, letterSpacing: 0.5, textTransform: 'uppercase' },
  roleBadgeBusiness: { backgroundColor: 'rgba(0,207,255,0.12)', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 6, marginTop: 10 },
  roleBadgeBusinessText: { color: '#00CFFF', fontSize: 13, fontWeight: '600' },
  opportunitiesSection: { padding: 18, maxWidth: 700, alignSelf: 'center', width: '100%', paddingBottom: 0 },
  oppCard: { backgroundColor: '#0F0F1D', borderRadius: 14, padding: 18, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderLeftWidth: 3, borderLeftColor: '#00CFFF' },
  oppCardTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' },
  oppTitle: { fontSize: 15, fontWeight: '700', color: '#F0F0FA', flex: 1 },
  oppBadge: { backgroundColor: 'rgba(0,207,255,0.12)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  oppBadgeText: { fontSize: 11, color: '#00CFFF', fontWeight: '700', textTransform: 'capitalize' },
  oppBody: { fontSize: 13, color: '#8A94B8', lineHeight: 19 },
  emptyOpp: { paddingVertical: 20, alignItems: 'center' },
  emptyOppText: { color: '#4A5278', fontSize: 14 },
});
