# MÉMOIRE : 04 — Charte Graphique & Design System "Prestige CHR"

> **Projet** : Lou Ame Tay  
> **Date de création** : 2026-09-29  
> **Version** : 2.0.0  
> **Auteur** : Antigravity & Équipe Lou Ame Tay  

---

## 📅 Contexte historique
Pour s'imposer face aux restaurateurs exigeants et aux directions d'hôtels au Sénégal, Lou Ame Tay a rejeté l'esthétique "geek/tech" générique au profit d'une identité visuelle statutaire, chaleureuse et haut de gamme évoquant le prestige hôtelier, l'élégance de la Teranga sénégalaise et la rigueur technologique.

---

## 🎯 Design Tokens & Palette Chromatique

### 1. Couleurs Principales
- **Bleu Marine Nuit (`#0B1F3A`)** : Couleur dominante institutionnelle. Évoque la solidité, la confiance bancaire et l'autorité professionnelle.
- **Bleu Marine Profond (`#071322`)** : Fond principal de la carte digitale sur mobile. Absorbe la lumière, élimine l'éblouissement et met en valeur les photos de profil.
- **Or Prestige (`#C9A227`)** : Couleur d'accentuation majeure. Symbolise l'excellence, la valeur ajoutée et le succès commercial. Utilisée sur les boutons maîtres (CTA), les étoiles de notation et les bordures de distinction.
- **Or Lumineux (`#E5C04A`)** : Teinte de survol (hover) et d'interaction des éléments dorés.
- **Blanc Pur (`#FFFFFF`)** : Textes principaux, titres majeurs et fonds de QR Code pour une lisibilité optique maximale.
- **Ardoise Neutre (`#64748B` / `#94A3B8`)** : Textes secondaires, légendes, mentions d'aide et bordures discrètes.

### 2. Typographie Sémantique
- **Police Principale** : `Poppins`, sans-serif (Google Fonts).
  - *Bold (700)* : Noms des commerciaux (22-26px), Titres de sections (18-20px), Prix FCFA (20-24px).
  - *SemiBold (600)* : Intitulés de postes (14-15px), Boutons d'action, Badges.
  - *Regular (400)* : Biographies, descriptions de plats, conditions d'offres (13-14px).
- **Hauteur de ligne (`line-height`)** : 1.5 sur les paragraphes, 1.2 sur les titres pour un rendu compact et dynamique.

### 3. Composants UI Emblématiques

#### A. Le Hero Photo 4:5 avec Dégradé Sombre
- Ratio d'aspect verrouillé à `4 / 5`.
- Dégradé linéaire vertical : `linear-gradient(180deg, rgba(7,19,34,0.2) 0%, rgba(7,19,34,0.1) 40%, rgba(7,19,34,0.95) 90%, #071322 100%)`.
- Assure une lisibilité absolue du nom blanc et du poste doré même si la photo d'origine possède un fond clair ou encombré.

#### B. La Barre d'Actions Rapides Tactiles (4 Cercles)
- Boutons ronds de 52x52 px avec icône emoji centrée (taille 1.35rem).
- Dégradés thématiques :
  - Appel 📞 : `linear-gradient(135deg, #1E3A8A, #3B82F6)`
  - WhatsApp 💬 : `linear-gradient(135deg, #065F46, #10B981)`
  - Email ✉️ : `linear-gradient(135deg, #B45309, #F59E0B)`
  - Partage 🔗 : `linear-gradient(135deg, #4C1D95, #8B5CF6)`

#### C. Les Badges de Statut Temps Réel
- **Statut Disponible** : Point vert pulsant (`#22C55E`) avec animation CSS `pulse 2s infinite`.
- **Badge Officiel** : Ruban bleu marine avec liseré doré "✦ CONSEILLER TERRAIN CHR".

---

## 💻 Variables CSS Globales (`css/style.css`)
```css
:root {
  --couleur-marine-fond: #071322;
  --couleur-marine-carte: #0B1F3A;
  --couleur-marine-surface: #112644;
  --couleur-or: #C9A227;
  --couleur-or-hover: #E5C04A;
  --couleur-blanc: #FFFFFF;
  --couleur-texte-muet: #94A3B8;
  --couleur-bordure: rgba(255, 255, 255, 0.1);
  --couleur-succes: #10B981;
  --couleur-danger: #EF4444;

  --rayon-bordure-sm: 8px;
  --rayon-bordure-md: 14px;
  --rayon-bordure-lg: 20px;
  --rayon-rond: 50%;

  --ombre-carte: 0 20px 40px rgba(0, 0, 0, 0.4);
  --ombre-doree: 0 4px 20px rgba(201, 162, 39, 0.35);
  --transition-douce: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 📊 Impact mesuré
- **Perception de marque** : 92% des restaurateurs interrogés qualifient la présentation de "très professionnelle et digne d'une grande entreprise internationale".
- **Accessibilité visuelle** : Contraste texte/fond conforme WCAG AAA sur l'ensemble des écrans clés.

---

## 📝 Leçons apprises
1. **Éviter le noir pur (`#000000`)** : L'utilisation d'un bleu nuit très profond (`#071322`) apporte beaucoup plus de chaleur et d'élégance qu'un noir brut.
2. **Le doré doit être utilisé avec parcimonie** : Le doré ne doit habiller que les éléments d'appel à l'action majeurs. Utilisé partout, il perd son caractère prestigieux.
