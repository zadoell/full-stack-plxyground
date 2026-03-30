import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useBack } from '../src/hooks/useBack';

export default function SignupChoiceScreen() {
  const router = useRouter();
  const goBack = useBack('/');

  const roles = [
    {
      icon: '🎨',
      title: 'Creator',
      desc: 'Share your sports content, build your audience, and connect with brands for opportunities.',
      route: '/signup',
      color: '#FF3D00',
      bgColor: 'rgba(255,61,0,0.08)',
    },
    {
      icon: '🏢',
      title: 'Business',
      desc: 'Find talented creators, run campaigns, and grow your brand in the sports space.',
      route: '/business-signup',
      color: '#00CFFF',
      bgColor: 'rgba(0,207,255,0.08)',
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <TouchableOpacity onPress={() => goBack()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Join PLXYGROUND</Text>
        <Text style={styles.subtitle}>Choose how you want to use the platform</Text>

        <View style={styles.cards}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.title}
              style={[styles.card, { borderColor: role.color }]}
              onPress={() => router.push(role.route)}
              accessibilityRole="button"
              accessibilityLabel={`Sign up as ${role.title}`}
            >
              <View style={[styles.iconCircle, { backgroundColor: role.bgColor }]}>
                <Text style={styles.icon}>{role.icon}</Text>
              </View>
              <Text style={[styles.cardTitle, { color: role.color }]}>{role.title}</Text>
              <Text style={styles.cardDesc}>{role.desc}</Text>
              <View style={[styles.cardBtn, { backgroundColor: role.color }]}>
                <Text style={styles.cardBtnText}>Get Started →</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.altRow}>
          <Text style={styles.altText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/login')} accessibilityRole="link">
            <Text style={styles.link}>Log in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07070E' },
  scrollContent: { padding: 28, minHeight: '100%', justifyContent: 'center' },
  backBtn: { marginBottom: 20 },
  backBtnText: { color: '#FF3D00', fontSize: 14, fontWeight: '600' },
  content: { maxWidth: 540, width: '100%', alignSelf: 'center' },
  title: { fontSize: 34, fontWeight: '900', color: '#F0F0FA', textAlign: 'center', marginBottom: 6, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: '#8A94B8', textAlign: 'center', marginBottom: 40 },
  cards: { gap: 18, marginBottom: 36 },
  card: { backgroundColor: '#0F0F1D', borderRadius: 14, padding: 28, borderWidth: 1.5, shadowColor: '#FF3D00', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 4, alignItems: 'center' },
  iconCircle: { width: 68, height: 68, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  icon: { fontSize: 32 },
  cardTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8, letterSpacing: -0.3 },
  cardDesc: { fontSize: 14, color: '#8A94B8', textAlign: 'center', lineHeight: 21, marginBottom: 18 },
  cardBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 },
  cardBtnText: { color: '#07070E', fontWeight: '800', fontSize: 14 },
  altRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  altText: { fontSize: 14, color: '#8A94B8' },
  link: { color: '#FF3D00', fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
});
