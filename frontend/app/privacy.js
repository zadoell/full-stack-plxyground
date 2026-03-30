import React from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useBack } from '../src/hooks/useBack';

export default function PrivacyScreen() {
  const router = useRouter();
  const goBack = useBack('/');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => goBack()} style={styles.backBtn} accessibilityRole="button"><Text style={styles.backBtnText}>← Back</Text></TouchableOpacity>

      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.updated}>Last Updated: March 1, 2026</Text>

      <Text style={styles.heading}>1. Information We Collect</Text>
      <Text style={styles.body}>We collect information you provide directly to us, including your name, email address, profile information, and content you post. We also collect usage data such as pages visited, actions taken, and device information.</Text>

      <Text style={styles.heading}>2. How We Use Your Information</Text>
      <Text style={styles.body}>We use the information we collect to provide, maintain, and improve the Platform; to process transactions and send related notices; to respond to your comments and questions; and to send you technical notices, updates, and support messages.</Text>

      <Text style={styles.heading}>3. Information Sharing</Text>
      <Text style={styles.body}>We do not sell or rent your personal information to third parties. We may share your information with service providers who assist us in operating the Platform, with your consent, or as required by law.</Text>

      <Text style={styles.heading}>4. Data Security</Text>
      <Text style={styles.body}>We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. Passwords are encrypted using industry-standard bcrypt hashing.</Text>

      <Text style={styles.heading}>5. Cookies and Tracking</Text>
      <Text style={styles.body}>PLXYGROUND uses authentication tokens stored in local storage to maintain your session. We may use analytics tools to understand how users interact with the Platform.</Text>

      <Text style={styles.heading}>6. Your Rights</Text>
      <Text style={styles.body}>You have the right to access, correct, or delete your personal information. You can update your profile information at any time through the Platform. To request deletion of your account, please contact our support team.</Text>

      <Text style={styles.heading}>7. Data Retention</Text>
      <Text style={styles.body}>We retain your personal information for as long as your account is active or as needed to provide you services. We will retain and use your information as necessary to comply with our legal obligations, resolve disputes, and enforce our agreements.</Text>

      <Text style={styles.heading}>8. Children's Privacy</Text>
      <Text style={styles.body}>PLXYGROUND is not intended for use by children under the age of 13. We do not knowingly collect personal information from children under 13.</Text>

      <Text style={styles.heading}>9. Changes to This Policy</Text>
      <Text style={styles.body}>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.</Text>

      <Text style={styles.heading}>10. Contact Us</Text>
      <Text style={styles.body}>If you have any questions about this Privacy Policy, please contact us at privacy@plxyground.local.</Text>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07070E' },
  content: { padding: 28, maxWidth: 700, alignSelf: 'center', width: '100%' },
  backBtn: { marginBottom: 20 },
  backBtnText: { color: '#FF3D00', fontSize: 14, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '800', color: '#F0F0FA', marginBottom: 6, letterSpacing: -0.3 },
  updated: { fontSize: 13, color: '#4A5278', marginBottom: 32 },
  heading: { fontSize: 16, fontWeight: '800', color: '#FF3D00', marginTop: 28, marginBottom: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
  body: { fontSize: 15, color: '#8A94B8', lineHeight: 26 },
  bottomPadding: { height: 40 },
});
