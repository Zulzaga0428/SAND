// Анхны placeholder — хэрэглэгчийн App.tsx үүнийг дарж бичнэ.
// ⚠️ Component kit (ui/) SAND-д prebake хийгддэггүй — apps өөрсдийн ui/-г
// илгээдэг (app.kodu.live эзэмшдэг). SAND зөвхөн runtime (react-native-web +
// vite + alias + Alert polyfill) prebake хийнэ. Тиймээс энэ demo нь цэвэр
// react-native — ./ui-аас import ХИЙХГҮЙ.
import { View, Text, StyleSheet } from "react-native";

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kodu Sandbox runtime 🐳</Text>
      <Text style={styles.sub}>react-native-web + vite бэлэн.</Text>
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
