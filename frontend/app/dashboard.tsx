import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, Platform, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { THEME_COLOR, APP_NAME } from '../src/constants/config';
import api from '../src/services/api';
import { storage } from '../src/services/storage';
import { GlassCard } from '../src/components/GlassCard';
import { AnimatedBackground } from '../src/components/AnimatedBackground';
import { ParallaxWrapper } from '../src/components/ParallaxWrapper';
import { GlobalWebStyles, RandomFadeText, HandDrawnCircle, useRevealOnScroll } from '../src/components/SharedUI';

interface Referral {
  _id?: string;
  docId?: string;
  specialty: string;
  patientPhone: string;
  date: string;
  createdAt?: string;
  status: 'pending' | 'approved' | 'denied';
  consentStatus?: 'pending' | 'approved' | 'denied';
  gpId?: string;
  workflowState?: string;
  reason?: string;
  history?: string;
  medications?: string;
  allergies?: string;
  urgency?: string;
}

export default function DashboardScreen() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean,
    type: 'edit' | 'delete' | 'info',
    data: Referral | null
  }>({ visible: false, type: 'info', data: null });
  
  const [editForm, setEditForm] = useState({ 
    patientPhone: '', 
    specialty: '',
    reason: '',
    history: '',
    medications: '',
    allergies: '',
    urgency: ''
  });
  
  const router = useRouter();
  useRevealOnScroll();

  useEffect(() => {
    fetchReferrals();
    
    // Auto-refresh dashboard every 5 seconds to catch WhatsApp updates
    const pollInterval = setInterval(() => {
      fetchReferrals();
    }, 5000);

    return () => clearInterval(pollInterval);
  }, []);

  const fetchReferrals = async () => {
    try {
      let gpId = await storage.getGpId();
      if (!gpId) {
        gpId = 'GP_' + Math.random().toString(36).substr(2, 9).toUpperCase();
        await storage.saveGpId(gpId);
        await storage.saveUser({ id: gpId, name: 'Local GP Session' });
      }
      const response = await api.get('/api/referral/list', { params: { gpId } });
      setReferrals(response.data);
    } catch (error) {
      console.error('Failed to fetch referrals', error);
    } finally {
      setLoading(false);
    }
  };

  const maskPhone = (phone: string) => {
    if (!phone) return '';
    return phone.replace(/(\d{3})\d+(\d{4})/, '$1******$2');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#4CAF50';
      case 'denied': return '#FF0000';
      default: return '#FF9800';
    }
  };

  const renderItem = ({ item, index }: { item: Referral, index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(600)}>
      <GlassCard style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.specialty}>{item.specialty || 'General'}</Text>
          <View style={[styles.badge, { backgroundColor: getStatusColor(item.status || item.consentStatus || 'pending') }]}>
            <Text style={styles.badgeText}>{(item.status || item.consentStatus || 'pending').toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.cardText}>Patient: {maskPhone(item.patientPhone)}</Text>
        <Text style={styles.dateText}>Created {new Date(item.createdAt || item.date).toLocaleDateString()}</Text>
        
        {expandedId === (item.docId || item._id) && (
          <Animated.View 
            entering={FadeInDown.duration(300)} 
            style={styles.expandedSection}
          >
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>REASON:</Text>
              <Text style={styles.detailValue}>{item.reason || 'N/A'}</Text>
            </View>
            {item.history && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>HISTORY:</Text>
                <Text style={styles.detailValue}>{item.history}</Text>
              </View>
            )}
            {item.medications && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>MEDS:</Text>
                <Text style={styles.detailValue}>{item.medications}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>URGENCY:</Text>
              <Text style={[styles.detailValue, { color: item.urgency === 'Routine' ? '#4CAF50' : '#FF9800' }]}>{item.urgency || 'Routine'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>DOC ID:</Text>
              <Text style={styles.detailValue}>{item.docId || 'N/A'}</Text>
            </View>
          </Animated.View>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.actionBtn, expandedId === (item.docId || item._id) && { backgroundColor: THEME_COLOR }]} 
            onPress={() => handleCheck(item)}
          >
            <Text style={[styles.actionBtnText, expandedId === (item.docId || item._id) && { color: '#fff' }]}>
              {expandedId === (item.docId || item._id) ? 'CLOSE' : 'CHECK'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(item)}>
            <Text style={styles.actionBtnText}>EDIT</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { borderColor: '#FF4444' }]} onPress={() => openDeleteModal(item)}>
            <Text style={[styles.actionBtnText, { color: '#FF4444' }]}>DELETE</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>
    </Animated.View>
  );

  const handleLogout = async () => {
    await storage.clear();
    router.replace('/');
  };

  const handleDelete = async (docId: string) => {
    try {
      await api.delete(`/api/referral/${docId}`);
      setModalConfig({ ...modalConfig, visible: false });
      fetchReferrals();
    } catch (e) {
      console.error('Delete failed', e);
      Alert.alert('Error', 'Failed to delete referral');
    }
  };

  const handleUpdate = async () => {
    if (!modalConfig.data) return;
    try {
      await api.put(`/api/referral/${modalConfig.data.docId}`, { 
        ...editForm
      });
      setModalConfig({ ...modalConfig, visible: false });
      fetchReferrals();
    } catch (e) {
      console.error('Update failed', e);
      Alert.alert('Error', 'Failed to update referral');
    }
  };

  const openEditModal = (item: Referral) => {
    setEditForm({ 
      patientPhone: item.patientPhone, 
      specialty: item.specialty,
      reason: item.reason || '',
      history: item.history || '',
      medications: item.medications || '',
      allergies: item.allergies || '',
      urgency: item.urgency || 'Routine'
    });
    setModalConfig({ visible: true, type: 'edit', data: item });
  };

  const openDeleteModal = (item: Referral) => {
    setModalConfig({ visible: true, type: 'delete', data: item });
  };

  const handleCheck = (item: Referral) => {
    const id = item.docId || item._id || '';
    setExpandedId(expandedId === id ? null : id);
  };

  const stats = [
    { label: 'Total', value: referrals.length, color: '#333' },
    { label: 'Pending', value: referrals.filter(r => (r.status || r.consentStatus || 'pending') === 'pending').length, color: '#FF9800' },
    { label: 'Approved', value: referrals.filter(r => (r.status === 'approved' || r.consentStatus === 'approved')).length, color: '#4CAF50' },
  ];

  if (Platform.OS === 'web') {
    return (
      <div className="app-container">
        <Stack.Screen options={{ headerShown: false }} />
        <GlobalWebStyles />
        
        <header className="global-header fade-in">
          <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 'bold', letterSpacing: '0.2em' }}>
            GP DASHBOARD
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", letterSpacing: '0.1em', cursor: 'pointer' }} onClick={handleLogout}>
            LOGOUT
          </div>
        </header>

        <div className="grid-layout reveal-on-scroll">
          <div className="grid-col reveal-block" style={{ transitionDelay: '0s' }}>
            <h1 className="font-serif" style={{ fontSize: '64px', margin: '0 0 40px', lineHeight: '1.1' }}>
              <RandomFadeText text="Active" baseDelay={0} />
              <br />
              <HandDrawnCircle delay={1.5}>
                <RandomFadeText text="Referrals" baseDelay={0.5} />
              </HandDrawnCircle>
            </h1>
            
            <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
              {stats.map((stat, i) => (
                <div key={stat.label} style={{ flex: 1, padding: '20px', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', letterSpacing: '0.1em', marginTop: '8px' }}>{stat.label.toUpperCase()}</div>
                </div>
              ))}
            </div>

            <button 
              className="editorial-btn" 
              onClick={() => router.push('/create-referral')} 
            >
              + NEW SECURE REFERRAL
            </button>
          </div>

          <div className="grid-col reveal-block" style={{ transitionDelay: '0.2s', borderRight: 'none', padding: 0 }}>
            {loading ? (
              <div style={{ padding: '40px', fontFamily: "'Space Mono', monospace", fontSize: '12px' }}>LOADING DATA...</div>
            ) : referrals.length === 0 ? (
              <div style={{ padding: '40px', fontFamily: "'Space Mono', monospace", fontSize: '12px', color: '#666' }}>NO REFERRALS FOUND.</div>
            ) : (
              referrals.map((item, index) => (
                <div key={item._id || item.docId || index} className="grid-row fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '14px', fontWeight: 'bold' }}>{(item.specialty || 'General').toUpperCase()}</div>
                    <div style={{ 
                      fontFamily: "'Space Mono', monospace", 
                      fontSize: '10px', 
                      letterSpacing: '0.1em',
                      padding: '4px 8px',
                      background: getStatusColor(item.status || item.consentStatus || 'pending'),
                      color: 'white'
                    }}>
                      {(item.status || item.consentStatus || 'pending').toUpperCase()}
                    </div>
                  </div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '16px', marginBottom: '8px' }}>
                    Patient: {maskPhone(item.patientPhone)}
                  </div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#666', marginBottom: '16px' }}>
                    Created {new Date(item.createdAt || item.date).toLocaleDateString()}
                  </div>

                  <div style={{ 
                    maxHeight: expandedId === (item.docId || item._id) ? '200px' : '0', 
                    overflow: 'hidden', 
                    transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                    opacity: expandedId === (item.docId || item._id) ? 1 : 0,
                    marginBottom: expandedId === (item.docId || item._id) ? '20px' : '0'
                  }}>
                    <div style={{ padding: '12px', background: 'rgba(0,0,0,0.02)', borderLeft: '2px solid var(--primary)' }}>
                      <div style={{ fontSize: '10px', color: '#999', marginBottom: '8px', fontFamily: "'Space Mono', monospace" }}>CLINICAL DATA</div>
                      <div style={{ fontSize: '13px', marginBottom: '8px', lineHeight: '1.4' }}>
                        <strong style={{ color: 'var(--primary)', fontSize: '10px' }}>REASON:</strong><br/>
                        {item.reason || 'No clinical reason provided.'}
                      </div>
                      {item.history && (
                        <div style={{ fontSize: '13px', marginBottom: '8px', lineHeight: '1.4' }}>
                          <strong style={{ color: 'var(--primary)', fontSize: '10px' }}>HISTORY:</strong><br/>
                          {item.history}
                        </div>
                      )}
                      {item.medications && (
                        <div style={{ fontSize: '13px', marginBottom: '8px', lineHeight: '1.4' }}>
                          <strong style={{ color: 'var(--primary)', fontSize: '10px' }}>MEDICATIONS:</strong><br/>
                          {item.medications}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '20px', marginTop: '12px' }}>
                        <div style={{ fontSize: '11px' }}>
                          <strong style={{ color: '#999', fontSize: '9px' }}>URGENCY:</strong> {item.urgency || 'Routine'}
                        </div>
                        <div style={{ fontSize: '11px' }}>
                          <strong style={{ color: '#999', fontSize: '9px' }}>STATUS:</strong> {(item.status || item.consentStatus || 'pending').toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                    <button 
                      onClick={() => handleCheck(item)}
                      style={{ 
                        background: expandedId === (item.docId || item._id) ? 'var(--fg)' : 'transparent', 
                        color: expandedId === (item.docId || item._id) ? 'var(--bg)' : 'inherit',
                        border: '1px solid #ddd', padding: '4px 8px', fontSize: '10px', fontFamily: "'Space Mono', monospace", cursor: 'pointer',
                        transition: 'all 0.3s'
                      }}
                    >
                      {expandedId === (item.docId || item._id) ? 'CLOSE' : 'CHECK'}
                    </button>
                    <button 
                      onClick={() => openEditModal(item)}
                      style={{ background: 'transparent', border: '1px solid #ddd', padding: '4px 8px', fontSize: '10px', fontFamily: "'Space Mono', monospace", cursor: 'pointer' }}
                    >
                      EDIT
                    </button>
                    <button 
                      onClick={() => openDeleteModal(item)}
                      style={{ background: 'transparent', border: '1px solid #FF4444', color: '#FF4444', padding: '4px 8px', fontSize: '10px', fontFamily: "'Space Mono', monospace", cursor: 'pointer' }}
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {modalConfig.visible && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            animation: 'fadeIn 0.3s'
          }}>
            <div style={{
              background: '#fff', padding: '0', maxWidth: '550px', width: '90%', maxHeight: '90vh',
              borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              overflow: 'hidden', display: 'flex', flexDirection: 'column'
            }}>
              {modalConfig.type === 'edit' ? (
                <>
                  <div style={{ padding: '32px 32px 16px', borderBottom: '1px solid #f0f0f0' }}>
                    <h2 style={{ fontSize: '28px', fontWeight: '800', margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>Edit Clinical File</h2>
                    <p style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>Modify the referral details for this patient.</p>
                  </div>
                  
                  <div style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                      <div>
                        <label style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Patient Phone</label>
                        <input 
                          style={{ width: '100%', padding: '12px', marginTop: '8px', border: '1px solid #eee', borderRadius: '12px', fontSize: '15px' }}
                          value={editForm.patientPhone}
                          onChange={(e) => setEditForm({ ...editForm, patientPhone: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Specialty</label>
                        <input 
                          style={{ width: '100%', padding: '12px', marginTop: '8px', border: '1px solid #eee', borderRadius: '12px', fontSize: '15px' }}
                          value={editForm.specialty}
                          onChange={(e) => setEditForm({ ...editForm, specialty: e.target.value })}
                        />
                      </div>
                    </div>

                    <label style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Clinical Reason</label>
                    <textarea 
                      style={{ width: '100%', padding: '12px', marginTop: '8px', marginBottom: '24px', border: '1px solid #eee', borderRadius: '12px', fontSize: '15px', minHeight: '80px', fontFamily: 'inherit' }}
                      value={editForm.reason}
                      onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                    />

                    <label style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Medical History</label>
                    <textarea 
                      style={{ width: '100%', padding: '12px', marginTop: '8px', marginBottom: '24px', border: '1px solid #eee', borderRadius: '12px', fontSize: '15px', minHeight: '80px', fontFamily: 'inherit' }}
                      value={editForm.history}
                      onChange={(e) => setEditForm({ ...editForm, history: e.target.value })}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                      <div>
                        <label style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Urgency</label>
                        <select 
                          style={{ width: '100%', padding: '12px', marginTop: '8px', border: '1px solid #eee', borderRadius: '12px', fontSize: '15px', background: 'white' }}
                          value={editForm.urgency}
                          onChange={(e) => setEditForm({ ...editForm, urgency: e.target.value })}
                        >
                          <option>Routine</option>
                          <option>High</option>
                          <option>Emergency</option>
                          <option>Critical</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Allergies</label>
                        <input 
                          style={{ width: '100%', padding: '12px', marginTop: '8px', border: '1px solid #eee', borderRadius: '12px', fontSize: '15px' }}
                          value={editForm.allergies}
                          onChange={(e) => setEditForm({ ...editForm, allergies: e.target.value })}
                        />
                      </div>
                    </div>

                    <label style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Medications</label>
                    <textarea 
                      style={{ width: '100%', padding: '12px', marginTop: '8px', marginBottom: '8px', border: '1px solid #eee', borderRadius: '12px', fontSize: '15px', minHeight: '60px', fontFamily: 'inherit' }}
                      value={editForm.medications}
                      onChange={(e) => setEditForm({ ...editForm, medications: e.target.value })}
                    />
                  </div>

                  <div style={{ padding: '24px 32px 32px', display: 'flex', gap: '16px', borderTop: '1px solid #f0f0f0' }}>
                    <button 
                      onClick={() => setModalConfig({ ...modalConfig, visible: false })}
                      style={{ flex: 1, padding: '16px', background: '#f8f8f8', border: 'none', borderRadius: '16px', cursor: 'pointer', fontWeight: 'bold', color: '#666' }}
                    >
                      CANCEL
                    </button>
                    <button 
                      onClick={handleUpdate}
                      style={{ flex: 1, padding: '16px', background: 'var(--fg)', color: 'var(--bg)', border: 'none', borderRadius: '16px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      SAVE CHANGES
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ padding: '40px', textAlign: 'center' }}>
                    <div style={{ 
                      width: '80px', height: '80px', borderRadius: '40px', background: '#FFF5F5', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' 
                    }}>
                      <div style={{ fontSize: '32px' }}>⚠️</div>
                    </div>
                    
                    <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 12px', fontFamily: "'Space Grotesk', sans-serif", color: '#1A1A1A' }}>
                      Delete Referral?
                    </h2>
                    
                    <p style={{ color: '#666', fontSize: '15px', lineHeight: '1.6', margin: '0 0 32px' }}>
                      You are about to permanently remove the referral for <strong style={{ color: '#000' }}>{modalConfig.data?.specialty}</strong>. 
                      This clinical record will be wiped from our secure vault.
                    </p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <button 
                        onClick={() => handleDelete(modalConfig.data?.docId || '')}
                        style={{ 
                          padding: '18px', background: '#FF4444', color: '#fff', border: 'none', 
                          borderRadius: '16px', cursor: 'pointer', fontWeight: '800', fontSize: '14px',
                          letterSpacing: '1px', boxShadow: '0 10px 20px rgba(255, 68, 68, 0.2)'
                        }}
                      >
                        CONFIRM DELETION
                      </button>
                      <button 
                        onClick={() => setModalConfig({ ...modalConfig, visible: false })}
                        style={{ 
                          padding: '18px', background: 'transparent', color: '#999', border: 'none', 
                          borderRadius: '16px', cursor: 'pointer', fontWeight: '700', fontSize: '12px'
                        }}
                      >
                        NEVERMIND, KEEP IT
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome Back,</Text>
            <Text style={styles.appName}>{APP_NAME}</Text>
          </View>
          <TouchableOpacity style={styles.logoutCircle} onPress={handleLogout}>
            <Text style={styles.logoutIcon}>×</Text>
          </TouchableOpacity>
        </View>

        <ParallaxWrapper>
          <View style={styles.statsContainer}>
            {stats.map((stat, i) => (
              <Animated.View key={stat.label} entering={FadeInRight.delay(i * 150)}>
                <GlassCard style={styles.statCard}>
                  <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </GlassCard>
              </Animated.View>
            ))}
          </View>
        </ParallaxWrapper>

        {loading ? (
          <ActivityIndicator style={styles.loader} size="large" color={THEME_COLOR} />
        ) : (
          <FlatList
            data={referrals}
            renderItem={renderItem}
            keyExtractor={(item) => item._id || item.docId || Math.random().toString()}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={<Text style={styles.listTitle}>Recent Referrals</Text>}
            ListEmptyComponent={<Text style={styles.empty}>No referrals created yet.</Text>}
          />
        )}

        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/create-referral')}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 20,
    marginBottom: 30,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -1,
  },
  logoutCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutIcon: {
    fontSize: 24,
    color: '#666',
    marginTop: -2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statCard: {
    width: 105,
    padding: 15,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase',
    marginTop: 4,
    fontWeight: '600',
  },
  loader: {
    marginTop: 100,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
    marginLeft: 5,
  },
  card: {
    marginBottom: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  specialty: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  cardText: {
    fontSize: 15,
    color: '#444',
    marginBottom: 6,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    color: '#999',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: THEME_COLOR,
    width: 65,
    height: 65,
    borderRadius: 32.5,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: THEME_COLOR,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  fabIcon: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '200',
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 12,
    gap: 10,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  actionBtnText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
    color: '#666',
  },
  expandedSection: {
    marginTop: 15,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: THEME_COLOR,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  detailValue: {
    fontSize: 10,
    color: '#333',
    fontWeight: '600',
  }
});
