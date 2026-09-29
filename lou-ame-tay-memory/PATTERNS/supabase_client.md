# PATTERN : Initialisation du Client Supabase ESM avec Fallback & Détection d'Environnement

> **Langage** : JavaScript (ESM)  
> **Fichier source** : `js/supabase-client.js`  
> **Compatibilité** : Navigateurs modernes, hébergement statique (Apache / LWS / Nginx)

---

## 🎯 Objectif
Fournir une instance singleton du client Supabase (`@supabase/supabase-js`) robuste face aux environnements statiques :
- Détecte dynamiquement la présence des clés d'environnement `window.__ENV__` injectées par `env.js`.
- Gère la persistance de la session utilisateur dans le stockage local du navigateur.
- Évite les erreurs fatales si Supabase est temporairement inaccessible en fournissant des méthodes de test d'état (`estSupabaseConfigure()`).

---

## 💻 Code Réutilisable

```javascript
/**
 * ==============================================================================
 * PATTERN : CLIENT SUPABASE SINGLETON POUR FRONTEND STATIQUE
 * ==============================================================================
 */

// Import direct via CDN ESM (aucune dépendance npm requise au runtime)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Récupération des variables injectées par js/env.js
const env = (typeof window !== 'undefined' && window.__ENV__) ? window.__ENV__ : {};

export const SUPABASE_URL = env.SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY || '';

/**
 * Vérifie si les identifiants Supabase sont valides et renseignés
 * @returns {boolean}
 */
export function estSupabaseConfigure() {
  return Boolean(
    SUPABASE_URL && 
    SUPABASE_ANON_KEY && 
    !SUPABASE_URL.includes('VOTRE_') &&
    SUPABASE_URL.startsWith('https://')
  );
}

/**
 * Instance Singleton du client Supabase
 */
export const supabase = estSupabaseConfigure()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'louametay_auth_token'
      },
      global: {
        headers: {
          'x-client-info': 'louametay-web-pwa/2.0.0'
        }
      }
    })
  : null;

/**
 * Helper sécurisé d'exécution de requête avec fallback gracieux
 * @param {Function} requeteFn - Fonction retournant une promesse Supabase
 * @param {*} donneesSecours - Données retournées en cas d'erreur ou d'absence de configuration
 * @returns {Promise<*>}
 */
export async function executerAvecSecours(requeteFn, donneesSecours = null) {
  if (!estSupabaseConfigure() || !supabase) {
    console.warn('[Supabase] Non configuré, utilisation des données de secours.');
    return donneesSecours;
  }

  try {
    const { data, error } = await requeteFn(supabase);
    if (error) {
      console.warn('[Supabase] Erreur requête, utilisation du secours :', error);
      return donneesSecours;
    }
    return data;
  } catch (err) {
    console.error('[Supabase] Exception réseau/exécution :', err);
    return donneesSecours;
  }
}
```

---

## 🛠️ Exemple d'Utilisation dans un Contrôleur
```javascript
import { supabase, estSupabaseConfigure } from './supabase-client.js';

async function chargerProfil(id) {
  if (estSupabaseConfigure()) {
    const { data, error } = await supabase
      .from('commerciaux')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!error && data) return data;
  }

  // Fallback si Supabase est indisponible
  return { prenom: 'Conseiller', nom: 'Terrain' };
}
```
