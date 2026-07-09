import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";
import { Field } from "../components/ui";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { getBuyerId } from "../context/AuthContext";

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "à l'instant";
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.floor(h / 24)} j`;
}

export default function ChatScreen({ route, navigation }) {
  const { product } = route.params;
  const { auth } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [mySenderId, setMySenderId] = useState(auth?.phone || null);
  const listRef = useRef(null);

  useLayoutEffect(() => {
    navigation.setOptions({ title: product.name });
  }, [navigation, product.name]);

  useEffect(() => {
    let mounted = true;
    if (!auth) getBuyerId().then((id) => mounted && setMySenderId(id));
    return () => {
      mounted = false;
    };
  }, [auth]);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const data = await api.chat(product.id);
        if (!cancelled) setMessages(data.messages);
      } catch {
        /* silent — polling, no need to surface transient errors */
      }
    }
    poll();
    const timer = setInterval(poll, 2500);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [product.id]);

  const isSeller = mySenderId === product.sellerPhone;

  async function handleSend() {
    const text = input.trim();
    if (!text || !mySenderId) return;
    setInput("");
    try {
      await api.sendChat(product.id, mySenderId, text);
      const data = await api.chat(product.id);
      setMessages(data.messages);
    } catch {
      /* if it fails, the message just won't appear — user can retry */
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <Text style={styles.vendorLabel}>{isSeller ? "Vous discutez en tant que vendeur" : product.vendorId}</Text>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const mine = item.senderId === mySenderId;
          return (
            <View style={[styles.msgRow, mine ? styles.msgRowMine : styles.msgRowTheirs]}>
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={mine ? styles.bubbleTextMine : styles.bubbleText}>{item.text}</Text>
              </View>
              <Text style={styles.meta}>
                {mine ? "Vous" : item.role === "seller" ? "Vendeur" : item.senderId} · {timeAgo(item.createdAt)}
              </Text>
            </View>
          );
        }}
      />
      <View style={styles.inputRow}>
        <Field style={styles.input} placeholder="Écrire un message…" value={input} onChangeText={setInput} onSubmitEditing={handleSend} />
        <Pressable style={styles.sendBtn} onPress={handleSend}>
          <Text style={styles.sendBtnText}>➤</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.ink },
  vendorLabel: { color: colors.teal, fontSize: 11, paddingHorizontal: 16, paddingTop: 10 },
  list: { padding: 16, gap: 12 },
  msgRow: { maxWidth: "80%" },
  msgRowMine: { alignSelf: "flex-end", alignItems: "flex-end" },
  msgRowTheirs: { alignSelf: "flex-start", alignItems: "flex-start" },
  bubble: { borderRadius: 14, paddingHorizontal: 13, paddingVertical: 9 },
  bubbleMine: { backgroundColor: colors.amber, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.hairline, borderBottomLeftRadius: 4 },
  bubbleText: { color: colors.text, fontSize: 13 },
  bubbleTextMine: { color: colors.amberOn, fontSize: 13 },
  meta: { color: colors.textDim, fontSize: 9.5, marginTop: 4, paddingHorizontal: 4 },
  inputRow: { flexDirection: "row", gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: colors.hairline, backgroundColor: colors.panelRaised },
  input: { flex: 1, borderRadius: 20 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.amber, alignItems: "center", justifyContent: "center" },
  sendBtnText: { color: colors.amberOn, fontSize: 15 }
});
