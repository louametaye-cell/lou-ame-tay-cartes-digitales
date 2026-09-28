/**
 * ==============================================================================
 * FICHIER : js/qrcode-export.js
 * GÉNÉRATION & EXPORT DES SUPPORTS D'IMPRESSION HAUTE RÉSOLUTION (300 DPI)
 * ==============================================================================
 * 1. genererQRCodePNG(commercial) : PNG 1200x1400px (300 DPI) avec charte or & marine
 * 2. genererToutesCartesPDF(liste) : Planche A4 cartes 85x55mm avec repères de coupe
 * 3. genererSignatureEmail(commercial) : Signature HTML pour Gmail / Outlook
 * 4. exporterDonneesCSV(liste) : Export Excel UTF-8
 */

/**
 * 1. Génère un QR Code dynamique dans un conteneur HTML
 */
export function genererQRCode(url, conteneur, taille = 260) {
  if (!conteneur) return null;
  conteneur.innerHTML = '';

  if (typeof QRCode !== 'undefined') {
    try {
      new QRCode(conteneur, {
        text: url,
        width: taille,
        height: taille,
        colorDark: "#0B1F3A",
        colorLight: "#FFFFFF",
        correctLevel: QRCode.CorrectLevel.H
      });
      return conteneur;
    } catch (e) {
      console.warn('Fallback QR code image :', e);
    }
  }

  // Fallback image en ligne haute résolution
  const img = document.createElement('img');
  img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${taille}x${taille}&margin=4&data=${encodeURIComponent(url)}`;
  img.alt = "QR code Lou Ame Tay";
  img.crossOrigin = "anonymous";
  img.width = taille;
  img.height = taille;
  conteneur.appendChild(img);
  return conteneur;
}

/**
 * 2. Télécharge un QR Code PNG Haute Définition (1200x1400px, 300 DPI)
 * @param {Object} commercial
 */
export async function genererQRCodePNG(commercial) {
  const urlCarte = `${window.location.origin}/carte.html?id=${encodeURIComponent(commercial.id)}`;

  // Création du gabarit haute définition 1200x1400px
  const conteneurTemp = document.createElement('div');
  conteneurTemp.style.position = 'fixed';
  conteneurTemp.style.left = '-9999px';
  conteneurTemp.style.top = '0';
  conteneurTemp.style.width = '1200px';
  conteneurTemp.style.height = '1400px';
  conteneurTemp.style.background = '#FFFFFF';
  conteneurTemp.style.padding = '80px 70px';
  conteneurTemp.style.boxSizing = 'border-box';
  conteneurTemp.style.display = 'flex';
  conteneurTemp.style.flexDirection = 'column';
  conteneurTemp.style.justifyContent = 'space-between';
  conteneurTemp.style.alignItems = 'center';
  conteneurTemp.style.fontFamily = "'Poppins', system-ui, -apple-system, sans-serif";
  conteneurTemp.style.border = '24px solid #C9A227'; // Bordure dorée Lou Ame Tay
  conteneurTemp.style.borderRadius = '40px';

  conteneurTemp.innerHTML = `
    <!-- En-tête Marque & Logo -->
    <div style="text-align: center; width: 100%; display: flex; flex-direction: column; align-items: center;">
      <div style="display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 12px;">
        <img src="images/logo.png" onerror="this.onerror=null; this.src='images/logo.svg';" style="width: 84px; height: 84px; object-fit: contain;">
        <span style="font-size: 52px; font-weight: 800; color: #0B1F3A; letter-spacing: -0.5px;">LOU AME TAY 🍽️</span>
      </div>
      <p style="font-size: 24px; font-weight: 700; color: #C9A227; text-transform: uppercase; letter-spacing: 3px; margin: 0;">
        La transition digitale de la restauration au Sénégal
      </p>
    </div>

    <!-- Cadre QR Code Central (600x600px) -->
    <div id="temp-qr-rendu" style="padding: 32px; background: #FFFFFF; border-radius: 28px; box-shadow: 0 12px 50px rgba(11, 31, 58, 0.15); display: flex; align-items: center; justify-content: center; border: 4px solid #F1F5F9;"></div>

    <!-- Identité du commercial -->
    <div style="text-align: center; width: 100%;">
      <div style="font-size: 46px; font-weight: 800; color: #0B1F3A; margin-bottom: 8px;">
        ${commercial.prenom} ${commercial.nom}
      </div>
      <div style="font-size: 26px; font-weight: 600; color: #9E7D17; margin-bottom: 18px;">
        ${commercial.poste || 'Conseiller Terrain CHR'} • Lou Ame Tay
      </div>
      <div style="display: inline-block; background: #F8FAFC; border: 2px solid #E2E8F0; padding: 14px 34px; border-radius: 50px; font-size: 22px; color: #334155; font-weight: 600;">
        📱 Scannez pour ouvrir la carte & enregistrer le contact
      </div>
    </div>
  `;

  document.body.appendChild(conteneurTemp);

  const qrBox = conteneurTemp.querySelector('#temp-qr-rendu');
  genererQRCode(urlCarte, qrBox, 560);

  // Laisser 450ms pour le rendu graphique
  await new Promise(resolve => setTimeout(resolve, 450));

  try {
    if (typeof html2canvas === 'undefined') {
      throw new Error("Bibliothèque html2canvas non chargée.");
    }

    const canvas = await html2canvas(conteneurTemp, {
      scale: 1,
      width: 1200,
      height: 1400,
      backgroundColor: '#FFFFFF',
      useCORS: true,
      logging: false
    });

    const nomPropre = `${commercial.prenom}_${commercial.nom}`
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, '_');

    const nomFichier = `QR_${nomPropre}_LouAmeTay.png`;

    const lien = document.createElement('a');
    lien.download = nomFichier;
    lien.href = canvas.toDataURL('image/png');
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);

  } catch (err) {
    console.error('Erreur export PNG :', err);
    throw err;
  } finally {
    document.body.removeChild(conteneurTemp);
  }
}

// Alias pour compatibilité
export const telechargerQRCodePNG = genererQRCodePNG;

/**
 * 3. Ouvre la modale de prévisualisation QR Code
 */
export function ouvrirModalPreviewQR(commercial) {
  const modal = document.getElementById('modal-qr-preview');
  const nomEl = document.getElementById('modal-qr-nom');
  const posteEl = document.getElementById('modal-qr-poste');
  const carteNomEl = document.getElementById('modal-qr-carte-nom');
  const cartePosteEl = document.getElementById('modal-qr-carte-poste');
  const renduQR = document.getElementById('modal-qrcode-rendu');

  if (nomEl) nomEl.textContent = `QR Code — ${commercial.prenom} ${commercial.nom}`;
  if (posteEl) posteEl.textContent = commercial.poste || 'Conseiller terrain Lou Ame Tay';
  if (carteNomEl) carteNomEl.textContent = `${commercial.prenom} ${commercial.nom}`;
  if (cartePosteEl) cartePosteEl.textContent = commercial.poste || 'Conseiller CHR';

  const urlCarte = `${window.location.origin}/carte.html?id=${encodeURIComponent(commercial.id)}`;
  genererQRCode(urlCarte, renduQR, 220);

  if (modal) modal.classList.add('active');
}

/**
 * 4. Télécharge toutes les cartes en PDF A4 au format carte de visite standard 85x55mm
 * Imprime une planche avec lignes de coupe en pointillés
 * @param {Array} listeCommerciaux
 */
export async function telechargerToutesCartesPDF(listeCommerciaux) {
  if (!listeCommerciaux || listeCommerciaux.length === 0) {
    alert("Aucun commercial actif à exporter.");
    return;
  }

  if (typeof window.jspdf === 'undefined' && typeof jsPDF === 'undefined') {
    alert("La bibliothèque jsPDF n'a pas pu être chargée.");
    return;
  }

  const { jsPDF } = window.jspdf || window;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const cardW = 85;
  const cardH = 55;
  const cols = 2;
  const rows = 5; // 10 cartes par page A4
  const cardsPerPage = cols * rows;

  const startX = (210 - (cols * cardW)) / 2; // 20mm
  const startY = (297 - (rows * cardH)) / 2; // 11mm

  for (let i = 0; i < listeCommerciaux.length; i++) {
    const c = listeCommerciaux[i];
    const indexOnPage = i % cardsPerPage;

    if (i > 0 && indexOnPage === 0) {
      doc.addPage();
    }

    const col = indexOnPage % cols;
    const row = Math.floor(indexOnPage / cols);

    const x = startX + (col * cardW);
    const y = startY + (row * cardH);

    // Fond blanc avec bordure pointillée pour la découpe
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.setLineDashPattern([2, 2], 0);
    doc.rect(x, y, cardW, cardH, 'FD');
    doc.setLineDashPattern([], 0); // Réinitialiser pointillés

    // Bande dorée supérieure
    doc.setFillColor(201, 162, 39);
    doc.rect(x, y, cardW, 2, 'F');

    // Logo & Marque
    doc.setTextColor(11, 31, 58);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('LOU AME TAY 🍽️', x + 4, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(158, 125, 23);
    doc.text('Transition Digitale CHR Sénégal', x + 4, y + 10);

    // Nom & Prénom
    doc.setTextColor(11, 31, 58);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`${c.prenom} ${c.nom}`, x + 4, y + 17.5);

    // Poste
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(180, 83, 9);
    doc.text((c.poste || 'Conseiller Terrain CHR').substring(0, 32), x + 4, y + 21.5);

    // Ligne séparatrice
    doc.setDrawColor(226, 232, 240);
    doc.line(x + 4, y + 23.5, x + 46, y + 23.5);

    // Coordonnées
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(51, 65, 85);

    let curY = y + 28;
    if (c.telephone) {
      doc.text(`Tél : ${c.telephone}`, x + 4, curY);
      curY += 3.8;
    }
    if (c.whatsapp) {
      doc.text(`WA : +${c.whatsapp.replace(/\D/g, '')}`, x + 4, curY);
      curY += 3.8;
    }
    if (c.email) {
      doc.text(`Email : ${c.email}`, x + 4, curY);
      curY += 3.8;
    }
    doc.text(`Zone : ${(c.zone || 'Dakar — Thiès').substring(0, 24)}`, x + 4, curY);

    // QR Code 33x33mm scannable à droite
    const urlCarte = `${window.location.origin}/carte.html?id=${encodeURIComponent(c.id)}`;
    const qrDataUrl = await genererDataURLQRCode(urlCarte, 280);

    if (qrDataUrl) {
      const qrSize = 33;
      const qrX = x + cardW - qrSize - 4;
      const qrY = y + 11;

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(qrX - 1, qrY - 1, qrSize + 2, qrSize + 2, 1, 1, 'FD');

      doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

      doc.setFontSize(5);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');
      doc.text('SCANNEZ POUR', qrX + (qrSize / 2), qrY + qrSize + 3, { align: 'center' });
      doc.text('OUVRIR LA CARTE', qrX + (qrSize / 2), qrY + qrSize + 5.5, { align: 'center' });
    }
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`LouAmeTay_Cartes_${dateStr}.pdf`);
}

/**
 * Helper de conversion QR Code en DataURL
 */
function genererDataURLQRCode(texte, taille = 300) {
  return new Promise((resolve) => {
    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.left = '-9999px';
    document.body.appendChild(div);

    try {
      if (typeof QRCode !== 'undefined') {
        new QRCode(div, {
          text: texte,
          width: taille,
          height: taille,
          colorDark: "#0B1F3A",
          colorLight: "#FFFFFF",
          correctLevel: QRCode.CorrectLevel.M
        });

        setTimeout(() => {
          const img = div.querySelector('img');
          const canvas = div.querySelector('canvas');
          let dataUrl = null;
          if (canvas) {
            dataUrl = canvas.toDataURL('image/png');
          } else if (img && img.src) {
            dataUrl = img.src;
          }
          document.body.removeChild(div);
          resolve(dataUrl);
        }, 160);
      } else {
        document.body.removeChild(div);
        resolve(null);
      }
    } catch (e) {
      if (div.parentNode) document.body.removeChild(div);
      resolve(null);
    }
  });
}

/**
 * 5. Génère une signature email HTML professionnelle (Gmail / Outlook)
 * @param {Object} commercial
 * @returns {string} Code HTML de la signature
 */
export function genererSignatureEmail(commercial) {
  const urlCarte = `${window.location.origin}/carte.html?id=${encodeURIComponent(commercial.id)}`;
  const photoUrl = commercial.photo_url || commercial.photo || `${window.location.origin}/images/commercial1.jpg`;
  const logoUrl = `${window.location.origin}/images/logo.png`;

  return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; font-size: 13px; color: #1E293B; line-height: 1.4; max-width: 480px;">
  <tr>
    <td style="vertical-align: top; padding-right: 16px; border-right: 2px solid #C9A227;">
      <img src="${photoUrl}" alt="${commercial.prenom} ${commercial.nom}" width="75" height="94" style="border-radius: 6px; object-fit: cover; display: block; border: 1px solid #E2E8F0;" />
    </td>
    <td style="vertical-align: top; padding-left: 16px;">
      <div style="font-size: 16px; font-weight: bold; color: #0B1F3A; margin-bottom: 2px;">
        ${commercial.prenom} ${commercial.nom}
      </div>
      <div style="font-size: 12px; font-weight: bold; color: #C9A227; text-transform: uppercase; margin-bottom: 6px;">
        ${commercial.poste || 'Conseiller Terrain CHR'} • Lou Ame Tay
      </div>
      <div style="font-size: 12px; color: #475569; margin-bottom: 2px;">
        📞 <strong>Tél :</strong> <a href="tel:${commercial.telephone}" style="color: #0B1F3A; text-decoration: none;">${commercial.telephone}</a>
      </div>
      <div style="font-size: 12px; color: #475569; margin-bottom: 2px;">
        💬 <strong>WhatsApp :</strong> <a href="https://wa.me/${(commercial.whatsapp || '').replace(/\D/g, '')}" style="color: #166534; text-decoration: none;">+${(commercial.whatsapp || '').replace(/\D/g, '')}</a>
      </div>
      <div style="font-size: 12px; color: #475569; margin-bottom: 8px;">
        ✉️ <strong>Email :</strong> <a href="mailto:${commercial.email}" style="color: #0B1F3A; text-decoration: none;">${commercial.email}</a>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <img src="${logoUrl}" alt="Lou Ame Tay" width="22" height="22" style="vertical-align: middle;" />
        <a href="${urlCarte}" target="_blank" style="display: inline-block; background: #0B1F3A; color: #FFFFFF; padding: 4px 10px; border-radius: 4px; font-size: 11px; text-decoration: none; font-weight: bold;">
          📲 Ouvrir ma carte de visite digitale ↗
        </a>
      </div>
    </td>
  </tr>
</table>
  `.trim();
}

/**
 * 6. Export des données des commerciaux en CSV Excel UTF-8
 */
export function exporterDonneesCSV(liste) {
  if (!liste || liste.length === 0) {
    alert("Aucune donnée commerciale à exporter.");
    return;
  }

  const enTetes = ['ID', 'Prénom', 'Nom', 'Poste', 'Catégorie', 'Téléphone', 'WhatsApp', 'Email', 'Zone', 'Statut Actif', 'Lien Carte'];
  const lignes = liste.map(c => [
    `"${c.id}"`,
    `"${c.prenom}"`,
    `"${c.nom}"`,
    `"${c.poste || ''}"`,
    `"${c.categorie || ''}"`,
    `"${c.telephone || ''}"`,
    `"${c.whatsapp || ''}"`,
    `"${c.email || ''}"`,
    `"${c.zone || ''}"`,
    `"${c.actif !== false ? 'OUI' : 'NON'}"`,
    `"${window.location.origin}/carte.html?id=${c.id}"`
  ]);

  const contenuCSV = '\uFEFF' + [enTetes.join(';'), ...lignes.map(l => l.join(';'))].join('\r\n');
  const blob = new Blob([contenuCSV], { type: 'text/csv;charset=utf-8;' });
  const lien = document.createElement('a');
  lien.href = URL.createObjectURL(blob);
  lien.download = `Commerciaux_LouAmeTay_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
}
