import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  ScrollView,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import { useRef } from "react";
import { Colors } from "../constants/colors";
import { APP_NAME, API_BASE_URL } from "../constants/config";

export default function QRDisplayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    docId: string;
    specialty: string;
    createdAt: string;
  }>();

  const { docId, specialty, createdAt } = params;
  const qrRef = useRef<{ toDataURL: (cb: (data: string) => void) => void }>(null);

  const qrValue = `${API_BASE_URL}/referral/${docId}`;

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-IN", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

  async function handleShare() {
    try {
      if (qrRef.current) {
        qrRef.current.toDataURL((dataURL: string) => {
          Share.share({
            title: `${APP_NAME} Referral QR — ${specialty}`,
            message: `${APP_NAME} Referral\nSpecialty: ${specialty}\nDate: ${formattedDate}\n\nScan this QR at your specialist appointment:\n${qrValue}`,
            url: `data:image/png;base64,${dataURL}`,
          }).catch(() => {
            // Fallback: share URL only
            Share.share({
              title: `${APP_NAME} Referral — ${specialty}`,
              message: `${APP_NAME} Referral Link:\n${qrValue}`,
            });
          });
        });
      } else {
        await Share.share({
          title: `${APP_NAME} Referral — ${specialty}`,
          message: `${APP_NAME} Referral Link:\n${qrValue}`,
        });
      }
    } catch {
      Alert.alert(APP_NAME, "Unable to share at this time. Please try again.");
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      {/* ── Success Header ────────────────────────────────── */}
      <View style={styles.successBanner}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.successTitle}>Referral Created!</Text>
        <Text style={styles.successSub}>
          Share the QR code below with your patient.
        </Text>
      </View>

      {/* ── QR Card ──────────────────────────────────────── */}
      <View style={styles.qrCard}>
        {/* Header strip */}
        <View style={styles.qrCardHeader}>
          <Text style={styles.qrCardAppName}>{APP_NAME}</Text>
          <Text style={styles.qrCardSub}>Medical Referral</Text>
        </View>

        {/* QR Code */}
        <View style={styles.qrWrapper}>
          <QRCode
            value={qrValue}
            size={220}
            color={Colors.textPrimary}
            backgroundColor={Colors.white}
            getRef={(ref) => {
              // @ts-ignore
              qrRef.current = ref;
            }}
          />
        </View>

        {/* Summary — specialty + date only, no clinical data */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Specialty</Text>
            <View style={styles.specialtyPill}>
              <Text style={styles.specialtyText}>{specialty}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Issued</Text>
            <Text style={styles.summaryValue}>{formattedDate}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Ref ID</Text>
            <Text style={styles.summaryValueMono} numberOfLines={1}>
              {docId ?? "—"}
            </Text>
          </View>
        </View>

        {/* Footer watermark */}
        <Text style={styles.qrCardFooter}>
          Secured & issued by {APP_NAME} · Not a prescription
        </Text>
      </View>

      {/* ── Instruction Banner ────────────────────────────── */}
      <View style={styles.instructionBanner}>
        <Text style={styles.instructionIcon}>🏥</Text>
        <Text style={styles.instructionText}>
          Ask patient to carry this card to their specialist appointment
        </Text>
      </View>

      {/* ── Actions ──────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.shareBtn}
        onPress={handleShare}
        activeOpacity={0.85}
      >
        <Text style={styles.shareBtnIcon}>📤</Text>
        <Text style={styles.shareBtnText}>Share / Print Referral</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.dashboardBtn}
        onPress={() => router.replace("/dashboard")}
        activeOpacity={0.85}
      >
        <Text style={styles.dashboardBtnText}>Back to Dashboard</Text>
      </TouchableOpacity>

      <Text style={styles.privacyNote}>
        🔒 No clinical data is displayed here. Only specialty and date are visible
        for privacy.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: {
    padding: 20,
    paddingBottom: 48,
    alignItems: "center",
  },

  // Success
  successBanner: {
    alignItems: "center",
    marginBottom: 24,
    paddingTop: 8,
  },
  successIcon: { fontSize: 44, marginBottom: 8 },
  successTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  successSub: { fontSize: 14, color: Colors.textSecondary },

  // QR Card
  qrCard: {
    width: "100%",
    backgroundColor: Colors.white,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 20,
  },
  qrCardHeader: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    alignItems: "center",
  },
  qrCardAppName: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.white,
    letterSpacing: 1,
  },
  qrCardSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
    letterSpacing: 0.5,
  },
  qrWrapper: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 20,
    backgroundColor: Colors.white,
  },
  summaryBox: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500",
    width: 70,
  },
  summaryValue: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  summaryValueMono: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
    fontVariant: ["tabular-nums"],
  },
  specialtyPill: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  specialtyText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primaryDark,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 2,
  },
  qrCardFooter: {
    textAlign: "center",
    fontSize: 11,
    color: Colors.textMuted,
    paddingBottom: 14,
    paddingTop: 4,
  },

  // Instruction
  instructionBanner: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    gap: 10,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  instructionIcon: { fontSize: 20 },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: Colors.primaryDark,
    fontWeight: "600",
    lineHeight: 20,
  },

  // Share Button
  shareBtn: {
    width: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  shareBtnIcon: { fontSize: 20 },
  shareBtnText: { color: Colors.white, fontSize: 16, fontWeight: "700" },

  // Dashboard button
  dashboardBtn: {
    width: "100%",
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 20,
  },
  dashboardBtnText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: "700",
  },

  // Privacy note
  privacyNote: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 17,
    paddingHorizontal: 12,
  },
});
