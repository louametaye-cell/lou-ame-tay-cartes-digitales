# PROMPT TYPE : Checklist & Validation Pré-Déploiement LWS / Production

> **Usage** : Utilisez ce prompt avant de téléverser une nouvelle version sur l'hébergement de production pour vous assurer que rien n'a été oublié.

---

```markdown
# MISSION : Audit Pré-Déploiement & Packaging Production LWS

## 🎯 OBJECTIF
Vérifier l'intégrité de tous les composants de l'application avant l'envoi vers le serveur de production LWS (`louametay.online`).

## 📋 CHECKLIST SYSTÉMATIQUE DES 10 POINTS DE CONTRÔLE

1. **Compilation du Build** :
   - Lancer `npm run build` et vérifier l'absence d'erreurs de syntaxe ou d'imports orphelins.
2. **Synchronisation du fichier d'environnement (`env.js`)** :
   - Vérifier que `dist/js/env.js` contient bien l'URL Supabase et la clé `anon` de production.
   - S'assurer que les templates HTML (`index.html`, `carte.html`, `admin.html`) incluent bien `<script src="js/env.js"></script>`.
3. **Fichier `.htaccess` Apache** :
   - Présent à la racine de `dist/`.
   - Contient la règle de forçage HTTPS 301 et la réécriture d'URLs sans extension `.html`.
   - Contient la règle interdisant la mise en cache de `service-worker.js` et `manifest.json`.
4. **Fichiers de Référencement & Découverte** :
   - `robots.txt` autorisant l'indexation publique.
   - `sitemap.xml` à jour listant les URLs clés.
   - Page `404.html` stylisée présente.
5. **PWA & Offline** :
   - `manifest.json` valide avec icônes 192px et 512px.
   - `service-worker.js` valide avec incrément de numéro de version du cache.
6. **Contrôle Console Navigateur** :
   - Zéro avertissement d'erreur 404 sur les polices, favicons ou scripts dans les DevTools.
7. **Packaging ZIP** :
   - Générer l'archive de distribution finale (`louametay-lws-dist.zip`).
   - Vérifier la taille et le contenu de l'archive (doit inclure tous les assets compilés).

Exécute la checklist, génère le ZIP et fournis le rapport d'intégrité complet.
```
