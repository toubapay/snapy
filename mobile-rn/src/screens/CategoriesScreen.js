import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { colors } from "../theme";
import { api } from "../api";
import CategoryTile from "../components/CategoryTile";

export default function CategoriesScreen() {
  const navigation = useNavigation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      setCategories(await api.categories());
    } catch {
      /* leave the previous cache if the refresh fails */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.amber} />
      </View>
    );
  }

  return (
    <FlatList
      data={categories}
      keyExtractor={(c) => c.name}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl tintColor={colors.amber} refreshing={refreshing} onRefresh={() => load(true)} />}
      renderItem={({ item }) => <CategoryTile category={item} onPress={(name) => navigation.navigate("CategoryFeed", { name })} />}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  row: { justifyContent: "space-between" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" }
});
