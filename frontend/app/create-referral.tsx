import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform, SafeAreaView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { THEME_COLOR, API_BASE_URL } from '../src/constants/config';
import api from '../src/services/api';
import { storage } from '../src/services/storage';
import { encryptClinicalFields } from '../src/services/encryption';
import { GlassCard } from '../src/components/GlassCard';
import { AnimatedBackground } from '../src/components/AnimatedBackground';
import { GlobalWebStyles, RandomFadeText, HandDrawnCircle, useRevealOnScroll } from '../src/components/SharedUI';

const SPECIALTIES = [
  'Cardiology', 'Neurology', 'Orthopedics', 'Dermatology',
  'ENT', 'Ophthalmology', 'Gynecology', 'Psychiatry', 'Other'
];

export default function ReferralFormScreen() {
  const router = useRouter();
  useRevealOnScroll();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    patientPhone: '+91 ',
    reason: '',
    history: '',
    medications: '',
    allergies: '',
    urgency: 'Routine',
    specialty: 'Cardiology',
    customSpecialty: '',
  });
  const [mode, setMode] = useState<'referral' | 'blood_test'>('referral');
  const [bloodChecks, setBloodChecks] = useState<string[]>([]);
  
  const URGENCY_LEVELS = ['Routine', 'High', 'Emergency', 'Critical'];
  const BLOOD_TESTS = [
    'CBC (Complete Blood Count)', 
    'Lipid Profile (Cholesterol)', 
    'HbA1c (Diabetes)', 
    'Liver Function Test (LFT)', 
    'Kidney Function Test (KFT)', 
    'Thyroid Profile (T3, T4, TSH)', 
    'Vitamin D & B12',
    'Iron Profile (Ferritin)',
    'Electrolytes (Na, K, Cl)',
    'Blood Glucose (Fasting)',
    'C-Reactive Protein (CRP)',
    'ESR (Inflammation Marker)',
    'Cardiac Markers (Troponin)',
    'Coagulation (PT/INR)',
    'Serum Uric Acid',
    'Urine Analysis (Routine)'
  ];

  const handleSubmit = async () => {
    console.log('[MediRef] Submit clicked. Form data:', form);
    
    let requiredFields: string[] = [];
    if (mode === 'referral') {
      requiredFields = ['patientPhone', 'reason', 'urgency'];
    } else {
      requiredFields = ['patientPhone'];
    }
    
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
    if (mode === 'referral' && form.specialty === 'Other' && !form.customSpecialty.trim()) {
      if (Platform.OS === 'web') window.alert('Missing Field: Please specify the custom specialty.');
      else Alert.alert('Missing Field', 'Please specify the custom specialty.');
      return;
    }
    if (mode === 'blood_test' && bloodChecks.length === 0) {
      if (Platform.OS === 'web') window.alert('Missing Field: Please select at least one blood test.');
      else Alert.alert('Missing Field', 'Please select at least one blood test.');
      return;
    }

    setLoading(true);
    try {
      const user = await storage.getUser();
      if (!user?.id) throw new Error('User session not found');

      const clinicalFields = {
        reason: form.reason,
        ...(mode === 'referral' && {
          history: form.history,
          medications: form.medications,
          allergies: form.allergies,
          urgency: form.urgency,
        }),
        ...(mode === 'blood_test' && {
          bloodChecks: bloodChecks,
        })
      };

      const finalSpecialty = mode === 'blood_test' ? 'Pathology / Blood Check' : (form.specialty === 'Other' ? form.customSpecialty : form.specialty);

      const { cipherText: encryptedPayload, unlockKey } = encryptClinicalFields(clinicalFields);

      const response = await api.post('/api/referral/create', {
        encryptedPayload,
        patientPhone: form.patientPhone,
        specialty: finalSpecialty,
        gpId: user.id,
      });

      const { docId } = response.data;
      
      // NEW: Automatically send the QR pass image to the patient's WhatsApp
      try {
        const specialistUrl = `${API_BASE_URL}/referral/${docId}#${unlockKey}`;
        await api.post(`/api/referral/${docId}/send-pass`, { specialistUrl });
        console.log('[MediRef] QR Pass auto-sent to patient WhatsApp');
      } catch (sendErr) {
        console.error('[MediRef] Failed to auto-send QR Pass:', sendErr);
      }

      router.replace({
        pathname: '/qr-display',
        params: { docId, specialty: finalSpecialty, unlockKey }
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

  if (Platform.OS === 'web') {
    return (
      <div className="app-container">
        <Stack.Screen options={{ headerShown: false }} />
        <GlobalWebStyles />
        
        <header className="global-header fade-in">
          <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 'bold', letterSpacing: '0.2em', cursor: 'pointer' }} onClick={() => router.back()}>
            ← RETURN
          </div>
          <div style={{ display: 'flex', gap: '32px' }}>
            <button 
              onClick={() => setMode('referral')}
              style={{ 
                background: 'transparent', border: 'none', fontFamily: "'Space Mono', monospace", letterSpacing: '0.1em', cursor: 'pointer', 
                color: mode === 'referral' ? 'var(--primary)' : '#999', 
                fontWeight: mode === 'referral' ? 'bold' : 'normal', 
                padding: '10px 0',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: mode === 'referral' ? 'scale(1.05) translateY(-2px)' : 'scale(1) translateY(0)'
              }}
            >
              <HandDrawnCircle active={mode === 'referral'} delay={0}>REFERRAL</HandDrawnCircle>
            </button>
            <button 
              onClick={() => setMode('blood_test')}
              style={{ 
                background: 'transparent', border: 'none', fontFamily: "'Space Mono', monospace", letterSpacing: '0.1em', cursor: 'pointer', 
                color: mode === 'blood_test' ? 'var(--primary)' : '#999', 
                fontWeight: mode === 'blood_test' ? 'bold' : 'normal', 
                padding: '10px 0',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: mode === 'blood_test' ? 'scale(1.05) translateY(-2px)' : 'scale(1) translateY(0)'
              }}
            >
              <HandDrawnCircle active={mode === 'blood_test'} delay={0}>BLOOD CHECKUP</HandDrawnCircle>
            </button>
          </div>
        </header>

        <div className="grid-layout reveal-on-scroll">
          {mode === 'referral' ? (
            <>
              <div className="grid-col reveal-block" style={{ transitionDelay: '0s' }}>
                <h1 className="font-serif" style={{ fontSize: '64px', margin: '0 0 40px', lineHeight: '1.1' }}>
                  <RandomFadeText text="Create Secure" baseDelay={0} />
                  <br />
                  <HandDrawnCircle delay={1.5}>
                    <RandomFadeText text="Referral" baseDelay={0.5} />
                  </HandDrawnCircle>
                </h1>
                <p className="font-sans" style={{ color: '#666', fontSize: '16px', lineHeight: '1.6', marginBottom: '40px' }}>
                  All clinical data entered here is encrypted locally in your browser using AES-256-GCM. 
                  Only the destination specialist will receive the decryption key. The server never sees the plaintext.
                </p>
            
            <label style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'var(--primary)', letterSpacing: '0.2em' }}>SPECIALTY</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px', marginBottom: '32px' }}>
              {SPECIALTIES.map(spec => (
                <button
                  key={spec}
                  onClick={() => setForm({ ...form, specialty: spec })}
                  style={{
                    padding: '8px 16px',
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '10px',
                    background: form.specialty === spec ? 'var(--fg)' : 'transparent',
                    color: form.specialty === spec ? 'var(--bg)' : 'var(--fg)',
                    border: '1px solid var(--border)',
                    borderRadius: '9999px',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                >
                  {spec}
                </button>
              ))}
            </div>
            
            {form.specialty === 'Other' && (
              <div className="fade-in">
                <label style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'var(--primary)', letterSpacing: '0.2em' }}>SPECIFY SPECIALTY</label>
                <input 
                  className="editorial-input" 
                  value={form.customSpecialty}
                  onChange={(e) => setForm({ ...form, customSpecialty: e.target.value })}
                  placeholder="e.g. Pediatric Oncology"
                  style={{ marginTop: '16px' }}
                />
              </div>
            )}

            <label style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'var(--primary)', letterSpacing: '0.2em' }}>PATIENT PHONE (SMS NOTIFICATION)</label>
            <input 
              className="editorial-input" 
              value={form.patientPhone}
              onChange={(e) => setForm({ ...form, patientPhone: e.target.value })}
              placeholder="+91"
              style={{ marginTop: '16px' }}
            />
            
            <label style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'var(--primary)', letterSpacing: '0.2em' }}>URGENCY LEVEL</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px', marginBottom: '32px' }}>
              {URGENCY_LEVELS.map(level => (
                <button
                  key={level}
                  onClick={() => setForm({ ...form, urgency: level })}
                  style={{
                    padding: '8px 16px',
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '10px',
                    background: form.urgency === level ? 'var(--fg)' : 'transparent',
                    color: form.urgency === level ? 'var(--bg)' : 'var(--fg)',
                    border: '1px solid var(--border)',
                    borderRadius: '9999px',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="grid-col reveal-block" style={{ transitionDelay: '0.2s' }}>
            <label style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'var(--primary)', letterSpacing: '0.2em' }}>CLINICAL REASON</label>
            <textarea 
              className="editorial-textarea" 
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Primary reason for referral..."
              style={{ marginTop: '16px' }}
            />

            <label style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'var(--primary)', letterSpacing: '0.2em' }}>MEDICAL HISTORY (OPTIONAL)</label>
            <textarea 
              className="editorial-textarea" 
              value={form.history}
              onChange={(e) => setForm({ ...form, history: e.target.value })}
              placeholder="Relevant past medical history..."
              style={{ marginTop: '16px', minHeight: '80px' }}
            />

            <label style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'var(--primary)', letterSpacing: '0.2em' }}>CURRENT MEDICATIONS (OPTIONAL)</label>
            <textarea 
              className="editorial-textarea" 
              value={form.medications}
              onChange={(e) => setForm({ ...form, medications: e.target.value })}
              placeholder="List current active medications..."
              style={{ marginTop: '16px', minHeight: '80px' }}
            />

            <label style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'var(--primary)', letterSpacing: '0.2em' }}>ALLERGIES (OPTIONAL)</label>
            <input 
              className="editorial-input" 
              value={form.allergies}
              onChange={(e) => setForm({ ...form, allergies: e.target.value })}
              placeholder="Known allergies..."
              style={{ marginTop: '16px' }}
            />

                <button 
                  className="editorial-btn" 
                  onClick={handleSubmit} 
                  disabled={loading}
                  style={{ marginTop: '20px' }}
                >
                  {loading ? 'ENCRYPTING & SUBMITTING...' : 'ENCRYPT & CREATE REFERRAL'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="grid-col reveal-block" style={{ transitionDelay: '0s' }}>
                <h1 className="font-serif" style={{ fontSize: '64px', margin: '0 0 40px', lineHeight: '1.1' }}>
                  <RandomFadeText text="Order Blood" baseDelay={0} />
                  <br />
                  <HandDrawnCircle delay={1.5}>
                    <RandomFadeText text="Checkup" baseDelay={0.5} />
                  </HandDrawnCircle>
                </h1>
                <p className="font-sans" style={{ color: '#666', fontSize: '16px', lineHeight: '1.6', marginBottom: '40px' }}>
                  Select the required pathology tests. The encrypted request will be accessible only via the generated QR code.
                </p>
                
                <label style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'var(--primary)', letterSpacing: '0.2em', display: 'block', marginBottom: '16px' }}>SELECT REQUIRED TESTS</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
                  {BLOOD_TESTS.map(test => {
                    const isSelected = bloodChecks.includes(test);
                    return (
                      <label key={test} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", fontSize: '14px' }}>
                        <div style={{
                          width: '18px', height: '18px', border: '1px solid var(--primary)', 
                          background: isSelected ? 'var(--primary)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                        }}>
                          {isSelected && <span style={{ color: 'white', fontSize: '12px' }}>✓</span>}
                        </div>
                        <input 
                          type="checkbox" 
                          style={{ display: 'none' }}
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) setBloodChecks([...bloodChecks, test]);
                            else setBloodChecks(bloodChecks.filter(t => t !== test));
                          }}
                        />
                        {test}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="grid-col reveal-block" style={{ transitionDelay: '0.2s' }}>
                <label style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'var(--primary)', letterSpacing: '0.2em' }}>PATIENT PHONE (SMS NOTIFICATION)</label>
                <input 
                  className="editorial-input" 
                  value={form.patientPhone}
                  onChange={(e) => setForm({ ...form, patientPhone: e.target.value })}
                  placeholder="+91"
                  style={{ marginTop: '16px', marginBottom: '32px' }}
                />

                <label style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'var(--primary)', letterSpacing: '0.2em' }}>CLINICAL REASONING (OPTIONAL)</label>
                <textarea 
                  className="editorial-textarea" 
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Why are these tests required?..."
                  style={{ marginTop: '16px', minHeight: '120px' }}
                />

                <button 
                  className="editorial-btn" 
                  onClick={handleSubmit} 
                  disabled={loading}
                  style={{ marginTop: '40px' }}
                >
                  {loading ? 'ENCRYPTING & SUBMITTING...' : 'ENCRYPT & ORDER TESTS'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>New Referral</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Animated.View entering={FadeInDown.delay(100)}>
            <GlassCard style={styles.formSection}>
              <Text style={styles.sectionTitle}>Patient Information</Text>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+91 00000 00000"
                placeholderTextColor="#AAA"
                value={form.patientPhone}
                onChangeText={(val) => setForm({ ...form, patientPhone: val })}
                keyboardType="phone-pad"
              />
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200)}>
            <GlassCard style={styles.formSection}>
              <Text style={styles.sectionTitle}>Medical Specialty</Text>
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
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300)}>
            <GlassCard style={styles.formSection}>
              <Text style={styles.sectionTitle}>Clinical Details</Text>
              
              <Text style={styles.label}>Reason for Referral</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                multiline
                placeholder="What is the primary concern?"
                placeholderTextColor="#AAA"
                value={form.reason}
                onChangeText={(val) => setForm({ ...form, reason: val })}
              />

              <Text style={styles.label}>Relevant Medical History</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                multiline
                placeholder="Past conditions, surgeries..."
                placeholderTextColor="#AAA"
                value={form.history}
                onChangeText={(val) => setForm({ ...form, history: val })}
              />

              <Text style={styles.label}>Current Medications</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                multiline
                placeholder="Drugs and dosages..."
                placeholderTextColor="#AAA"
                value={form.medications}
                onChangeText={(val) => setForm({ ...form, medications: val })}
              />

              <Text style={styles.label}>Allergies (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="List any known allergies"
                placeholderTextColor="#AAA"
                value={form.allergies}
                onChangeText={(val) => setForm({ ...form, allergies: val })}
              />

              <Text style={styles.label}>Urgency Notes</Text>
              <TextInput
                style={styles.input}
                placeholder="Critical observations"
                placeholderTextColor="#AAA"
                value={form.urgency}
                onChangeText={(val) => setForm({ ...form, urgency: val })}
              />
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(500)}>
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
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  backText: {
    fontSize: 24,
    color: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  formSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME_COLOR,
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginRight: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: THEME_COLOR,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  chipText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: THEME_COLOR,
    padding: 20,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: THEME_COLOR,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
