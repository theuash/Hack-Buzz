import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { THEME_COLOR } from '../src/constants/config';
import api from '../src/services/api';
import { storage } from '../src/services/storage';

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

  const renderItem = ({ item }: { item: Referral }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.specialty}>{item.specialty}</Text>
        <View style={[styles.badge, { backgroundColor: getStatusColor(item.status || 'pending') }]}>
          <Text style={styles.badgeText}>{(item.status || 'pending').toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.cardText}>Patient: {maskPhone(item.patientPhone)}</Text>
      <Text style={styles.cardText}>Date: {new Date(item.date).toLocaleDateString()}</Text>
    </View>
  );

  const handleLogout = async () => {
    await storage.clear();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color={THEME_COLOR} />
      ) : (
        <FlatList
          data={referrals}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No referrals created yet.</Text>}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/create-referral')}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F9',
  },
  loader: {
    flex: 1,
  },
  list: {
    padding: 15,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  specialty: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cardText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
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
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  fabIcon: {
    color: '#fff',
    fontSize: 35,
    fontWeight: '300',
  },
  logoutBtn: {
    padding: 10,
    alignSelf: 'flex-end',
    marginRight: 15,
    marginTop: 10,
  },
  logoutText: {
    color: THEME_COLOR,
    fontWeight: 'bold',
  },
});
