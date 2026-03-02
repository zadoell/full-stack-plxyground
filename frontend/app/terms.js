import React from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button"><Text style={styles.backBtnText}>← Back</Text></TouchableOpacity>

      <Text style={styles.title}>Terms of Service</Text>
      <Text style={styles.updated}>Last Updated: March 1, 2026</Text>

      <Text style={styles.heading}>1. Acceptance of Terms</Text>
      <Text style={styles.body}>By accessing or using PLXYGROUND ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, you must not access or use the Platform.</Text>

      <Text style={styles.heading}>2. Description of Service</Text>
      <Text style={styles.body}>PLXYGROUND is a platform connecting sports content creators with brands and audiences. The Platform enables users to create, share, and discover sports-related content, as well as connect with business opportunities in the sports industry.</Text>

      <Text style={styles.heading}>3. User Accounts</Text>
      <Text style={styles.body}>You must register for an account to use certain features of the Platform. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete. You are responsible for safeguarding your password and for all activities that occur under your account.</Text>

      <Text style={styles.heading}>4. Content Guidelines</Text>
      <Text style={styles.body}>Users are responsible for all content they post on the Platform. Content must not violate any applicable laws, infringe on intellectual property rights, or contain harmful, abusive, or misleading material. All content is subject to review and moderation by our admin team. Media content (images, videos) is required for all posts.</Text>

      <Text style={styles.heading}>5. Intellectual Property</Text>
      <Text style={styles.body}>You retain ownership of content you create and post on PLXYGROUND. By posting content, you grant PLXYGROUND a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content on the Platform.</Text>

      <Text style={styles.heading}>6. Account Suspension</Text>
      <Text style={styles.body}>PLXYGROUND reserves the right to suspend or terminate accounts that violate these Terms of Service, engage in fraudulent activity, or otherwise harm the Platform or its users. Suspended users will be notified and may appeal the decision through our support channels.</Text>

      <Text style={styles.heading}>7. Privacy</Text>
      <Text style={styles.body}>Your privacy is important to us. Please review our Privacy Policy, which explains how we collect, use, and protect your personal information.</Text>

      <Text style={styles.heading}>8. Limitation of Liability</Text>
      <Text style={styles.body}>PLXYGROUND is provided "as is" without warranties of any kind. We shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Platform.</Text>

      <Text style={styles.heading}>9. Changes to Terms</Text>
      <Text style={styles.body}>We may modify these Terms at any time. We will notify users of material changes by posting the updated Terms on the Platform. Your continued use of the Platform after changes are posted constitutes your acceptance of the modified Terms.</Text>

      <Text style={styles.heading}>10. Contact</Text>
      <Text style={styles.body}>If you have questions about these Terms of Service, please contact us at support@plxyground.local.</Text>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, maxWidth: 700, alignSelf: 'center', width: '100%' },
  backBtn: { marginBottom: 16 },
  backBtnText: { color: '#2563eb', fontSize: 14, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '800', color: '#111', marginBottom: 4 },
  updated: { fontSize: 13, color: '#9ca3af', marginBottom: 28 },
  heading: { fontSize: 18, fontWeight: '700', color: '#111', marginTop: 24, marginBottom: 8 },
  body: { fontSize: 15, color: '#374151', lineHeight: 24 },
  bottomPadding: { height: 40 },
});
