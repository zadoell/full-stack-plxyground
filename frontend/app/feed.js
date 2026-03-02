import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import api from '../src/utils/api';
import { ContentCard, LoadingSpinner, EmptyState, ErrorState, InlineModal, NoticeBanner, useToast } from '../src/components/UIComponents';

export default function FeedScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteModal, setDeleteModal] = useState({ visible: false, item: null });

  const fetchContent = useCallback(async (p = 1, searchVal = search) => {
    try {
      setError(null);
      const params = `?page=${p}&limit=20${searchVal ? `&search=${encodeURIComponent(searchVal)}` : ''}`;
      const res = await api.get(`/api/content${params}`);
      if (p === 1) {
        setContent(res.data);
      } else {
        setContent(prev => [...prev, ...res.data]);
      }
      setTotal(res.total);
      setPage(p);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => { fetchContent(1); }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      fetchContent(1, search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchContent(1);
  };

  const handleLoadMore = () => {
    if (content.length < total) {
      fetchContent(page + 1);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.item) return;
    try {
      await api.delete(`/api/content/${deleteModal.item.id}`);
      showToast('Post deleted', 'success');
      setDeleteModal({ visible: false, item: null });
      fetchContent(1);
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  return (
    <View style={styles.container}>
      <NoticeBanner {...toast} onDismiss={hideToast} />
      <InlineModal
        visible={deleteModal.visible}
        title="Delete Post"
        message={`Are you sure you want to delete "${deleteModal.item?.title}"? This cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ visible: false, item: null })}
      />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>PLXYGROUND</Text>
        <View style={styles.topBarActions}>
          {isAuthenticated && (
            <>
              <TouchableOpacity onPress={() => router.push('/create-post')} style={styles.createBtn} accessibilityRole="button" accessibilityLabel="Create new post">
                <Text style={styles.createBtnText}>+ New Post</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder="Search by title, creator, or content..." placeholderTextColor="#9ca3af" accessibilityLabel="Search posts" />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn} accessibilityRole="button" accessibilityLabel="Clear search"><Text style={styles.clearBtnText}>✕</Text></TouchableOpacity>
        ) : null}
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchContent(1)} />
      ) : content.length === 0 ? (
        <EmptyState message={search ? 'No results found' : 'No posts yet. Be the first to share!'} />
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.feedContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          {content.map(item => (
            <ContentCard
              key={item.id}
              item={item}
              onPress={() => router.push(`/content/${item.id}`)}
              onEdit={(it) => router.push(`/edit-post/${it.id}`)}
              onDelete={(it) => setDeleteModal({ visible: true, item: it })}
              isOwner={user && user.id === item.creator_id}
            />
          ))}
          {content.length < total && (
            <TouchableOpacity onPress={handleLoadMore} style={styles.loadMoreBtn} accessibilityRole="button">
              <Text style={styles.loadMoreText}>Load More</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* Bottom Nav */}
      {isAuthenticated && (
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => {}} accessibilityRole="button" accessibilityLabel="Feed"><Text style={[styles.navIcon, styles.navActive]}>🏠</Text><Text style={[styles.navLabel, styles.navActive]}>Feed</Text></TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/discover')} accessibilityRole="button" accessibilityLabel="Discover"><Text style={styles.navIcon}>🔍</Text><Text style={styles.navLabel}>Discover</Text></TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/create-post')} accessibilityRole="button" accessibilityLabel="Create"><Text style={styles.navIcon}>➕</Text><Text style={styles.navLabel}>Create</Text></TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push(`/profile/${user?.id}`)} accessibilityRole="button" accessibilityLabel="Profile"><Text style={styles.navIcon}>👤</Text><Text style={styles.navLabel}>Profile</Text></TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/settings')} accessibilityRole="button" accessibilityLabel="Settings"><Text style={styles.navIcon}>⚙️</Text><Text style={styles.navLabel}>Settings</Text></TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  topBarTitle: { fontSize: 20, fontWeight: '800', color: '#111', letterSpacing: 1 },
  topBarActions: { flexDirection: 'row', gap: 12 },
  createBtn: { backgroundColor: '#2563eb', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  searchInput: { flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#111', backgroundColor: '#f9fafb' },
  clearBtn: { marginLeft: 8, padding: 8 },
  clearBtnText: { fontSize: 16, color: '#6b7280' },
  scrollView: { flex: 1 },
  feedContent: { padding: 16, maxWidth: 700, alignSelf: 'center', width: '100%' },
  loadMoreBtn: { alignItems: 'center', paddingVertical: 16 },
  loadMoreText: { color: '#2563eb', fontWeight: '600', fontSize: 14 },
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingVertical: 8 },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  navIcon: { fontSize: 20 },
  navLabel: { fontSize: 10, color: '#6b7280', marginTop: 2 },
  navActive: { color: '#2563eb' },
});
