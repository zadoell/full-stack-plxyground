import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, useWindowDimensions, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';

const SLIDES = [
  {
    accent: '#FF3D00',
    symbol: '⚡',
    eyebrow: 'WELCOME TO',
    title: 'PLXYGROUND',
    subtitle: 'The home of sports creators, athletes, and brands. Built for the next generation of sport.',
  },
  {
    accent: '#00CFFF',
    symbol: '🎯',
    eyebrow: 'CREATE & SHARE',
    title: 'Your Content,\nYour Rules',
    subtitle: 'Post articles, videos, and image stories. Build your public profile and grow your audience.',
  },
  {
    accent: '#FFD100',
    symbol: '🤝',
    eyebrow: 'OPPORTUNITIES',
    title: 'Land Real\nSponsorships',
    subtitle: 'Connect directly with sports brands. Find collabs and campaigns built for creators like you.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const { width, height } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);

  React.useEffect(() => {
    if (!loading && isAuthenticated) router.replace('/dashboard');
  }, [loading, isAuthenticated]);

  const handleScroll = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  const slide = SLIDES[activeIndex];

  return (
    <View style={styles.container}>

      {/* ── Decorative background blobs ── */}
      <View style={[styles.blob, styles.blobTL, { backgroundColor: slide.accent + '18' }]} />
      <View style={[styles.blob, styles.blobBR, { backgroundColor: slide.accent + '0D' }]} />

      {/* ── Logo bar ── */}
      <View style={styles.topBar}>
        <Text style={styles.logoText}>
          PLXY<Text style={[styles.logoAccent, { color: slide.accent }]}>GROUND</Text>
        </Text>
      </View>

      {/* ── Slides ── */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
        contentContainerStyle={{ width: width * SLIDES.length }}
      >
        {SLIDES.map((s, i) => (
          <View key={i} style={[styles.slide, { width }]}>

            {/* Icon visual */}
            <View style={styles.visualArea}>
              {/* Outer ring */}
              <View style={[styles.ring, styles.ringOuter, { borderColor: s.accent + '20' }]} />
              {/* Mid ring */}
              <View style={[styles.ring, styles.ringMid, { borderColor: s.accent + '35' }]} />
              {/* Inner filled circle */}
              <View style={[styles.iconCircle, { backgroundColor: s.accent }]}>
                <Text style={styles.iconSymbol}>{s.symbol}</Text>
              </View>
              {/* Corner accent marks */}
              <View style={[styles.cornerMark, styles.cornerTL, { borderColor: s.accent + '60' }]} />
              <View style={[styles.cornerMark, styles.cornerBR, { borderColor: s.accent + '60' }]} />
            </View>

            {/* Text content */}
            <View style={styles.textArea}>
              <Text style={[styles.eyebrow, { color: s.accent }]}>{s.eyebrow}</Text>
              <Text style={styles.slideTitle}>{s.title}</Text>
              <Text style={styles.slideSubtitle}>{s.subtitle}</Text>
            </View>

          </View>
        ))}
      </ScrollView>

      {/* ── Dot indicators ── */}
      <View style={styles.dots}>
        {SLIDES.map((s, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === activeIndex
                ? [styles.dotActive, { backgroundColor: slide.accent, width: 24 }]
                : styles.dotInactive,
            ]}
          />
        ))}
      </View>

      {/* ── CTA buttons ── */}
      <View style={styles.ctas}>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: slide.accent }]}
          onPress={() => router.push('/signup-choice')}
          accessibilityRole="button"
          accessibilityLabel="Get started"
        >
          <Text style={styles.primaryBtnText}>GET STARTED</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push('/login')}
          accessibilityRole="button"
          accessibilityLabel="Sign in"
        >
          <Text style={styles.secondaryBtnText}>Already have an account? <Text style={[styles.secondaryBtnLink, { color: slide.accent }]}>Sign In</Text></Text>
        </TouchableOpacity>
      </View>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => router.push('/terms')} accessibilityRole="link">
          <Text style={styles.footerLink}>Terms</Text>
        </TouchableOpacity>
        <Text style={styles.footerSep}>·</Text>
        <TouchableOpacity onPress={() => router.push('/privacy')} accessibilityRole="link">
          <Text style={styles.footerLink}>Privacy</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07070E',
  },

  // Background blobs
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blobTL: {
    width: 320,
    height: 320,
    top: -100,
    left: -100,
  },
  blobBR: {
    width: 280,
    height: 280,
    bottom: 80,
    right: -80,
  },

  // Logo bar
  topBar: {
    paddingTop: 60,
    paddingBottom: 12,
    alignItems: 'center',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F0F0FA',
    letterSpacing: 4,
  },
  logoAccent: {
    fontWeight: '900',
  },

  // Slides
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  // Visual area with rings
  visualArea: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 999,
  },
  ringOuter: {
    width: 220,
    height: 220,
  },
  ringMid: {
    width: 170,
    height: 170,
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  iconSymbol: {
    fontSize: 52,
  },
  // Corner accent marks (L-shaped lines via bordered View)
  cornerMark: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderWidth: 2,
  },
  cornerTL: {
    top: 8,
    left: 8,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 4,
  },
  cornerBR: {
    bottom: 8,
    right: 8,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 4,
  },

  // Text
  textArea: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: 12,
  },
  slideTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#F0F0FA',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 42,
    marginBottom: 16,
  },
  slideSubtitle: {
    fontSize: 15,
    color: '#8A94B8',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },

  // Dots
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 24,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    height: 6,
    borderRadius: 3,
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  // CTAs
  ctas: {
    paddingHorizontal: 28,
    paddingBottom: 8,
    gap: 4,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  primaryBtn: {
    paddingVertical: 17,
    borderRadius: 12,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  secondaryBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    color: '#4A5278',
    fontWeight: '500',
  },
  secondaryBtnLink: {
    fontWeight: '700',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 32,
    paddingTop: 4,
    gap: 10,
  },
  footerLink: {
    fontSize: 12,
    color: '#4A5278',
    fontWeight: '500',
  },
  footerSep: {
    fontSize: 12,
    color: '#4A5278',
  },
});
