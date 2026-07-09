import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { colors, radius } from "../theme";
import { Field, PrimaryButton, SecondaryButton } from "../components/ui";
import { api, ApiError } from "../api";
import { useAuth } from "../context/AuthContext";

export default function EditProductScreen({ route, navigation }) {
  const { product, onSaved } = route.params;
  const { auth, setAuth } = useAuth();

  const [categories, setCategories] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState(product.category || "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const existingImageUrl = product.imageUrl.startsWith("http") ? product.imageUrl : `${api.base}${product.imageUrl}`;

  useEffect(() => {
    api.categories().then(setCategories).catch(() => {});
  }, []);

  async function pickPhoto(fromCamera) {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.85 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85 });
    if (result.canceled) return;
    const asset = result.assets[0];
    setPhoto({ uri: asset.uri, name: asset.fileName || asset.uri.split("/").pop() || `photo-${Date.now()}.jpg`, type: asset.mimeType || "image/jpeg" });
  }

  async function handleSubmit() {
    setError("");
    if (!name.trim()) {
      setError("Le nom du produit est requis.");
      return;
    }
    setSubmitting(true);

    const fd = new FormData();
    fd.append("name", name.trim());
    fd.append("category", category);
    if (photo) fd.append("image", { uri: photo.uri, name: photo.name, type: photo.type });

    try {
      await api.updateProduct(auth.token, product.id, fd);
      onSaved?.();
      navigation.goBack();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setAuth(null);
        navigation.goBack();
        return;
      }
      setError(err instanceof ApiError ? err.message : "Une erreur s'est produite.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable onPress={() => pickPhoto(false)}>
        <Image source={{ uri: photo?.uri || existingImageUrl }} style={styles.preview} />
        <View style={styles.hint}>
          <Text style={styles.hintText}>Cliquez pour remplacer la photo</Text>
        </View>
      </Pressable>

      <View style={styles.photoRow}>
        <SecondaryButton title="📷 Prendre une photo" onPress={() => pickPhoto(true)} style={styles.flex1} />
        <SecondaryButton title="🖼️ Galerie" onPress={() => pickPhoto(false)} style={styles.flex1} />
      </View>

      <Field placeholder="Nom du produit" maxLength={80} value={name} onChangeText={setName} style={styles.gap} />

      <View style={styles.chips}>
        {categories.map((c) => (
          <Pressable key={c.name} onPress={() => setCategory(c.name)} style={[styles.chip, category === c.name && styles.chipActive]}>
            <Text style={[styles.chipText, category === c.name && styles.chipTextActive]}>{c.name}</Text>
          </Pressable>
        ))}
      </View>

      <PrimaryButton title="Enregistrer les modifications" onPress={handleSubmit} loading={submitting} />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  preview: { width: "100%", aspectRatio: 1, borderRadius: radius, backgroundColor: colors.panel },
  hint: {
    position: "absolute",
    bottom: 8,
    alignSelf: "center",
    backgroundColor: "rgba(16,15,22,0.75)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  hintText: { color: colors.text, fontSize: 10 },
  photoRow: { flexDirection: "row", gap: 8, marginTop: 12, marginBottom: 16 },
  flex1: { flex: 1 },
  gap: { marginBottom: 12 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: { borderWidth: 1, borderColor: colors.hairline, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  chipActive: { borderColor: colors.amber, backgroundColor: "rgba(232,163,61,0.1)" },
  chipText: { color: colors.textDim, fontSize: 12 },
  chipTextActive: { color: colors.amber },
  error: { color: colors.error, fontSize: 11.5, marginTop: 10 }
});
