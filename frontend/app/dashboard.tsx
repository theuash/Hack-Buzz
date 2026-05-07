import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, Platform } from 'react-native';
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
  id: string;
  specialty: string;
  patientPhone: string;
  date: string;
  status: 'pending' | 'approved' | 'denied';
}

export default function DashboardScreen() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  useRevealOnScroll();

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      const response = await api.get('/api/referral/list');
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
      case 'denied': return '#F44336';
      default: return '#FF9800';
    }
  };

  const renderItem = ({ item, index }: { item: Referral, index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(600)}>
      <GlassCard style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.specialty}>{item.specialty}</Text>
          <View style={[styles.badge, { backgroundColor: getStatusColor(item.status || 'pending') }]}>
            <Text style={styles.badgeText}>{(item.status || 'pending').toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.cardText}>Patient: {maskPhone(item.patientPhone)}</Text>
        <Text style={styles.dateText}>Created {new Date(item.date).toLocaleDateString()}</Text>
      </GlassCard>
    </Animated.View>
  );

  const handleLogout = async () => {
    await storage.clear();
    router.replace('/');
  };

  const stats = [
    { label: 'Total', value: referrals.length, color: '#333' },
    { label: 'Pending', value: referrals.filter(r => (r.status || 'pending') === 'pending').length, color: '#FF9800' },
    { label: 'Approved', value: referrals.filter(r => r.status === 'approved').length, color: '#4CAF50' },
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
                <div key={item.id} className="grid-row fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '14px', fontWeight: 'bold' }}>{item.specialty.toUpperCase()}</div>
                    <div style={{ 
                      fontFamily: "'Space Mono', monospace", 
                      fontSize: '10px', 
                      letterSpacing: '0.1em',
                      padding: '4px 8px',
                      background: getStatusColor(item.status || 'pending'),
                      color: 'white'
                    }}>
                      {(item.status || 'pending').toUpperCase()}
                    </div>
                  </div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '16px', marginBottom: '8px' }}>
                    Patient: {maskPhone(item.patientPhone)}
                  </div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: '#666' }}>
                    Created {new Date(item.date).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
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
            keyExtractor={(item) => item.id || Math.random().toString()}
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
});
