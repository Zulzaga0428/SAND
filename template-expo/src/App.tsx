// Анхны placeholder — хэрэглэгчийн App.tsx үүнийг дарж бичнэ (src/App.tsx).
import { View, Text, StyleSheet } from "react-native";

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kodu Expo template 🐳</Text>
      <Text style={styles.sub}>Хэрэглэгчийн App.tsx үүнийг дарж бичнэ.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0b1020",
  },
  title: { color: "#8fb0ff", fontSize: 22, fontWeight: "700" },
  sub: { color: "#8b93a7", marginTop: 8 },
});
