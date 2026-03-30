import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../src/utils/api';
import { LoadingSpinner, EmptyState, ErrorState } from '../src/components/UIComponents';
import { useBack } from '../src/hooks/useBack';

export default function DiscoverScreen() {
  const router = useRouter();
  const goBack = useBack('/feed');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('creators');
  const [creators, setCreators] = useState([]);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (s = search) => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'creators') {
        const res = await api.get(`/api/creators?limit=50${s ? `&search=${encodeURIComponent(s)}` : ''}`);
        setCreators(res.data);
      } else {
        const res = await api.get(`/api/content?limit=50${s ? `&search=${encodeURIComponent(s)}` : ''}`);
        setContent(res.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tab, search]);

  useEffect(() => {
    const timer = setTimeout(() => fetchData(search), 400);
    return () => clearTimeout(timer);
  }, [search, tab]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBack()} style={styles.backBtn}><Text style={styles.backBtnText}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>Discover</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder="Search creators & content..." placeholderTextColor="#9ca3af" accessibilityLabel="Search" />
        {search ? <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}><Text>✕</Text></TouchableOpacity> : null}
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'creators' && styles.tabActive]} onPress={() => setTab('creators')}><Text style={[styles.tabText, tab === 'creators' && styles.tabTextActive]}>Creators</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'content' && styles.tabActive]} onPress={() => setTab('content')}><Text style={[styles.tabText, tab === 'content' && styles.tabTextActive]}>Content</Text></TouchableOpacity>
      </View>

      {loading ? <LoadingSpinner /> : error ? <ErrorState message={error} onRetry={() => fetchData()} /> : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {tab === 'creators' ? (
            creators.length === 0 ? <EmptyState message="No creators found" /> : (
              creators.map(c => (
                <TouchableOpacity key={c.id} style={styles.creatorCard} onPress={() => router.push(`/profile/${c.id}`)}>
                  <View style={styles.avatar}><Text style={styles.avatarText}>{(c.name || 'U')[0]}</Text></View>
                  <View style={styles.creatorInfo}>
                    <Text style={styles.creatorName}>{c.name}</Text>
                    <Text style={styles.creatorMeta}>{c.role === 'business' ? '🏢 Business' : c.role === 'athlete' ? '🏆 Athlete' : '🎨 Creator'}{c.location ? ` • ${c.location}` : ''}</Text>
                    {c.bio ? <Text style={styles.creatorBio} numberOfLines={2}>{c.bio}</Text> : null}
                  </View>
                </TouchableOpacity>
              ))
            )
          ) : (
            content.length === 0 ? <EmptyState message="No content found" /> : (
              content.map(item => (
                <TouchableOpacity key={item.id} style={styles.contentItem} onPress={() => router.push(`/content/${item.id}`)}>
                  <Text style={styles.contentTitle}>{item.title}</Text>
                  <Text style={styles.contentMeta}>by {item.creator_name} • {item.content_type?.replace('_', ' ')}</Text>
                </TouchableOpacity>
              ))
            )
          )}
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
  title: { fontSize: 20, fontWeight: '800', color: '#F0F0FA', letterSpacing: -0.3 },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#0A0A18' },
  searchInput: { flex: 1, borderWidth: 1.5, borderColor: 'rgba(255,61,0,0.2)', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: '#F0F0FA', backgroundColor: 'rgba(255,61,0,0.04)' },
  clearBtn: { marginLeft: 8, padding: 8 },
  tabs: { flexDirection: 'row', backgroundColor: '#0A0A18', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2.5, borderBottomColor: '#FF3D00' },
  tabText: { fontSize: 14, color: '#4A5278', fontWeight: '600' },
  tabTextActive: { color: '#FF3D00' },
  list: { flex: 1 },
  listContent: { padding: 16, maxWidth: 600, alignSelf: 'center', width: '100%' },
  creatorCard: { flexDirection: 'row', padding: 18, backgroundColor: '#0F0F1D', borderRadius: 14, marginBottom: 12, shadowColor: '#FF3D00', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 2, gap: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  avatar: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#FF3D00', justifyContent: 'center', alignItems: 'center', shadowColor: '#FF3D00', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8 },
  avatarText: { color: '#FFFFFF', fontWeight: '800', fontSize: 18 },
  creatorInfo: { flex: 1 },
  creatorName: { fontSize: 16, fontWeight: '700', color: '#F0F0FA' },
  creatorMeta: { fontSize: 12, color: '#8A94B8', marginTop: 3 },
  creatorBio: { fontSize: 13, color: '#8A94B8', marginTop: 6, lineHeight: 19 },
  contentItem: { padding: 18, backgroundColor: '#0F0F1D', borderRadius: 14, marginBottom: 12, shadowColor: '#FF3D00', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  contentTitle: { fontSize: 15, fontWeight: '700', color: '#F0F0FA' },
  contentMeta: { fontSize: 12, color: '#8A94B8', marginTop: 4 },
});
