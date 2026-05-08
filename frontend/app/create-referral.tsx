import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform, SafeAreaView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
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
  
  // Tracking for specialty sliding pill
  const specialtyContainerRef = useRef<HTMLDivElement>(null);
  const specialtyRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [pillStyle, setPillStyle] = useState({ left: 0, top: 0, width: 0, opacity: 0 });

  // Tracking for urgency sliding pill
  const urgencyRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [urgencyPillStyle, setUrgencyPillStyle] = useState({ left: 0, top: 0, width: 0, opacity: 0 });

  // Mobile layout tracking
  const [pillLayout, setPillLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const chipLayouts = useRef<{ [key: string]: { x: number, y: number, width: number, height: number } }>({});

  const [urgencyPillLayout, setUrgencyPillLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const urgencyChipLayouts = useRef<{ [key: string]: { x: number, y: number, width: number, height: number } }>({});

  // Tracking for shared input focus border (Web)
  const [focusStyle, setFocusStyle] = useState({ top: 0, left: 0, width: 0, height: 0, opacity: 0 });
  const inputRefs = useRef<{ [key: string]: HTMLTextAreaElement | HTMLInputElement | null }>({});

  const handleFocus = (key: string) => {
    const el = inputRefs.current[key];
    if (el) {
      setFocusStyle({
        top: el.offsetTop,
        left: el.offsetLeft,
        width: el.offsetWidth,
        height: el.offsetHeight,
        opacity: 1
      });
    }
  };

  const handleBlur = () => {
    setFocusStyle(prev => ({ ...prev, opacity: 0 }));
  };

  const handleChipLayout = (spec: string, layout: any) => {
    chipLayouts.current[spec] = layout;
    if (form.specialty === spec) {
      setPillLayout(layout);
    }
  };

  const handleUrgencyLayout = (level: string, layout: any) => {
    urgencyChipLayouts.current[level] = layout;
    if (form.urgency === level) {
      setUrgencyPillLayout(layout);
    }
  };

  useEffect(() => {
    if (chipLayouts.current[form.specialty]) {
      setPillLayout(chipLayouts.current[form.specialty]);
    }
  }, [form.specialty]);

  useEffect(() => {
    if (urgencyChipLayouts.current[form.urgency]) {
      setUrgencyPillLayout(urgencyChipLayouts.current[form.urgency]);
    }
  }, [form.urgency]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (form.specialty) {
        const activeBtn = specialtyRefs.current[form.specialty];
        if (activeBtn) {
          setPillStyle({ left: activeBtn.offsetLeft, top: activeBtn.offsetTop, width: activeBtn.offsetWidth, opacity: 1 });
        }
      }
      if (form.urgency) {
        const activeBtn = urgencyRefs.current[form.urgency];
        if (activeBtn) {
          setUrgencyPillStyle({ left: activeBtn.offsetLeft, top: activeBtn.offsetTop, width: activeBtn.offsetWidth, opacity: 1 });
        }
      }
    }
  }, [form.specialty, form.urgency, mode]);
  
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
      let user = await storage.getUser();
      let gpId = user?.id || await storage.getGpId();
      
      if (!gpId) {
        gpId = 'GP_' + Math.random().toString(36).substr(2, 9).toUpperCase();
        await storage.saveGpId(gpId);
        await storage.saveUser({ id: gpId, name: 'Local GP Session' });
      }

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
        gpId: gpId,
        reason: form.reason,
        history: form.history,
        medications: form.medications,
        allergies: form.allergies,
        urgency: form.urgency,
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

  const animatedPillStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(pillLayout.width, { duration: 800, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
      height: withTiming(pillLayout.height, { duration: 800, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
      left: withTiming(pillLayout.x, { duration: 800, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
      top: withTiming(pillLayout.y, { duration: 800, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
    };
  }, [pillLayout]);

  const animatedUrgencyPillStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(urgencyPillLayout.width, { duration: 1200, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
      height: withTiming(urgencyPillLayout.height, { duration: 1200, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
      left: withTiming(urgencyPillLayout.x, { duration: 1200, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
      top: withTiming(urgencyPillLayout.y, { duration: 1200, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
    };
  }, [urgencyPillLayout]);

  const animatedUrgencyTailStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(urgencyPillLayout.width, { duration: 1500, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
      height: withTiming(urgencyPillLayout.height, { duration: 1500, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
      left: withTiming(urgencyPillLayout.x, { duration: 1500, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
      top: withTiming(urgencyPillLayout.y, { duration: 1500, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
    };
  }, [urgencyPillLayout]);

  const animatedSpecialtyTailStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(pillLayout.width, { duration: 1000, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
      height: withTiming(pillLayout.height, { duration: 1000, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
      left: withTiming(pillLayout.x, { duration: 1000, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
      top: withTiming(pillLayout.y, { duration: 1000, easing: Easing.bezier(0.16, 1, 0.3, 1) }),
    };
  }, [pillLayout]);

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
            
            <div 
              ref={specialtyContainerRef} 
              style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px', marginBottom: '32px' }}
            >
              {/* The Shadow Tail */}
              <div 
                style={{
                  position: 'absolute', height: '32px', background: 'var(--fg)', borderRadius: '9999px',
                  transition: 'all 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
                  left: `${pillStyle.left}px`, top: `${pillStyle.top}px`, width: `${pillStyle.width}px`,
                  opacity: pillStyle.opacity * 0.3, zIndex: 0, filter: 'blur(4px)'
                }}
              />
              {/* The Main Pill */}
              <div 
                style={{
                  position: 'absolute', height: '32px', background: 'var(--fg)', borderRadius: '9999px',
                  transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                  left: `${pillStyle.left}px`, top: `${pillStyle.top}px`, width: `${pillStyle.width}px`,
                  opacity: pillStyle.opacity, zIndex: 0
                }}
              />

              {SPECIALTIES.map((spec, index) => (
                <div 
                  key={spec} 
                  ref={el => specialtyRefs.current[spec] = el}
                  className="fade-in" 
                  style={{ animationDelay: `${0.2 + index * 0.05}s`, display: 'inline-block', position: 'relative', zIndex: 1 }}
                >
                  <button
                    onClick={() => setForm({ ...form, specialty: spec })}
                    style={{
                      padding: '8px 16px',
                      fontFamily: "'Space Mono', monospace",
                      fontSize: '10px',
                      background: 'transparent',
                      color: form.specialty === spec ? 'var(--bg)' : 'var(--fg)',
                      border: '1px solid var(--border)',
                      borderRadius: '9999px',
                      cursor: 'pointer',
                      transition: 'color 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                      position: 'relative',
                      zIndex: 2
                    }}
                  >
                    {spec}
                  </button>
                </div>
              ))}
            </div>
            
            {form.specialty === 'Other' && (
              <div 
                className="fade-in" 
                style={{ 
                  animation: 'slideDown 0.6s var(--bezier) forwards',
                  overflow: 'hidden'
                }}
              >
                <style>{`
                  @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-20px); max-height: 0; }
                    to { opacity: 1; transform: translateY(0); max-height: 100px; }
                  }
                `}</style>
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
            <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px', marginBottom: '32px' }}>
              {/* The Shadow Tail */}
              <div 
                style={{
                  position: 'absolute', height: '32px', background: 'var(--fg)', borderRadius: '9999px',
                  transition: 'all 1.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  left: `${urgencyPillStyle.left}px`, top: `${urgencyPillStyle.top}px`, 
                  width: `${urgencyPillStyle.width}px`, opacity: urgencyPillStyle.opacity * 0.3,
                  zIndex: 0, filter: 'blur(4px)'
                }}
              />
              {/* The Main Pill */}
              <div 
                style={{
                  position: 'absolute', height: '32px', background: 'var(--fg)', borderRadius: '9999px',
                  transition: 'all 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  left: `${urgencyPillStyle.left}px`, top: `${urgencyPillStyle.top}px`, 
                  width: `${urgencyPillStyle.width}px`, opacity: urgencyPillStyle.opacity,
                  zIndex: 0
                }}
              />
              {URGENCY_LEVELS.map((level, index) => (
                <div 
                  key={level} ref={el => urgencyRefs.current[level] = el}
                  className="fade-in" style={{ animationDelay: `${0.4 + index * 0.05}s`, display: 'inline-block', position: 'relative', zIndex: 1 }}
                >
                  <button
                    onClick={() => setForm({ ...form, urgency: level })}
                    style={{
                      padding: '8px 16px', fontFamily: "'Space Mono', monospace", fontSize: '10px',
                      background: 'transparent', color: form.urgency === level ? 'var(--bg)' : 'var(--fg)',
                      border: '1px solid var(--border)', borderRadius: '9999px', cursor: 'pointer',
                      transition: 'color 1.2s cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative', zIndex: 2
                    }}
                  >
                    {level}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid-col reveal-block" style={{ transitionDelay: '0.2s', position: 'relative' }}>
            {/* Shared Sliding Focus Border - Shadow Tail */}
            <div 
              style={{
                position: 'absolute',
                border: '2px solid var(--fg)',
                transition: 'all 1.4s cubic-bezier(0.16, 1, 0.3, 1)',
                top: `${focusStyle.top}px`,
                left: `${focusStyle.left}px`,
                width: `${focusStyle.width}px`,
                height: `${focusStyle.height}px`,
                opacity: focusStyle.opacity * 0.3,
                pointerEvents: 'none',
                zIndex: 4,
                borderRadius: '4px',
                filter: 'blur(2px)'
              }}
            />
            {/* Shared Sliding Focus Border - Main */}
            <div 
              style={{
                position: 'absolute',
                border: '2px solid var(--fg)',
                transition: 'all 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
                top: `${focusStyle.top}px`,
                left: `${focusStyle.left}px`,
                width: `${focusStyle.width}px`,
                height: `${focusStyle.height}px`,
                opacity: focusStyle.opacity,
                pointerEvents: 'none',
                zIndex: 5,
                borderRadius: '4px'
              }}
            />

            <label style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'var(--primary)', letterSpacing: '0.2em' }}>CLINICAL REASON</label>
            <textarea 
              ref={el => inputRefs.current['reason'] = el}
              className="editorial-textarea" 
              value={form.reason}
              onFocus={() => handleFocus('reason')}
              onBlur={handleBlur}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Primary reason for referral..."
              style={{ marginTop: '16px' }}
            />

            <label style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'var(--primary)', letterSpacing: '0.2em' }}>MEDICAL HISTORY (OPTIONAL)</label>
            <textarea 
              ref={el => inputRefs.current['history'] = el}
              className="editorial-textarea" 
              value={form.history}
              onFocus={() => handleFocus('history')}
              onBlur={handleBlur}
              onChange={(e) => setForm({ ...form, history: e.target.value })}
              placeholder="Relevant past medical history..."
              style={{ marginTop: '16px', minHeight: '80px' }}
            />

            <label style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'var(--primary)', letterSpacing: '0.2em' }}>CURRENT MEDICATIONS (OPTIONAL)</label>
            <textarea 
              ref={el => inputRefs.current['medications'] = el}
              className="editorial-textarea" 
              value={form.medications}
              onFocus={() => handleFocus('medications')}
              onBlur={handleBlur}
              onChange={(e) => setForm({ ...form, medications: e.target.value })}
              placeholder="List current active medications..."
              style={{ marginTop: '16px', minHeight: '80px' }}
            />

            <label style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'var(--primary)', letterSpacing: '0.2em' }}>ALLERGIES (OPTIONAL)</label>
            <input 
              ref={el => inputRefs.current['allergies'] = el}
              className="editorial-input" 
              value={form.allergies}
              onFocus={() => handleFocus('allergies')}
              onBlur={handleBlur}
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                  {BLOOD_TESTS.map((test, index) => {
                    const isSelected = bloodChecks.includes(test);
                    return (
                      <div 
                        key={test} 
                        className="fade-in" 
                        style={{ animationDelay: `${0.2 + index * 0.03}s` }}
                      >
                        <label 
                          onClick={() => {
                            if (isSelected) setBloodChecks(bloodChecks.filter(t => t !== test));
                            else setBloodChecks([...bloodChecks, test]);
                          }}
                          style={{ 
                            display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', 
                            fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px',
                            padding: '12px', borderRadius: '12px', border: '1px solid',
                            borderColor: isSelected ? 'var(--primary)' : 'rgba(0,0,0,0.05)',
                            background: isSelected ? 'rgba(27, 79, 114, 0.03)' : 'transparent',
                            transition: 'all 0.4s var(--bezier)'
                          }}
                        >
                          <div style={{
                            width: '20px', height: '20px', borderRadius: '6px', border: '2px solid', 
                            borderColor: isSelected ? 'var(--primary)' : '#ddd',
                            background: isSelected ? 'var(--primary)' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                            flexShrink: 0
                          }}>
                            {isSelected && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'popIn 0.3s forwards' }}>
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                          <span style={{ color: isSelected ? 'var(--primary)' : '#666', fontWeight: isSelected ? '600' : '400' }}>{test}</span>
                        </label>
                      </div>
                    );
                  })}
                </div>
                <style>{`
                  @keyframes popIn {
                    0% { transform: scale(0); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                  }
                `}</style>
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
          {mode === 'referral' ? (
            <>
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
                    {/* Shadow Tail */}
                    <Animated.View 
                      style={[
                        styles.mobilePill,
                        animatedSpecialtyTailStyle,
                        { opacity: 0.3, transform: [{ scale: 0.95 }] }
                      ]}
                    />
                    {/* Mobile Sliding Pill */}
                    <Animated.View 
                      style={[
                        styles.mobilePill,
                        animatedPillStyle
                      ]}
                    />
                    
                    {SPECIALTIES.map((spec, index) => (
                      <Animated.View 
                        key={spec} 
                        entering={FadeInDown.delay(index * 100).duration(500)}
                        onLayout={(e) => handleChipLayout(spec, e.nativeEvent.layout)}
                      >
                        <TouchableOpacity
                          style={[styles.chip, { backgroundColor: 'transparent' }]}
                          onPress={() => setForm({ ...form, specialty: spec })}
                        >
                          <Text style={[styles.chipText, form.specialty === spec && { color: '#fff' }]}>{spec}</Text>
                        </TouchableOpacity>
                      </Animated.View>
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

                  <Text style={styles.label}>Urgency Level</Text>
                  <View style={styles.pickerContainer}>
                    {/* Shadow Tail */}
                    <Animated.View 
                      style={[
                        styles.mobilePill,
                        animatedUrgencyTailStyle,
                        { opacity: 0.3, transform: [{ scale: 0.95 }] }
                      ]}
                    />
                    <Animated.View 
                      style={[
                        styles.mobilePill,
                        animatedUrgencyPillStyle
                      ]}
                    />
                    {URGENCY_LEVELS.map((level, index) => (
                      <Animated.View 
                        key={level} 
                        entering={FadeInDown.delay(index * 100 + 300).duration(500)}
                        onLayout={(e) => handleUrgencyLayout(level, e.nativeEvent.layout)}
                      >
                        <TouchableOpacity
                          style={[styles.chip, { backgroundColor: 'transparent' }]}
                          onPress={() => setForm({ ...form, urgency: level })}
                        >
                          <Text style={[styles.chipText, form.urgency === level && { color: '#fff' }]}>{level}</Text>
                        </TouchableOpacity>
                      </Animated.View>
                    ))}
                  </View>
                </GlassCard>
              </Animated.View>
            </>
          ) : (
            <>
              <Animated.View entering={FadeInUp.delay(100)}>
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

              <Animated.View entering={FadeInUp.delay(200)}>
                <GlassCard style={styles.formSection}>
                  <Text style={styles.sectionTitle}>Required Pathology Tests</Text>
                  <View style={styles.bloodList}>
                    {BLOOD_TESTS.map((test, index) => {
                      const isSelected = bloodChecks.includes(test);
                      return (
                        <Animated.View 
                          key={test} 
                          entering={FadeInDown.delay(index * 50).duration(400)}
                        >
                          <TouchableOpacity
                            style={[styles.bloodItem, isSelected && styles.bloodItemActive]}
                            onPress={() => {
                              if (isSelected) setBloodChecks(bloodChecks.filter(t => t !== test));
                              else setBloodChecks([...bloodChecks, test]);
                            }}
                          >
                            <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                              {isSelected && (
                                <View style={styles.checkmark} />
                              )}
                            </View>
                            <Text style={[styles.bloodText, isSelected && styles.bloodTextActive]}>{test}</Text>
                          </TouchableOpacity>
                        </Animated.View>
                      );
                    })}
                  </View>
                </GlassCard>
              </Animated.View>
              
              <Animated.View entering={FadeInUp.delay(300)}>
                <GlassCard style={styles.formSection}>
                  <Text style={styles.sectionTitle}>Clinical Reason (Optional)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    multiline
                    placeholder="Why are these tests required?..."
                    placeholderTextColor="#AAA"
                    value={form.reason}
                    onChangeText={(val) => setForm({ ...form, reason: val })}
                  />
                </GlassCard>
              </Animated.View>
            </>
          )}

          <Animated.View entering={FadeInUp.delay(500)}>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>
                  {mode === 'referral' ? 'Generate Secure Referral' : 'Generate Blood Order'}
                </Text>
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
  mobilePill: {
    position: 'absolute',
    backgroundColor: THEME_COLOR,
    borderRadius: 20,
    zIndex: -1,
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
  bloodList: {
    marginTop: 10,
  },
  bloodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  bloodItemActive: {
    backgroundColor: 'rgba(27, 79, 114, 0.05)',
    borderColor: 'rgba(27, 79, 114, 0.1)',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxActive: {
    borderColor: THEME_COLOR,
    backgroundColor: THEME_COLOR,
  },
  checkmark: {
    width: 10,
    height: 6,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#fff',
    transform: [{ rotate: '-45deg' }, { translateY: -1 }],
  },
  bloodText: {
    fontSize: 14,
    color: '#666',
  },
  bloodTextActive: {
    color: THEME_COLOR,
    fontWeight: '600',
  }
});
