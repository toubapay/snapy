import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState
} from "expo-audio";
import { colors, radius } from "../theme";

// uri: string | null — the recorded voice-note file, or null if none yet.
// onChange(uri | null) — called once recording stops, or when the user removes it.
export default function AudioRecorderField({ uri, onChange }) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const player = useAudioPlayer(uri || undefined);
  const playerStatus = useAudioPlayerStatus(player);
  const [error, setError] = useState("");

  async function startRecording() {
    setError("");
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) {
      setError("Autorisez l'accès au micro pour enregistrer une note vocale.");
      return;
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
  }

  async function stopRecording() {
    await recorder.stop();
    if (recorder.uri) onChange(recorder.uri);
  }

  function togglePlayback() {
    if (playerStatus.playing) player.pause();
    else player.play();
  }

  const seconds = Math.floor((recorderState.durationMillis || 0) / 1000);

  return (
    <View style={styles.wrap}>
      {uri ? (
        <View style={styles.previewRow}>
          <Pressable style={styles.playBtn} onPress={togglePlayback}>
            <Text style={styles.playBtnText}>{playerStatus.playing ? "⏸" : "▶"}</Text>
          </Pressable>
          <Text style={styles.previewLabel}>Note vocale enregistrée</Text>
          <Pressable style={styles.removeBtn} onPress={() => onChange(null)}>
            <Text style={styles.removeBtnText}>✕</Text>
          </Pressable>
        </View>
      ) : recorderState.isRecording ? (
        <Pressable style={[styles.recordBtn, styles.recording]} onPress={stopRecording}>
          <View style={styles.recDot} />
          <Text style={[styles.recordBtnText, styles.recordingText]}>Arrêter l'enregistrement · {seconds}s</Text>
        </Pressable>
      ) : (
        <Pressable style={styles.recordBtn} onPress={startRecording}>
          <View style={styles.camDot} />
          <Text style={styles.recordBtnText}>🎤 Ajouter une note vocale (facultatif)</Text>
        </Pressable>
      )}
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  recordBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 42,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    borderRadius: radius
  },
  recording: { borderColor: colors.error },
  recordBtnText: { color: colors.teal, fontSize: 12 },
  recordingText: { color: colors.error },
  camDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.teal },
  recDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.error },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 42,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    borderRadius: radius
  },
  playBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.amber,
    alignItems: "center",
    justifyContent: "center"
  },
  playBtnText: { color: colors.amberOn, fontSize: 11 },
  previewLabel: { flex: 1, color: colors.textDim, fontSize: 12 },
  removeBtn: { width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  removeBtnText: { color: colors.textDim, fontSize: 12 },
  error: { color: colors.error, fontSize: 11, marginTop: 6 }
});
