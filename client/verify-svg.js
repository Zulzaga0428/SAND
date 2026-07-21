// client/verify-svg.js — react-native-svg runtime-д ажиллаж байгааг батлах.
// Controller руу ШУУД (HTTPS-гүй, Host header-ээр) шалгана — тэгэхээр
// гэрчилгээ/loopback асуудалгүй. App.tsx (react-native-svg-тэй) Vite web-д
// зөв хөрвүүлж байгааг илрүүлнэ.
//   node client/verify-svg.js

const fs = require("fs");
const path = require("path");
const http = require("http");
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

const ERR_MARKERS = ["Failed to resolve", "does not provide an export", "Internal Server Error", "Pre-transform error", "[plugin:", "Cannot find"];

// Controller-ийн HTTP порт руу ШУУД (Host header-ээр preview subdomain руу чиглүүлнэ)
function fetchViaProxy(host, pathname) {
  return new Promise((resolve, reject) => {
    const u = new URL(baseUrl);
    const req = http.request(
      { host: u.hostname, port: u.port || 80, path: pathname, method: "GET", headers: { Host: host }, timeout: 20000 },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve({ status: res.statusCode, body }));
      }
    );
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
    req.end();
  });
}

(async () => {
  console.log("\n🧪 react-native-svg шалгаж байна... (Vite асахад хэдэн секунд)\n");
  const sb = new KoduSandbox({ baseUrl, apiKey });
  let id;
  try {
    // createPreview expo горимд дотоод readiness хүлээгээд буцна (HTTPS хүлээхгүй)
    const r = await sb.createPreview([{ path: "src/App.tsx", content: APP }], { mode: "expo" });
    id = r.id;
    console.log("  preview:", r.url);

    // https://<sub>.<domain> → sub + host гаргаж авна
    const m = r.url.match(/^https?:\/\/([^.]+)\.(.+?)\/?$/);
    if (!m) throw new Error("URL-аас subdomain гаргаж чадсангүй: " + r.url);
    const hostHeader = m[1] + "." + m[2];

    // App.tsx-ийг controller proxy-гоор татаж, Vite react-native-svg хөрвүүлж
    // байгааг шалга (Vite эхний удаад compile хийхэд хэдэн секунд авна — 2 оролдоно)
    let ok = false, detail = "тодорхойгүй";
    for (let i = 0; i < 8; i++) {
      try {
        const res = await fetchViaProxy(hostHeader, "/src/App.tsx");
        if (res.status === 200 && !ERR_MARKERS.some((x) => res.body.includes(x))) { ok = true; break; }
        detail = "HTTP " + res.status + (ERR_MARKERS.find((x) => res.body.includes(x)) || "");
      } catch (e) { detail = e.message; }
      await new Promise((r) => setTimeout(r, 1500));
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
