# 📸 Guide des images — Lou Ame Tay

## Images générées automatiquement
Les 3 images de la galerie sont générées par le script `npm run generate:images` :
- `deploiement1.jpg` — Écran Cuisine (KDS) en action (1200×800 px, ~77 Ko)
- `deploiement2.jpg` — Formation équipe + chevalet QR sur table (1200×800 px, ~73 Ko)
- `deploiement3.jpg` — Carte du Sénégal avec support 7j/7 sur l'axe Dakar — Thiès — Mbour (1200×800 px, ~64 Ko)

Ces visuels respectent rigoureusement la charte graphique officielle :
- **Bleu marine profond** : `#0B1F3A`
- **Doré impérial** : `#C9A227`
- **Blanc pur** : `#FFFFFF`
- **Typographie** : Poppins

Des versions vectorielles sources `.svg` sont également générées en miroir (`deploiement1.svg`, `deploiement2.svg`, `deploiement3.svg`) pour un affichage ultra-léger et infini.

## Remplacer par de vraies photos
1. Nomme tes photos exactement : `deploiement1.jpg`, `deploiement2.jpg`, `deploiement3.jpg`
2. Format recommandé : JPG 1200×800 px (ratio 16:10 ou 16:9), poids inférieur à 300 Ko
3. Compresse sur https://tinypng.com pour optimiser le temps de chargement sur réseau mobile 3G/4G
4. Dépose les fichiers dans `public/images/` et `images/`
5. Lance le build de production : `npm run build:lws`
6. Transfère le zip `louametay-lws-dist.zip` ou le contenu du dossier `dist/` sur l'hébergement LWS via FTP ou le gestionnaire de fichiers

## Autres images du projet
- `logo.svg` et `logo.png` — Médaillon officiel circulaire or et marine avec monogramme LAT
- `icon-192.png` et `icon-512.png` — Icônes PWA pour installation sur smartphone Android et iOS
- `commercial1.svg` à `commercial4.svg` — Portraits vectoriels des 4 conseillers terrain (ratio 4:5)
