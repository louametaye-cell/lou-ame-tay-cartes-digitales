# PATTERN : Génération de Cartes de Visite PDF (85x55mm Recto/Verso) avec jsPDF

> **Langage** : JavaScript (ESM)  
> **Bibliothèque** : `jspdf` (v2.5+)  
> **Standard** : Format d'impression standard international (85x55 mm paysage)  

---

## 🎯 Objectif
Générer à la volée côté navigateur un document PDF vectoriel de 2 pages (Recto / Verso) conforme aux standards des imprimeurs professionnels :
- **Page 1 (Recto)** : Fond sombre `#0B1F3A`, bordure dorée prestige `#C9A227`, nom en grand, fonction, coordonnées complètes et logo.
- **Page 2 (Verso)** : Fond blanc épuré, QR code scannable haute tolérance de 30x30 mm, instructions de scan et mentions légales.

---

## 💻 Code Réutilisable

```javascript
/**
 * Génère et télécharge une carte de visite PDF recto-verso 85x55 mm
 * @param {Object} commercial - Données complètes du conseiller
 */
export async function genererCarteVisitePDF85x55(commercial) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    throw new Error('Bibliothèque jsPDF introuvable. Veuillez inclure jspdf.umd.min.js.');
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [85, 55] // 85 mm de largeur x 55 mm de hauteur
  });

  // ============================================================================
  // PAGE 1 : RECTO (Fond Bleu Marine Prestige)
  // ============================================================================
  doc.setFillColor(11, 31, 58); // #0B1F3A
  doc.rect(0, 0, 85, 55, 'F');

  // Bordure dorée intérieure fine (marge de 3 mm)
  doc.setDrawColor(201, 162, 39); // #C9A227
  doc.setLineWidth(0.4);
  doc.rect(3, 3, 79, 49);

  // Logo / Marque en haut à droite
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text("LOU AME TAY 🍽️", 54, 9.5);

  doc.setTextColor(201, 162, 39);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.text("SOLUTIONS CHR SÉNÉGAL", 54, 13);

  // Nom complet du conseiller
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  const nomComplet = `${commercial.prenom} ${commercial.nom}`;
  // Réduction automatique de police si le nom est long
  const taillePoliceNom = nomComplet.length > 20 ? 11 : 13;
  doc.setFontSize(taillePoliceNom);
  doc.text(nomComplet, 7, 23);

  // Fonction / Poste
  doc.setTextColor(201, 162, 39);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text((commercial.poste || 'Conseiller Terrain CHR').toUpperCase(), 7, 28);

  // Séparateur fin
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.2);
  doc.line(7, 31, 45, 31);

  // Bloc Coordonnées
  doc.setTextColor(220, 230, 245);
  doc.setFontSize(6.5);
  doc.text(`📞 Tél : ${commercial.telephone || '+221 -- --- -- --'}`, 7, 36);
  doc.text(`💬 WhatsApp : ${commercial.whatsapp || commercial.telephone}`, 7, 40.5);
  doc.text(`✉️ Email : ${commercial.email || 'contact@louametay.com'}`, 7, 45);
  doc.text(`📍 Zone : ${commercial.zone || 'Dakar — Thiès — Mbour'}`, 7, 49.5);

  // ============================================================================
  // PAGE 2 : VERSO (Fond Blanc avec QR Code Haute Précision)
  // ============================================================================
  doc.addPage([85, 55], 'landscape');
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 85, 55, 'F');

  // Bordure dorée
  doc.setDrawColor(201, 162, 39);
  doc.setLineWidth(0.4);
  doc.rect(3, 3, 79, 49);

  // Création du QR Code dans un conteneur éphémère
  const divTemp = document.createElement('div');
  const urlCarte = `https://www.louametay.online/carte.html?id=${commercial.id}`;
  
  new QRCode(divTemp, {
    text: urlCarte,
    width: 256,
    height: 256,
    colorDark: '#0B1F3A',
    colorLight: '#FFFFFF',
    correctLevel: QRCode.CorrectLevel.H
  });

  // Extraction de l'image base64
  const qrImg = divTemp.querySelector('img') || divTemp.querySelector('canvas');
  if (qrImg) {
    const dataUrl = qrImg.src || qrImg.toDataURL();
    // Incrustation du QR Code centré (largeur 28 mm, hauteur 28 mm)
    // Coordonnée X = (85 - 28) / 2 = 28.5 mm
    doc.addImage(dataUrl, 'PNG', 28.5, 7.5, 28, 28);
  }

  // Textes d'instruction sous le QR Code
  doc.setTextColor(11, 31, 58);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text("SCANNEZ AVEC VOTRE SMARTPHONE", 42.5, 41, { align: 'center' });

  doc.setTextColor(201, 162, 39);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text("Pour enregistrer le contact & découvrir nos menus digitaux", 42.5, 45, { align: 'center' });

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(5.5);
  doc.text("Lou Ame Tay • www.louametay.online • Thiès — Dakar — Mbour", 42.5, 49.5, { align: 'center' });

  // Sauvegarde et téléchargement immédiat
  const nomFichier = `Carte_Visite_${commercial.prenom}_${commercial.nom}_85x55mm.pdf`.replace(/\s+/g, '_');
  doc.save(nomFichier);
}
```
