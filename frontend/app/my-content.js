import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import api from '../src/utils/api';
import { ContentCard, LoadingSpinner, SkeletonCardList, EmptyState, ErrorState, InlineModal, NoticeBanner, useToast } from '../src/components/UIComponents';
import { useBack } from '../src/hooks/useBack';

export default function MyContentScreen() {
  const router = useRouter();
  const goBack = useBack('/dashboard');
  const { user } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, published, pending
  const [deleteModal, setDeleteModal] = useState({ visible: false, item: null });

  const fetchContent = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get('/api/content/mine?limit=200');
      setContent(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchContent(); }, []);

  const handleDelete = async () => {
    if (!deleteModal.item) return;
    try {
      await api.delete(`/api/content/${deleteModal.item.id}`);
      showToast('Post deleted successfully', 'success');
      setDeleteModal({ visible: false, item: null });
      fetchContent();
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  const filtered = content.filter(item => {
    if (filter === 'published') return item.is_published;
    if (filter === 'pending') return !item.is_published;
    return true;
  });

  const publishedCount = content.filter(c => c.is_published).length;
  const pendingCount = content.filter(c => !c.is_published).length;

  return (
    <View style={styles.container}>
      <NoticeBanner {...toast} onDismiss={hideToast} />
      <InlineModal
        visible={deleteModal.visible}
        title="Delete Post"
        message={`Are you sure you want to delete "${deleteModal.item?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ visible: false, item: null })}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBack()} style={styles.backBtn}><Text style={styles.backBtnText}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>My Content</Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/create-post')} accessibilityRole="button">
          <Text style={styles.createBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{content.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#00E676' }]}>{publishedCount}</Text>
          <Text style={styles.statLabel}>Published</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#FF9100' }]}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabs}>
        {[{ key: 'all', label: `All (${content.length})` }, { key: 'published', label: `Published (${publishedCount})` }, { key: 'pending', label: `Pending (${pendingCount})` }].map(t => (
          <TouchableOpacity key={t.key} style={[styles.tab, filter === t.key && styles.tabActive]} onPress={() => setFilter(t.key)} accessibilityRole="button">
            <Text style={[styles.tabText, filter === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? <SkeletonCardList count={3} /> : error ? <ErrorState message={error} onRetry={fetchContent} /> : filtered.length === 0 ? (
        <EmptyState
          message={filter === 'all' ? 'You haven\'t created any content yet' : `No ${filter} content`}
          icon={filter === 'pending' ? '⏳' : '📭'}
        />
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchContent(); }} />}
        >
          {filtered.map(item => (
            <ContentCard
              key={item.id}
              item={item}
              onPress={() => router.push(`/content/${item.id}`)}
              onEdit={(it) => router.push(`/edit-post/${it.id}`)}
              onDelete={(it) => setDeleteModal({ visible: true, item: it })}
              isOwner={true}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07070E' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 18, backgroundColor: '#0A0A18', borderBottomWidth: 1, borderBottomColor: 'rgba(255,61,0,0.12)', gap: 12 },
  backBtn: {},
  backBtnText: { color: '#FF3D00', fontSize: 14, fontWeight: '600' },
  title: { flex: 1, fontSize: 20, fontWeight: '800', color: '#F0F0FA', letterSpacing: -0.3 },
  createBtn: { backgroundColor: '#FF3D00', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  createBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  statsBar: { flexDirection: 'row', backgroundColor: '#0A0A18', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,61,0,0.12)' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', color: '#FF3D00', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, color: '#8A94B8', marginTop: 3, fontWeight: '600' },
  tabs: { flexDirection: 'row', backgroundColor: '#0A0A18', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2.5, borderBottomColor: '#FF3D00' },
  tabText: { fontSize: 13, color: '#8A94B8', fontWeight: '600' },
  tabTextActive: { color: '#FF3D00' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, maxWidth: 700, alignSelf: 'center', width: '100%' },
});
