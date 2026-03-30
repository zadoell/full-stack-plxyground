import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../src/utils/api';
import { LoadingSpinner, EmptyState, ErrorState, InlineModal, NoticeBanner, useToast } from '../src/components/UIComponents';
import { useBack } from '../src/hooks/useBack';

const getRoleIcon = (roleType) => {
  const icons = {
    ambassador: '🏅',
    creator: '🎨',
    photographer: '📷',
    reporter: '🎙️',
    host: '🎤',
    specialist: '⚡',
  };
  return icons[roleType?.toLowerCase()] || '🤝';
};

export default function MyOpportunitiesScreen() {
  const router = useRouter();
  const goBack = useBack('/dashboard');
  const { toast, showToast, hideToast } = useToast();

  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ visible: false, id: null, title: '' });
  const [deleting, setDeleting] = useState(false);

  const fetchOpportunities = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get('/api/opportunities/mine?limit=100');
      setOpportunities(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load opportunities');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOpportunities();
  };

  const openDeleteModal = (opp) => {
    setDeleteModal({ visible: true, id: opp.id, title: opp.title });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ visible: false, id: null, title: '' });
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;
    setDeleting(true);
    try {
      await api.delete(`/api/opportunities/${deleteModal.id}`);
      setOpportunities(prev => prev.filter(o => o.id !== deleteModal.id));
      closeDeleteModal();
      showToast('Opportunity deleted.', 'success');
    } catch (err) {
      closeDeleteModal();
      showToast(err.message || 'Failed to delete opportunity', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Analytics
  const totalCount = opportunities.length;
  const publishedCount = opportunities.filter(o => o.is_published).length;
  const totalViews = opportunities.reduce((sum, o) => sum + (o.view_count || 0), 0);

  const renderContent = () => {
    if (loading) return <LoadingSpinner message="Loading your opportunities..." />;
    if (error) return <ErrorState message={error} onRetry={() => { setLoading(true); fetchOpportunities(); }} />;

    return (
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FF3D00"
            colors={['#FF3D00']}
          />
        }
      >
        {/* Analytics Summary Bar */}
        <View style={styles.analyticsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#FF3D00' }]}>{totalCount}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#00E676' }]}>{publishedCount}</Text>
            <Text style={styles.statLabel}>Published</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#00CFFF' }]}>{totalViews}</Text>
            <Text style={styles.statLabel}>Total Views</Text>
          </View>
        </View>

        {opportunities.length === 0 ? (
          <EmptyState
            message="No opportunities yet. Create your first one to start attracting talent!"
            icon="🤝"
          />
        ) : (
          opportunities.map(opp => (
            <View key={opp.id} style={styles.oppCard}>
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <Text style={styles.roleIcon}>{getRoleIcon(opp.role_type)}</Text>
                <View style={styles.cardHeaderInfo}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{opp.title}</Text>
                  <View style={styles.badgeRow}>
                    {opp.role_type ? (
                      <View style={styles.roleBadge}>
                        <Text style={styles.roleBadgeText}>{opp.role_type}</Text>
                      </View>
                    ) : null}
                    <View style={[styles.statusBadge, opp.is_published ? styles.statusBadgePublished : styles.statusBadgePending]}>
                      <Text style={[styles.statusBadgeText, opp.is_published ? styles.statusTextPublished : styles.statusTextPending]}>
                        {opp.is_published ? 'Published' : 'Pending'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* View Count */}
              <Text style={styles.viewCount}>👁 {opp.view_count || 0} views</Text>

              {/* Card Footer Actions */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => router.push(`/edit-opportunity/${opp.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${opp.title}`}
                >
                  <Text style={styles.editBtnText}>✏️ Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => openDeleteModal(opp)}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${opp.title}`}
                >
                  <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <NoticeBanner {...toast} onDismiss={hideToast} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => goBack()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Opportunities</Text>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => router.push('/create-opportunity')}
          accessibilityRole="button"
          accessibilityLabel="Create new opportunity"
        >
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {renderContent()}

      {/* Delete Confirmation Modal */}
      <InlineModal
        visible={deleteModal.visible}
        title="Delete Opportunity"
        message={`Are you sure you want to delete "${deleteModal.title}"? This action cannot be undone.`}
        confirmText={deleting ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        confirmColor="#FF1744"
        onConfirm={handleDelete}
        onCancel={closeDeleteModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07070E',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: '#0A0A18',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,61,0,0.12)',
    gap: 12,
  },
  backBtn: {},
  backBtnText: {
    color: '#FF3D00',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: '#F0F0FA',
    letterSpacing: -0.3,
  },
  newBtn: {
    backgroundColor: '#FF3D00',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    shadowColor: '#FF3D00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  newBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // List
  list: { flex: 1 },
  listContent: {
    padding: 16,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: 40,
  },

  // Analytics Row
  analyticsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#0F0F1D',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: '#4A5278',
    marginTop: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Opportunity Card
  oppCard: {
    backgroundColor: '#0F0F1D',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderLeftWidth: 3,
    borderLeftColor: '#FF3D00',
    marginBottom: 14,
    padding: 18,
    shadowColor: '#FF3D00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  roleIcon: {
    fontSize: 28,
    marginTop: 2,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F0F0FA',
    marginBottom: 8,
    lineHeight: 22,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  roleBadge: {
    backgroundColor: 'rgba(255,61,0,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 11,
    color: '#FF3D00',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgePublished: {
    backgroundColor: 'rgba(0,230,118,0.12)',
  },
  statusBadgePending: {
    backgroundColor: 'rgba(255,145,0,0.12)',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusTextPublished: {
    color: '#00E676',
  },
  statusTextPending: {
    color: '#FF9100',
  },
  viewCount: {
    fontSize: 12,
    color: '#4A5278',
    marginBottom: 14,
    fontWeight: '500',
  },

  // Card Actions
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
  editBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(0,207,255,0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,207,255,0.2)',
    alignItems: 'center',
  },
  editBtnText: {
    fontSize: 13,
    color: '#00CFFF',
    fontWeight: '600',
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,23,68,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,23,68,0.2)',
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: 13,
    color: '#FF1744',
    fontWeight: '600',
  },
});
