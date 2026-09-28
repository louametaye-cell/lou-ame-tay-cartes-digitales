# Guide Technique : Lecteur Vidéo YouTube & Carrousel 3 Images — Lou Ame Tay v2.0

Ce document décrit l'architecture, l'intégration technique et les règles d'utilisation des deux nouveaux composants interactifs déployés sur les cartes de visite digitales Lou Ame Tay :
1. **Le lecteur vidéo YouTube optimisé & respectueux de la vie privée (RGPD)**
2. **Le carrousel dynamique de 3 images de réalisations terrain (Swipe mobile & Autoplay fluide)**

---

## 1. Schéma de Base de Données (Supabase / PostgreSQL)

Le script SQL exécuté est [`sql/07_media.sql`](file:///C:/Users/DELL/Desktop/CRM%20LOUAMETAY.COM/lou-ame-tay-—-cartes-de-visite-digitales/sql/07_media.sql).

### Nouvelles colonnes sur `public.commerciaux` :
| Colonne | Type | Description |
| :--- | :--- | :--- |
| `video_youtube_id` | `TEXT` | ID de la vidéo YouTube (11 caractères, ex: `dQw4w9WgXcQ`) |
| `video_titre` | `TEXT` | Titre affiché sous la vidéo (ex: *Démo Lou Ame Tay — Menu QR*) |
| `video_description` | `TEXT` | Présentation synthétique en 2 lignes |
| `carrousel_images` | `JSONB` | Tableau ordonné d'objets `[{"url": "...", "titre": "...", "legende": "..."}]` |

### Table alternative `public.videos` :
Permet si nécessaire de gérer une médiathèque multi-vidéos par commercial avec contrôle d'ordre et statuts actifs protégés par RLS.

---

## 2. Lecteur Vidéo YouTube Haute Performance

### Points Clés d'Ingénierie :
- **Zéro impact sur le temps de chargement initial (LCP)** : Aucun script lourd ni iframe YouTube n'est chargé à l'ouverture de la page. Seule une miniature statique haute définition (`maxresdefault.jpg` avec repli automatique sur `hqdefault.jpg`) est affichée.
- **Conformité RGPD & Confidentialité** : Utilisation du domaine `www.youtube-nocookie.com`. Aucun cookie publicitaire Google n'est déposé tant que le visiteur n'a pas cliqué sur le bouton de lecture.
- **Design Chimp & Lou Ame Tay** :
  - Bouton Play rouge YouTube officiel centré avec effet d'agrandissement (`scale(1.1)`) au survol.
  - Dégradé sombre protecteur garantissant la lisibilité du titre.
  - Mention cliquable `▶ Regarder sur YouTube`.
  - Coins arrondis `border-radius: 16px` et ombres portées douces.
- **Masquage automatique** : Si le conseiller n'a pas renseigné d'ID vidéo, la section est complètement masquée (aucun bloc vide).

---

## 3. Carrousel d'Images des Réalisations Terrain

### Fonctionnalités & Spécifications :
- **Défilement automatique fluide** : Transition toutes les 4 secondes (`0.6s cubic-bezier(0.4, 0, 0.2, 1)`).
- **Pause intelligente** : Le défilement automatique se met en pause dès que la souris survole le carrousel sur ordinateur.
- **Navigation multi-supports** :
  - **Boutons Précédent / Suivant** arrondis semi-transparents avec fond doré au survol (masqués automatiquement sur smartphone pour privilégier l'ergonomie tactile).
  - **Pagination par 3 points (dots)** : l'indicateur actif s'allonge (`width: 24px`) avec la couleur dorée `#C9A227`.
  - **Support du geste tactile Swipe (`touchstart` / `touchend`)** sur mobile avec seuil de déclenchement calibré à 40px.
- **Esthétique QRCodeChimp** :
  - Ratio 4:3 sur ordinateur et format carré 1:1 sur smartphone.
  - Ombre portée externe marquée (`box-shadow: 0 12px 40px rgba(11, 31, 58, 0.15)`).
  - Coins arrondis à `20px`.
  - Légende blanche sur dégradé sombre en bas de chaque diapositive.
- **Seuil de robustesse** : Si le conseiller dispose de moins de 2 images, la section est masquée.

---

## 4. Administration & Modération (`admin.html`)

Dans le modal de création/édition d'un commercial :
1. **Section Vidéo** :
   - Champ polyvalent acceptant soit l'ID direct (`dQw4w9WgXcQ`), soit l'URL complète (`https://youtu.be/...`, `https://www.youtube.com/watch?v=...`, `shorts/...`).
   - Prévisualisation instantanée de la miniature YouTube dès la frappe ou le copier-coller.
2. **Section Carrousel (3 diapositives)** :
   - 3 emplacements dédiés avec sélection de fichier local ou conservation de l'URL existante.
   - Compression d'image automatique côté client via `browser-image-compression` (< 1 Mo) pour préserver l'espace de stockage Supabase.
   - Téléversement direct dans le bucket public `photos` sous `carrousel/${commercialId}_slot${i}_${Date.now()}.jpg`.
   - Bouton `✕` de suppression rapide par emplacement.
