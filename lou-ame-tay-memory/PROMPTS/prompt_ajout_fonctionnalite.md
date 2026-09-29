# PROMPT TYPE : Ajout d'une Fonctionnalité Complète (Full-Stack Statique)

> **Usage** : Utilisez ce prompt pour confier l'implémentation d'une nouvelle fonctionnalité métier à un agent sans risquer de casser l'existant.

---

```markdown
# MISSION : Implémentation de Fonctionnalité — [Nom de la Fonctionnalité]

## CONTEXTE TECHNIQUE
- Projet : [Nom du projet]
- Fichiers concernés : [ex: carte.html, css/style.css, js/carte.js, schéma Supabase]
- Règle de design : Respect absolu de la charte graphique existante ([Couleur 1], [Couleur 2], typographie [Police]).

## 🎯 SPÉCIFICATIONS FONCTIONNELLES
1. **Comportement attendu** :
   [Décrire précisément le parcours utilisateur, étape par étape]
2. **Gestion des données** :
   - Schéma Supabase : [Nouvelle table ou nouvelle colonne ? Migration SQL nécessaire ?]
   - Politiques RLS associées : [Quels droits pour anon et authenticated ?]
3. **Persistance & Hors-Ligne** :
   - Quelles données doivent être mémorisées dans `localStorage` ou en cache Service Worker ?
4. **Gestion des états d'erreur & Edge Cases** :
   - Que se passe-t-il si l'utilisateur est hors-ligne ?
   - Que se passe-t-il si la donnée est absente ?

## 📋 ORDRE D'EXÉCUTION OBLIGATOIRE
1. **Migration SQL** (si requise) : Préparer et valider la commande SQL.
2. **Implémentation Backend/JS** : Créer le module logique dédié dans `js/` avec exports clairs.
3. **Intégration UI/CSS** : Adapter le HTML et ajouter les styles en respectant les tokens CSS.
4. **Test E2E Playwright** : Rédiger un script de test dédié, simuler l'action et capturer un screenshot de confirmation.
5. **Mise à jour du build** : Recompiler le bundle de production (`npm run build`).

Ne déclare la mission terminée qu'après avoir fourni la capture d'écran du test validé.
```
