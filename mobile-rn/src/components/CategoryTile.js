import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radius } from "../theme";

export default function CategoryTile({ category, onPress }) {
  return (
    <Pressable style={styles.tile} onPress={() => onPress(category.name)}>
      <Text style={styles.name}>{category.name}</Text>
      <Text style={styles.count}>
        {category.count} annonce{category.count === 1 ? "" : "s"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexBasis: "48%",
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius,
    padding: 16,
    marginBottom: 12
  },
  name: { color: colors.paper, fontWeight: "700", fontSize: 15, marginBottom: 4 },
  count: { color: colors.textDim, fontSize: 11 }
});
