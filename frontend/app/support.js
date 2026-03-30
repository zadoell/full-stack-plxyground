import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useBack } from '../src/hooks/useBack';

const SUPPORT_EMAIL = 'support@plxyground.com';

const FAQ_ITEMS = [
  { q: 'How do I reset my password?', a: 'Go to Settings → Change Password, or use "Forgot Password" on the login screen. You\'ll receive a 6-digit code to verify your identity.' },
  { q: 'How do I publish content?', a: 'Create a post from the Dashboard → Create Post. Your content will be reviewed by our moderation team before going live.' },
  { q: 'Why is my account suspended?', a: 'Accounts may be suspended for violating community guidelines. Contact the admin team for more information.' },
  { q: 'How do I change my role?', a: 'Roles are assigned during signup. To change your role, please contact the admin team.' },
  { q: 'How do I delete my account?', a: 'Contact us via the form below or email support@plxyground.com to request account deletion.' },
];

export default function SupportScreen() {
  const router = useRouter();
  const goBack = useBack('/settings');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);

  const handleSend = () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    // In production, this would POST to an API. For now, open mailto.
    const subject = encodeURIComponent(`Support Request from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
    setSent(true);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Help & Support</Text>
      <Text style={styles.subtitle}>We're here to help. Browse FAQs or send us a message.</Text>

      {/* FAQ Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {FAQ_ITEMS.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={styles.faqItem}
            onPress={() => setExpandedFaq(expandedFaq === i ? null : i)}
            activeOpacity={0.7}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>{item.q}</Text>
              <Text style={styles.faqChevron}>{expandedFaq === i ? '▾' : '▸'}</Text>
            </View>
            {expandedFaq === i && (
              <Text style={styles.faqAnswer}>{item.a}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Contact Form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Us</Text>
        {sent ? (
          <View style={styles.sentCard}>
            <Text style={styles.sentIcon}>✓</Text>
            <Text style={styles.sentTitle}>Message Prepared</Text>
            <Text style={styles.sentText}>Your email client should have opened with the message. If not, email us directly at {SUPPORT_EMAIL}.</Text>
            <TouchableOpacity style={styles.sendAnother} onPress={() => { setSent(false); setMessage(''); }}>
              <Text style={styles.sendAnotherText}>Send another message</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.fieldLabel}>Your Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Jane Doe" placeholderTextColor="#9ca3af" />
            <Text style={styles.fieldLabel}>Email Address</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="jane@example.com" keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#9ca3af" />
            <Text style={styles.fieldLabel}>Message</Text>
            <TextInput style={[styles.input, styles.textArea]} value={message} onChangeText={setMessage} placeholder="How can we help?" multiline numberOfLines={5} textAlignVertical="top" placeholderTextColor="#9ca3af" />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend} activeOpacity={0.8}>
              <Text style={styles.sendBtnText}>Send Message</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Direct Contact */}
      <View style={[styles.section, styles.directContact]}>
        <Text style={styles.directTitle}>Or reach us directly</Text>
        <TouchableOpacity onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
          <Text style={styles.directEmail}>{SUPPORT_EMAIL}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.backBtn} onPress={() => goBack()}>
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07070E' },
  scrollContent: { padding: 28, paddingBottom: 60 },
  title: { fontSize: 28, fontWeight: '800', color: '#F0F0FA', marginBottom: 6, letterSpacing: -0.3 },
  subtitle: { fontSize: 15, color: '#8A94B8', marginBottom: 32 },
  section: { backgroundColor: '#0F0F1D', borderRadius: 14, padding: 24, marginBottom: 22, shadowColor: '#FF3D00', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#F0F0FA', marginBottom: 18, letterSpacing: 0.5, textTransform: 'uppercase' },
  faqItem: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)', paddingVertical: 16 },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { fontSize: 14, fontWeight: '600', color: '#8A94B8', flex: 1, marginRight: 12 },
  faqChevron: { fontSize: 16, color: '#4A5278' },
  faqAnswer: { fontSize: 13, color: '#8A94B8', lineHeight: 21, marginTop: 12 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#8A94B8', marginBottom: 8, marginTop: 14, letterSpacing: 1.2, textTransform: 'uppercase' },
  input: { backgroundColor: '#0A0A18', borderWidth: 1.5, borderColor: 'rgba(255,61,0,0.2)', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#F0F0FA' },
  textArea: { minHeight: 120, paddingTop: 14 },
  sendBtn: { backgroundColor: '#FF3D00', paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 24, shadowColor: '#FF3D00', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 12 },
  sendBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  sentCard: { alignItems: 'center', paddingVertical: 24 },
  sentIcon: { fontSize: 48, color: '#00E676', marginBottom: 14 },
  sentTitle: { fontSize: 18, fontWeight: '800', color: '#F0F0FA', marginBottom: 10 },
  sentText: { fontSize: 14, color: '#8A94B8', textAlign: 'center', lineHeight: 23 },
  sendAnother: { marginTop: 18 },
  sendAnotherText: { fontSize: 14, fontWeight: '600', color: '#FF3D00' },
  directContact: { alignItems: 'center', paddingVertical: 28 },
  directTitle: { fontSize: 14, color: '#8A94B8', marginBottom: 10 },
  directEmail: { fontSize: 16, fontWeight: '700', color: '#FF3D00' },
  backBtn: { marginTop: 8 },
  backBtnText: { fontSize: 15, color: '#8A94B8' },
});
