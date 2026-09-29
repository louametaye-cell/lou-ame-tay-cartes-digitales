# SKILL : Génération & Export de QR Codes HD (PNG 1000px & PDF 85x55mm Print-Ready)

> **Version** : 2.0.0  
> **Date de création** : 2026-09-29  
> **Auteur** : Antigravity & Équipe Lou Ame Tay  
> **Tags** : `qrcode`, `export-png`, `jspdf`, `html2canvas`, `print`, `high-res`

---

## 🎯 Quand utiliser cette compétence
Utilisez cette compétence dès lors que vous devez générer des QR Codes professionnels exploitables aussi bien sur écran que pour l'impression physique industrielle :
- Pour générer un QR Code dynamique vectoriel ou matriciel pointant vers une URL personnalisée.
- Pour incruster le logo de l'entreprise au centre du QR Code sans altérer la lisibilité du scan (correction d'erreur niveau H / 30%).
- Pour exporter une image PNG haute définition (1000x1000 pixels) encadrée avec le nom, le poste, le logo et les instructions de scan via `html2canvas`.
- Pour générer à la volée une carte de visite PDF recto-verso au format d'impression standard (85x55 mm) prête pour l'imprimeur via `jsPDF`.

---

## 📋 Prérequis
1. Bibliothèque `qrcodejs` ou `qrcode-generator` chargée via CDN ou npm.
2. Bibliothèque `html2canvas` (v1.4+) pour la rastérisation des conteneurs DOM.
3. Bibliothèque `jspdf` (v2.5+) pour la composition de fichiers PDF millimétrés.
4. Logo d'entreprise vectoriel en SVG ou PNG haute résolution avec fond transparent.

---

## 🛠️ Étapes d'implémentation

### Étape 1 : Génération du QR Code avec Tolérance d'Erreur Maximale
Utiliser impérativement le niveau de correction d'erreur `H` (High - 30% de redondance) pour garantir qu'un scan rapide fonctionne même si un logo est incrusté au centre ou si le QR code imprimé est légèrement sali ou froissé.

### Étape 2 : Assemblage du cadre d'export PNG (1000x1000px)
Créer un élément DOM invisible ou modal dimensionné à 1000x1000px, positionner l'en-tête de marque, le QR Code au centre (taille 500x500px), le nom du conseiller et la légende d'action. Utiliser `html2canvas` avec un facteur d'échelle `scale: 2`.

### Étape 3 : Composition du PDF Recto / Verso (85x55 mm)
Créer une instance `new jsPDF({ unit: 'mm', format: [85, 55], orientation: 'landscape' })`.
- **Recto** : Fond bleu marine profond `#0B1F3A`, logo doré, nom en gras, fonction et coordonnées.
- **Verso** : Fond blanc épuré avec fine bordure dorée, QR Code centré, coordonnées directes et site web officiel.

---

## 💻 Code / Configuration

### 1. Génération du QR Code avec Logo au Centre
```javascript
export function genererQRCodeDansConteneur(conteneurId, url, taille = 300) {
  const conteneur = document.getElementById(conteneurId);
  if (!conteneur) return;
  conteneur.innerHTML = '';

  new QRCode(conteneur, {
    text: url,
    width: taille,
    height: taille,
    colorDark: "#0B1F3A",
    colorLight: "#FFFFFF",
    correctLevel: QRCode.CorrectLevel.H // 30% de tolérance aux erreurs
  });
}
```

### 2. Export PNG Haute Résolution 1000x1000px
```javascript
export async function exporterCadrePNG(elementId, nomFichier) {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Élément #${elementId} introuvable`);

  const canvas = await html2canvas(element, {
    scale: 2, // 2x pour une netteté cristalline sur écrans Retina et impression
    useCORS: true,
    backgroundColor: '#0B1F3A',
    logging: false
  });

  const lien = document.createElement('a');
  lien.download = `${nomFichier}_1000px.png`;
  lien.href = canvas.toDataURL('image/png', 1.0);
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
}
```

### 3. Génération de Carte de Visite PDF (85x55mm Imprimeur)
```javascript
export async function genererCarteVisitePDF(commercial) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [85, 55]
  });

  // --- RECTO (Fond Sombre Prestige) ---
  doc.setFillColor(11, 31, 58); // #0B1F3A
  doc.rect(0, 0, 85, 55, 'F');

  // Bordure dorée intérieure fine
  doc.setDrawColor(201, 162, 39); // #C9A227
  doc.setLineWidth(0.5);
  doc.rect(3, 3, 79, 49);

  // Textes Recto
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`${commercial.prenom} ${commercial.nom}`, 7, 22);

  doc.setTextColor(201, 162, 39);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(commercial.poste.toUpperCase(), 7, 27);

  doc.setTextColor(200, 210, 225);
  doc.setFontSize(7);
  doc.text(`Tél : ${commercial.telephone}`, 7, 36);
  doc.text(`Email : ${commercial.email}`, 7, 41);
  doc.text(`Zone : ${commercial.zone || 'Dakar - Thiès'}`, 7, 46);

  // Marque en haut à droite
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text("LOU AME TAY 🍽️", 55, 10);

  // --- VERSO (Fond Blanc avec QR Code) ---
  doc.addPage([85, 55], 'landscape');
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 85, 55, 'F');

  // Bordure dorée
  doc.setDrawColor(201, 162, 39);
  doc.rect(3, 3, 79, 49);

  // Récupération de l'image du QR Code générée dans un canvas temporaire
  const tempDiv = document.createElement('div');
  new QRCode(tempDiv, {
    text: `https://www.louametay.online/carte.html?id=${commercial.id}`,
    width: 256,
    height: 256,
    correctLevel: QRCode.CorrectLevel.H
  });
  
  // Attendre la génération de l'image par qrcodejs
  const qrImg = tempDiv.querySelector('img') || tempDiv.querySelector('canvas');
  if (qrImg) {
    const qrDataUrl = qrImg.src || qrImg.toDataURL();
    doc.addImage(qrDataUrl, 'PNG', 27.5, 8, 30, 30);
  }

  doc.setTextColor(11, 31, 58);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text("SCANNEZ POUR ACCÉDER À MA CARTE", 42.5, 43, { align: 'center' });

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(6.5);
  doc.text("www.louametay.online • Solution CHR Sénégal", 42.5, 48, { align: 'center' });

  doc.save(`Carte_Visite_${commercial.prenom}_${commercial.nom}_85x55mm.pdf`);
}
```

---

## ⚠️ Pièges à éviter
1. **Niveau de correction d'erreur trop faible (L ou M)** : Si vous utilisez `CorrectLevel.L`, le QR Code sera illisible dès lors que vous poserez un logo au centre. Utilisez TOUJOURS `CorrectLevel.H`.
2. **Problème de CORS sur les images distantes avec `html2canvas`** : Si des images proviennent d'un bucket sans en-tête `Access-Control-Allow-Origin: *`, `html2canvas` échouera à capturer le canvas.
3. **QR Code trop petit sur le PDF imprimé** : Pour un scan fiable avec n'importe quel smartphone d'entrée de gamme, le QR Code imprimé sur papier ne doit jamais mesurer moins de 20x20 mm (30x30 mm est la taille idéale sur une carte 85x55mm).

---

## ✅ Checklist de validation
- [ ] Le QR Code généré se scanne en moins d'une seconde avec l'appareil photo d'un smartphone.
- [ ] L'image PNG exportée fait au minimum 1000x1000 pixels avec une netteté parfaite des textes.
- [ ] Le fichier PDF généré respecte scrupuleusement les dimensions 85x55 mm paysage.
- [ ] L'URL encodée dans le QR Code contient bien l'UUID Supabase réel du commercial.

---

## 🔗 Ressources liées
- [`06_cartes_digitales.md`](file:///C:/Users/DELL/Desktop/CRM%20LOUAMETAY.COM/lou-ame-tay-—-cartes-de-visite-digitales/lou-ame-tay-memory/SKILLS/06_cartes_digitales.md)
- [`PATTERNS/qr_export_png.md`](file:///C:/Users/DELL/Desktop/CRM%20LOUAMETAY.COM/lou-ame-tay-—-cartes-de-visite-digitales/lou-ame-tay-memory/PATTERNS/qr_export_png.md)
- [`PATTERNS/pdf_generation.md`](file:///C:/Users/DELL/Desktop/CRM%20LOUAMETAY.COM/lou-ame-tay-—-cartes-de-visite-digitales/lou-ame-tay-memory/PATTERNS/pdf_generation.md)

---

## 📊 Exemple concret (projet Lou Ame Tay)
Depuis le tableau d'administration de Lou Ame Tay ou directement depuis la carte du conseiller, un simple clic sur "▦ QR Code" ouvre le modal de prévisualisation HD et permet de télécharger en 1 seconde l'affiche PNG 1000px utilisée pour imprimer les stickers sur les chevalets de table en plexiglas et le PDF prêt à être remis à l'imprimeur à Thiès.
