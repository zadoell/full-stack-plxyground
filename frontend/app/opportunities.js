import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../src/utils/api';
import { LoadingSpinner, EmptyState, ErrorState } from '../src/components/UIComponents';
import { useBack } from '../src/hooks/useBack';

export default function OpportunitiesScreen() {
  const router = useRouter();
  const goBack = useBack('/dashboard');
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const fetchOpportunities = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get('/api/opportunities?limit=50');
      setOpportunities(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOpportunities(); }, []);

  const getRoleIcon = (roleType) => {
    const icons = {
      ambassador: '🏅',
      creator: '🎨',
      coach: '🏋️',
      reporter: '🎙️',
      model: '📸',
      host: '🎤',
      specialist: '⚡',
      photographer: '📷',
    };
    return icons[roleType?.toLowerCase()] || '🤝';
  };

  const selected = opportunities.find(o => o.id === selectedId);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBack()} style={styles.backBtn}><Text style={styles.backBtnText}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>Opportunities</Text>
      </View>

      {loading ? <LoadingSpinner message="Loading opportunities..." /> : error ? <ErrorState message={error} onRetry={fetchOpportunities} /> : opportunities.length === 0 ? (
        <EmptyState message="No opportunities available right now. Check back soon!" icon="🤝" />
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOpportunities(); }} />}
        >
          {/* Detail View */}
          {selected && (
            <View style={styles.detailCard}>
              <TouchableOpacity onPress={() => setSelectedId(null)} accessibilityRole="button">
                <Text style={styles.detailClose}>← Back to list</Text>
              </TouchableOpacity>
              <Text style={styles.detailIcon}>{getRoleIcon(selected.role_type)}</Text>
              <Text style={styles.detailTitle}>{selected.title}</Text>
              <View style={styles.detailBadge}>
                <Text style={styles.detailBadgeText}>{selected.role_type || 'General'}</Text>
              </View>
              {selected.body ? <Text style={styles.detailBody}>{selected.body}</Text> : null}
              {selected.requirements ? (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Requirements</Text>
                  <Text style={styles.detailSectionText}>{selected.requirements}</Text>
                </View>
              ) : null}
              {selected.benefits ? (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Benefits</Text>
                  <Text style={styles.detailSectionText}>{selected.benefits}</Text>
                </View>
              ) : null}
              <Text style={styles.detailDate}>Posted {new Date(selected.created_at).toLocaleDateString()}</Text>
            </View>
          )}

          {/* List View */}
          {!selected && opportunities.map(opp => (
            <TouchableOpacity
              key={opp.id}
              style={styles.oppCard}
              onPress={() => setSelectedId(opp.id)}
              accessibilityRole="button"
              accessibilityLabel={`View ${opp.title}`}
            >
              <Text style={styles.oppIcon}>{getRoleIcon(opp.role_type)}</Text>
              <View style={styles.oppInfo}>
                <Text style={styles.oppTitle}>{opp.title}</Text>
                <View style={styles.oppMeta}>
                  <View style={styles.oppBadge}><Text style={styles.oppBadgeText}>{opp.role_type || 'General'}</Text></View>
                  <Text style={styles.oppDate}>{new Date(opp.created_at).toLocaleDateString()}</Text>
                </View>
                {opp.body ? <Text style={styles.oppDesc} numberOfLines={2}>{opp.body}</Text> : null}
              </View>
              <Text style={styles.oppArrow}>›</Text>
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
  list: { flex: 1 },
  listContent: { padding: 16, maxWidth: 600, alignSelf: 'center', width: '100%' },
  oppCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F0F1D', borderRadius: 14, padding: 18, marginBottom: 12, shadowColor: '#FF3D00', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 2, gap: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  oppIcon: { fontSize: 32 },
  oppInfo: { flex: 1 },
  oppTitle: { fontSize: 16, fontWeight: '700', color: '#F0F0FA' },
  oppMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
  oppBadge: { backgroundColor: 'rgba(255,61,0,0.12)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  oppBadgeText: { fontSize: 11, color: '#FF3D00', fontWeight: '600', textTransform: 'capitalize' },
  oppDate: { fontSize: 11, color: '#4A5278' },
  oppDesc: { fontSize: 13, color: '#8A94B8', marginTop: 6, lineHeight: 19 },
  oppArrow: { fontSize: 24, color: '#4A5278' },
  detailCard: { backgroundColor: '#0F0F1D', borderRadius: 14, padding: 28, marginBottom: 18, shadowColor: '#FF3D00', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  detailClose: { color: '#FF3D00', fontSize: 14, fontWeight: '600', marginBottom: 18 },
  detailIcon: { fontSize: 48, textAlign: 'center', marginBottom: 14 },
  detailTitle: { fontSize: 26, fontWeight: '800', color: '#F0F0FA', textAlign: 'center', marginBottom: 10, letterSpacing: -0.3 },
  detailBadge: { alignSelf: 'center', backgroundColor: 'rgba(255,61,0,0.12)', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 6, marginBottom: 18 },
  detailBadgeText: { fontSize: 13, color: '#FF3D00', fontWeight: '600', textTransform: 'capitalize' },
  detailBody: { fontSize: 15, color: '#8A94B8', lineHeight: 23, marginBottom: 18 },
  detailSection: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 18, marginBottom: 14 },
  detailSectionTitle: { fontSize: 14, fontWeight: '700', color: '#F0F0FA', marginBottom: 6 },
  detailSectionText: { fontSize: 14, color: '#8A94B8', lineHeight: 21 },
  detailDate: { fontSize: 12, color: '#4A5278', textAlign: 'center', marginTop: 10 },
});
