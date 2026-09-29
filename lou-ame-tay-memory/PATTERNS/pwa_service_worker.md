# PATTERN : Service Worker PWA & Stratégies de Cache Hybrides

> **Langage** : JavaScript (Service Worker API)  
> **Fichier** : `service-worker.js`  
> **Catégorie** : PWA, Offline, Performance Mobile  

---

## 🎯 Objectif
Fournir un Service Worker complet assurant une navigation ultra-fluide sur smartphone, même en cas de coupure subite du réseau mobile :
- Met en cache les ressources critiques de la coquille applicative (Shell).
- Utilise une stratégie **Stale-While-Revalidate** pour rafraîchir en tâche de fond les fichiers modifiés sans bloquer l'affichage.
- Supprime automatiquement les caches des anciennes versions lors de l'activation d'un nouveau build.
- Protège les requêtes POST et les appels d'API dynamiques contre les mises en cache corrompues.

---

## 💻 Code Réutilisable (`service-worker.js`)

```javascript
/**
 * ==============================================================================
 * SERVICE WORKER DE PRODUCTION — LOU AME TAY
 * ==============================================================================
 */

const VERSION_CACHE = 'louametay-v2.0.0';

// Fichiers du Shell applicatif mis en cache dès l'installation
const ASSETS_CRITIQUES = [
  '/',
  '/index.html',
  '/carte.html',
  '/css/style.css',
  '/css/carte.css',
  '/js/env.js',
  '/js/supabase-client.js',
  '/js/data.js',
  '/js/carte.js',
  '/images/logo.svg',
  '/manifest.json'
];

// 1. PHASE D'INSTALLATION : Téléchargement et mise en cache du Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION_CACHE)
      .then((cache) => {
        console.log('[SW] Pré-mise en cache des assets critiques');
        return cache.addAll(ASSETS_CRITIQUES);
      })
      .then(() => self.skipWaiting()) // Prise de contrôle immédiate
  );
});

// 2. PHASE D'ACTIVATION : Purge impitoyable des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((clesExistantes) => {
      return Promise.all(
        clesExistantes.map((cle) => {
          if (cle !== VERSION_CACHE) {
            console.log(`[SW] Suppression de l'ancien cache obsolète : ${cle}`);
            return caches.delete(cle);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. PHASE D'INTERCEPTION RÉSEAU (Fetch)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Règle 1 : Ne JAMAIS intercepter les requêtes non-GET (ex: POST Supabase Auth ou insert lead)
  if (event.request.method !== 'GET') {
    return;
  }

  // Règle 2 : Ne pas mettre en cache les requêtes de base de données en direct Supabase PostgREST
  if (url.hostname.includes('supabase.co') && url.pathname.includes('/rest/v1/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // En cas de panne totale réseau, retourner une réponse vide 200 pour éviter une erreur fatale
        return new Response(JSON.stringify([]), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Règle 3 : Stratégie Stale-While-Revalidate pour le reste des requêtes statiques
  event.respondWith(
    caches.match(event.request).then((reponseEnCache) => {
      // Déclenchement de la requête réseau en parallèle
      const fetchPromise = fetch(event.request).then((reponseReseau) => {
        if (reponseReseau && reponseReseau.status === 200) {
          const reponseACloner = reponseReseau.clone();
          caches.open(VERSION_CACHE).then((cache) => {
            cache.put(event.request, reponseACloner);
          });
        }
        return reponseReseau;
      }).catch((err) => {
        console.warn(`[SW] Mode hors-ligne pour : ${event.request.url}`);
        // Fallback d'urgence sur la page carte.html si navigation HTML
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/carte.html');
        }
      });

      // Retourne immédiatement la ressource en cache si elle existe, sinon attend le réseau
      return reponseEnCache || fetchPromise;
    })
  );
});
```

---

## 🛠️ Enregistrement Côté Client (`js/main.js` ou `js/carte.js`)
```javascript
if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
      .then((reg) => console.log('✓ Service Worker PWA enregistré. Scope:', reg.scope))
      .catch((err) => console.warn('Échec enregistrement Service Worker:', err));
  });
}
```
