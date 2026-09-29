# PROMPT TYPE : Initialisation d'un Nouveau Projet SaaS Découplé (Supabase + Statique)

> **Usage** : Donnez ce prompt à un agent IA pour initialiser un projet SaaS de zéro avec architecture découplée, haute performance et coût d'infrastructure minimal.

---

```markdown
# MISSION : Initialisation de Projet SaaS Découplé (Frontend Statique + BaaS Supabase)

## CONTEXTE DU PROJET
- Nom du projet : [Nom du Projet, ex: RestoPass Sénégal]
- Secteur d'activité : [Secteur, ex: CHR / Hôtellerie UEMOA]
- Modèle économique : Abonnements mensuels B2B en monnaie locale [FCFA]
- Cible utilisateurs : [Professionnels nomades, gérants d'établissements]

## 🎯 OBJECTIFS D'ARCHITECTURE
1. **Frontend** : HTML5 sémantique, CSS moderne avec design tokens, JavaScript Vanilla modulaire (ESM natif). Zéro framework lourd (pas de React/Next.js sauf demande expresse). Temps de chargement visé : < 800ms sur mobile.
2. **Backend BaaS (Supabase)** : Base relationnelle PostgreSQL, API REST PostgREST automatique, Authentification et Storage d'objets (bucket public pour les médias).
3. **Sécurité** : Row Level Security (RLS) activé sur 100% des tables avec cloisonnement strict `anon` vs `authenticated`.
4. **Hébergement** : Compatible hébergement mutualisé Apache standard (LWS / cPanel) avec fichier `.htaccess` gérant HTTPS, réécriture d'URLs propres et politique de cache.
5. **PWA** : Web App Manifest et Service Worker gérant la mise en cache du shell applicatif et le fonctionnement hors ligne.

## 🛠️ LIVRABLES ATTENDUS POUR L'INITIALISATION
1. Le script SQL complet DDL : tables maîtresses avec UUID v4, index, contraintes et politiques RLS hermétiques.
2. L'arborescence des fichiers frontend :
   - `index.html` (Vitrine / Annuaire)
   - `app.html` ou `carte.html` (Vue principale mobile-first)
   - `admin.html` (Dashboard d'administration protégé)
   - `login.html` (Authentification Supabase)
   - `manifest.json` & `service-worker.js`
   - `js/env.js` (Pattern d'injection de variables)
   - `js/supabase-client.js` (Singleton avec fallback)
   - `.htaccess` (Règles Apache)
3. Un script de build et packaging zip prêt à être déployé par FTP.
4. Un test E2E Playwright validant le chargement initial et la conformité console.

Commence par concevoir le schéma SQL et la structure de dossiers.
```
