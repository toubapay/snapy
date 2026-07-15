import { useLayoutEffect } from "react";
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { colors, radius } from "../theme";
import { api } from "../api";

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "à l'instant";
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.floor(h / 24)} j`;
}

function digitsOnly(str = "") {
  return str.replace(/[^\d]/g, "");
}

function VoiceNotePlayer({ audioUrl }) {
  const player = useAudioPlayer(audioUrl);
  const status = useAudioPlayerStatus(player);

  return (
    <Pressable style={styles.voiceBtn} onPress={() => (status.playing ? player.pause() : player.play())}>
      <Text style={styles.voiceBtnText}>{status.playing ? "⏸ Note vocale" : "▶ Écouter la note vocale"}</Text>
    </Pressable>
  );
}

export default function ProductDetailScreen({ route, navigation }) {
  const { product: p } = route.params;

  useLayoutEffect(() => {
    navigation.setOptions({ title: p.name });
  }, [navigation, p.name]);

  const imageUrl = p.imageUrl.startsWith("http") ? p.imageUrl : `${api.base}${p.imageUrl}`;
  const audioUrl = p.audioUrl ? (p.audioUrl.startsWith("http") ? p.audioUrl : `${api.base}${p.audioUrl}`) : null;
  const phoneDigits = digitsOnly(p.contact);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.photoWrap}>
        <Image source={{ uri: imageUrl }} style={styles.photo} />
        <View style={styles.vendorTag}>
          <Text style={styles.vendorTagText} numberOfLines={1}>
            {p.vendorId}
          </Text>
        </View>
      </View>

      <Text style={styles.pdesc}>{p.description}</Text>
      {!!audioUrl && <VoiceNotePlayer audioUrl={audioUrl} />}

      <Pressable onPress={() => navigation.navigate("Boutique", { phone: p.sellerPhone, label: p.storeName || p.vendorId })}>
        <Text style={styles.vendorLine} numberOfLines={1}>
          🏪 {p.storeName || p.vendorId}
          {p.storeName ? ` · ${p.ownerLabel || p.vendorId}` : ""}
        </Text>
      </Pressable>

      <View style={styles.actions}>
        <Pressable style={styles.iconBtn} onPress={() => navigation.navigate("Chat", { product: p })}>
          <Text style={styles.iconBtnText}>💬 Discuter en direct</Text>
        </Pressable>
        {!!phoneDigits && (
          <Pressable style={[styles.iconBtn, styles.phoneBtn]} onPress={() => Linking.openURL(`tel:+${phoneDigits}`)}>
            <Text style={[styles.iconBtnText, { color: colors.amber }]}>📞 Appeler</Text>
          </Pressable>
        )}
        {!!phoneDigits && (
          <Pressable
            style={[styles.iconBtn, styles.whatsappBtn]}
            onPress={() =>
              Linking.openURL(
                `https://wa.me/${phoneDigits}?text=${encodeURIComponent(
                  "Bonjour ! Je suis intéressé(e) par " + p.name + " sur Snapy."
                )}`
              )
            }
          >
            <Text style={[styles.iconBtnText, { color: colors.teal }]}>🟢 WhatsApp</Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.ptime}>{timeAgo(p.createdAt)}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  photoWrap: {
    position: "relative",
    aspectRatio: 1,
    borderRadius: radius,
    overflow: "hidden",
    backgroundColor: "#0c0c12",
    marginBottom: 14
  },
  photo: { width: "100%", height: "100%" },
  vendorTag: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(16,15,22,0.75)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: "80%"
  },
  vendorTagText: { color: colors.teal, fontSize: 10 },
  pdesc: { fontSize: 14, lineHeight: 21, color: colors.textDim, marginBottom: 12 },
  voiceBtn: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 14
  },
  voiceBtnText: { fontSize: 11, color: colors.teal },
  vendorLine: { fontSize: 12, color: colors.teal, marginBottom: 16 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  iconBtn: {
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.panelRaised,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  iconBtnText: { fontSize: 11.5, color: colors.text },
  phoneBtn: { borderColor: "rgba(232,163,61,0.35)" },
  whatsappBtn: { borderColor: "rgba(95,195,176,0.35)" },
  ptime: { fontSize: 10, color: colors.hairline }
});
