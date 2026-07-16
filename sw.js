// Service worker sederhana untuk Finantara.
// Hanya meng-cache "shell" aplikasi (file statis di domain sendiri).
// Semua request ke Firebase/Firestore/Google APIs TIDAK disentuh sama sekali,
// supaya data selalu real-time dan tidak ada versi basi yang ke-cache.

const CACHE_NAME = 'finantara-shell-v1';
const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Biarkan semua request ke luar domain sendiri (Firebase, Firestore, Google, dll)
  // langsung ke network, tidak dicampur cache.
  if (url.origin !== self.location.origin) return;

  // Untuk file shell sendiri: coba network dulu (biar selalu versi terbaru
  // saat online), baru fallback ke cache kalau offline.
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
