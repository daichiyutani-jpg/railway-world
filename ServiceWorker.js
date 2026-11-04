// オフライン対応: ゲーム本体を端末にしまっておき、通信なしでも起動できるようにする。
// ビルドのたびにファイル名（ハッシュ）が変わるので、キャッシュ名も変わり、古いものは消える。
const CACHE = "railwayworld-0.1.0-72dff0a28c4d29cb3c0c8050cb107e48.wasm.unityweb";
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "TemplateData/style.css",
  "TemplateData/icons/icon-192.png",
  "TemplateData/icons/icon-512.png",
  "Build/5f5390d59a0b24f458842f98aa390ea7.loader.js",
  "Build/ae7d4aca11b12dd0091f26001208e2cf.framework.js.unityweb",
  "Build/4b12fe4d337e209b61be7470a61e52fa.data.unityweb",
  "Build/72dff0a28c4d29cb3c0c8050cb107e48.wasm.unityweb",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("railwayworld-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  // ページ本体は通信を優先（更新を受け取る）し、つながらなければ端末内のものを使う
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put("index.html", copy));
        return res;
      }).catch(() => caches.match("index.html", { ignoreSearch: true }))
    );
    return;
  }
  // それ以外（ゲーム本体・画像）は端末内を優先
  e.respondWith(
    caches.match(req, { ignoreVary: true, ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok && new URL(req.url).origin === location.origin) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }))
  );
});
