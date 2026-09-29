# PATTERN : Export de QR Code Haute Définition (PNG 1000x1000px)

> **Langage** : JavaScript (ESM) & CSS  
> **Bibliothèques** : `qrcodejs` (1.0.0), `html2canvas` (1.4.1)  
> **Cas d'usage** : Impression de chevalets de table, stickers vitrine, dépliants publicitaires  

---

## 🎯 Objectif
Générer dynamiquement un visuel de marque carré de 1000x1000 pixels combinant :
- Le logo de l'entreprise.
- Un QR code scannable haute tolérance (CorrectLevel.H).
- Le nom et la fonction du collaborateur.
- Une instruction de scan claire.
- Le tout exporté sous forme de fichier image PNG téléchargeable en 1 clic sans dépendre d'un serveur d'imagerie lourd.

---

## 💻 Structure HTML du Cadre d'Export (1000x1000px)

```html
<!-- Cadre visuel optimisé pour la capture (caché hors écran ou dans un modal) -->
<div id="qr-export-cadre" class="qr-export-cadre-visuel">
  <div class="qr-export-logo-ligne">
    <img src="images/logo.svg" alt="Logo" class="qr-export-logo-img" width="48" height="48">
    <div class="qr-export-marque-titre">LOU AME TAY 🍽️</div>
  </div>

  <div id="qr-export-code-centre" class="qr-export-code-centre"></div>

  <div class="qr-export-infos-bas">
    <strong id="qr-export-nom" class="qr-export-nom">Mamadou Diallo</strong>
    <span id="qr-export-poste" class="qr-export-poste">Directeur Commercial & Grands Comptes</span>
    <span class="qr-export-instruction">Scannez pour ouvrir la carte & enregistrer le contact</span>
  </div>
</div>
```

---

## 🎨 Styles CSS du Cadre

```css
.qr-export-cadre-visuel {
  width: 500px;
  height: 500px;
  background-color: #0B1F3A;
  border: 4px solid #C9A227;
  border-radius: 24px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  font-family: 'Poppins', sans-serif;
  color: #FFFFFF;
}

.qr-export-logo-ligne {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.qr-export-marque-titre {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 1px;
}

.qr-export-code-centre {
  background: #FFFFFF;
  padding: 12px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-export-infos-bas {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.25rem;
}

.qr-export-nom {
  font-size: 1.15rem;
  color: #FFFFFF;
}

.qr-export-poste {
  font-size: 0.85rem;
  color: #C9A227;
}

.qr-export-instruction {
  font-size: 0.75rem;
  color: #94A3B8;
  margin-top: 0.25rem;
}
```

---

## 🚀 Logique JavaScript d'Exportation

```javascript
/**
 * Génère le QR Code et télécharge l'image PNG 1000x1000px
 * @param {string} url - URL de destination du QR Code
 * @param {string} nomCommercial - Nom affiché sur le support
 * @param {string} posteCommercial - Fonction affichée sur le support
 */
export async function exporterQRCodeHD(url, nomCommercial, posteCommercial) {
  const conteneurQR = document.getElementById('qr-export-code-centre');
  const cadre = document.getElementById('qr-export-cadre');
  const elNom = document.getElementById('qr-export-nom');
  const elPoste = document.getElementById('qr-export-poste');

  if (!cadre || !conteneurQR) return;

  // Mise à jour des textes
  if (elNom) elNom.textContent = nomCommercial;
  if (elPoste) elPoste.textContent = posteCommercial;

  // Génération du QR Code
  conteneurQR.innerHTML = '';
  new QRCode(conteneurQR, {
    text: url,
    width: 250,
    height: 250,
    colorDark: '#0B1F3A',
    colorLight: '#FFFFFF',
    correctLevel: QRCode.CorrectLevel.H // Tolérance maximale 30%
  });

  // Laisser 200ms pour le rendu complet du canvas QRCode
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Rastérisation en résolution x2 (500px -> 1000px)
  const canvas = await html2canvas(cadre, {
    scale: 2, // Produit une image exactement de 1000x1000 px
    useCORS: true,
    backgroundColor: '#0B1F3A',
    logging: false
  });

  // Déclenchement du téléchargement
  const nomFichierNettoye = nomCommercial.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
  const lien = document.createElement('a');
  lien.download = `QRCode_LouAmeTay_${nomFichierNettoye}_1000px.png`;
  lien.href = canvas.toDataURL('image/png', 1.0);
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
}
```
