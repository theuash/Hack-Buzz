import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { loginGP } from "../services/apiService";
import { saveToken, saveGPProfile } from "../utils/storage";
import { Colors } from "../constants/colors";
import { APP_NAME } from "../constants/config";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Enter a valid email.";
    if (!password) newErrors.password = "Password is required.";
    else if (password.length < 6) newErrors.password = "Minimum 6 characters.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setLoading(true);
    try {
      const { token, gpId, email: gpEmail } = await loginGP(email.trim(), password);
      await saveToken(token);
      await saveGPProfile(gpId, gpEmail);
      router.replace("/dashboard");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? "Login failed. Please check your credentials.";
      Alert.alert(`${APP_NAME}`, msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Hero Header ─────────────────────────────────── */}
        <View style={styles.hero}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoIcon}>✚</Text>
          </View>
          <Text style={styles.appName}>{APP_NAME}</Text>
          <Text style={styles.tagline}>Secure GP Referral Portal</Text>
        </View>

        {/* ── Card ────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>GP Sign In</Text>
          <Text style={styles.cardSubtitle}>
            Access is restricted to registered General Practitioners.
          </Text>

          {/* Email */}
          <Text style={styles.label}>Email Address</Text>
          <View style={[styles.inputWrapper, errors.email ? styles.inputError : null]}>
            <TextInput
              style={styles.input}
              placeholder="doctor@clinic.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
              }}
            />
          </View>
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

          {/* Password */}
          <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
          <View style={[styles.inputWrapper, errors.password ? styles.inputError : null]}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!passwordVisible}
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
              }}
            />
            <TouchableOpacity
              onPress={() => setPasswordVisible((v) => !v)}
              style={styles.eyeBtn}
              accessibilityLabel="Toggle password visibility"
            >
              <Text style={styles.eyeText}>{passwordVisible ? "🙈" : "👁️"}</Text>
            </TouchableOpacity>
          </View>
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.loginBtn, loading ? styles.loginBtnDisabled : null]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.loginBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Footer ──────────────────────────────────────── */}
        <Text style={styles.footer}>
          {APP_NAME} · Confidential Medical Platform
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.primary },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  // Hero
  hero: { alignItems: "center", marginBottom: 32 },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  logoIcon: { fontSize: 32, color: Colors.white },
  appName: {
    fontSize: 36,
    fontWeight: "800",
    color: Colors.white,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
    letterSpacing: 0.5,
  },
  // Card
  card: {
    width: "100%",
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 24,
    lineHeight: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.background,
    paddingHorizontal: 14,
    height: 52,
  },
  inputError: { borderColor: Colors.error },
  input: {
    fontSize: 15,
    color: Colors.textPrimary,
    flex: 1,
  },
  eyeBtn: { padding: 4 },
  eyeText: { fontSize: 18 },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
    marginLeft: 2,
  },
  loginBtn: {
    marginTop: 28,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 54,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  // Footer
  footer: {
    marginTop: 28,
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
  },
});
