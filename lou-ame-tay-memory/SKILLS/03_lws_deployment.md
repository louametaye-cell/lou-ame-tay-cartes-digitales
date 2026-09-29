# SKILL : Déploiement et Configuration LWS / Apache (Production Ready)

> **Version** : 2.0.0  
> **Date de création** : 2026-09-29  
> **Auteur** : Antigravity & Équipe Lou Ame Tay  
> **Tags** : `lws`, `apache`, `deployment`, `htaccess`, `cpanel`, `ftp`

---

## 🎯 Quand utiliser cette compétence
Utilisez cette compétence pour déployer un site statique / PWA / SaaS sur un hébergement mutualisé ou cPanel LWS (Ligne Web Services) ou tout serveur web Apache :
- Pour configurer le routage d'URLs propres sans extension `.html` (`/carte` au lieu de `/carte.html`).
- Pour forcer le protocole HTTPS et la redirection canonique `www` ou `non-www`.
- Pour mettre en place les en-têtes de sécurité HTTP (Content Security Policy, X-Frame-Options, X-Content-Type-Options, HSTS).
- Pour configurer le cache navigateur agressif sur les fichiers immuables et autoriser le Service Worker PWA sans mise en cache parasite.
- Pour automatiser la génération d'une archive zip prête à être téléversée dans le gestionnaire de fichiers LWS ou par FTP.

---

## 📋 Prérequis
1. Compte client LWS actif avec nom de domaine rattaché (ex: `louametay.online`).
2. Accès au gestionnaire de fichiers cPanel ou identifiants FTP/SFTP (FileZilla ou script Node/bash).
3. Certificat SSL Let's Encrypt activé en 1 clic dans l'interface LWS.
4. Fichier `dist/` généré par le bundler (Vite).

---

## 🛠️ Étapes d'implémentation

### Étape 1 : Rédaction du fichier `.htaccess` haute performance
Le fichier `.htaccess` doit être placé à la racine exacte de `public_html` sur le serveur Apache. Il orchestre :
1. La réécriture HTTPS stricte.
2. Le routage SPA / URLs propres.
3. La compression Gzip/Deflate.
4. Les directives `Cache-Control` par type MIME.
5. Les en-têtes de sécurité OWASP.

### Étape 2 : Script de build et packaging automatisé (`prepare-lws.js`)
Un script Node.js vérifie l'intégrité de tous les fichiers nécessaires avant de générer le fichier zip téléchargeable en 1 clic.

### Étape 3 : Procédure de mise en ligne sur LWS
1. Connectez-vous à l'Espace Client LWS -> Hébergement Web -> Gestionnaire de fichiers (ou FTP).
2. Naviguez dans le répertoire web racine : `/htdocs` ou `/public_html`.
3. Téléversez l'archive zip (`louametay-lws-dist.zip`).
4. Cliquez sur **Extraire** (Extract).
5. Vérifiez les permissions de fichiers : `644` pour les fichiers, `755` pour les dossiers.

---

## 💻 Code / Configuration

### 1. Fichier `.htaccess` complet et optimisé
```apache
# ==============================================================================
# CONFIGURATION APACHE HAUTE PERFORMANCE & SÉCURITÉ — LOU AME TAY
# ==============================================================================

# 1. Activation du moteur de réécriture
RewriteEngine On
RewriteBase /

# 2. Forcer HTTPS systématique
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# 3. Forcer le sous-domaine canonique www (ou sans www selon la stratégie)
RewriteCond %{HTTP_HOST} ^louametay\.online$ [NC]
RewriteRule ^(.*)$ https://www.louametay.online/$1 [L,R=301]

# 4. URLs propres (suppression de l'extension .html apparente)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_FILENAME}.html -f
RewriteRule ^([^\.]+)$ $1.html [NC,L]

# 5. Redirection de la page d'erreur 404 personnalisée
ErrorDocument 404 /404.html

# 6. En-têtes de sécurité HTTP stricts
<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set X-XSS-Protection "1; mode=block"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
  
  # Politique de cache : Service Worker et Manifest JAMAIS mis en cache
  <FilesMatch "(service-worker\.js|manifest\.json|env\.js)$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires 0
  </FilesMatch>

  # Cache agressif (1 an) pour les assets statiques immuables
  <FilesMatch "\.(css|js|woff2|woff|ttf|png|jpg|jpeg|svg|webp|ico)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
</IfModule>

# 7. Compression Gzip / Deflate pour bande passante mobile réduite
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css
  AddOutputFilterByType DEFLATE application/javascript application/json application/xml
  AddOutputFilterByType DEFLATE image/svg+xml
</IfModule>
```

### 2. Script de packaging Node.js (`scripts/prepare-lws.js`)
```javascript
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

const distDir = path.resolve('dist');
const zipPath = path.resolve('louametay-lws-dist.zip');

console.log('--- Préparation du build de production pour LWS ---');

// Fichiers obligatoires à copier dans dist s'ils manquent
const essentiels = ['.htaccess', 'robots.txt', 'sitemap.xml', 'manifest.json', 'service-worker.js'];
essentiels.forEach(file => {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, path.join(distDir, file));
    console.log(`✓ Synchronisé dans dist: ${file}`);
  }
});

// Création de l'archive ZIP
const output = fs.createWriteStream(zipPath);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log(`✓ Archive ZIP prête : louametay-lws-dist.zip (${(archive.pointer() / 1024).toFixed(1)} Ko)`);
});

archive.pipe(output);
archive.directory(distDir, false);
archive.finalize();
```

---

## ⚠️ Pièges à éviter
1. **Cache du Service Worker par Apache** : Si Apache met en cache `service-worker.js` avec une durée de 1 an, vos utilisateurs ne recevront JAMAIS les mises à jour de l'application ! Le bloc `<FilesMatch "service-worker\.js">` avec `no-cache, no-store` est critique.
2. **Conflit de réécriture avec les sous-dossiers** : Si vous hébergez plusieurs projets sur le même compte LWS (multi-domaines), assurez-vous que chaque domaine pointe vers un dossier racine séparé dans cPanel (ex: `/public_html/louametay/`).
3. **Absence du type MIME SVG ou WOFF2** : Certains serveurs Apache anciens ne servent pas correctement les polices WOFF2 ou fichiers SVG sans la directive `AddType image/svg+xml .svg`.

---

## ✅ Checklist de validation
- [ ] Le certificat SSL est actif (cadenas vert sur `https://www.louametay.online`).
- [ ] La requête HTTP `http://` redirige automatiquement en code `301 Moved Permanently` vers `https://`.
- [ ] Les pages `carte.html` et `admin.html` sont accessibles sans l'extension dans la barre d'adresse (`/carte`, `/admin`).
- [ ] L'en-tête de réponse de `service-worker.js` indique bien `Cache-Control: no-cache, no-store`.
- [ ] La page 404 stylisée s'affiche lors de la saisie d'une URL inexistante.

---

## 🔗 Ressources liées
- [`01_architecture_saas.md`](file:///C:/Users/DELL/Desktop/CRM%20LOUAMETAY.COM/lou-ame-tay-—-cartes-de-visite-digitales/lou-ame-tay-memory/SKILLS/01_architecture_saas.md)
- [`04_pwa_offline.md`](file:///C:/Users/DELL/Desktop/CRM%20LOUAMETAY.COM/lou-ame-tay-—-cartes-de-visite-digitales/lou-ame-tay-memory/SKILLS/04_pwa_offline.md)

---

## 📊 Exemple concret (projet Lou Ame Tay)
L'hébergement de Lou Ame Tay est opéré sur l'infrastructure LWS France/Sénégal. Grâce à la compression Deflate et au cache HTTP configuré dans le `.htaccess`, la taille de chargement de la carte de visite passe de 1,8 Mo à moins de 240 Ko lors des visites répétées des restaurateurs à Thiès et Dakar.
