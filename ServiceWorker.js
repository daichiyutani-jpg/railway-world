// オフライン対応: ゲーム本体を端末にしまっておき、通信なしでも起動できるようにする。
// ビルドのたびにファイル名（ハッシュ）が変わるので、キャッシュ名も変わり、古いものは消える。
const CACHE = "railwayworld-0.1.0-24c8da0db4ed34529b539a6db413cacd.wasm.unityweb";
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "TemplateData/style.css",
  "TemplateData/icons/icon-192.png",
  "TemplateData/icons/icon-512.png",
  "Build/44beacd44db2deb9df0da7c661399887.loader.js",
  "Build/bcf2543e6c09d70da6b977d4b3e5b6e9.framework.js.unityweb",
  "Build/4a577dafe21b6ac7f6ddc21397a53a46.data.unityweb",
  "Build/24c8da0db4ed34529b539a6db413cacd.wasm.unityweb",
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
