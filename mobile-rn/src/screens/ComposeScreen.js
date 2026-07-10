import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { colors, radius } from "../theme";
import { Field, PrimaryButton, SecondaryButton } from "../components/ui";
import AudioRecorderField from "../components/AudioRecorderField";
import { api, ApiError } from "../api";
import { useAuth } from "../context/AuthContext";

export default function ComposeScreen({ navigation }) {
  const { auth, setAuth } = useAuth();
  const [categories, setCategories] = useState([]);
  const [photo, setPhoto] = useState(null); // { uri, name, type }
  const [audioUri, setAudioUri] = useState(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState({ text: "", error: false });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.categories().then(setCategories).catch(() => {});
  }, []);

  async function pickFromCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setStatus({ text: "Autorisez l'accès à la caméra pour prendre une photo.", error: true });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
    if (!result.canceled) setAssetFromPicker(result.assets[0]);
  }

  async function pickFromLibrary() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setStatus({ text: "Autorisez l'accès à vos photos pour en choisir une.", error: true });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85 });
    if (!result.canceled) setAssetFromPicker(result.assets[0]);
  }

  function setAssetFromPicker(asset) {
    const filename = asset.fileName || asset.uri.split("/").pop() || `photo-${Date.now()}.jpg`;
    const type = asset.mimeType || "image/jpeg";
    setPhoto({ uri: asset.uri, name: filename, type });
  }

  async function handleSubmit() {
    setStatus({ text: "", error: false });

    if (!photo) {
      setStatus({ text: "Ajoutez d'abord une photo du produit.", error: true });
      return;
    }
    if (!name.trim()) {
      setStatus({ text: "Le nom du produit est requis.", error: true });
      return;
    }
    if (!category) {
      setStatus({ text: "Choisissez une catégorie pour votre produit.", error: true });
      return;
    }

    const fd = new FormData();
    fd.append("image", { uri: photo.uri, name: photo.name, type: photo.type });
    if (audioUri) fd.append("audio", { uri: audioUri, name: `voice-${Date.now()}.m4a`, type: "audio/m4a" });
    fd.append("name", name.trim());
    fd.append("category", category);

    setSubmitting(true);
    setStatus({ text: "Génération d'une description façon Twitter à partir de votre photo…", error: false });

    try {
      const data = await api.createProduct(auth.token, fd);
      setStatus({ text: "Publié → " + data.description, error: false });
      setTimeout(() => navigation.goBack(), 900);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setAuth(null);
      setStatus({ text: err.message, error: true });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {photo ? (
        <Pressable onPress={pickFromLibrary}>
          <Image source={{ uri: photo.uri }} style={styles.preview} />
        </Pressable>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Aucune photo sélectionnée</Text>
        </View>
      )}

      <View style={styles.photoRow}>
        <SecondaryButton title="📷 Prendre une photo" onPress={pickFromCamera} style={styles.flex1} />
        <SecondaryButton title="🖼️ Galerie" onPress={pickFromLibrary} style={styles.flex1} />
      </View>

      <Field placeholder="Nom du produit — ex. Veste en jean vintage" maxLength={80} value={name} onChangeText={setName} style={styles.gap} />

      <View style={styles.chips}>
        {categories.map((c) => (
          <Pressable
            key={c.name}
            onPress={() => setCategory(c.name)}
            style={[styles.chip, category === c.name && styles.chipActive]}
          >
            <Text style={[styles.chipText, category === c.name && styles.chipTextActive]}>{c.name}</Text>
          </Pressable>
        ))}
      </View>

      <AudioRecorderField uri={audioUri} onChange={setAudioUri} />

      <Text style={styles.sellingAs}>
        Publication en tant que {auth?.storeName || auth?.maskedPhone} — les acheteurs peuvent vous contacter par chat ou WhatsApp.
      </Text>

      <PrimaryButton title="Publier le produit" onPress={handleSubmit} loading={submitting} style={styles.gap} />
      {!!status.text && <Text style={[styles.status, status.error && styles.statusError]}>{status.text}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  preview: { width: "100%", aspectRatio: 1, borderRadius: radius, marginBottom: 14, backgroundColor: colors.panel },
  placeholder: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: radius,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    backgroundColor: colors.panel
  },
  placeholderText: { color: colors.textDim, fontSize: 12 },
  photoRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  flex1: { flex: 1 },
  gap: { marginBottom: 12 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: { borderWidth: 1, borderColor: colors.hairline, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  chipActive: { borderColor: colors.amber, backgroundColor: "rgba(232,163,61,0.1)" },
  chipText: { color: colors.textDim, fontSize: 12 },
  chipTextActive: { color: colors.amber },
  sellingAs: { color: colors.teal, fontSize: 10.5, marginBottom: 14 },
  status: { color: colors.textDim, fontSize: 12, marginTop: 10, textAlign: "center" },
  statusError: { color: colors.error }
});
