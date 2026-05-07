import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Share, SafeAreaView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import Animated, { FadeIn, ZoomIn, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { THEME_COLOR, APP_NAME, API_BASE_URL } from '../src/constants/config';
import { GlassCard } from '../src/components/GlassCard';
import { AnimatedBackground } from '../src/components/AnimatedBackground';
import { ParallaxWrapper } from '../src/components/ParallaxWrapper';
import { GlobalWebStyles, RandomFadeText, HandDrawnCircle, useRevealOnScroll } from '../src/components/SharedUI';

const PrintStyles = () => (
  <style>{`
    @media print {
      body { background: white !important; }
      .app-container { display: none !important; }
      .printable-ticket { 
        display: flex !important; 
        flex-direction: column; 
        align-items: center; 
        justify-content: center;
        padding: 60px;
        width: 100%;
        height: 100vh;
        visibility: visible !important;
      }
      .printable-ticket * { visibility: visible !important; }
    }
    .printable-ticket { display: none; }
  `}</style>
);

export default function QRDisplayScreen() {
  const { docId, specialty, unlockKey } = useLocalSearchParams();
  const router = useRouter();
  useRevealOnScroll();

  // Specialist View URL - Zero Knowledge implementation (key in fragment)
  const specialistUrl = `${API_BASE_URL}/referral/${docId}#${unlockKey}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `MediRef Secure Referral for ${specialty}: ${specialistUrl}`,
        url: specialistUrl,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withRepeat(
          withSequence(
            withTiming(1.02, { duration: 1500 }),
            withTiming(1, { duration: 1500 })
          ),
          -1,
          true
        ),
      },
    ],
  }));

  if (Platform.OS === 'web') {
    return (
      <div className="app-container">
        <Stack.Screen options={{ headerShown: false }} />
        <GlobalWebStyles />
        <PrintStyles />
        
        <div className="printable-ticket">
          <div style={{ fontSize: '32px', fontWeight: 'bold', fontFamily: "'Playfair Display', serif", marginBottom: '8px', color: 'black' }}>MEDIREF</div>
          <div style={{ fontSize: '10px', fontFamily: "'Space Mono', monospace", letterSpacing: '0.2em', marginBottom: '40px', color: '#666' }}>SECURE CLINICAL TRANSFER PASS</div>
          
          <div style={{ padding: '30px', border: '1px solid black', marginBottom: '40px' }}>
            <QRCode
              value={specialistUrl}
              size={350}
              color="black"
              backgroundColor="white"
            />
          </div>
          
          <div style={{ textAlign: 'center', color: 'black' }}>
            <div style={{ fontSize: '12px', fontFamily: "'Space Mono', monospace", letterSpacing: '0.1em', marginBottom: '8px' }}>TARGET SPECIALTY</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', textTransform: 'uppercase' }}>{specialty}</div>
            <div style={{ fontSize: '10px', marginTop: '30px', maxWidth: '300px', lineHeight: '1.5', opacity: 0.8 }}>
              This QR code contains a Zero-Knowledge decryption key. Scan with any smartphone camera to view encrypted clinical records locally.
            </div>
          </div>
        </div>
        
        <header className="global-header fade-in">
          <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 'bold', letterSpacing: '0.2em', cursor: 'pointer' }} onClick={() => router.replace('/dashboard')}>
            ✕ CLOSE
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", letterSpacing: '0.1em' }}>SECURE TRANSFER</div>
        </header>

        <div className="grid-layout reveal-on-scroll">
          <div className="grid-col reveal-block" style={{ transitionDelay: '0s', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h1 className="font-serif" style={{ fontSize: '64px', margin: '0 0 20px', lineHeight: '1.1' }}>
              <RandomFadeText text="Scan to" baseDelay={0} />
              <br />
              <HandDrawnCircle delay={1.5}>
                <RandomFadeText text="Decrypt" baseDelay={0.5} />
              </HandDrawnCircle>
            </h1>
            <p className="font-sans" style={{ color: '#666', fontSize: '16px', lineHeight: '1.6', marginBottom: '40px' }}>
              The QR code contains the secure URL and the exact decryption key embedded in the URL fragment. 
              The specialist scans this directly. The key never touches the server.
            </p>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'var(--primary)', letterSpacing: '0.2em', marginBottom: '8px' }}>SPECIALTY</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{specialty}</div>
            </div>

            <div style={{ marginBottom: '40px' }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px', color: 'var(--primary)', letterSpacing: '0.2em', marginBottom: '8px' }}>BLOB ID</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '14px', color: '#666' }}>{docId}</div>
            </div>

            <button 
              className="editorial-btn outline" 
              onClick={() => window.print()} 
              style={{ marginBottom: '16px' }}
            >
              PRINT SECURE PASS
            </button>
            <button 
              className="editorial-btn outline" 
              onClick={handleShare} 
              style={{ marginBottom: '16px' }}
            >
              COPY SECURE LINK
            </button>
            <button 
              className="editorial-btn" 
              onClick={() => router.replace('/dashboard')} 
            >
              RETURN TO DASHBOARD
            </button>
          </div>

          <div className="grid-col reveal-block" style={{ transitionDelay: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: 'none' }}>
            <div style={{ padding: '40px', background: 'white', border: '1px solid var(--border)', boxShadow: '8px 8px 0px rgba(61, 112, 104, 0.1)' }}>
              <QRCode
                value={specialistUrl}
                size={300}
                color="var(--fg)"
                backgroundColor="transparent"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/dashboard')} style={styles.backBtn}>
            <Text style={styles.backText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Secure QR</Text>
        </View>

        <View style={styles.content}>
          <ParallaxWrapper>
            <Animated.View entering={ZoomIn.duration(800)} style={pulseStyle}>
              <GlassCard style={styles.qrCard}>
                <View style={styles.qrWrapper}>
                  <QRCode
                    value={specialistUrl}
                    size={240}
                    color={THEME_COLOR}
                    backgroundColor="transparent"
                  />
                </View>
                <Text style={styles.qrHint}>Specialist scans this to view</Text>
              </GlassCard>
            </Animated.View>
          </ParallaxWrapper>

          <Animated.View entering={FadeIn.delay(600)} style={styles.infoSection}>
            <Text style={styles.specialtyLabel}>{specialty} Referral</Text>
            <Text style={styles.docIdLabel}>ID: {docId}</Text>
            
            <View style={styles.statusBox}>
              <View style={styles.pulseDot} />
              <Text style={styles.statusText}>Waiting for specialist scan...</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(800)} style={styles.actions}>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <Text style={styles.shareBtnText}>Share Secure Link</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.doneBtn} onPress={() => router.replace('/dashboard')}>
              <Text style={styles.doneBtnText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
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
    fontSize: 20,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  qrCard: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  qrWrapper: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 15,
  },
  qrHint: {
    marginTop: 20,
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  infoSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  specialtyLabel: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  docIdLabel: {
    fontSize: 12,
    color: '#AAA',
    marginTop: 5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 155, 142, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 20,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME_COLOR,
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    color: THEME_COLOR,
    fontWeight: '700',
  },
  actions: {
    width: '100%',
    marginTop: 50,
  },
  shareBtn: {
    backgroundColor: THEME_COLOR,
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  shareBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  doneBtn: {
    padding: 15,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '600',
  },
});
