import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import api from '../src/utils/api';
import { LoadingSpinner, SkeletonCardList, ErrorState, NoticeBanner, useToast } from '../src/components/UIComponents';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const [stats, setStats] = useState(null);
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setError(null);

      // Fetch content and profile; treat a 404 on the profile as a stale session
      const [contentRes, profileRes] = await Promise.all([
        api.get('/api/content/mine?limit=5'),
        api.get(`/api/creators/${user?.id}`).catch(err => {
          if (err.status === 404) {
            // Stored session references an account that no longer exists — sign out
            logout().then(() => router.replace('/login'));
            return null;
          }
          throw err;
        }),
      ]);

      if (!profileRes) return; // redirecting to login, bail out

      const posts = contentRes.data || [];
      const totalPosts = contentRes.total || posts.length;
      const published = posts.filter(p => p.is_published).length;
      const pending = posts.filter(p => !p.is_published).length;

      setStats({
        totalPosts,
        published,
        pending,
        profileViews: profileRes.view_count || 0,
        name: profileRes.name,
        role: profileRes.role,
      });
      setRecentPosts(posts.slice(0, 5));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, logout, router]);

  useEffect(() => {
    if (isAuthenticated && user) fetchDashboard();
  }, [isAuthenticated, user]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const isFan = user?.role === 'fan';
  const isBusiness = user?.role === 'business';
  const isAthlete = user?.role === 'athlete';

  if (loading) return <SkeletonCardList count={3} />;
  if (error) return <ErrorState message={error} onRetry={fetchDashboard} />;

  return (
    <View style={styles.container}>
      <NoticeBanner {...toast} onDismiss={hideToast} />

      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>PLXYGROUND</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Welcome */}
        <View style={styles.welcomeCard}>
          <View style={styles.avatarLg}>
            <Text style={styles.avatarLgText}>{(user?.name || 'U')[0]}</Text>
          </View>
          <View style={styles.welcomeInfo}>
            <Text style={styles.welcomeName}>Welcome back, {user?.name?.split(' ')[0]}!</Text>
            <Text style={styles.welcomeRole}>
              {isFan ? '🏟️ Fan' : isBusiness ? '🏢 Business' : isAthlete ? '🏆 Athlete' : '🎨 Creator'}
            </Text>
          </View>
        </View>

        {/* KPI Cards - only show for creators/businesses */}
        {!isFan && (
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{stats?.totalPosts || 0}</Text>
              <Text style={styles.kpiLabel}>Total Posts</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={[styles.kpiValue, { color: '#00E676' }]}>{stats?.published || 0}</Text>
              <Text style={styles.kpiLabel}>Published</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={[styles.kpiValue, { color: '#FF9100' }]}>{stats?.pending || 0}</Text>
              <Text style={styles.kpiLabel}>Pending</Text>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {!isFan && (
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/create-post')} accessibilityRole="button">
              <Text style={styles.actionIcon}>✏️</Text>
              <Text style={styles.actionLabel}>Create Post</Text>
            </TouchableOpacity>
          )}
          {isBusiness && (
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/my-opportunities')} accessibilityRole="button">
              <Text style={styles.actionIcon}>📋</Text>
              <Text style={styles.actionLabel}>My Opportunities</Text>
            </TouchableOpacity>
          )}
          {!isFan && (
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/analytics')} accessibilityRole="button">
              <Text style={styles.actionIcon}>📈</Text>
              <Text style={styles.actionLabel}>Analytics</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/feed')} accessibilityRole="button">
            <Text style={styles.actionIcon}>📰</Text>
            <Text style={styles.actionLabel}>View Feed</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/discover')} accessibilityRole="button">
            <Text style={styles.actionIcon}>🔍</Text>
            <Text style={styles.actionLabel}>Discover</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push(`/profile/${user?.id}`)} accessibilityRole="button">
            <Text style={styles.actionIcon}>👤</Text>
            <Text style={styles.actionLabel}>My Profile</Text>
          </TouchableOpacity>
          {!isFan && (
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/my-content')} accessibilityRole="button">
              <Text style={styles.actionIcon}>📁</Text>
              <Text style={styles.actionLabel}>My Content</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/notifications')} accessibilityRole="button">
            <Text style={styles.actionIcon}>🔔</Text>
            <Text style={styles.actionLabel}>Notifications</Text>
          </TouchableOpacity>
          {!isFan && (
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/opportunities')} accessibilityRole="button">
              <Text style={styles.actionIcon}>🤝</Text>
              <Text style={styles.actionLabel}>Opportunities</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/settings')} accessibilityRole="button">
            <Text style={styles.actionIcon}>⚙️</Text>
            <Text style={styles.actionLabel}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity - for creators/businesses */}
        {!isFan && recentPosts.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recent Posts</Text>
            {recentPosts.map(post => (
              <TouchableOpacity key={post.id} style={styles.recentItem} onPress={() => router.push(`/content/${post.id}`)} accessibilityRole="button">
                <View style={styles.recentItemLeft}>
                  <Text style={styles.recentTitle} numberOfLines={1}>{post.title}</Text>
                  <Text style={styles.recentMeta}>
                    {post.content_type?.replace('_', ' ')} • {post.is_published ? '✅ Published' : '⏳ Pending'}
                  </Text>
                </View>
                <Text style={styles.recentDate}>{new Date(post.created_at).toLocaleDateString()}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.viewAllBtn} onPress={() => router.push('/my-content')} accessibilityRole="button">
              <Text style={styles.viewAllText}>View All Content →</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => {}} accessibilityRole="button" accessibilityLabel="Dashboard">
          <Text style={[styles.navIcon, styles.navActive]}>📊</Text>
          <Text style={[styles.navLabel, styles.navActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/feed')} accessibilityRole="button" accessibilityLabel="Feed">
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/discover')} accessibilityRole="button" accessibilityLabel="Discover">
          <Text style={styles.navIcon}>🔍</Text>
          <Text style={styles.navLabel}>Discover</Text>
        </TouchableOpacity>
        {!isFan && (
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/create-post')} accessibilityRole="button" accessibilityLabel="Create">
            <Text style={styles.navIcon}>➕</Text>
            <Text style={styles.navLabel}>Create</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.navItem} onPress={() => router.push(`/profile/${user?.id}`)} accessibilityRole="button" accessibilityLabel="Profile">
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07070E' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, backgroundColor: '#0A0A18', borderBottomWidth: 1, borderBottomColor: 'rgba(255,61,0,0.12)' },
  topBarTitle: { fontSize: 20, fontWeight: '800', color: '#FF3D00', letterSpacing: 2 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 18, maxWidth: 600, alignSelf: 'center', width: '100%', paddingBottom: 36 },
  welcomeCard: { flexDirection: 'row', alignItems: 'center', gap: 18, padding: 22, backgroundColor: '#0F0F1D', borderRadius: 14, marginBottom: 22, shadowColor: '#FF3D00', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  avatarLg: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#FF3D00', justifyContent: 'center', alignItems: 'center', shadowColor: '#FF3D00', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 12 },
  avatarLgText: { color: '#FFFFFF', fontWeight: '800', fontSize: 24 },
  welcomeInfo: { flex: 1 },
  welcomeName: { fontSize: 22, fontWeight: '800', color: '#F0F0FA', letterSpacing: -0.3 },
  welcomeRole: { fontSize: 14, color: '#8A94B8', marginTop: 4 },
  kpiRow: { flexDirection: 'row', gap: 12, marginBottom: 26 },
  kpiCard: { flex: 1, backgroundColor: '#0F0F1D', borderRadius: 14, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  kpiValue: { fontSize: 30, fontWeight: '800', color: '#FF3D00', letterSpacing: -0.5 },
  kpiLabel: { fontSize: 12, color: '#4A5278', marginTop: 4, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#F0F0FA', marginBottom: 14, marginTop: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 26 },
  actionCard: { width: '47%', backgroundColor: '#0F0F1D', borderRadius: 14, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  actionIcon: { fontSize: 28, marginBottom: 10 },
  actionLabel: { fontSize: 13, fontWeight: '600', color: '#8A94B8', textAlign: 'center' },
  recentItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0F0F1D', borderRadius: 14, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  recentItemLeft: { flex: 1, marginRight: 12 },
  recentTitle: { fontSize: 15, fontWeight: '600', color: '#F0F0FA' },
  recentMeta: { fontSize: 12, color: '#8A94B8', marginTop: 4 },
  recentDate: { fontSize: 12, color: '#4A5278' },
  viewAllBtn: { alignItems: 'center', paddingVertical: 14 },
  viewAllText: { color: '#FF3D00', fontWeight: '700', fontSize: 14 },
  bottomNav: { flexDirection: 'row', backgroundColor: '#0A0A18', borderTopWidth: 1, borderTopColor: 'rgba(255,61,0,0.15)', paddingVertical: 10 },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  navIcon: { fontSize: 20 },
  navLabel: { fontSize: 10, color: '#4A5278', marginTop: 3, fontWeight: '500' },
  navActive: { color: '#FF3D00' },
});
