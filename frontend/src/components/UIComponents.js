import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, ActivityIndicator } from 'react-native';

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

  const bgColor = type === 'success' ? '#00E676' : type === 'error' ? '#FF1744' : type === 'warning' ? '#FF9100' : '#FF3D00';

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
export function InlineModal({ visible, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', confirmColor = '#ff3366' }) {
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
export function LoadingSpinner({ message = 'Loading...', size = 'large', color = '#FF3D00' }) {
  return (
    <View style={styles.center} accessibilityRole="progressbar" accessibilityLabel={message}>
      <ActivityIndicator size={size} color={color} />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

// ── Skeleton Loader ──
export function SkeletonLoader({ lines = 3, hasAvatar = false, hasImage = false }) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const opacity = shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <View style={styles.skeletonContainer}>
      {hasImage && <Animated.View style={[styles.skeletonImage, { opacity }]} />}
      <View style={styles.skeletonBody}>
        {hasAvatar && (
          <View style={styles.skeletonAvatarRow}>
            <Animated.View style={[styles.skeletonAvatar, { opacity }]} />
            <Animated.View style={[styles.skeletonLine, { width: '40%', opacity }]} />
          </View>
        )}
        {Array.from({ length: lines }).map((_, i) => (
          <Animated.View
            key={i}
            style={[styles.skeletonLine, { width: i === lines - 1 ? '60%' : '100%', opacity }]}
          />
        ))}
      </View>
    </View>
  );
}

// ── Skeleton Card List (convenience) ──
export function SkeletonCardList({ count = 3, hasImage = false }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonLoader key={i} lines={3} hasAvatar hasImage={hasImage} />
      ))}
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
  const typePillColor = item.content_type === 'article' ? '#FF3D00' : item.content_type === 'video_embed' ? '#00CFFF' : '#FFD100';

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
            <View style={[styles.typePill, { backgroundColor: '#00E676' }]}><Text style={styles.typePillText}>Published</Text></View>
          ) : (
            <View style={[styles.typePill, { backgroundColor: '#FF9100' }]}><Text style={styles.typePillText}>Pending</Text></View>
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
  banner: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, flexDirection: 'row', alignItems: 'center', padding: 16, paddingHorizontal: 20, borderRadius: 14, marginHorizontal: 12, marginTop: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  bannerText: { color: '#fff', flex: 1, fontSize: 14, fontWeight: '600' },
  bannerClose: { color: '#fff', fontSize: 18, marginLeft: 12, padding: 4, opacity: 0.85 },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
  modalContent: { backgroundColor: '#0F0F1D', borderRadius: 14, padding: 28, width: '90%', maxWidth: 400, shadowColor: '#FF3D00', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.15, shadowRadius: 32, elevation: 12, borderWidth: 1, borderColor: 'rgba(255,61,0,0.15)' },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8, color: '#F0F0FA', letterSpacing: -0.3 },
  modalMessage: { fontSize: 15, color: '#8A94B8', marginBottom: 24, lineHeight: 22 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalBtn: { paddingHorizontal: 22, paddingVertical: 11, borderRadius: 10 },
  modalBtnCancel: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  modalBtnCancelText: { color: '#8A94B8', fontWeight: '600' },
  modalBtnText: { color: '#fff', fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 48 },
  loadingText: { fontSize: 15, color: '#8A94B8', marginTop: 14, fontWeight: '500' },
  skeletonContainer: { backgroundColor: '#0F0F1D', borderRadius: 14, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  skeletonImage: { width: '100%', height: 180, backgroundColor: 'rgba(255,61,0,0.05)' },
  skeletonBody: { padding: 18 },
  skeletonAvatarRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  skeletonAvatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,61,0,0.1)' },
  skeletonLine: { height: 12, backgroundColor: 'rgba(255,61,0,0.05)', borderRadius: 8, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#4A5278', marginTop: 14, textAlign: 'center', fontWeight: '500' },
  errorText: { fontSize: 16, color: '#FF1744', marginTop: 14, textAlign: 'center', fontWeight: '500' },
  retryBtn: { marginTop: 20, backgroundColor: '#FF3D00', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10, shadowColor: '#FF3D00', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 12 },
  retryBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  card: { backgroundColor: '#0F0F1D', borderRadius: 14, marginBottom: 18, shadowColor: '#FF3D00', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 4, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderLeftWidth: 3, borderLeftColor: '#FF3D00' },
  cardMedia: { width: '100%', height: 200, backgroundColor: 'rgba(255,61,0,0.04)' },
  cardBody: { padding: 18 },
  cardHeader: { flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  typePill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
  typePillText: { color: '#fff', fontSize: 11, fontWeight: '700', textTransform: 'capitalize', letterSpacing: 0.3 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#F0F0FA', marginBottom: 4, letterSpacing: -0.2 },
  cardCreator: { fontSize: 13, color: '#8A94B8', marginBottom: 8, fontWeight: '500' },
  cardBodyText: { fontSize: 15, color: '#8A94B8', lineHeight: 23 },
  cardDate: { fontSize: 12, color: '#4A5278', marginTop: 10, fontWeight: '500' },
  cardActions: { flexDirection: 'row', gap: 10, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)' },
  editBtn: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: 'rgba(255,61,0,0.08)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,61,0,0.2)' },
  editBtnText: { fontSize: 13, color: '#FF3D00', fontWeight: '600' },
  deleteBtn: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: 'rgba(255,23,68,0.08)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,23,68,0.2)' },
  deleteBtnText: { fontSize: 13, color: '#FF1744', fontWeight: '600' },
});
