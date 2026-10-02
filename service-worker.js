/**
 * ==============================================================================
 * SERVICE WORKER — LOU AME TAY CARTES DE VISITE (PWA OFFLINE-READY)
 * ==============================================================================
 * Version du cache : lou-ame-tay-v2
 * Stratégie : Network First pour le HTML / API, Cache First pour les assets statiques
 */

const CACHE_NAME = 'lou-ame-tay-v4';

const ASSETS_A_METTRE_EN_CACHE = [
  '/',
  '/index.html',
  '/carte.html',
  '/login.html',
  '/commercial.html',
  '/commercial',
  '/admin.html',
  '/css/style.css',
  '/css/admin.css',
  '/js/data.js',
  '/js/app.js',
  '/js/carte.js',
  '/js/commercial.js',
  '/js/contrat-pdf.js',
  '/js/contrat-commercial-pdf.js',
  '/js/image-compressor.js',
  '/js/gps-geofence.js',
  '/js/whatsapp-pitch.js',
  '/js/cdp-privacy.js',
  '/js/gemini-copilot.js',
  '/js/offline-sync.js',
  '/js/wallet-pass.js',
  '/js/supabase-client.js',
  '/js/audit.js',
  '/js/lead-scoring.js',
  '/js/analytics.js',
  '/js/notifications.js',
  '/js/i18n.js',
  '/js/pwa-install.js',
  '/locales/fr.json',
  '/locales/wo.json',
  '/locales/en.json',
  '/images/logo.png',
  '/images/logo.svg',
  '/images/commercial1.jpg',
  '/images/commercial2.jpg',
  '/images/commercial3.jpg',
  '/images/commercial4.jpg'
];

// Installation : mise en cache des assets essentiels
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_A_METTRE_EN_CACHE).catch((err) => {
        console.warn('Certains assets optionnels n\'ont pu être mis en cache :', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cles) => {
      return Promise.all(
        cles.filter((cle) => cle !== CACHE_NAME).map((cle) => caches.delete(cle))
      );
    }).then(() => self.clients.claim())
  );
});

// Interception des requêtes réseau
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Ignorer les requêtes non GET ou externes analytics/ipapi
  if (e.request.method !== 'GET' || url.hostname.includes('ipapi.co') || url.hostname.includes('supabase.co')) {
    return;
  }

  // Pour les pages HTML : Network First avec fallback sur le cache
  if (e.request.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copie = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copie));
          return res;
        })
        .catch(() => caches.match(e.request).then((res) => res || caches.match('/index.html')))
    );
    return;
  }

  // Pour les assets (images, css, js, json) : Cache First avec rafraîchissement en arrière-plan
  e.respondWith(
    caches.match(e.request).then((resCache) => {
      if (resCache) {
        // Rafraîchissement en arrière-plan (Stale While Revalidate)
        fetch(e.request).then((resReseau) => {
          if (resReseau.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resReseau));
          }
        }).catch(() => {});
        return resCache;
      }

      return fetch(e.request).then((resReseau) => {
        if (!resReseau || resReseau.status !== 200 || resReseau.type !== 'basic') {
          return resReseau;
        }
        const copie = resReseau.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copie));
        return resReseau;
      });
    })
  );
});
