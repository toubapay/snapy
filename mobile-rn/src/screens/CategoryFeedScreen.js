import { useLayoutEffect } from "react";
import ProductListScreen from "./ProductListScreen";

export default function CategoryFeedScreen({ route, navigation }) {
  const { name } = route.params;

  useLayoutEffect(() => {
    navigation.setOptions({ title: `Catégorie : ${name}` });
  }, [navigation, name]);

  return <ProductListScreen mode="categoryFiltered" categoryName={name} emptyText="Aucune annonce dans cette catégorie pour l'instant." />;
}
