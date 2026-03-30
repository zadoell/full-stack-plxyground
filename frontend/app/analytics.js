import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import api from '../src/utils/api';
import { LoadingSpinner, ErrorState } from '../src/components/UIComponents';
import { useBack } from '../src/hooks/useBack';

// ── Reusable sub-components ────────────────────────────────────────────────

function KpiCard({ label, value, color = '#FF3D00', sub }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      {sub ? <Text style={styles.kpiSub}>{sub}</Text> : null}
    </View>
  );
}

function SectionHeader({ title }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function BarRow({ label, count, total, color }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.barCount, { color }]}>{count}</Text>
    </View>
  );
}

function StatChip({ label, value, color }) {
  return (
    <View style={[styles.statChip, { borderColor: color + '40' }]}>
      <Text style={[styles.statChipValue, { color }]}>{value}</Text>
      <Text style={styles.statChipLabel}>{label}</Text>
    </View>
  );
}

// ── Creator Analytics ──────────────────────────────────────────────────────

function CreatorAnalytics({ posts }) {
  const published = posts.filter(p => p.is_published);
  const pending = posts.filter(p => !p.is_published);

  const byType = {
    article: posts.filter(p => p.content_type === 'article').length,
    video_embed: posts.filter(p => p.content_type === 'video_embed').length,
    image_story: posts.filter(p => p.content_type === 'image_story').length,
    campaign_brief: posts.filter(p => p.content_type === 'campaign_brief').length,
  };

  const publishRate = posts.length > 0 ? Math.round((published.length / posts.length) * 100) : 0;
  const recent = [...posts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

  return (
    <>
      {/* KPIs */}
      <View style={styles.kpiRow}>
        <KpiCard label="TOTAL POSTS" value={posts.length} color="#FF3D00" />
        <KpiCard label="PUBLISHED" value={published.length} color="#00E676" />
        <KpiCard label="PENDING" value={pending.length} color="#FF9100" />
      </View>

      {/* Publish Rate */}
      <View style={styles.card}>
        <SectionHeader title="PUBLISH RATE" />
        <View style={styles.publishRateRow}>
          <View style={styles.publishRateTrack}>
            <View style={[styles.publishRateFill, { width: `${publishRate}%` }]} />
          </View>
          <Text style={styles.publishRatePct}>{publishRate}%</Text>
        </View>
        <Text style={styles.publishRateCaption}>
          {published.length} of {posts.length} post{posts.length !== 1 ? 's' : ''} approved and live
        </Text>
      </View>

      {/* Content Breakdown */}
      {posts.length > 0 && (
        <View style={styles.card}>
          <SectionHeader title="CONTENT BREAKDOWN" />
          <BarRow label="Articles" count={byType.article} total={posts.length} color="#FF3D00" />
          <BarRow label="Videos" count={byType.video_embed} total={posts.length} color="#00CFFF" />
          <BarRow label="Image Stories" count={byType.image_story} total={posts.length} color="#FFD100" />
          {byType.campaign_brief > 0 && (
            <BarRow label="Campaign Briefs" count={byType.campaign_brief} total={posts.length} color="#00E676" />
          )}
        </View>
      )}

      {/* Recent Posts */}
      {recent.length > 0 && (
        <View style={styles.card}>
          <SectionHeader title="RECENT POSTS" />
          {recent.map((post, i) => (
            <View key={post.id} style={[styles.recentItem, i === recent.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.recentLeft}>
                <Text style={styles.recentTitle} numberOfLines={1}>{post.title}</Text>
                <Text style={styles.recentMeta}>
                  {post.content_type?.replace('_', ' ')} · {new Date(post.created_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={[
                styles.statusPill,
                { backgroundColor: post.is_published ? 'rgba(0,230,118,0.12)' : 'rgba(255,145,0,0.12)' },
              ]}>
                <Text style={[
                  styles.statusPillText,
                  { color: post.is_published ? '#00E676' : '#FF9100' },
                ]}>
                  {post.is_published ? 'Live' : 'Pending'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {posts.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>No data yet</Text>
          <Text style={styles.emptyDesc}>Create your first post to start seeing analytics here.</Text>
        </View>
      )}
    </>
  );
}

// ── Business Analytics ─────────────────────────────────────────────────────

function BusinessAnalytics({ posts, opportunities }) {
  const publishedOpps = opportunities.filter(o => o.is_published);
  const pendingOpps = opportunities.filter(o => !o.is_published);
  const totalViews = opportunities.reduce((sum, o) => sum + (o.view_count || 0), 0);

  const publishedPosts = posts.filter(p => p.is_published);
  const campaignBriefs = posts.filter(p => p.content_type === 'campaign_brief');

  const topOpps = [...opportunities]
    .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    .slice(0, 5);

  const recentOpps = [...opportunities]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const maxViews = topOpps.length > 0 ? (topOpps[0].view_count || 0) : 1;

  return (
    <>
      {/* Opportunity KPIs */}
      <SectionHeader title="OPPORTUNITIES" />
      <View style={styles.kpiRow}>
        <KpiCard label="TOTAL" value={opportunities.length} color="#FF3D00" />
        <KpiCard label="LIVE" value={publishedOpps.length} color="#00E676" />
        <KpiCard label="TOTAL VIEWS" value={totalViews} color="#00CFFF" />
      </View>

      {/* Content KPIs */}
      <SectionHeader title="CONTENT" />
      <View style={styles.chipRow}>
        <StatChip label="Posts" value={posts.length} color="#FF3D00" />
        <StatChip label="Campaign Briefs" value={campaignBriefs.length} color="#FFD100" />
        <StatChip label="Live" value={publishedPosts.length} color="#00E676" />
        <StatChip label="Pending" value={posts.length - publishedPosts.length} color="#FF9100" />
      </View>

      {/* Opportunity Performance */}
      {opportunities.length > 0 && (
        <View style={styles.card}>
          <SectionHeader title="OPPORTUNITY PERFORMANCE" />
          {topOpps.map((opp, i) => (
            <View key={opp.id} style={[styles.oppPerfRow, i === topOpps.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.oppPerfLeft}>
                <Text style={styles.oppPerfTitle} numberOfLines={1}>{opp.title}</Text>
                {opp.role_type ? (
                  <View style={styles.oppRoleBadge}>
                    <Text style={styles.oppRoleBadgeText}>{opp.role_type}</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.oppPerfRight}>
                <View style={styles.oppViewBar}>
                  <View style={[
                    styles.oppViewBarFill,
                    { width: maxViews > 0 ? `${((opp.view_count || 0) / maxViews) * 100}%` : '0%' },
                  ]} />
                </View>
                <Text style={styles.oppViewCount}>👁 {opp.view_count || 0}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Recent Opportunities */}
      {recentOpps.length > 0 && (
        <View style={styles.card}>
          <SectionHeader title="RECENT OPPORTUNITIES" />
          {recentOpps.map((opp, i) => (
            <View key={opp.id} style={[styles.recentItem, i === recentOpps.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.recentLeft}>
                <Text style={styles.recentTitle} numberOfLines={1}>{opp.title}</Text>
                <Text style={styles.recentMeta}>{new Date(opp.created_at).toLocaleDateString()}</Text>
              </View>
              <View style={[
                styles.statusPill,
                { backgroundColor: opp.is_published ? 'rgba(0,230,118,0.12)' : 'rgba(255,145,0,0.12)' },
              ]}>
                <Text style={[
                  styles.statusPillText,
                  { color: opp.is_published ? '#00E676' : '#FF9100' },
                ]}>
                  {opp.is_published ? 'Live' : 'Pending'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {opportunities.length === 0 && posts.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>No data yet</Text>
          <Text style={styles.emptyDesc}>Post an opportunity or create content to start seeing analytics here.</Text>
        </View>
      )}
    </>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const router = useRouter();
  const goBack = useBack('/dashboard');
  const { user } = useAuth();
  const isBusiness = user?.role === 'business';

  const [posts, setPosts] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const contentRes = await api.get('/api/content/mine?limit=200');
      setPosts(contentRes.data || []);

      if (isBusiness) {
        const oppRes = await api.get('/api/opportunities/mine?limit=200');
        setOpportunities(oppRes.data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isBusiness]);

  useEffect(() => { fetchData(); }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) return <LoadingSpinner message="Loading analytics..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Analytics</Text>
          <Text style={styles.headerSub}>{isBusiness ? 'Business Overview' : 'Creator Overview'}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FF3D00" />}
      >
        {isBusiness
          ? <BusinessAnalytics posts={posts} opportunities={opportunities} />
          : <CreatorAnalytics posts={posts} />
        }

        <Text style={styles.pullHint}>Pull down to refresh</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07070E' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16, backgroundColor: '#0A0A18', borderBottomWidth: 1, borderBottomColor: 'rgba(255,61,0,0.12)', gap: 12 },
  backBtn: {},
  backBtnText: { color: '#FF3D00', fontSize: 14, fontWeight: '600' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#F0F0FA', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: '#4A5278', fontWeight: '600', letterSpacing: 0.5, marginTop: 1 },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 16, maxWidth: 640, alignSelf: 'center', width: '100%', paddingBottom: 40 },

  // Section header
  sectionHeader: { fontSize: 11, fontWeight: '800', color: '#4A5278', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 20, marginBottom: 10 },

  // KPI cards
  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  kpiCard: { flex: 1, backgroundColor: '#0F0F1D', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderTopWidth: 3 },
  kpiValue: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  kpiLabel: { fontSize: 10, fontWeight: '700', color: '#4A5278', letterSpacing: 1, textTransform: 'uppercase', marginTop: 4, textAlign: 'center' },
  kpiSub: { fontSize: 11, color: '#4A5278', marginTop: 2 },

  // Stat chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  statChip: { backgroundColor: '#0F0F1D', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 18, borderWidth: 1, minWidth: '47%', flex: 1, alignItems: 'center' },
  statChipValue: { fontSize: 22, fontWeight: '900', letterSpacing: -0.3 },
  statChipLabel: { fontSize: 10, fontWeight: '700', color: '#4A5278', letterSpacing: 1, textTransform: 'uppercase', marginTop: 4 },

  // Generic card
  card: { backgroundColor: '#0F0F1D', borderRadius: 14, padding: 18, marginTop: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderLeftWidth: 3, borderLeftColor: '#FF3D00' },

  // Publish rate
  publishRateRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  publishRateTrack: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' },
  publishRateFill: { height: '100%', backgroundColor: '#00E676', borderRadius: 4 },
  publishRatePct: { fontSize: 16, fontWeight: '800', color: '#00E676', minWidth: 44, textAlign: 'right' },
  publishRateCaption: { fontSize: 12, color: '#4A5278' },

  // Bar rows (content breakdown)
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  barLabel: { fontSize: 13, color: '#8A94B8', width: 110, fontWeight: '500' },
  barTrack: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  barCount: { fontSize: 13, fontWeight: '700', minWidth: 24, textAlign: 'right' },

  // Recent items
  recentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', gap: 10 },
  recentLeft: { flex: 1 },
  recentTitle: { fontSize: 14, fontWeight: '600', color: '#F0F0FA', marginBottom: 3 },
  recentMeta: { fontSize: 11, color: '#4A5278', textTransform: 'capitalize' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusPillText: { fontSize: 11, fontWeight: '700' },

  // Opportunity performance rows
  oppPerfRow: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', gap: 8 },
  oppPerfLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  oppPerfTitle: { fontSize: 14, fontWeight: '600', color: '#F0F0FA', flex: 1 },
  oppRoleBadge: { backgroundColor: 'rgba(0,207,255,0.12)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  oppRoleBadgeText: { fontSize: 10, color: '#00CFFF', fontWeight: '700', textTransform: 'capitalize' },
  oppPerfRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  oppViewBar: { flex: 1, height: 5, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' },
  oppViewBarFill: { height: '100%', backgroundColor: '#00CFFF', borderRadius: 3 },
  oppViewCount: { fontSize: 12, color: '#00CFFF', fontWeight: '700', minWidth: 52, textAlign: 'right' },

  // Empty state
  emptyCard: { alignItems: 'center', padding: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#F0F0FA', marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#4A5278', textAlign: 'center', lineHeight: 21 },

  pullHint: { textAlign: 'center', color: '#4A5278', fontSize: 11, marginTop: 24 },
});
