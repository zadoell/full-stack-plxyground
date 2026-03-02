import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';

const HERO_BG = 'https://images.unsplash.com/photo-1461896836934-bd45ba8fcb36?w=1600';

const FEATURES = [
  { icon: '🛡️', title: 'Moderation', desc: 'Content reviewed and approved by our admin team before going live.' },
  { icon: '📊', title: 'Analytics', desc: 'Track engagement, content performance, and growth metrics in real-time.' },
  { icon: '🤝', title: 'Opportunities', desc: 'Connect creators with brands for sponsorships, campaigns, and collaborations.' },
  { icon: '🔒', title: 'Secure Admin', desc: 'Enterprise-grade admin panel with audit logging and role-based access.' },
];

const BRANDS = ['Nike Sports', 'Adidas Athletics', 'Under Armour Pro'];

export default function LandingScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated) router.replace('/feed');
  }, [isAuthenticated]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Nav */}
      <View style={styles.nav}>
        <Text style={styles.logo}>PLXYGROUND</Text>
        <View style={styles.navLinks}>
          <TouchableOpacity onPress={() => { /* scroll to features */ }} accessibilityRole="link"><Text style={styles.navLink}>Features</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/terms')} accessibilityRole="link"><Text style={styles.navLink}>Help</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/login')} accessibilityRole="link"><Text style={styles.navLinkLogin}>Login</Text></TouchableOpacity>
        </View>
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <Image source={{ uri: HERO_BG }} style={styles.heroBg} resizeMode="cover" accessibilityLabel="Sports stadium background" />
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Where creators and brands connect in sports</Text>
          <Text style={styles.heroSubtitle}>The platform for athletes, creators, and sports brands to collaborate, create content, and grow together.</Text>
          <View style={styles.heroCTAs}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/signup')} accessibilityRole="button" accessibilityLabel="Get Started - Creator signup">
              <Text style={styles.primaryBtnText}>Get Started</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/business-signup')} accessibilityRole="button" accessibilityLabel="I'm a Business - Business signup">
              <Text style={styles.secondaryBtnText}>I'm a Business</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Features */}
      <View style={styles.features}>
        <Text style={styles.sectionTitle}>Why PLXYGROUND?</Text>
        <View style={styles.featureGrid}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureCard}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Trust Bar */}
      <View style={styles.trustBar}>
        <Text style={styles.trustTitle}>Trusted by leading sports brands</Text>
        <View style={styles.trustLogos}>
          {BRANDS.map((b, i) => (
            <View key={i} style={styles.trustLogo}>
              <Text style={styles.trustLogoText}>{b}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={() => router.push('/terms')} accessibilityRole="link"><Text style={styles.footerLink}>Terms of Service</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/privacy')} accessibilityRole="link"><Text style={styles.footerLink}>Privacy Policy</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/terms')} accessibilityRole="link"><Text style={styles.footerLink}>Help Center</Text></TouchableOpacity>
        </View>
        <Text style={styles.footerCopyright}>© 2026 PLXYGROUND. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1020' },
  scrollContent: { minHeight: '100%' },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  logo: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: 2 },
  navLinks: { flexDirection: 'row', gap: 20, alignItems: 'center' },
  navLink: { color: '#ccc', fontSize: 14, fontWeight: '500' },
  navLinkLogin: { color: '#fff', fontSize: 14, fontWeight: '600', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  hero: { height: 600, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  heroBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9,12,24,0.7)' },
  heroContent: { zIndex: 1, alignItems: 'center', paddingHorizontal: 24, maxWidth: 700 },
  heroTitle: { fontSize: 36, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 16, lineHeight: 44 },
  heroSubtitle: { fontSize: 16, color: '#cbd5e1', textAlign: 'center', marginBottom: 32, lineHeight: 24 },
  heroCTAs: { flexDirection: 'row', gap: 16, flexWrap: 'wrap', justifyContent: 'center' },
  primaryBtn: { backgroundColor: '#2563eb', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 10 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#fff', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 10 },
  secondaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  features: { paddingVertical: 60, paddingHorizontal: 24, backgroundColor: '#f8fafc' },
  sectionTitle: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 32, color: '#111' },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 20 },
  featureCard: { backgroundColor: '#fff', borderRadius: 12, padding: 24, width: 260, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3, alignItems: 'center' },
  featureIcon: { fontSize: 36, marginBottom: 12 },
  featureTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 8 },
  featureDesc: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
  trustBar: { paddingVertical: 40, paddingHorizontal: 24, backgroundColor: '#fff', alignItems: 'center' },
  trustTitle: { fontSize: 14, color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 },
  trustLogos: { flexDirection: 'row', gap: 32, flexWrap: 'wrap', justifyContent: 'center' },
  trustLogo: { backgroundColor: '#f3f4f6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  trustLogoText: { fontSize: 14, fontWeight: '700', color: '#374151' },
  footer: { backgroundColor: '#0b1020', paddingVertical: 32, paddingHorizontal: 24, alignItems: 'center' },
  footerLinks: { flexDirection: 'row', gap: 24, marginBottom: 16, flexWrap: 'wrap', justifyContent: 'center' },
  footerLink: { color: '#94a3b8', fontSize: 14 },
  footerCopyright: { color: '#64748b', fontSize: 12 },
});
