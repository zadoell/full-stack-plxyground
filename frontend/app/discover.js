import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../src/utils/api';
import { LoadingSpinner, EmptyState, ErrorState } from '../src/components/UIComponents';

export default function DiscoverScreen() {
  const router = useRouter();
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backBtnText}>← Back</Text></TouchableOpacity>
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
                    <Text style={styles.creatorMeta}>{c.role === 'business' ? '🏢 Business' : '🎨 Creator'}{c.location ? ` • ${c.location}` : ''}</Text>
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
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', gap: 12 },
  backBtn: {},
  backBtnText: { color: '#2563eb', fontSize: 14, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '800', color: '#111' },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' },
  searchInput: { flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 },
  clearBtn: { marginLeft: 8, padding: 8 },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#2563eb' },
  tabText: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
  tabTextActive: { color: '#2563eb' },
  list: { flex: 1 },
  listContent: { padding: 16, maxWidth: 600, alignSelf: 'center', width: '100%' },
  creatorCard: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderRadius: 10, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  creatorInfo: { flex: 1 },
  creatorName: { fontSize: 16, fontWeight: '700', color: '#111' },
  creatorMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  creatorBio: { fontSize: 13, color: '#374151', marginTop: 6 },
  contentItem: { padding: 16, backgroundColor: '#fff', borderRadius: 10, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  contentTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
  contentMeta: { fontSize: 12, color: '#6b7280', marginTop: 4 },
});
