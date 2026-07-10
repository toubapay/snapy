import { Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { colors, radius } from "../theme";
import { api } from "../api";

function VoiceNoteButton({ audioUrl }) {
  const player = useAudioPlayer(audioUrl);
  const status = useAudioPlayerStatus(player);

  return (
    <Pressable style={styles.voiceBtn} onPress={() => (status.playing ? player.pause() : player.play())}>
      <Text style={styles.voiceBtnText}>{status.playing ? "⏸ Note vocale" : "▶ Écouter la note vocale"}</Text>
    </Pressable>
  );
}

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

export default function ProductCard({ product: p, mine, onOpenChat, onOpenBoutique, onEdit, onDelete }) {
  const imageUrl = p.imageUrl.startsWith("http") ? p.imageUrl : `${api.base}${p.imageUrl}`;
  const audioUrl = p.audioUrl ? (p.audioUrl.startsWith("http") ? p.audioUrl : `${api.base}${p.audioUrl}`) : null;

  return (
    <View style={styles.card}>
      <View style={styles.photoWrap}>
        <Image source={{ uri: imageUrl }} style={styles.photo} />
        <View style={styles.vendorTag}>
          <Text style={styles.vendorTagText} numberOfLines={1}>
            {p.vendorId}
          </Text>
        </View>
      </View>

      <View style={styles.stub}>
        <Text style={styles.pname}>{p.name}</Text>
        <Text style={styles.pdesc}>{p.description}</Text>
        {!!audioUrl && <VoiceNoteButton audioUrl={audioUrl} />}

        {!mine && (
          <Pressable onPress={() => onOpenBoutique(p.sellerPhone, p.storeName || p.vendorId)}>
            <Text style={styles.vendorLine} numberOfLines={1}>
              🏪 {p.storeName || p.vendorId}
              {p.storeName ? ` · ${p.ownerLabel || p.vendorId}` : ""}
            </Text>
          </Pressable>
        )}

        <View style={styles.actions}>
          {mine ? (
            <>
              <Pressable style={styles.iconBtn} onPress={() => onEdit(p)}>
                <Text style={styles.iconBtnText}>✏️ Modifier</Text>
              </Pressable>
              <Pressable style={[styles.iconBtn, styles.deleteBtn]} onPress={() => onDelete(p.id)}>
                <Text style={[styles.iconBtnText, { color: colors.error }]}>🗑️ Supprimer</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable style={styles.iconBtn} onPress={() => onOpenChat(p)}>
                <Text style={styles.iconBtnText}>💬 Discuter</Text>
              </Pressable>
              {!!p.contact && (
                <Pressable
                  style={[styles.iconBtn, styles.whatsappBtn]}
                  onPress={() =>
                    Linking.openURL(
                      `https://wa.me/${digitsOnly(p.contact)}?text=${encodeURIComponent(
                        "Bonjour ! Je suis intéressé(e) par " + p.name + " sur Snapy."
                      )}`
                    )
                  }
                >
                  <Text style={[styles.iconBtnText, { color: colors.teal }]}>🟢 WhatsApp</Text>
                </Pressable>
              )}
            </>
          )}
        </View>
        <Text style={styles.ptime}>{timeAgo(p.createdAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panel,
    borderRadius: radius,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.hairline,
    marginBottom: 16
  },
  photoWrap: { aspectRatio: 1, backgroundColor: "#0c0c12" },
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
  stub: { padding: 14, borderTopWidth: 1, borderTopColor: colors.hairline, borderStyle: "dashed" },
  pname: { fontWeight: "700", fontSize: 15, color: colors.paper, marginBottom: 6 },
  pdesc: { fontSize: 12, lineHeight: 18, color: colors.textDim, marginBottom: 10 },
  vendorLine: { fontSize: 10.5, color: colors.teal, marginBottom: 10 },
  voiceBtn: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 10
  },
  voiceBtnText: { fontSize: 10.5, color: colors.teal },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  iconBtn: {
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.panelRaised,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  iconBtnText: { fontSize: 10.5, color: colors.text },
  whatsappBtn: { borderColor: "rgba(95,195,176,0.35)" },
  deleteBtn: { borderColor: "rgba(232,117,106,0.35)" },
  ptime: { fontSize: 10, color: colors.hairline, marginTop: 6 }
});
