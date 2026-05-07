import React, { useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Share, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { API_BASE_URL, THEME_COLOR } from '../src/constants/config';

export default function QRDisplayScreen() {
  const { docId, specialty } = useLocalSearchParams();
  const router = useRouter();
  const qrRef = useRef<any>();

  const referralUrl = `${API_BASE_URL}/referral/${docId}`;
  const date = new Date().toLocaleDateString();

  const handleShare = async () => {
    try {
      // For simplicity, we share the link. 
      // To share as image, we'd need to convert the SVG to base64, 
      // but simple URL sharing is most reliable in RN without extra heavy libs.
      await Share.share({
        message: `MediRef Referral for ${specialty}. Link: ${referralUrl}`,
        url: referralUrl,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.qrCard}>
        <Text style={styles.summaryTitle}>{specialty} Referral</Text>
        <Text style={styles.summaryDate}>Generated on: {date}</Text>

        <View style={styles.qrContainer}>
          <QRCode
            value={referralUrl}
            size={220}
            color={THEME_COLOR}
            backgroundColor="white"
            getRef={(c) => (qrRef.current = c)}
          />
        </View>

        <Text style={styles.instructionHead}>Patient Instructions:</Text>
        <Text style={styles.instructionBody}>
          Ask the patient to carry this card to their specialist appointment.
          The specialist will scan this QR to securely decrypt the clinical notes.
        </Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Text style={styles.shareBtnText}>Share / Print QR</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/dashboard')}>
          <Text style={styles.homeBtnText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F9',
    padding: 20,
    justifyContent: 'center',
  },
  qrCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  summaryDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
  },
  qrContainer: {
    padding: 15,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    borderRadius: 15,
    marginBottom: 30,
  },
  instructionHead: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  instructionBody: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    textAlign: 'left',
  },
  actionRow: {
    marginTop: 30,
  },
  shareBtn: {
    backgroundColor: THEME_COLOR,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  shareBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  homeBtn: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  homeBtnText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});
