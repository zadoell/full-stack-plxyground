import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';

// ── Toast / Banner Component ──
export function NoticeBanner({ message, type = 'info', visible, onDismiss, duration = 4000 }) {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      if (duration > 0) {
        const timer = setTimeout(() => {
          Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => onDismiss?.());
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  const bgColor = type === 'success' ? '#059669' : type === 'error' ? '#dc2626' : type === 'warning' ? '#d97706' : '#2563eb';

  return (
    <Animated.View style={[styles.banner, { backgroundColor: bgColor, opacity: fadeAnim }]} accessibilityRole="alert">
      <Text style={styles.bannerText}>{message}</Text>
      <TouchableOpacity onPress={onDismiss} accessibilityLabel="Dismiss notification" accessibilityRole="button">
        <Text style={styles.bannerClose}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Inline Modal ──
export function InlineModal({ visible, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', confirmColor = '#dc2626' }) {
  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent} accessibilityRole="dialog" accessibilityLabel={title}>
        <Text style={styles.modalTitle}>{title}</Text>
        <Text style={styles.modalMessage}>{message}</Text>
        <View style={styles.modalButtons}>
          <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={onCancel} accessibilityRole="button" accessibilityLabel={cancelText}>
            <Text style={styles.modalBtnCancelText}>{cancelText}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modalBtn, { backgroundColor: confirmColor }]} onPress={onConfirm} accessibilityRole="button" accessibilityLabel={confirmText}>
            <Text style={styles.modalBtnText}>{confirmText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── Loading Spinner ──
export function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <View style={styles.center} accessibilityRole="progressbar" accessibilityLabel={message}>
      <Text style={styles.loadingText}>⏳ {message}</Text>
    </View>
  );
}

// ── Empty State ──
export function EmptyState({ message = 'Nothing here yet', icon = '📭' }) {
  return (
    <View style={styles.center}>
      <Text style={{ fontSize: 48 }}>{icon}</Text>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

// ── Error State ──
export function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <View style={styles.center}>
      <Text style={{ fontSize: 48 }}>⚠️</Text>
      <Text style={styles.errorText}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry} accessibilityRole="button" accessibilityLabel="Retry">
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Content Card ──
export function ContentCard({ item, onPress, onEdit, onDelete, isOwner }) {
  const typePillColor = item.content_type === 'article' ? '#2563eb' : item.content_type === 'video_embed' ? '#7c3aed' : '#059669';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} accessibilityRole="button" accessibilityLabel={`View ${item.title}`}>
      {item.media_url && (
        <View style={styles.cardMedia}>
          <img
            src={item.media_url}
            alt={item.title}
            style={{ width: '100%', height: 200, objectFit: 'cover', borderTopLeftRadius: 10, borderTopRightRadius: 10 }}
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1461896836934-bd45ba8fcb36?w=800'; }}
          />
        </View>
      )}
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <View style={[styles.typePill, { backgroundColor: typePillColor }]}>
            <Text style={styles.typePillText}>{item.content_type?.replace('_', ' ')}</Text>
          </View>
          {item.is_published ? (
            <View style={[styles.typePill, { backgroundColor: '#059669' }]}><Text style={styles.typePillText}>Published</Text></View>
          ) : (
            <View style={[styles.typePill, { backgroundColor: '#d97706' }]}><Text style={styles.typePillText}>Pending</Text></View>
          )}
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        {item.creator_name && <Text style={styles.cardCreator}>by {item.creator_name}</Text>}
        <Text style={styles.cardBodyText}>{item.body}</Text>
        <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
        {isOwner && (
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.editBtn} onPress={(e) => { e.stopPropagation(); onEdit?.(item); }} accessibilityRole="button" accessibilityLabel="Edit post">
              <Text style={styles.editBtnText}>✏️ Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={(e) => { e.stopPropagation(); onDelete?.(item); }} accessibilityRole="button" accessibilityLabel="Delete post">
              <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// Hook for toast management
export function useToast() {
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  
  const show = useCallback((message, type = 'info') => {
    setToast({ visible: true, message, type });
  }, []);
  
  const hide = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  return { toast, showToast: show, hideToast: hide };
}

const styles = StyleSheet.create({
  banner: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, flexDirection: 'row', alignItems: 'center', padding: 14, paddingHorizontal: 20 },
  bannerText: { color: '#fff', flex: 1, fontSize: 14, fontWeight: '600' },
  bannerClose: { color: '#fff', fontSize: 18, marginLeft: 12, padding: 4 },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '90%', maxWidth: 400, elevation: 8 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8, color: '#111' },
  modalMessage: { fontSize: 14, color: '#555', marginBottom: 20, lineHeight: 20 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  modalBtnCancel: { backgroundColor: '#e5e7eb' },
  modalBtnCancelText: { color: '#374151', fontWeight: '600' },
  modalBtnText: { color: '#fff', fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { fontSize: 16, color: '#666', marginTop: 8 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 12, textAlign: 'center' },
  errorText: { fontSize: 16, color: '#dc2626', marginTop: 12, textAlign: 'center' },
  retryBtn: { marginTop: 16, backgroundColor: '#2563eb', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 10, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, overflow: 'hidden' },
  cardMedia: { width: '100%', height: 200, backgroundColor: '#e5e7eb' },
  cardBody: { padding: 16 },
  cardHeader: { flexDirection: 'row', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  typePill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  typePillText: { color: '#fff', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 4 },
  cardCreator: { fontSize: 13, color: '#6b7280', marginBottom: 8 },
  cardBodyText: { fontSize: 15, color: '#374151', lineHeight: 22 },
  cardDate: { fontSize: 12, color: '#9ca3af', marginTop: 8 },
  cardActions: { flexDirection: 'row', gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  editBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#eff6ff', borderRadius: 6 },
  editBtnText: { fontSize: 13, color: '#2563eb' },
  deleteBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#fef2f2', borderRadius: 6 },
  deleteBtnText: { fontSize: 13, color: '#dc2626' },
});
