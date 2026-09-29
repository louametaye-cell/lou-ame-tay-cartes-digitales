# SKILL : Conception de Cartes de Visite Digitales Haute Conversion (Style QRCodeChimp Mobile-First)

> **Version** : 2.0.0  
> **Date de création** : 2026-09-29  
> **Auteur** : Antigravity & Équipe Lou Ame Tay  
> **Tags** : `digital-card`, `mobile-first`, `qrcodechimp`, `ux-ui`, `vcard`, `networking`

---

## 🎯 Quand utiliser cette compétence
Utilisez cette compétence pour concevoir une page de carte de visite digitale haut de gamme (digital business card) optimisée pour smartphone :
- Pour maximiser le taux de conversion lors d'un scan QR physique (salons, rendez-vous terrain, chevalets de table).
- Pour créer un impact visuel immédiat avec un ratio photo géant 4:5, un badge officiel flottant et des superpositions dégradées nettes.
- Pour fournir des boutons d'action rapide ronds et instinctifs (Appel, WhatsApp pré-rempli, Email, Partage rapide).
- Pour intégrer un écosystème commercial complet : vCard 3.0 en 1 clic, prise de rendez-vous, simulateur de ROI, démo vidéo YouTube et catalogue de formules interactif.

---

## 📋 Prérequis
1. Charte graphique contrastée : bleu marine profond (`#0B1F3A`), doré prestige (`#C9A227`), blanc pur (`#FFFFFF`), typographie moderne (Poppins / Inter).
2. Photos de profil au format portrait haute définition centrées sur le visage.
3. Données structurées du conseiller (nom, fonction, coordonnées, WhatsApp, zone d'intervention, liens réseaux sociaux).

---

## 🛠️ Étapes d'implémentation

### Étape 1 : Architecture du layout Mobile-First (Largeur max 480px)
La carte est centrée sur écran desktop avec un fond feutré, et occupe 100% de la largeur sur mobile avec des zones tactiles d'au moins 48px de hauteur.

### Étape 2 : Le Hero Géant format 4:5 avec Dégradé Sombre
La photo du conseiller occupe le haut de la carte. Un dégradé linéaire (`linear-gradient(to top, rgba(11,31,58,0.95), transparent)`) garantit une lisibilité absolue du nom blanc et du poste en lettres dorées.

### Étape 3 : La Barre d'Actions Rapides Rondes
Disposition de 4 cercles tactiles avec micro-animations au survol/tap :
1. **📞 Appel** : lien `tel:+221...`
2. **💬 WhatsApp** : lien direct `wa.me/221...` avec message contextualisé
3. **✉️ Email** : lien `mailto:...`
4. **🔗 Partage** : ouverture du modal multi-canal (QR, WhatsApp, SMS, Copie lien)

### Étape 4 : L'action maîtresse "Ajouter aux contacts" (vCard 3.0)
Bouton pleine largeur doré ultra-visible téléchargeant instantanément un fichier `.vcf` formaté selon la norme RFC 2426.

---

## 💻 Code / Configuration

### 1. Structure HTML Sémantique du Hero
```html
<section class="carte-chimp-hero" aria-label="Identité du conseiller">
  <div class="hero-photo-wrapper">
    <img id="commercial-photo" src="images/commercial1.jpg" alt="Portrait" class="hero-photo-chimp">
    
    <div class="hero-gradient-overlay">
      <div class="hero-badge-haut">
        <span class="chimp-pill-officiel">✦ CONSEILLER TERRAIN CHR</span>
        <div class="statut-dispo" id="statut-dispo">
          <span class="statut-dot"></span>
          <span class="statut-texte">Disponible maintenant</span>
        </div>
      </div>

      <div class="hero-textes-bas">
        <h1 id="commercial-nom-complet" class="hero-nom-commercial">Mamadou Diallo</h1>
        <p id="commercial-poste" class="hero-poste-commercial">Directeur Commercial & Grands Comptes</p>
        <div class="hero-entreprise-ruban">
          <img src="images/logo.svg" alt="Lou Ame Tay" width="24" height="24">
          <span>LOU AME TAY 🍽️ — Menu Digital & KDS</span>
        </div>
      </div>
    </div>
  </div>
</section>
```

### 2. Styles CSS Clés (`css/carte.css`)
```css
.carte-chimp-wrapper {
  max-width: 460px;
  margin: 0 auto;
  min-height: 100vh;
  background-color: #071322;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
  font-family: 'Poppins', sans-serif;
  color: #FFFFFF;
}

.hero-photo-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 5;
  overflow: hidden;
}

.hero-photo-chimp {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
}

.hero-gradient-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(7,19,34,0.3) 0%, rgba(7,19,34,0.1) 40%, rgba(7,19,34,0.95) 90%, #071322 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.25rem;
}

.chimp-actions-rondes {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  padding: 1.25rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  margin: 1rem 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.chimp-btn-rond-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  text-decoration: none;
  color: #FFFFFF;
  transition: transform 0.2s ease;
}

.chimp-btn-rond-wrapper:active {
  transform: scale(0.92);
}

.chimp-cercle-icone {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.25);
}

.icone-rond-tel { background: linear-gradient(135deg, #1E3A8A, #3B82F6); }
.icone-rond-wa { background: linear-gradient(135deg, #065F46, #10B981); }
.icone-rond-mail { background: linear-gradient(135deg, #B45309, #F59E0B); }
.icone-rond-partage { background: linear-gradient(135deg, #4C1D95, #8B5CF6); }
```

---

## ⚠️ Pièges à éviter
1. **Ratio d'aspect d'image déformé** : Utiliser impérativement `object-fit: cover` et `aspect-ratio: 4 / 5` pour éviter que les photos envoyées par les commerciaux ne soient écrasées ou étirées.
2. **Texte illisible sur fond photo clair** : Ne jamais afficher le nom en blanc directement sur la photo sans un dégradé sombre d'opacité suffisante (`rgba(7,19,34,0.95)`).
3. **Absence de bouton de secours (Fallback)** : Toujours prévoir un état d'erreur convivial si l'identifiant passé dans l'URL n'existe pas ou si la carte a été désactivée par l'administrateur.

---

## ✅ Checklist de validation
- [ ] La photo s'affiche parfaitement au ratio 4:5 sans bandes noires.
- [ ] Le clic sur l'icône téléphone lance directement le composeur d'appel avec l'indicatif international (+221).
- [ ] Le clic sur l'icône WhatsApp ouvre WhatsApp Web ou l'application avec le texte pré-rédigé.
- [ ] Le bouton "Ajouter aux contacts" télécharge un `.vcf` valide reconnu par iOS Contacts et Android Contacts.
- [ ] Le rendu est fluide et sans décalage de mise en page (CLS = 0).

---

## 🔗 Ressources liées
- [`05_i18n_multi_langue.md`](file:///C:/Users/DELL/Desktop/CRM%20LOUAMETAY.COM/lou-ame-tay-—-cartes-de-visite-digitales/lou-ame-tay-memory/SKILLS/05_i18n_multi_langue.md)
- [`07_qr_code_export.md`](file:///C:/Users/DELL/Desktop/CRM%20LOUAMETAY.COM/lou-ame-tay-—-cartes-de-visite-digitales/lou-ame-tay-memory/SKILLS/07_qr_code_export.md)
- [`PATTERNS/vcard_generation.md`](file:///C:/Users/DELL/Desktop/CRM%20LOUAMETAY.COM/lou-ame-tay-—-cartes-de-visite-digitales/lou-ame-tay-memory/PATTERNS/vcard_generation.md)

---

## 📊 Exemple concret (projet Lou Ame Tay)
La carte digitale de Mamadou Diallo ou Cheikh Ndiaye adopte ce modèle exact : en 3 secondes après avoir scanné le QR code, le restaurateur voit la photo officielle en haute définition, peut l'enregistrer dans son répertoire d'un simple clic sur le bouton doré, et tester immédiatement la démo du menu interactif Lou Ame Tay directement depuis la carte.
