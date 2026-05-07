import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { fetchReferrals, Referral, ConsentStatus } from "../services/apiService";
import { clearSession } from "../utils/storage";
import { Colors } from "../constants/colors";
import { APP_NAME } from "../constants/config";

// ── Consent Badge ──────────────────────────────────────────────────────────────
function ConsentBadge({ status }: { status: ConsentStatus }) {
  const config: Record<ConsentStatus, { label: string; bg: string; text: string }> = {
    pending: { label: "Pending", bg: Colors.pendingLight, text: Colors.pending },
    approved: { label: "Approved", bg: Colors.approvedLight, text: Colors.approved },
    denied: { label: "Denied", bg: Colors.deniedLight, text: Colors.denied },
  };
  const { label, bg, text } = config[status];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: text }]}>{label}</Text>
    </View>
  );
}

// ── Referral Card ──────────────────────────────────────────────────────────────
function ReferralCard({ item }: { item: Referral }) {
  const date = new Date(item.date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // Mask phone: show last 4 digits only
  const maskedPhone =
    item.patientPhone.length > 4
      ? `••••••${item.patientPhone.slice(-4)}`
      : "••••••••";

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.specialtyPill}>
          <Text style={styles.specialtyText}>{item.specialty}</Text>
        </View>
        <ConsentBadge status={item.consentStatus} />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📱</Text>
          <Text style={styles.infoLabel}>Patient</Text>
          <Text style={styles.infoValue}>{maskedPhone}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📅</Text>
          <Text style={styles.infoLabel}>Date</Text>
          <Text style={styles.infoValue}>{date}</Text>
        </View>
      </View>
    </View>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>No referrals yet</Text>
      <Text style={styles.emptySubtitle}>
        Tap the + button below to create your first referral.
      </Text>
    </View>
  );
}

// ── Main Dashboard Screen ─────────────────────────────────────────────────────
export default function DashboardScreen() {
  const router = useRouter();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReferrals = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await fetchReferrals();
      setReferrals(data);
    } catch {
      Alert.alert(APP_NAME, "Could not load referrals. Pull down to retry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReferrals();
  }, [loadReferrals]);

  async function handleLogout() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await clearSession();
          router.replace("/login");
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      {/* ── Sub-header ─────────────────────────────────────── */}
      <View style={styles.subHeader}>
        <View>
          <Text style={styles.subHeaderTitle}>My Referrals</Text>
          <Text style={styles.subHeaderCount}>
            {referrals.length} record{referrals.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* ── List ───────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading referrals…</Text>
        </View>
      ) : (
        <FlatList
          data={referrals}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ReferralCard item={item} />}
          ListEmptyComponent={<EmptyState />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadReferrals(true)}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        />
      )}

      {/* ── FAB ────────────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/referral-form")}
        activeOpacity={0.85}
        accessibilityLabel="Create new referral"
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { color: Colors.textSecondary, fontSize: 14 },

  // Sub-header
  subHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  subHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  subHeaderCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  logoutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.error,
  },
  logoutText: { fontSize: 13, fontWeight: "600", color: Colors.error },

  // List
  list: { padding: 16, paddingBottom: 100 },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  specialtyPill: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  specialtyText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primaryDark,
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 12, fontWeight: "700" },
  cardBody: { gap: 8 },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoIcon: { fontSize: 14, width: 20 },
  infoLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    width: 56,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
  },

  // Empty
  emptyContainer: {
    alignItems: "center",
    marginTop: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: 28,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  fabIcon: { fontSize: 30, color: Colors.white, lineHeight: 34 },
});
