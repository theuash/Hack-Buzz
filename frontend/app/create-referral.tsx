import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { THEME_COLOR } from '../src/constants/config';
import api from '../src/services/api';
import { storage } from '../src/services/storage';
import { encryptClinicalFields } from '../src/services/encryption';

const SPECIALTIES = [
  'Cardiology', 'Neurology', 'Orthopedics', 'Dermatology',
  'ENT', 'Ophthalmology', 'Gynecology', 'Psychiatry', 'Other'
];

export default function ReferralFormScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    patientPhone: '',
    reason: '',
    history: '',
    medications: '',
    allergies: '',
    urgency: '',
    specialty: 'Cardiology',
  });

  const handleSubmit = async () => {
    console.log('[MediRef] Submit clicked. Form data:', form);
    
    // Basic validation
    const requiredFields = ['patientPhone', 'reason', 'history', 'medications', 'urgency', 'specialty'];
    for (const field of requiredFields) {
      if (!form[field as keyof typeof form]) {
        const msg = `Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`;
        console.warn('[MediRef] Validation failed for:', field);
        if (Platform.OS === 'web') {
          window.alert('Missing Field: ' + msg);
        } else {
          Alert.alert('Missing Field', msg);
        }
        return;
      }
    }

    setLoading(true);
    try {
      const user = await storage.getUser();
      if (!user?.id) throw new Error('User session not found');

      // 1. Separate clinical data for encryption
      const clinicalFields = {
        reason: form.reason,
        history: form.history,
        medications: form.medications,
        allergies: form.allergies,
        urgency: form.urgency,
      };

      // 2. Encrypt clinical data
      const encryptedPayload = encryptClinicalFields(clinicalFields, user.id);

      // 3. POST to backend
      const response = await api.post('/api/referral/create', {
        encryptedPayload,
        patientPhone: form.patientPhone,
        specialty: form.specialty,
        gpId: user.id,
      });

      const { docId } = response.data;

      // 4. Navigate to QR Display
      router.replace({
        pathname: '/qr-display',
        params: { docId, specialty: form.specialty }
      });

    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to create referral';
      console.error('[MediRef] Create Referral Error:', errorMsg);
      if (Platform.OS === 'web') {
        window.alert('Submission Error: ' + errorMsg);
      } else {
        Alert.alert('Submission Error', errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Patient Phone Number</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. +91 9876543210"
        value={form.patientPhone}
        onChangeText={(val) => setForm({ ...form, patientPhone: val })}
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Target Specialty</Text>
      <View style={styles.pickerContainer}>
        {SPECIALTIES.map((spec) => (
          <TouchableOpacity
            key={spec}
            style={[styles.chip, form.specialty === spec && styles.chipActive]}
            onPress={() => setForm({ ...form, specialty: spec })}
          >
            <Text style={[styles.chipText, form.specialty === spec && styles.chipTextActive]}>{spec}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Reason for Referral</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        multiline
        placeholder="Briefly describe the primary concern..."
        value={form.reason}
        onChangeText={(val) => setForm({ ...form, reason: val })}
      />

      <Text style={styles.label}>Relevant Medical History</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        multiline
        placeholder="Past conditions, surgeries, etc."
        value={form.history}
        onChangeText={(val) => setForm({ ...form, history: val })}
      />

      <Text style={styles.label}>Current Medications</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        multiline
        placeholder="List current drugs and dosages"
        value={form.medications}
        onChangeText={(val) => setForm({ ...form, medications: val })}
      />

      <Text style={styles.label}>Allergies (Optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Drug or food allergies"
        value={form.allergies}
        onChangeText={(val) => setForm({ ...form, allergies: val })}
      />

      <Text style={styles.label}>Red Flags / Urgency Notes</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        multiline
        placeholder="Any critical observations..."
        value={form.urgency}
        onChangeText={(val) => setForm({ ...form, urgency: val })}
      />

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>Generate Secure Referral</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#444',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME_COLOR,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: THEME_COLOR,
  },
  chipText: {
    color: THEME_COLOR,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: THEME_COLOR,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
    shadowColor: THEME_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
