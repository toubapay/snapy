import { StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";
import { PrimaryButton } from "../components/ui";
import ProductListScreen from "./ProductListScreen";

export default function MesAnnoncesScreen({ navigation }) {
  const { auth } = useAuth();

  if (!auth) {
    return (
      <View style={styles.locked}>
        <Text style={styles.text}>Connectez-vous avec votre compte vendeur pour voir vos annonces.</Text>
        <PrimaryButton title="Se connecter / S'inscrire" onPress={() => navigation.navigate("Auth", { mode: "login" })} />
      </View>
    );
  }

  return <ProductListScreen mode="mine" emptyText="Vous n'avez encore publié aucune annonce." />;
}

const styles = StyleSheet.create({
  locked: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 },
  text: { color: colors.textDim, fontSize: 13, textAlign: "center" }
});
