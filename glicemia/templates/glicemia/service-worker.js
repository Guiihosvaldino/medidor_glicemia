const CACHE_NAME = 'glicemia-offline-v1';
const URLS_TO_CACHE = [
  '/',
  '/login/',
  '/dashboard/',
  '/nova-medicao/',
  '/static/glicemia/css/style.css',
  '/static/glicemia/logo-app.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(URLS_TO_CACHE))
  );
});

self.addEventListener('fetch', event => {
  // Ignora chamadas de API (como POST) ou URLs que não sejam GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then(response => {
        if (response) {
          return response;
        }
        // Se a página não estiver em cache e não tiver internet, retorna o dashboard como fallback
        if (event.request.mode === 'navigate') {
          return caches.match('/dashboard/');
        }
      });
    })
  );
});
