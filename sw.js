const CACHE_NAME = 'lernzeit-tracker-v9-workspace';

// Everything the app needs to boot offline. Keep this list in sync with the
// <script> tags in index.html - a missing module used to break the app offline.
const LOCAL_ASSETS = [
    './',
    './index.html',
    './style.css',
    './css/toast.css',
    './css/tailwind.generated.css',
    './vendor/lucide.min.js',
    './js/ui.js',
    './js/utils.js',
    './js/store.js',
    './js/timer.js',
    './js/achievements.js',
    './js/calendar.js',
    './js/dashboard.js',
    './js/app.js',
    './sw.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

const CDN_ASSETS = [];

self.addEventListener('install', (e) => {
    e.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        // Local assets are mandatory; a failing CDN must not abort the install
        // (offline/LTE installs used to fail completely).
        await cache.addAll(LOCAL_ASSETS);
        await Promise.all(CDN_ASSETS.map(async (url) => {
            try {
                const response = await fetch(url, { mode: 'cors' });
                if (response && response.ok) {
                    await cache.put(url, response);
                }
            } catch (err) {
                // Offline install: the runtime fetch handler fills this later.
            }
        }));
        await self.skipWaiting();
    })());
});

self.addEventListener('activate', (e) => {
    e.waitUntil((async () => {
        const keyList = await caches.keys();
        await Promise.all(keyList.map((key) => {
            if (key !== CACHE_NAME && key.startsWith('lernzeit-tracker-')) {
                return caches.delete(key);
            }
            return Promise.resolve();
        }));
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', (e) => {
    const request = e.request;

    // Never intercept writes - the cache cannot answer them.
    if (request.method !== 'GET') return;

    // Navigations: network first so a new deployment is picked up, cache as
    // the offline fallback (cache-first served stale index.html forever).
    if (request.mode === 'navigate') {
        e.respondWith((async () => {
            try {
                const response = await fetch(request);
                const copy = response.clone();
                const cache = await caches.open(CACHE_NAME);
                cache.put(request, copy).catch(() => {});
                return response;
            } catch (err) {
                const cached = await caches.match(request);
                if (cached) return cached;
                const shell = await caches.match('./index.html');
                if (shell) return shell;
                throw err;
            }
        })());
        return;
    }

    const url = new URL(request.url);
    const sameOrigin = url.origin === self.location.origin;

    if (!sameOrigin) {
        // CDN bundles: cache first, fill on demand.
        e.respondWith((async () => {
            const cached = await caches.match(request);
            if (cached) return cached;
            const response = await fetch(request);
            if (response && response.ok) {
                const cache = await caches.open(CACHE_NAME);
                cache.put(request, response.clone()).catch(() => {});
            }
            return response;
        })());
        return;
    }

    // Own assets: stale-while-revalidate keeps startup instant and still
    // refreshes the cached copy for the next visit.
    e.respondWith((async () => {
        const cached = await caches.match(request);
        const network = fetch(request).then((response) => {
            if (response && response.ok) {
                caches.open(CACHE_NAME)
                    .then((cache) => cache.put(request, response.clone()))
                    .catch(() => {});
            }
            return response;
        }).catch(() => null);

        if (cached) {
            network.catch(() => {});
            return cached;
        }
        const response = await network;
        if (response) return response;
        throw new Error('Offline und nicht im Cache: ' + request.url);
    })());
});

self.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
