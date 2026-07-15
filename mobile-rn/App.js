import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { colors } from "./src/theme";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import AnnoncesScreen from "./src/screens/AnnoncesScreen";
import TopScreen from "./src/screens/TopScreen";
import CategoriesScreen from "./src/screens/CategoriesScreen";
import MesAnnoncesScreen from "./src/screens/MesAnnoncesScreen";
import BoutiqueScreen from "./src/screens/BoutiqueScreen";
import CategoryFeedScreen from "./src/screens/CategoryFeedScreen";
import ProductDetailScreen from "./src/screens/ProductDetailScreen";
import ComposeScreen from "./src/screens/ComposeScreen";
import EditProductScreen from "./src/screens/EditProductScreen";
import ChatScreen from "./src/screens/ChatScreen";
import AuthScreen from "./src/screens/AuthScreen";
import AccountScreen from "./src/screens/AccountScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const NAV_THEME = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.ink,
    card: colors.panel,
    text: colors.text,
    border: colors.hairline,
    primary: colors.amber
  }
};

function HeaderRight({ navigation }) {
  const { auth } = useAuth();
  return (
    <View style={styles.headerRight}>
      <Pressable
        style={styles.headerBtn}
        onPress={() => (auth ? navigation.navigate("Compose") : navigation.navigate("Auth", { mode: "login" }))}
      >
        <Text style={styles.headerBtnText}>＋</Text>
      </Pressable>
      <Pressable
        style={styles.headerBtn}
        onPress={() => (auth ? navigation.navigate("Account") : navigation.navigate("Auth", { mode: "login" }))}
      >
        <Text style={styles.headerBtnText}>{auth ? "🏪" : "👤"}</Text>
      </Pressable>
    </View>
  );
}

function MainTabs({ navigation }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.panel },
        headerTintColor: colors.paper,
        headerRight: () => <HeaderRight navigation={navigation} />,
        tabBarStyle: { backgroundColor: colors.panel, borderTopColor: colors.hairline },
        tabBarActiveTintColor: colors.amber,
        tabBarInactiveTintColor: colors.textDim,
        tabBarLabelStyle: { fontSize: 11 }
      }}
    >
      <Tab.Screen
        name="Annonces"
        component={AnnoncesScreen}
        options={{ title: "Snapy", tabBarLabel: "Annonces", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>📰</Text> }}
      />
      <Tab.Screen
        name="Top"
        component={TopScreen}
        options={{ title: "Top annonces", tabBarLabel: "Top", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>🔥</Text> }}
      />
      <Tab.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{ title: "Catégories", tabBarLabel: "Catégories", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>🗂️</Text> }}
      />
      <Tab.Screen
        name="MesAnnonces"
        component={MesAnnoncesScreen}
        options={{ title: "Mes annonces", tabBarLabel: "Mes annonces", tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>🏪</Text> }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.panel },
        headerTintColor: colors.paper,
        contentStyle: { backgroundColor: colors.ink }
      }}
    >
      <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Boutique" component={BoutiqueScreen} options={{ title: "Boutique" }} />
      <Stack.Screen name="CategoryFeed" component={CategoryFeedScreen} options={{ title: "Catégorie" }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Compose" component={ComposeScreen} options={{ title: "Publier un produit", presentation: "modal" }} />
      <Stack.Screen name="EditProduct" component={EditProductScreen} options={{ title: "Modifier l'annonce", presentation: "modal" }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ presentation: "modal" }} />
      <Stack.Screen name="Auth" component={AuthScreen} options={{ title: "Compte vendeur", presentation: "modal" }} />
      <Stack.Screen name="Account" component={AccountScreen} options={{ title: "Mon compte", presentation: "modal" }} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer theme={NAV_THEME}>
          <RootNavigator />
        </NavigationContainer>
        <StatusBar style="light" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  headerRight: { flexDirection: "row", gap: 4, marginRight: 8 },
  headerBtn: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  headerBtnText: { fontSize: 18 }
});
