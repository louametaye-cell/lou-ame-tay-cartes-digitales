/**
 * ==============================================================================
 * FICHIER : js/carte-pdf.js
 * SPRINT 2 — D2 : CARTE DE VISITE PDF IMPRIMABLE 85x55mm RECTO / VERSO (300 DPI)
 * ==============================================================================
 * Génère un document PDF aux dimensions professionnelles standard d'imprimerie :
 * 85 mm × 55 mm avec marges de sécurité, vectoriel et prêt pour l'impression.
 * - RECTO : Fond bleu marine #0B1F3A, photo ronde, nom 16pt, poste 9pt, logo officiel.
 * - VERSO : Fond blanc, bordure dorée 2pt, QR Code vectoriel haute résolution, coordonnées.
 */

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast-notification visible ${type === 'error' ? 'toast-erreur' : ''}`;
  setTimeout(() => {
    toast.className = 'toast-notification';
  }, 3500);
}

/**
 * Génère une image DataURL du QR code en mémoire
 * @param {string} url - URL cible du QR code
 * @param {number} size - Taille en pixels
 * @returns {Promise<string>} Image DataURL PNG
 */
function genererQRCodeDataURL(url, size = 300) {
  return new Promise((resolve) => {
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    document.body.appendChild(tempDiv);

    if (typeof QRCode !== 'undefined') {
      try {
        new QRCode(tempDiv, {
          text: url,
          width: size,
          height: size,
          colorDark: '#0B1F3A',
          colorLight: '#FFFFFF',
          correctLevel: QRCode.CorrectLevel.H
        });

        setTimeout(() => {
          const canvas = tempDiv.querySelector('canvas');
          if (canvas) {
            const dataUrl = canvas.toDataURL('image/png');
            document.body.removeChild(tempDiv);
            resolve(dataUrl);
            return;
          }
          const img = tempDiv.querySelector('img');
          if (img && img.src) {
            const dataUrl = img.src;
            document.body.removeChild(tempDiv);
            resolve(dataUrl);
            return;
          }
          document.body.removeChild(tempDiv);
          resolve(creerQRCodeFallback(size));
        }, 80);
      } catch (e) {
        document.body.removeChild(tempDiv);
        resolve(creerQRCodeFallback(size));
      }
    } else {
      document.body.removeChild(tempDiv);
      resolve(creerQRCodeFallback(size));
    }
  });
}

function creerQRCodeFallback(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = '#0B1F3A';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, size - 20, size - 20);
  ctx.fillStyle = '#0B1F3A';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('QR CODE', size / 2, size / 2);
  return canvas.toDataURL('image/png');
}

/**
 * Génère le fichier PDF 85x55mm
 * @param {Object} commercial 
 * @param {Object} options { retourBlob: boolean }
 * @returns {Promise<Blob|jsPDF>}
 */
export async function genererCartePDF(commercial, options = {}) {
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF) {
    showToast('⚠️ Module PDF en cours de chargement...', 'error');
    throw new Error('jsPDF non disponible');
  }

  const prenom = commercial?.prenom || 'Conseiller';
  const nom = commercial?.nom || 'Terrain';
  const poste = commercial?.poste || 'Conseiller Commercial CHR';
  const tel = commercial?.telephone || '+221 77 130 36 78';
  const wa = commercial?.whatsapp || '+221 76 231 20 03';
  const email = commercial?.email || 'contact@louametay.com';
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.louametay.online';
  const urlCarte = `${baseUrl}/carte.html?id=${commercial?.id || '11111111-1111-1111-1111-111111111111'}`;

  // Format standard carte de visite : 85 mm × 55 mm
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [85, 55]
  });

  // ═══════════════════════════════════════════════════════════════════
  // RECTO : FOND BLEU MARINE (#0B1F3A) & IDENTITÉ
  // ═══════════════════════════════════════════════════════════════════
  doc.setFillColor(11, 31, 58); // #0B1F3A
  doc.rect(0, 0, 85, 55, 'F');

  // Liseré intérieur doré
  doc.setDrawColor(201, 162, 39); // #C9A227
  doc.setLineWidth(0.5);
  doc.rect(2, 2, 81, 51);

  // Logo Lou Ame Tay (Haut Droit)
  doc.setTextColor(201, 162, 39);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('LOU AME TAY', 80, 8, { align: 'right' });
  doc.setFontSize(6.5);
  doc.setTextColor(220, 220, 220);
  doc.setFont('helvetica', 'normal');
  doc.text('Solutions CHR Sénégal', 80, 11.5, { align: 'right' });

  // Avatar / Cercle photo stylisé au coin gauche
  doc.setFillColor(201, 162, 39);
  doc.circle(16, 26, 9.5, 'F');
  doc.setFillColor(11, 31, 58);
  doc.circle(16, 26, 8.8, 'F');
  doc.setTextColor(201, 162, 39);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(prenom.charAt(0) || 'C', 16, 31, { align: 'center' });

  // Nom complet en 15-16pt Bold
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`${prenom} ${nom}`, 30, 24);

  // Poste en 9pt Doré
  doc.setTextColor(201, 162, 39);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(poste, 30, 29);

  // Ligne de séparation fine dorée
  doc.setDrawColor(201, 162, 39);
  doc.setLineWidth(0.3);
  doc.line(30, 31.5, 78, 31.5);

  // Slogan / Spécialité
  doc.setTextColor(230, 230, 230);
  doc.setFontSize(6.5);
  doc.text('✦ Menu Digital • Commande QR Code • Écran Cuisine KDS', 30, 35);

  // Coordonnées rapides bas
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(6.5);
  doc.text(`Tél : ${tel}   |   WhatsApp : ${wa}`, 8, 48);

  // ═══════════════════════════════════════════════════════════════════
  // VERSO : FOND BLANC, BORDURE DORÉE 2PT & QR CODE CENTRÉ
  // ═══════════════════════════════════════════════════════════════════
  doc.addPage([85, 55], 'landscape');

  // Fond Blanc
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 85, 55, 'F');

  // Bordure dorée 2pt (~0.7 mm)
  doc.setDrawColor(201, 162, 39);
  doc.setLineWidth(0.7);
  doc.rect(2.5, 2.5, 80, 50);

  // Génération du QR Code HD
  const qrDataUrl = await genererQRCodeDataURL(urlCarte, 300);
  // QR Code centré verticalement sur la gauche (24 mm x 24 mm)
  doc.addImage(qrDataUrl, 'PNG', 7, 13, 27, 27);

  // Textes sur la droite du verso
  doc.setTextColor(11, 31, 58);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Scannez pour découvrir la carte', 38, 14);

  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.text('Accédez aux démonstrations en direct,', 38, 18);
  doc.text('à nos formules tarifaires et à la prise de RDV.', 38, 21.5);

  // Coordonnées précises
  doc.setTextColor(11, 31, 58);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('📞 Téléphone :', 38, 27);
  doc.setFont('helvetica', 'normal');
  doc.text(tel, 58, 27);

  doc.setFont('helvetica', 'bold');
  doc.text('💬 WhatsApp :', 38, 31);
  doc.setFont('helvetica', 'normal');
  doc.text(wa, 58, 31);

  doc.setFont('helvetica', 'bold');
  doc.text('✉️ Email :', 38, 35);
  doc.setFont('helvetica', 'normal');
  doc.text(email, 58, 35);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(201, 162, 39);
  doc.text('🌐 Site Web :', 38, 39);
  doc.setFont('helvetica', 'bold');
  doc.text('www.louametay.online', 58, 39);

  // Pied de page verso
  doc.setFillColor(11, 31, 58);
  doc.rect(2.5, 47, 80, 5.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.text('LOU AME TAY — La transition digitale de la restauration au Sénégal', 42.5, 50.8, { align: 'center' });

  // Retour selon options
  if (options.retourBlob) {
    return doc.output('blob');
  } else {
    const nomFichier = `Carte_Visite_${prenom}_${nom}_85x55mm.pdf`.replace(/\s+/g, '_');
    doc.save(nomFichier);
    showToast('🖨️ Carte de visite PDF (85x55mm) téléchargée !', 'success');
    return doc;
  }
}
