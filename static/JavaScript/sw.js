const OFFLINE_VERSION = 1;
const CACHE_NAME = "offline-v" + OFFLINE_VERSION;
const OFFLINE_URL = "offline.html";
const CACHE_URLS = [
  OFFLINE_URL,
  "/static/JavaScript/main.js",
  "/static/JavaScript/jquery.min.js",
  "/static/img//QLUT.ico",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(new Request(OFFLINE_URL));
        await cache.put(OFFLINE_URL, response);
      } catch (error) {
        console.log("Error caching offline page", error);
      }
      // 针对CSS和JS文件进行缓存。
      await cache.addAll(CACHE_URLS.filter(url => url !== OFFLINE_URL));

    })()
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      if ("navigationPreload" in self.registration) {
        await self.registration.navigationPreload.enable();
      }
      // 清理旧版本的缓存
      const keys = await caches.keys();
      keys.forEach(async (key) => {
        if (key !== CACHE_NAME) {
          await caches.delete(key);
        }
      });

      self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) {
            return preloadResponse;
          }
          const fetchResponse = await fetch(event.request);
          return fetchResponse;
        } catch (error) {
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(OFFLINE_URL);
          return cachedResponse;
        }
      })()
    );
  } else {

  }
  // 请求数据更新，不定时发起fetch请求发送给服务器
  if(event.request.url.startsWith("https://classroom.matt-wang.me/")){
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        try {
          // 记录当前时间
          const fetchTime = new Date().getTime();
          const fetchParams = {
            headers: {
              "If-Modified-Since": new Date(fetchTime).toUTCString()
            }
          };
          const fetchResponse = await fetch(event.request, fetchParams);
          // 只缓存成功响应。
          if (fetchResponse.ok) {
            cache.put(event.request, fetchResponse.clone());
          }
          return fetchResponse;
        } catch (error) {
          console.error("Fetch failed.", error);
        }
      })()
    );
  }
});

