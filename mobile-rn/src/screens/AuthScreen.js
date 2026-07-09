import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";
import { Field, PrimaryButton } from "../components/ui";
import { api, ApiError } from "../api";
import { useAuth } from "../context/AuthContext";

export default function AuthScreen({ route, navigation }) {
  const { setAuth } = useAuth();
  const [mode, setMode] = useState(route.params?.mode || "login");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [storeName, setStoreName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError("");
    setSubmitting(true);
    try {
      const data = mode === "login" ? await api.login(phone.trim(), pin.trim()) : await api.register(phone.trim(), pin.trim(), storeName.trim());
      setAuth({ token: data.token, phone: data.phone, maskedPhone: data.maskedPhone, storeName: data.storeName || "" });
      navigation.goBack();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur s'est produite.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.tabs}>
          <Pressable style={[styles.tab, mode === "login" && styles.tabActive]} onPress={() => setMode("login")}>
            <Text style={[styles.tabText, mode === "login" && styles.tabTextActive]}>Connexion</Text>
          </Pressable>
          <Pressable style={[styles.tab, mode === "register" && styles.tabActive]} onPress={() => setMode("register")}>
            <Text style={[styles.tabText, mode === "register" && styles.tabTextActive]}>Inscription</Text>
          </Pressable>
        </View>

        <Text style={styles.sub}>
          {mode === "login"
            ? "Connectez-vous avec votre numéro de téléphone vendeur et votre code PIN."
            : "Inscrivez-vous avec un numéro de téléphone et un code PIN de 4 à 6 chiffres — aucun e-mail requis."}
        </Text>

        <Field placeholder="Numéro de téléphone — ex. +221771234567" keyboardType="phone-pad" value={phone} onChangeText={setPhone} style={styles.gap} />
        <Field
          placeholder="Code PIN (4 à 6 chiffres)"
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
          value={pin}
          onChangeText={setPin}
          style={styles.gap}
        />
        {mode === "register" && (
          <Field placeholder="Nom de la boutique (facultatif)" maxLength={40} value={storeName} onChangeText={setStoreName} style={styles.gap} />
        )}

        <PrimaryButton
          title={mode === "login" ? "Se connecter" : "Créer un compte"}
          onPress={handleSubmit}
          loading={submitting}
          style={styles.gap}
        />
        {!!error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.panel },
  container: { padding: 22 },
  tabs: { flexDirection: "row", gap: 6, marginBottom: 14 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.hairline, alignItems: "center" },
  tabActive: { borderColor: colors.amber, backgroundColor: "rgba(232,163,61,0.08)" },
  tabText: { color: colors.textDim, fontSize: 12 },
  tabTextActive: { color: colors.amber },
  sub: { color: colors.textDim, fontSize: 12, lineHeight: 18, marginBottom: 16 },
  gap: { marginBottom: 10 },
  error: { color: colors.error, fontSize: 11.5, marginTop: 8 }
});
