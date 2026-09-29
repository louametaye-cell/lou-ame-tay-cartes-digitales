# SKILL : Progressive Web App (PWA) & Disponibilité Hors Ligne

> **Version** : 2.0.0  
> **Date de création** : 2026-09-29  
> **Auteur** : Antigravity & Équipe Lou Ame Tay  
> **Tags** : `pwa`, `service-worker`, `offline`, `manifest`, `caching`, `mobile`

---

## 🎯 Quand utiliser cette compétence
Utilisez cette compétence pour transformer une application web ou une carte de visite digitale en une application installable sur smartphone (iOS Safari / Android Chrome) capable de fonctionner même en zone blanche ou réseau intermittent :
- Pour ajouter un bouton d'installation personnalisé "📲 Installer l'application".
- Pour mettre en cache le shell applicatif (HTML, CSS, icônes, scripts essentiels).
- Pour servir des données de secours (data.js) si l'utilisateur ouvre sa carte dans un sous-sol ou sans connexion Internet mobile.
- Pour respecter les critères d'évaluation Google Lighthouse PWA (Score 100/100).

---

## 📋 Prérequis
1. Connexion HTTPS obligatoire (exigence de sécurité pour les Service Workers).
2. Fichier `manifest.json` valide avec icônes 192x192 et 512x512 png.
3. Fichier `service-worker.js` servi depuis la racine du domaine pour couvrir l'intégralité du scope `/`.

---

## 🛠️ Étapes d'implémentation

### Étape 1 : Configuration du Web App Manifest (`manifest.json`)
Définir les métadonnées d'affichage (`standalone`), la couleur de thème (`theme_color`), et les icônes adaptatives (`maskable`).

### Étape 2 : Stratégie de mise en cache du Service Worker
- **Network-First avec Fallback Cache** : Pour les requêtes dynamiques de données.
- **Cache-First / Stale-While-Revalidate** : Pour les feuilles de style, polices et images de la charte.
- **Cycle de vie du Service Worker** : `install`, `activate` (nettoyage des anciens caches) et `fetch`.

### Étape 3 : Capture de l'événement d'installation (`beforeinstallprompt`)
Intercepter l'événement natif Android/Desktop pour afficher un bandeau ou bouton d'installation élégant intégré à la charte graphique.

---

## 💻 Code / Configuration

### 1. `manifest.json`
```json
{
  "name": "Lou Ame Tay — Cartes de Visite Digitales",
  "short_name": "Lou Ame Tay",
  "description": "Cartes de visite digitales et solutions CHR au Sénégal",
  "start_url": "/carte.html",
  "display": "standalone",
  "background_color": "#0B1F3A",
  "theme_color": "#0B1F3A",
  "orientation": "portrait",
  "icons": [
    {
      "src": "images/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "images/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### 2. `service-worker.js` (Gestion de cache et fallback offline)
```javascript
const CACHE_NAME = 'louametay-v2.0.0';
const ASSETS_A_METTRE_EN_CACHE = [
  '/',
  '/carte.html',
  '/css/style.css',
  '/css/carte.css',
  '/js/env.js',
  '/js/supabase-client.js',
  '/js/data.js',
  '/js/carte.js',
  '/images/logo.svg',
  '/images/commercial1.svg'
];

// Installation : mise en cache du Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Mise en cache du Shell applicatif');
      return cache.addAll(ASSETS_A_METTRE_EN_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activation : purge des anciennes versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cles) => {
      return Promise.all(
        cles.filter((cle) => cle !== CACHE_NAME).map((cle) => caches.delete(cle))
      );
    }).then(() => self.clients.claim())
  );
});

// Interception des requêtes réseau (Stale-While-Revalidate + Cache Fallback)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((reponseEnCache) => {
      const requeteReseau = fetch(event.request).then((reponseReseau) => {
        if (reponseReseau && reponseReseau.status === 200) {
          const copieReponse = reponseReseau.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, copieReponse);
          });
        }
        return reponseReseau;
      }).catch(() => {
        // En cas d'échec total du réseau, retourne le cache ou la page de secours
        return reponseEnCache || caches.match('/carte.html');
      });

      return reponseEnCache || requeteReseau;
    })
  );
});
```

### 3. `js/pwa-install.js` (Bouton d'installation in-app)
```javascript
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  const btnInstaller = document.getElementById('btn-installer-pwa');
  if (btnInstaller) {
    btnInstaller.style.display = 'flex';
    btnInstaller.onclick = async () => {
      btnInstaller.style.display = 'none';
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`[PWA] Résultat installation : ${outcome}`);
      deferredPrompt = null;
    };
  }
});
```

---

## ⚠️ Pièges à éviter
1. **Oublier d'incrémenter `CACHE_NAME` lors d'une mise à jour de code** : Si vous modifiez vos fichiers CSS ou JS sans changer le nom du cache (ex: passer de `v1` à `v2`), les navigateurs mobiles continueront de servir les anciens fichiers en cache.
2. **Ne pas gérer le cas iOS Safari** : iOS ne supporte pas l'événement `beforeinstallprompt`. Prévoyez un modal d'instructions visuel spécifique ("Appuyez sur Partager ⎋ puis sur Sur l'écran d'accueil ⊕").
3. **Mettre en cache les requêtes POST Supabase** : Les Service Workers ne peuvent mettre en cache que les requêtes `GET`. Filtrer impérativement avec `if (event.request.method !== 'GET') return;`.

---

## ✅ Checklist de validation
- [ ] Le `service-worker.js` s'enregistre sans erreur dans l'onglet Application des DevTools.
- [ ] En cochant "Offline" dans les DevTools, la carte continue de s'afficher sans écran noir.
- [ ] Le bouton d'installation s'affiche sur Android Chrome.
- [ ] Le fichier `manifest.json` passe les audits Lighthouse avec 100% de conformité PWA.

---

## 🔗 Ressources liées
- [`01_architecture_saas.md`](file:///C:/Users/DELL/Desktop/CRM%20LOUAMETAY.COM/lou-ame-tay-—-cartes-de-visite-digitales/lou-ame-tay-memory/SKILLS/01_architecture_saas.md)
- [`PATTERNS/pwa_service_worker.md`](file:///C:/Users/DELL/Desktop/CRM%20LOUAMETAY.COM/lou-ame-tay-—-cartes-de-visite-digitales/lou-ame-tay-memory/PATTERNS/pwa_service_worker.md)

---

## 📊 Exemple concret (projet Lou Ame Tay)
Les commerciaux de Lou Ame Tay rencontrent souvent des restaurateurs dans des arrière-salles ou des zones touristiques où le réseau 3G/4G est instable. Grâce au Service Worker et au fallback `data.js`, la carte digitale s'ouvre instantanément, permettant au commercial de montrer le portfolio des solutions et de générer son QR Code sans interruption de service.
