// service-worker.js

const CACHE_NAME = 'mantrailing-card-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx', // Wichtig: Haupt-Skript hinzufügen
  '/manifest.json',
  'https://hs-bw.com/wp-content/uploads/2026/02/Trailer-Card-App-icon.png',
  // Die JS/TSX-Dateien werden durch den Browser-Cache und das Build-System gehandhabt,
  // aber die wichtigsten Einstiegspunkte werden hier gecacht.
];

// Event-Listener für die 'install'-Phase des Service Workers
self.addEventListener('install', event => {
  // Warten, bis der Cache geöffnet und alle wichtigen URLs hinzugefügt wurden
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache wurde geöffnet');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Fehler beim Caching während der Installation:', err);
      })
  );
});

// Event-Listener für Netzwerk-Anfragen ('fetch')
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Wenn die angeforderte Ressource im Cache gefunden wird, wird sie von dort zurückgegeben.
        if (response) {
          return response;
        }
        // Andernfalls wird die Anfrage an das Netzwerk weitergeleitet.
        return fetch(event.request);
      })
      .catch(err => {
        console.error('Fetch-Fehler:', err);
        // Optional: Hier könnte eine Offline-Fallback-Seite zurückgegeben werden
      })
  );
});

// Event-Listener für die 'activate'-Phase, um alte Caches zu bereinigen
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Löschen von veralteten Caches
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});