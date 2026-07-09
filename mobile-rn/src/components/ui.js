import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput } from "react-native";
import { colors, radius } from "../theme";

export function PrimaryButton({ title, onPress, disabled, loading, style }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.primaryBtn,
        (disabled || loading) && styles.primaryBtnDisabled,
        pressed && !disabled && !loading && styles.pressed,
        style
      ]}
    >
      {loading ? <ActivityIndicator color={colors.amberOn} /> : <Text style={styles.primaryBtnText}>{title}</Text>}
    </Pressable>
  );
}

export function SecondaryButton({ title, onPress, style, textStyle }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed, style]}>
      <Text style={[styles.secondaryBtnText, textStyle]}>{title}</Text>
    </Pressable>
  );
}

export function DangerButton({ title, onPress, style }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.dangerBtn, pressed && styles.pressed, style]}>
      <Text style={styles.dangerBtnText}>{title}</Text>
    </Pressable>
  );
}

export function Field(props) {
  return <TextInput placeholderTextColor={colors.textDim} style={[styles.field, props.style]} {...props} />;
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },
  primaryBtn: {
    backgroundColor: colors.amber,
    borderRadius: radius,
    height: 46,
    alignItems: "center",
    justifyContent: "center"
  },
  primaryBtnDisabled: { backgroundColor: colors.hairline },
  primaryBtnText: { color: colors.amberOn, fontWeight: "600", fontSize: 14 },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius,
    height: 42,
    alignItems: "center",
    justifyContent: "center"
  },
  secondaryBtnText: { color: colors.textDim, fontSize: 13 },
  dangerBtn: {
    borderWidth: 1,
    borderColor: "rgba(232,117,106,0.4)",
    borderRadius: radius,
    height: 42,
    alignItems: "center",
    justifyContent: "center"
  },
  dangerBtnText: { color: colors.error, fontSize: 13 },
  field: {
    backgroundColor: colors.ink,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius,
    height: 46,
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 14
  }
});
