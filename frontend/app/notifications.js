import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../src/utils/api';
import { LoadingSpinner, EmptyState, ErrorState, NoticeBanner, useToast } from '../src/components/UIComponents';
import { useBack } from '../src/hooks/useBack';

export default function NotificationsScreen() {
  const router = useRouter();
  const goBack = useBack('/dashboard');
  const { toast, showToast, hideToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get('/api/notifications?limit=50');
      setNotifications(res.data || []);
      setUnreadCount(res.unread_count || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      showToast('Failed to mark as read', 'error');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
      showToast('All notifications marked as read', 'success');
    } catch (err) {
      showToast('Failed to update notifications', 'error');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'content.approved': return '✅';
      case 'content.rejected': return '❌';
      case 'account.suspended': return '🚫';
      case 'account.reactivated': return '🎉';
      case 'content.published': return '📢';
      case 'opportunity': return '🤝';
      default: return '🔔';
    }
  };

  return (
    <View style={styles.container}>
      <NoticeBanner {...toast} onDismiss={hideToast} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBack()} style={styles.backBtn}><Text style={styles.backBtnText}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} accessibilityRole="button" accessibilityLabel="Mark all as read">
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {unreadCount > 0 && (
        <View style={styles.unreadBar}>
          <Text style={styles.unreadText}>{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</Text>
        </View>
      )}

      {loading ? <LoadingSpinner message="Loading notifications..." /> : error ? <ErrorState message={error} onRetry={fetchNotifications} /> : notifications.length === 0 ? (
        <EmptyState message="No notifications yet" icon="🔔" />
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} />}
        >
          {notifications.map(notif => (
            <TouchableOpacity
              key={notif.id}
              style={[styles.notifItem, !notif.is_read && styles.notifUnread]}
              onPress={() => {
                if (!notif.is_read) handleMarkRead(notif.id);
                if (notif.link) router.push(notif.link);
              }}
              accessibilityRole="button"
              accessibilityLabel={`${notif.is_read ? '' : 'Unread: '}${notif.title}`}
            >
              <Text style={styles.notifIcon}>{getNotificationIcon(notif.type)}</Text>
              <View style={styles.notifContent}>
                <Text style={[styles.notifTitle, !notif.is_read && styles.notifTitleUnread]}>{notif.title}</Text>
                {notif.message ? <Text style={styles.notifMessage} numberOfLines={2}>{notif.message}</Text> : null}
                <Text style={styles.notifDate}>{new Date(notif.created_at).toLocaleDateString()} {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
              {!notif.is_read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
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
  markAllText: { color: '#FF3D00', fontSize: 13, fontWeight: '600' },
  unreadBar: { backgroundColor: 'rgba(255,61,0,0.1)', paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,61,0,0.2)' },
  unreadText: { color: '#FF3D00', fontSize: 13, fontWeight: '600' },
  list: { flex: 1 },
  listContent: { maxWidth: 600, alignSelf: 'center', width: '100%' },
  notifItem: { flexDirection: 'row', alignItems: 'flex-start', padding: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)', gap: 14, backgroundColor: '#0A0A18' },
  notifUnread: { backgroundColor: 'rgba(255,61,0,0.07)' },
  notifIcon: { fontSize: 24, marginTop: 2 },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 15, fontWeight: '500', color: '#8A94B8' },
  notifTitleUnread: { fontWeight: '700', color: '#F0F0FA' },
  notifMessage: { fontSize: 13, color: '#8A94B8', marginTop: 4, lineHeight: 19 },
  notifDate: { fontSize: 11, color: '#4A5278', marginTop: 6 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF3D00', marginTop: 6 },
});
