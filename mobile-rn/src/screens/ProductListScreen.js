import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { colors } from "../theme";
import { api, ApiError } from "../api";
import { useAuth } from "../context/AuthContext";
import ProductCard from "../components/ProductCard";

export default function ProductListScreen({ mode, sellerPhone, categoryName, emptyText }) {
  const navigation = useNavigation();
  const { auth, setAuth } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (isRefresh = false) => {
      if (mode === "mine" && !auth) {
        setProducts([]);
        setLoading(false);
        return;
      }
      isRefresh ? setRefreshing(true) : setLoading(true);
      try {
        if (mode === "mine") {
          setProducts(await api.myProducts(auth.token));
        } else {
          const params = {};
          if (mode === "top") params.sort = "top";
          if (mode === "boutique" && sellerPhone) params.seller = sellerPhone;
          if (mode === "categoryFiltered" && categoryName) params.category = categoryName;
          setProducts(await api.products(params));
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401 && mode === "mine") setAuth(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [mode, sellerPhone, categoryName, auth, setAuth]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function openBoutique(phone, label) {
    if (!phone) return;
    navigation.navigate("Boutique", { phone, label });
  }

  function openChat(product) {
    navigation.navigate("Chat", { product });
  }

  function openDetail(product) {
    navigation.navigate("ProductDetail", { product });
  }

  function openEdit(product) {
    navigation.navigate("EditProduct", { product, onSaved: load });
  }

  async function handleDelete(id) {
    if (!auth) return;
    try {
      await api.deleteProduct(auth.token, id);
      load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setAuth(null);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.amber} />
      </View>
    );
  }

  return (
    <FlatList
      data={products}
      keyExtractor={(p) => p.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl tintColor={colors.amber} refreshing={refreshing} onRefresh={() => load(true)} />}
      renderItem={({ item }) => (
        <ProductCard
          product={item}
          mine={mode === "mine"}
          onOpenChat={openChat}
          onOpenBoutique={openBoutique}
          onOpenDetail={openDetail}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyText}>{emptyText}</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, flexGrow: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText: { color: colors.textDim, fontSize: 13, textAlign: "center", paddingHorizontal: 24 }
});
