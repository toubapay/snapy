import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";
import { Field, PrimaryButton, SecondaryButton, DangerButton } from "../components/ui";
import { api, ApiError } from "../api";
import { useAuth } from "../context/AuthContext";

export default function AccountScreen({ navigation }) {
  const { auth, setAuth, patchAuth } = useAuth();

  const [storeName, setStoreName] = useState(auth?.storeName || "");
  const [profileMsg, setProfileMsg] = useState({ text: "", error: false });
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [pinMsg, setPinMsg] = useState({ text: "", error: false });
  const [pinSubmitting, setPinSubmitting] = useState(false);

  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!auth) return;
    api
      .me(auth.token)
      .then((data) => {
        setStoreName(data.storeName || "");
        patchAuth({ storeName: data.storeName || "" });
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          setAuth(null);
          navigation.goBack();
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!auth) return null;

  async function handleProfileSubmit() {
    setProfileMsg({ text: "", error: false });
    setProfileSubmitting(true);
    try {
      const data = await api.updateProfile(auth.token, { storeName: storeName.trim() });
      patchAuth({ storeName: data.storeName || "" });
      setProfileMsg({ text: "Profil mis à jour.", error: false });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setAuth(null);
        navigation.goBack();
        return;
      }
      setProfileMsg({ text: err.message, error: true });
    } finally {
      setProfileSubmitting(false);
    }
  }

  async function handlePinSubmit() {
    setPinMsg({ text: "", error: false });
    setPinSubmitting(true);
    try {
      await api.updateProfile(auth.token, { currentPin: currentPin.trim(), newPin: newPin.trim() });
      setCurrentPin("");
      setNewPin("");
      setPinMsg({ text: "Code PIN mis à jour.", error: false });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setAuth(null);
        navigation.goBack();
        return;
      }
      setPinMsg({ text: err.message, error: true });
    } finally {
      setPinSubmitting(false);
    }
  }

  function handleLogout() {
    if (auth) api.logout(auth.token).catch(() => {});
    setAuth(null);
    navigation.goBack();
  }

  function confirmDelete() {
    Alert.alert(
      "Supprimer le compte",
      "Supprimer définitivement votre compte et toutes vos annonces ? Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: handleDelete }
      ]
    );
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.deleteAccount(auth.token);
      setAuth(null);
      navigation.goBack();
    } catch (err) {
      Alert.alert("Erreur", err instanceof ApiError ? err.message : "Une erreur s'est produite.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.phone}>Numéro : {auth.maskedPhone}</Text>

      <Text style={styles.label}>Nom de la boutique</Text>
      <Field placeholder="ex. Boutique Fatou" maxLength={40} value={storeName} onChangeText={setStoreName} style={styles.gap} />
      <PrimaryButton title="Enregistrer le profil" onPress={handleProfileSubmit} loading={profileSubmitting} />
      {!!profileMsg.text && <Text style={[styles.msg, profileMsg.error && styles.msgError]}>{profileMsg.text}</Text>}

      <View style={styles.divider} />

      <Text style={styles.label}>Changer le code PIN</Text>
      <Field placeholder="Code PIN actuel" secureTextEntry keyboardType="number-pad" maxLength={6} value={currentPin} onChangeText={setCurrentPin} style={styles.gap} />
      <Field
        placeholder="Nouveau code PIN (4 à 6 chiffres)"
        secureTextEntry
        keyboardType="number-pad"
        maxLength={6}
        value={newPin}
        onChangeText={setNewPin}
        style={styles.gap}
      />
      <PrimaryButton title="Changer le code PIN" onPress={handlePinSubmit} loading={pinSubmitting} />
      {!!pinMsg.text && <Text style={[styles.msg, pinMsg.error && styles.msgError]}>{pinMsg.text}</Text>}

      <View style={styles.divider} />

      <View style={styles.dangerRow}>
        <SecondaryButton title="Se déconnecter" onPress={handleLogout} style={styles.flex1} />
        <DangerButton title={deleting ? "Suppression…" : "Supprimer mon compte"} onPress={confirmDelete} style={styles.flex1} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 22 },
  phone: { color: colors.textDim, fontSize: 11.5, marginBottom: 18 },
  label: { color: colors.teal, fontSize: 10.5, marginBottom: 6 },
  gap: { marginBottom: 10 },
  msg: { color: colors.textDim, fontSize: 11, marginTop: 6 },
  msgError: { color: colors.error },
  divider: { height: 1, backgroundColor: colors.hairline, marginVertical: 20 },
  dangerRow: { flexDirection: "row", gap: 8 },
  flex1: { flex: 1 }
});
