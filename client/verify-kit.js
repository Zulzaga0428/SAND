// client/verify-kit.js — Component kit амьд эсэхийг батлах (сервер дээр).
// ./ui + ThemeProvider(base+accent) ашигласан expo preview үүсгэж шалгана.
// Ажиллуулах (сервер дээр, /opt/kodu-sandbox дотор):
//   node client/verify-kit.js
// (SAND_KEY-г controller/.kodu-key-ээс автоматаар уншина)

const fs = require("fs");
const path = require("path");
const { KoduSandbox } = require("./index");

const baseUrl = process.env.SAND_URL || "http://localhost:4000";
let apiKey = process.env.SAND_KEY;
if (!apiKey) {
  try {
    apiKey = fs.readFileSync(path.join(__dirname, "..", "controller", ".kodu-key"), "utf8").trim();
  } catch (_) {}
}
if (!apiKey) {
  console.error("❌ SAND_KEY алга (controller/.kodu-key ч олдсонгүй)");
  process.exit(1);
}

const APP = `import { ThemeProvider, Screen, Header, Title, Body, Button, Card, Badge, Tabs, useTabs } from "./ui";

export default function App() {
  const { active, setActive } = useTabs("home");
  return (
    <ThemeProvider base="dark" accent="#6d5efc">
      <Screen padded={false}>
        <Header title="Kit амьд" right={<Badge label="ok" tone="success" />} />
        <Screen scroll>
          <Title>Component kit ажиллаж байна 🎨</Title>
          <Card><Body>ThemeProvider + ./ui бүгд OK</Body></Card>
          <Button title="Тест товч" onPress={() => {}} style={{ marginTop: 16 }} />
        </Screen>
        <Tabs active={active} onChange={setActive} tabs={[{ key: "home", label: "Нүүр", icon: "🏠" }]} />
      </Screen>
    </ThemeProvider>
  );
}
`;

(async () => {
  console.log("\n🧪 Component kit шалгаж байна... (Vite асахад хэдэн секунд)\n");
  const sb = new KoduSandbox({ baseUrl, apiKey });
  try {
    const r = await sb.createAndWait([{ path: "src/App.tsx", content: APP }], { mode: "expo" });
    console.log("✅ KIT АМЬД БАЙНА!");
    console.log("   URL:", r.url, `(${r.readyMs}ms)`);
    console.log("   → Тэр линкийг browser/утаснаас нээвэл dark theme, ягаан accent");
    console.log("     товчтой хуудас гарна. ThemeProvider + ./ui бүгд ажиллаж байна.\n");
    await sb.stopPreview(r.id);
  } catch (e) {
    console.error("❌ Алдаа:", e.message);
    console.error("   (Cannot find module './ui' гэвэл docker build дутуу — deploy дахин хий)\n");
    process.exit(1);
  }
})();
