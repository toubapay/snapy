import { useLayoutEffect } from "react";
import ProductListScreen from "./ProductListScreen";

export default function BoutiqueScreen({ route, navigation }) {
  const { phone, label } = route.params;

  useLayoutEffect(() => {
    navigation.setOptions({ title: `🏪 ${label}` });
  }, [navigation, label]);

  return <ProductListScreen mode="boutique" sellerPhone={phone} emptyText="Cette boutique n'a pas encore publié d'annonce." />;
}
