// client/index.js — Kodu Sandbox API client (адаптер)
// -----------------------------------------------------------------------------
// KoDu-APP энэ модулиар SAND-ыг дуудна. E2B client-тэй ойролцоо интерфейс тул
// хожим E2B-ээс SAND руу шилжихэд зөвхөн энэ client-ийг сольвол болно.
//
// Шаардлага: Node 18+ (доторх fetch ашиглана). Гуравдагч сан ХЭРЭГГҮЙ.
//
// Жишээ:
//   const { KoduSandbox } = require("./client");
//   const sb = new KoduSandbox({ baseUrl: "https://prw.hisainuu.online", apiKey });
//   const { id, url } = await sb.createPreview(files, { mode: "app" });
//   ... хэрэглэгчид url-ийг үзүүлнэ ...
//   await sb.keepAlive(id);   // ашиглаж байгаа цагт амьд байлгана
//   await sb.stopPreview(id);
// -----------------------------------------------------------------------------

class KoduSandboxError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "KoduSandboxError";
    this.status = status;
  }
}

class KoduSandbox {
  constructor({ baseUrl, apiKey } = {}) {
    if (!baseUrl) throw new Error("baseUrl шаардлагатай (жишээ: https://prw.hisainuu.online)");
    if (!apiKey) throw new Error("apiKey шаардлагатай (SAND API түлхүүр)");
    this.baseUrl = String(baseUrl).replace(/\/+$/, "");
    this.apiKey = apiKey;
  }

  async _req(method, pathname, body) {
    let res;
    try {
      res = await fetch(this.baseUrl + pathname, {
        method,
        headers: {
          Authorization: "Bearer " + this.apiKey,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      throw new KoduSandboxError("Серверт холбогдож чадсангүй: " + e.message, 0);
    }
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }
    if (!res.ok) {
      throw new KoduSandboxError(data.error || res.statusText || "Алдаа", res.status);
    }
    return data;
  }

  /**
   * Preview үүсгэнэ.
   * @param {Array<{path:string,content:string}>} files - төслийн файлууд
   * @param {{mode?: "static"|"app", ttlMin?: number}} [opts]
   * @returns {Promise<{id:string, url:string, warm:boolean}>}
   */
  createPreview(files, opts = {}) {
    return this._req("POST", "/api/previews", {
      files,
      mode: opts.mode || "static",
      ttlMin: opts.ttlMin,
    });
  }

  /** Preview-ийн устах цагийг сунгана (ашиглаж байгаа цагт тогтмол дуудна). */
  keepAlive(id, ttlMin) {
    return this._req("POST", `/api/previews/${encodeURIComponent(id)}/keepalive`, ttlMin ? { ttlMin } : {});
  }

  /** Preview-г зогсоож устгана. */
  stopPreview(id) {
    return this._req("DELETE", `/api/previews/${encodeURIComponent(id)}`);
  }

  /** Ажиллаж буй preview-уудыг жагсаана. */
  list() {
    return this._req("GET", "/api/previews");
  }

  /**
   * Preview үүсгээд, URL хариу өгч эхлэх хүртэл хүлээнэ (shadow-тест/баталгаанд).
   * @returns {Promise<{id:string, url:string, warm:boolean, readyMs:number}>}
   */
  async createAndWait(files, opts = {}) {
    const started = Date.now();
    const p = await this.createPreview(files, opts);
    const timeout = opts.readyTimeoutMs || 90_000;
    while (Date.now() - started < timeout) {
      try {
        const r = await fetch(p.url, { signal: AbortSignal.timeout(4000) });
        if (r.status < 500) return { ...p, readyMs: Date.now() - started };
      } catch (_) {}
      await new Promise((r) => setTimeout(r, 700));
    }
    throw new KoduSandboxError("Preview хугацаандаа бэлэн болсонгүй", 504);
  }
}

module.exports = { KoduSandbox, KoduSandboxError };
