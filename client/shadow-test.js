// client/shadow-test.js — Shadow-тест: SAND зөв ажиллаж байгаа эсэхийг батлах.
// -----------------------------------------------------------------------------
// M5-ийн санаа: KoDu-APP хэрэглэгчийн сайтыг E2B дээр үзүүлж байх зуур, ЗЭРЭГЦЭЭ
// SAND дээр ч үүсгээд "ажиллаж байна уу, хэр хурдан бэ" гэдгийг чимээгүй бүртгэнэ.
// Хэрэглэгч SAND-ийн preview-г ХАРАХГҮЙ — зөвхөн бид үр дүнг цуглуулна.
//
// Энэ скрипт тэр баталгаажуулалтыг нэг удаа гүйцэтгэнэ:
//   1. static preview үүсгэ → бэлэн болтол хугацаа хэмж → агуулга зөв үү
//   2. app (Next.js) preview үүсгэ → мөн адил
//   3. keepAlive, list, stop бүгд ажиллаж байгааг шалга
//
// Ажиллуулах:
//   SAND_URL=http://202.182.123.79:4000 SAND_KEY=<түлхүүр> node client/shadow-test.js
// -----------------------------------------------------------------------------

const { KoduSandbox } = require("./index");

const baseUrl = process.env.SAND_URL;
const apiKey = process.env.SAND_KEY;
if (!baseUrl || !apiKey) {
  console.error("Хэрэглээ: SAND_URL=... SAND_KEY=... node client/shadow-test.js");
  process.exit(1);
}

const sb = new KoduSandbox({ baseUrl, apiKey });
let pass = 0;
let fail = 0;
const ok = (m) => { console.log("  ✅ " + m); pass++; };
const bad = (m) => { console.log("  ❌ " + m); fail++; };

const STATIC_FILES = [
  { path: "index.html", content: "<h1>shadow-static-OK</h1>" },
];
const APP_FILES = [
  { path: "app/page.js", content: "export default function H(){return <h1>shadow-app-OK</h1>;}" },
];

async function checkContent(url, needle) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const t = await r.text();
    return t.includes(needle);
  } catch {
    return false;
  }
}

async function run() {
  console.log(`\n🕵️  Shadow-тест — ${baseUrl}\n`);

  // 1. static
  console.log("=== 1. Static preview ===");
  const s = await sb.createAndWait(STATIC_FILES, { mode: "static" });
  console.log(`  → ${s.url}  (${s.readyMs}ms, warm=${s.warm})`);
  (await checkContent(s.url, "shadow-static-OK"))
    ? ok("static preview ажиллаж, агуулга зөв гарлаа")
    : bad("static preview агуулга буруу");

  // 2. app (Next.js)
  console.log("=== 2. Next.js app preview ===");
  const a = await sb.createAndWait(APP_FILES, { mode: "app" });
  console.log(`  → ${a.url}  (${a.readyMs}ms, warm=${a.warm})`);
  (await checkContent(a.url, "shadow-app-OK"))
    ? ok(`Next.js preview ажиллаж, агуулга зөв (бэлэн болсон хугацаа: ${a.readyMs}ms)`)
    : bad("Next.js preview агуулга буруу");

  // 3. keepAlive + list
  console.log("=== 3. keepAlive + list ===");
  (await sb.keepAlive(a.id)).ok ? ok("keepAlive ажиллав") : bad("keepAlive амжилтгүй");
  const listed = await sb.list();
  listed.some((p) => p.id === a.id || p.id.startsWith(a.id))
    ? ok(`list ажиллав (${listed.length} preview)`)
    : bad("list-д preview олдсонгүй");

  // 4. stop (цэвэрлэгээ)
  console.log("=== 4. stop (цэвэрлэгээ) ===");
  await sb.stopPreview(s.id);
  await sb.stopPreview(a.id);
  ok("stop дуудлагууд амжилттай (цэвэрлэгдлээ)");

  console.log(`\n============================================`);
  console.log(`  Дүн:  ✅ ${pass}   ❌ ${fail}`);
  console.log(fail === 0
    ? "  🎉 SAND бүрэн ажиллаж байна — shadow-тест PASS!"
    : "  ⚠️  Зарим шалгалт унасан — дээрх ❌ мөрийг үз.");
  console.log(`============================================\n`);
  process.exit(fail === 0 ? 0 : 1);
}

run().catch((e) => {
  console.error("\n❌ Shadow-тест алдаа:", e.message, e.status ? `(status ${e.status})` : "");
  process.exit(1);
});
