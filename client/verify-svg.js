// client/verify-svg.js — react-native-svg runtime-д ажиллаж байгааг батлах.
// SVG ашигласан expo апп үүсгэж, Vite react-native-svg-ийг web-д зөв
// хөрвүүлж байгааг шалгана (resolve алдаа байвал илрүүлнэ).
// Ажиллуулах (сервер дээр, /opt/kodu-sandbox дотор):
//   node client/verify-svg.js

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

const APP = `import { View, Text } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";

export default function App() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0b1020", gap: 16 }}>
      <Text style={{ color: "#fff", fontSize: 18 }}>SVG icon test</Text>
      <Svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="#6d5efc" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M5 12h14M12 5l7 7-7 7" />
      </Svg>
      <Svg width={40} height={40} viewBox="0 0 24 24"><Circle cx={12} cy={12} r={10} fill="#35d07f" /></Svg>
    </View>
  );
}
`;

const ERR_MARKERS = ["Failed to resolve", "does not provide an export", "Internal Server Error", "Pre-transform error", "[plugin:"];

(async () => {
  console.log("\n🧪 react-native-svg шалгаж байна... (Vite асахад хэдэн секунд)\n");
  const sb = new KoduSandbox({ baseUrl, apiKey });
  let id;
  try {
    const r = await sb.createAndWait([{ path: "src/App.tsx", content: APP }], { mode: "expo" });
    id = r.id;
    console.log("  preview:", r.url, `(${r.readyMs}ms)`);

    // App.tsx-ийг татаж, Vite react-native-svg-ийг хөрвүүлж чадаж байгааг шалга
    let ok = true;
    let detail = "";
    try {
      const res = await fetch(r.url.replace(/\/$/, "") + "/src/App.tsx", { signal: AbortSignal.timeout(15000) });
      const text = await res.text();
      if (res.status >= 400) { ok = false; detail = "HTTP " + res.status; }
      for (const m of ERR_MARKERS) if (text.includes(m)) { ok = false; detail = m; }
    } catch (e) {
      ok = false; detail = e.message;
    }

    if (ok) {
      console.log("\n✅ react-native-svg АЖИЛЛАЖ БАЙНА!");
      console.log("   Vite web-д зөв хөрвүүлж байна (resolve алдаагүй).");
      console.log("   → App agent SVG-ээр Icon component бичиж болно.\n");
    } else {
      console.log("\n⚠️ react-native-svg-д асуудал байна:", detail);
      console.log("   (Vite config-д resolve alias хэрэгтэй байж магадгүй — SAND agent-д хэл.)\n");
    }
    await sb.stopPreview(id);
    process.exit(ok ? 0 : 1);
  } catch (e) {
    console.error("\n❌ Алдаа:", e.message, "\n");
    if (id) await sb.stopPreview(id).catch(() => {});
    process.exit(1);
  }
})();
