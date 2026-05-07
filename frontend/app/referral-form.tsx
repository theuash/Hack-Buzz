import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { createReferral } from "../services/apiService";
import { encryptClinicalFields } from "../utils/encryption";
import { getGPProfile } from "../utils/storage";
import { Colors } from "../constants/colors";
import { APP_NAME, SPECIALTIES, Specialty } from "../constants/config";

// ── Specialty Picker Modal ────────────────────────────────────────────────────
function SpecialtyPicker({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: Specialty | "";
  onSelect: (s: Specialty) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={styles.modalOverlay} onPress={onClose} activeOpacity={1}>
        <View style={styles.pickerSheet}>
          <View style={styles.pickerHandle} />
          <Text style={styles.pickerTitle}>Select Specialty</Text>
          <FlatList
            data={SPECIALTIES}
            keyExtractor={(s) => s}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.pickerItem,
                  selected === item && styles.pickerItemSelected,
                ]}
                onPress={() => {
                  onSelect(item as Specialty);
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    selected === item && styles.pickerItemTextSelected,
                  ]}
                >
                  {item}
                </Text>
                {selected === item && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            )}
            style={{ maxHeight: 360 }}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Form Field ────────────────────────────────────────────────────────────────
function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  optional,
  error,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  optional?: boolean;
  error?: string;
  keyboardType?: "default" | "phone-pad";
}) {
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {optional && <Text style={styles.optionalTag}>optional</Text>}
      </View>
      <TextInput
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          error ? styles.inputError : null,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? `Enter ${label.toLowerCase()}…`}
        placeholderTextColor={Colors.textMuted}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? "top" : "center"}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize={keyboardType === "phone-pad" ? "none" : "sentences"}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

// ── Main Form Screen ──────────────────────────────────────────────────────────
export default function ReferralFormScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);

  // Form state
  const [patientPhone, setPatientPhone] = useState("");
  const [reason, setReason] = useState("");
  const [history, setHistory] = useState("");
  const [medications, setMedications] = useState("");
  const [allergies, setAllergies] = useState("");
  const [redFlags, setRedFlags] = useState("");
  const [specialty, setSpecialty] = useState<Specialty | "">("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!patientPhone.trim()) e.patientPhone = "Patient phone is required.";
    else if (!/^\+?[\d\s\-]{7,15}$/.test(patientPhone.trim()))
      e.patientPhone = "Enter a valid phone number.";
    if (!reason.trim()) e.reason = "Reason for referral is required.";
    if (!history.trim()) e.history = "Medical history is required.";
    if (!medications.trim()) e.medications = "Current medications are required.";
    if (!redFlags.trim()) e.redFlags = "Red flags / urgency notes are required.";
    if (!specialty) e.specialty = "Please select a specialty.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      const profile = await getGPProfile();
      if (!profile) {
        Alert.alert(APP_NAME, "Session expired. Please log in again.");
        router.replace("/login");
        return;
      }
      const { gpId } = profile;

      // Only clinical fields are encrypted — patientPhone is excluded
      const clinicalFields = {
        reason,
        history,
        medications,
        allergies,
        redFlags,
      };

      const encryptedPayload = encryptClinicalFields(clinicalFields, gpId);

      const response = await createReferral({
        encryptedPayload,
        patientPhone: patientPhone.trim(),
        specialty: specialty as Specialty,
        gpId,
      });

      router.push({
        pathname: "/qr-display",
        params: {
          docId: response.docId,
          specialty: specialty as string,
          createdAt: response.createdAt,
        },
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Submission failed. Please try again.";
      Alert.alert(APP_NAME, msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SpecialtyPicker
        visible={pickerVisible}
        selected={specialty}
        onSelect={(s) => {
          setSpecialty(s);
          setErrors((e) => ({ ...e, specialty: "" }));
        }}
        onClose={() => setPickerVisible(false)}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Privacy Notice ─────────────────────────── */}
        <View style={styles.noticeBanner}>
          <Text style={styles.noticeIcon}>🔒</Text>
          <Text style={styles.noticeText}>
            Clinical data is AES-encrypted before transmission. The specialist
            cannot read raw notes.
          </Text>
        </View>

        {/* ── Patient Info Section ───────────────────── */}
        <Text style={styles.sectionTitle}>Patient Information</Text>
        <FormField
          label="Patient Phone Number"
          value={patientPhone}
          onChangeText={(t) => {
            setPatientPhone(t);
            if (errors.patientPhone) setErrors((e) => ({ ...e, patientPhone: "" }));
          }}
          placeholder="+91 98765 43210"
          keyboardType="phone-pad"
          error={errors.patientPhone}
        />
        <View style={styles.phoneNote}>
          <Text style={styles.phoneNoteText}>
            📲 Used for WhatsApp consent only. Not shared with the specialist.
          </Text>
        </View>

        {/* ── Specialty ──────────────────────────────── */}
        <Text style={styles.sectionTitle}>Referral Details</Text>
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Target Specialty</Text>
          <TouchableOpacity
            style={[
              styles.input,
              styles.dropdownBtn,
              errors.specialty ? styles.inputError : null,
            ]}
            onPress={() => setPickerVisible(true)}
          >
            <Text
              style={[
                styles.dropdownText,
                !specialty && { color: Colors.textMuted },
              ]}
            >
              {specialty || "Select specialty…"}
            </Text>
            <Text style={styles.dropdownArrow}>▾</Text>
          </TouchableOpacity>
          {errors.specialty ? (
            <Text style={styles.errorText}>{errors.specialty}</Text>
          ) : null}
        </View>

        <FormField
          label="Reason for Referral"
          value={reason}
          onChangeText={(t) => {
            setReason(t);
            if (errors.reason) setErrors((e) => ({ ...e, reason: "" }));
          }}
          multiline
          error={errors.reason}
        />

        {/* ── Clinical Section ───────────────────────── */}
        <Text style={styles.sectionTitle}>Clinical Information (Encrypted)</Text>
        <FormField
          label="Relevant Medical History"
          value={history}
          onChangeText={(t) => {
            setHistory(t);
            if (errors.history) setErrors((e) => ({ ...e, history: "" }));
          }}
          multiline
          error={errors.history}
        />
        <FormField
          label="Current Medications"
          value={medications}
          onChangeText={(t) => {
            setMedications(t);
            if (errors.medications) setErrors((e) => ({ ...e, medications: "" }));
          }}
          multiline
          placeholder="e.g. Metformin 500mg, Atorvastatin 10mg"
          error={errors.medications}
        />
        <FormField
          label="Allergies"
          value={allergies}
          onChangeText={setAllergies}
          multiline
          optional
          placeholder="e.g. Penicillin, sulfa drugs"
        />
        <FormField
          label="Red Flags / Urgency Notes"
          value={redFlags}
          onChangeText={(t) => {
            setRedFlags(t);
            if (errors.redFlags) setErrors((e) => ({ ...e, redFlags: "" }));
          }}
          multiline
          placeholder="e.g. Chest pain worsening at rest — urgent"
          error={errors.redFlags}
        />

        {/* ── Submit ─────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Text style={styles.submitBtnText}>Generate Referral & QR</Text>
              <Text style={styles.submitBtnSub}>Encrypted & submitted securely</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: 20, paddingBottom: 40 },

  // Notice
  noticeBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  noticeIcon: { fontSize: 16 },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: Colors.primaryDark,
    lineHeight: 18,
  },

  // Sections
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
    marginTop: 8,
  },
  phoneNote: {
    backgroundColor: Colors.warningLight,
    borderRadius: 8,
    padding: 10,
    marginTop: -4,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
  },
  phoneNoteText: { fontSize: 12, color: Colors.warning, lineHeight: 17 },

  // Fields
  fieldContainer: { marginBottom: 16 },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  label: { fontSize: 13, fontWeight: "600", color: Colors.textPrimary },
  optionalTag: {
    fontSize: 11,
    color: Colors.textMuted,
    backgroundColor: Colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  inputMultiline: { minHeight: 90, paddingTop: 12 },
  inputError: { borderColor: Colors.error },
  errorText: { fontSize: 12, color: Colors.error, marginTop: 4, marginLeft: 2 },

  // Dropdown
  dropdownBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownText: { fontSize: 15, color: Colors.textPrimary },
  dropdownArrow: { fontSize: 16, color: Colors.textSecondary },

  // Submit
  submitBtn: {
    marginTop: 24,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: Colors.white, fontSize: 16, fontWeight: "700" },
  submitBtnSub: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 3 },

  // Picker modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  pickerSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  pickerHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginBottom: 16,
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  pickerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerItemSelected: { backgroundColor: Colors.primaryLight, borderRadius: 8, paddingHorizontal: 10 },
  pickerItemText: { fontSize: 15, color: Colors.textPrimary },
  pickerItemTextSelected: { color: Colors.primary, fontWeight: "700" },
  checkmark: { color: Colors.primary, fontSize: 16, fontWeight: "700" },
});
