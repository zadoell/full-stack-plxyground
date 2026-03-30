import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../src/utils/api';
import { NoticeBanner, useToast } from '../src/components/UIComponents';
import { useBack } from '../src/hooks/useBack';

const ROLE_TYPES = ['Ambassador', 'Creator', 'Photographer', 'Reporter', 'Host', 'Specialist'];

export default function CreateOpportunityScreen() {
  const router = useRouter();
  const goBack = useBack('/my-opportunities');
  const { toast, showToast, hideToast } = useToast();

  const [form, setForm] = useState({
    title: '',
    role_type: '',
    body: '',
    requirements: '',
    benefits: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      return showToast('Title is required', 'error');
    }

    setLoading(true);
    try {
      await api.post('/api/opportunities', {
        title: form.title.trim(),
        role_type: form.role_type || null,
        body: form.body.trim(),
        requirements: form.requirements.trim(),
        benefits: form.benefits.trim(),
      });
      showToast('Opportunity submitted for review!', 'success');
      setTimeout(() => router.replace('/my-opportunities'), 800);
    } catch (err) {
      showToast(err.message || 'Failed to create opportunity', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <NoticeBanner {...toast} onDismiss={hideToast} />

      <TouchableOpacity
        onPress={() => goBack()}
        style={styles.backBtn}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.form}>
        <Text style={styles.pageTitle}>New Opportunity</Text>
        <Text style={styles.pageSubtitle}>Post a role to connect with the right talent</Text>

        {/* Title */}
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={v => setForm(p => ({ ...p, title: v }))}
          placeholder="e.g. Brand Ambassador for Summer Campaign"
          placeholderTextColor="#4A5278"
          maxLength={500}
          accessibilityLabel="Opportunity title"
        />

        {/* Role Type */}
        <Text style={styles.label}>Role Type</Text>
        <View style={styles.roleRow}>
          {ROLE_TYPES.map(role => {
            const isSelected = form.role_type === role;
            return (
              <TouchableOpacity
                key={role}
                style={[styles.roleBtn, isSelected && styles.roleBtnActive]}
                onPress={() => setForm(p => ({ ...p, role_type: isSelected ? '' : role }))}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={role}
              >
                <Text style={[styles.roleBtnText, isSelected && styles.roleBtnTextActive]}>
                  {role}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Description / Body */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.body}
          onChangeText={v => setForm(p => ({ ...p, body: v }))}
          placeholder="Describe the opportunity, the project, and what success looks like..."
          placeholderTextColor="#4A5278"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          accessibilityLabel="Opportunity description"
        />

        {/* Requirements */}
        <Text style={styles.label}>Requirements</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.requirements}
          onChangeText={v => setForm(p => ({ ...p, requirements: v }))}
          placeholder="What are you looking for? Skills, experience, availability..."
          placeholderTextColor="#4A5278"
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          accessibilityLabel="Requirements"
        />

        {/* Benefits */}
        <Text style={styles.label}>Benefits</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.benefits}
          onChangeText={v => setForm(p => ({ ...p, benefits: v }))}
          placeholder="What do you offer? Compensation, exposure, perks..."
          placeholderTextColor="#4A5278"
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          accessibilityLabel="Benefits"
        />

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Submit opportunity"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>SUBMIT FOR REVIEW</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07070E',
  },
  scrollContent: {
    padding: 28,
    minHeight: '100%',
  },
  backBtn: {
    marginBottom: 20,
  },
  backBtnText: {
    color: '#FF3D00',
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F0F0FA',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 15,
    color: '#8A94B8',
    marginBottom: 28,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A94B8',
    marginBottom: 8,
    marginTop: 22,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,61,0,0.2)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#F0F0FA',
    backgroundColor: 'rgba(255,61,0,0.04)',
  },
  textArea: {
    minHeight: 130,
  },

  // Role Type Pills
  roleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  roleBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  roleBtnActive: {
    backgroundColor: '#FF3D00',
    borderColor: '#FF3D00',
  },
  roleBtnText: {
    fontSize: 13,
    color: '#8A94B8',
    fontWeight: '600',
  },
  roleBtnTextActive: {
    color: '#FFFFFF',
  },

  // Submit
  submitBtn: {
    backgroundColor: '#FF3D00',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 36,
    marginBottom: 20,
    shadowColor: '#FF3D00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
