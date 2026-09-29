# SKILL : Architecture SaaS Statique Découplée (BaaS Supabase + Hébergement LWS + PWA)

> **Version** : 2.0.0  
> **Date de création** : 2026-09-29  
> **Auteur** : Antigravity & Équipe Lou Ame Tay  
> **Tags** : `saas`, `architecture`, `supabase`, `lws`, `pwa`, `decoupled`

---

## 🎯 Quand utiliser cette compétence
Utilisez cette compétence lorsque vous concevez ou migrez une application web commerciale ou SaaS nécessitant :
- Des coûts d'infrastructure serveur réduits au strict minimum (hébergement mutualisé standard type Apache / cPanel / LWS à quelques euros/mois).
- Une scalabilité backend native sans serveur applicatif Node/Python à maintenir (PostgreSQL managé, API REST instantanée, Authentification et Storage d'objets via Supabase).
- Une disponibilité hors ligne et une installabilité mobile de premier ordre (Progressive Web App - PWA).
- Une sécurité étanche basée sur Row Level Security (RLS) directement au niveau du moteur de base de données.

---

## 📋 Prérequis
1. Compte Supabase actif avec projet provisionné (PostgreSQL 15+).
2. Hébergement web mutualisé ou VPS compatible Apache avec support du module `mod_rewrite` et certificats SSL Let's Encrypt (ex: LWS cPanel / Panel LWS).
3. Environnement de développement Node.js (v18+) avec bundler léger (Vite) pour le build statique et les tests locaux.
4. Connaissance des modules ECMAScript natifs (`import` / `export` ESM côté navigateur).

---

## 🛠️ Étapes d'implémentation

### Étape 1 : Conception du triptyque architectural
1. **Frontend Client-Side pur** : HTML5 sémantique, CSS moderne avec variables de design tokens, JavaScript Vanilla modulaire ESM sans framework lourd (garantit une vitesse d'affichage sous 1s sur réseau mobile 3G/4G).
2. **Backend-as-a-Service (Supabase)** : Fournit le schéma relationnel, l'API REST PostgREST automatique, le stockage des médias (bucket public `photos`), et la couche de sécurité déclarative RLS.
3. **Distribution & Cache (LWS Apache + PWA Service Worker)** : Fichiers statiques servis via Apache avec compression Gzip/Brotli, cache HTTP agressif sur les assets hachés, et fallback offline via Service Worker.

### Étape 2 : Structure arborescente du projet
```
mon-projet-saas/
├── index.html                 # Page d'accueil / Annuaire public
├── carte.html                 # Application de carte digitale (?id=UUID)
├── admin.html                 # Espace d'administration protégé
├── login.html                 # Formulaire de connexion Supabase Auth
├── 404.html                   # Page de routage d'erreur
├── manifest.json              # Déclaration PWA
├── service-worker.js          # Stratégie de cache offline
├── .htaccess                  # Règles de réécriture et sécurité Apache
├── css/
│   ├── style.css              # Tokens globaux & composants communs
│   ├── carte.css              # Vue mobile-first carte digitale
│   └── admin.css              # Interface back-office & tables CRM
├── js/
│   ├── env.js                 # Variables d'environnement injectées (URL, ANON_KEY)
│   ├── supabase-client.js     # Singleton du client Supabase
│   ├── carte.js               # Contrôleur applicatif de la carte
│   └── admin.js               # Contrôleur applicatif du dashboard
└── dist/                      # Fichiers compilés prêts à être déployés sur LWS
```

### Étape 3 : Injection dynamique des variables d'environnement
Sur un hébergement statique sans Node.js en production, les variables d'environnement (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) ne peuvent pas être lues via `process.env`. On utilise un pattern d'injection par fichier racine `js/env.js` chargé en premier dans le HTML :
```html
<!-- Dans le <head> de chaque page HTML -->
<script src="js/env.js"></script>
```

---

## 💻 Code / Configuration

### 1. `js/env.js` (Fichier d'environnement statique)
```javascript
/**
 * Configuration d'environnement pour hébergement statique (LWS / Apache)
 * Ne jamais y stocker la clef 'service_role' ! Uniquement la clef 'anon'.
 */
window.__ENV__ = {
  SUPABASE_URL: "https://ugmdpjncplnlizhpongo.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  BASE_URL: "https://www.louametay.online",
  MODE: "production"
};
```

### 2. `js/supabase-client.js` (Singleton ESM avec Fallback démo)
```javascript
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const env = window.__ENV__ || {};
export const SUPABASE_URL = env.SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY || '';

export function estSupabaseConfigure() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes('VOTRE_'));
}

export const supabase = estSupabaseConfigure()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'louametay_auth_token'
      }
    })
  : null;
```

---

## ⚠️ Pièges à éviter
1. **Oubli du script `env.js` dans le template HTML** : Si `js/env.js` n'est pas chargé avant les scripts ES modules, `window.__ENV__` est `undefined`, provoquant un crash silencieux de Supabase et un basculement erroné sur les données locales.
2. **Exposer la clef `service_role` dans le code client** : La clef `service_role` outrepasse toutes les politiques RLS. Elle ne doit JAMAIS apparaître dans le frontend ni dans Git. Seule la clef `anon` doit être exposée.
3. **Routage SPA non configuré sur Apache** : Lors d'un rafraîchissement sur une URL réécrite, Apache renvoie une 404 si le fichier `.htaccess` n'est pas configuré avec `RewriteEngine On` et `RewriteRule ^index\.html$ - [L]`.

---

## ✅ Checklist de validation
- [ ] La page HTML charge `js/env.js` avant tout autre script applicatif.
- [ ] `estSupabaseConfigure()` retourne `true` en console sur l'environnement de production.
- [ ] Le site continue de fonctionner en lecture minimale même en mode hors ligne via le Service Worker.
- [ ] Aucun secret ou mot de passe de base de données n'est présent dans le répertoire public.
- [ ] Le build statique produit une archive zip déployable directement à la racine `public_html` du serveur LWS.

---

## 🔗 Ressources liées
- [`02_supabase_patterns.md`](file:///C:/Users/DELL/Desktop/CRM%20LOUAMETAY.COM/lou-ame-tay-—-cartes-de-visite-digitales/lou-ame-tay-memory/SKILLS/02_supabase_patterns.md)
- [`03_lws_deployment.md`](file:///C:/Users/DELL/Desktop/CRM%20LOUAMETAY.COM/lou-ame-tay-—-cartes-de-visite-digitales/lou-ame-tay-memory/SKILLS/03_lws_deployment.md)
- [`PATTERNS/supabase_client.md`](file:///C:/Users/DELL/Desktop/CRM%20LOUAMETAY.COM/lou-ame-tay-—-cartes-de-visite-digitales/lou-ame-tay-memory/PATTERNS/supabase_client.md)

---

## 📊 Exemple concret (projet Lou Ame Tay)
Sur le projet Lou Ame Tay, cette architecture a permis d'héberger la plateforme sur l'offre cPanel LWS mutualisée à Dakar/France (domaine `louametay.online`) tout en connectant le backend temps réel à Supabase. Le coût récurrent d'infrastructure pour 50 commerciaux et des dizaines de milliers de scans mensuels est proche de 0€, avec des temps de chargement mobiles moyens de 650 ms sur réseau 4G sénégalais (Orange / Free / Expresso).
