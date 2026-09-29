/**
 * ==============================================================================
 * FICHIER : js/kit-networking.js
 * SPRINT 2 — D1 : GÉNÉRATEUR KIT NETWORKING COMPLET EN ARCHIVE ZIP (< 2 Mo)
 * ==============================================================================
 * Assemble et compresse instantanément les 6 outils essentiels du commercial :
 * 1. contact.vcf       - Fiche contact vCard 3.0 smartphone (iPhone / Android)
 * 2. qr_code.png       - QR Code haute définition 1000x1000px prêt à imprimer
 * 3. carte_visite.pdf  - Format d'imprimerie 85x55mm recto/verso via jsPDF
 * 4. signature_email.html - Signature professionnelle table-based pour Gmail/Outlook
 * 5. message_whatsapp.txt - Argumentaire de prospection commerciale CHR pré-rédigé
 * 6. LISEZ-MOI.txt     - Mode d'emploi et guide d'utilisation terrain
 */

import { genererCartePDF } from './carte-pdf.js';
import { genererSignatureHTML } from './signature-email.js';

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
 * Génère un QR Code HD 1000x1000px au format Blob PNG
 * @param {string} url 
 * @returns {Promise<Blob>}
 */
function genererQRCodeHD(url) {
  return new Promise((resolve) => {
    const size = 1000;
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
            canvas.toBlob((blob) => {
              document.body.removeChild(tempDiv);
              resolve(blob);
            }, 'image/png');
            return;
          }
          document.body.removeChild(tempDiv);
          resolve(creerCanvasFallbackHD(size));
        }, 120);
      } catch (e) {
        document.body.removeChild(tempDiv);
        resolve(creerCanvasFallbackHD(size));
      }
    } else {
      document.body.removeChild(tempDiv);
      resolve(creerCanvasFallbackHD(size));
    }
  });
}

function creerCanvasFallbackHD(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = '#0B1F3A';
  ctx.lineWidth = 12;
  ctx.strokeRect(30, 30, size - 60, size - 60);
  ctx.fillStyle = '#0B1F3A';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('LOU AME TAY — QR CODE HD', size / 2, size / 2);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

/**
 * Génère le fichier vCard 3.0 (.vcf)
 * @param {Object} c - Données du commercial
 * @param {string} urlCarte 
 * @returns {string}
 */
function genererVCardTexte(c, urlCarte) {
  const prenom = c.prenom || '';
  const nom = c.nom || '';
  const tel = (c.telephone || '').replace(/\s+/g, '');
  const wa = (c.whatsapp || '').replace(/\D/g, '');
  const email = c.email || 'contact@louametay.com';
  const poste = c.poste || 'Conseiller Commercial Terrain CHR';
  const bio = (c.bio || 'Lou Ame Tay — Solution Menu Digital & Commande QR Code').replace(/\r?\n/g, ' ');

  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${nom};${prenom};;;`,
    `FN:${prenom} ${nom}`,
    `ORG:Lou Ame Tay;Restauration & Hôtellerie Sénégal`,
    `TITLE:${poste}`,
    `TEL;TYPE=CELL,VOICE,PREF:${tel}`,
    `TEL;TYPE=WHATSAPP:+${wa}`,
    `EMAIL;TYPE=WORK,INTERNET:${email}`,
    `URL:${urlCarte}`,
    `NOTE:${bio}`,
    'ADR;TYPE=WORK:;;Thiès / Dakar;Sénégal;;;SN',
    'END:VCARD'
  ].join('\r\n');
}

/**
 * Génère le message WhatsApp de prospection prêt à l'emploi
 * @param {Object} c 
 * @param {string} urlCarte 
 * @returns {string}
 */
function genererMessageWhatsAppTexte(c, urlCarte) {
  return `Bonjour M./Mme le Gérant,\n\n` +
    `Je suis ${c.prenom} ${c.nom}, conseiller terrain chez Lou Ame Tay au Sénégal.\n\n` +
    `Nous équipons les restaurants, cafés et complexes hôteliers de notre solution de Menu Digital interactif QR Code et d'Écran Cuisine (KDS) en temps réel.\n\n` +
    `✦ Vos bénéfices immédiats :\n` +
    `• +25% sur le ticket moyen dès le premier mois\n` +
    `• -90% d'erreurs lors des coups de feu\n` +
    `• Paiements instantanés par Wave & Orange Money\n` +
    `• Support technique et déploiement sous 48h\n\n` +
    `Découvrez ma carte de visite digitale avec toutes nos démos en direct :\n${urlCarte}\n\n` +
    `À votre disposition pour une démonstration de 15 minutes dans votre établissement !\n\n` +
    `Cordialement,\n${c.prenom} ${c.nom}\n${c.telephone || '+221 77 130 36 78'}`;
}

/**
 * Génère le guide LISEZ-MOI.txt pour le commercial
 * @param {Object} c 
 * @param {string} urlCarte 
 * @returns {string}
 */
function genererLisezMoiTexte(c, urlCarte) {
  return `═════════════════════════════════════════════════════════════════════\r\n` +
    `   LOU AME TAY — PACK KIT NETWORKING TERRAIN DU CONSEILLER\r\n` +
    `═════════════════════════════════════════════════════════════════════\r\n\r\n` +
    `Conseiller(ère) : ${c.prenom} ${c.nom}\r\n` +
    `Poste           : ${c.poste || 'Conseiller Commercial CHR'}\r\n` +
    `Téléphone       : ${c.telephone || ''}\r\n` +
    `WhatsApp Pro    : ${c.whatsapp || ''}\r\n` +
    `Carte Digitale  : ${urlCarte}\r\n` +
    `Plateforme Web  : https://www.louametay.online\r\n\r\n` +
    `---------------------------------------------------------------------\r\n` +
    `CONTENU DE VOTRE PACK NETWORKING (6 OUTILS INCLUS) :\r\n` +
    `---------------------------------------------------------------------\r\n\r\n` +
    `1. contact.vcf\r\n` +
    `   -> Fichier de contact électronique standard (vCard 3.0).\r\n` +
    `   -> Envoyez-le par WhatsApp ou Bluetooth à un prospect : en 1 clic,\r\n` +
    `      toutes vos coordonnées s'enregistrent dans son répertoire smartphone.\r\n\r\n` +
    `2. qr_code.png\r\n` +
    `   -> Votre QR Code officiel en très haute définition (1000x1000px).\r\n` +
    `   -> Idéal pour vos supports imprimés, chevalets de table, kakémonos\r\n` +
    `      ou pour l'afficher en fond d'écran sur votre smartphone lors des salons.\r\n\r\n` +
    `3. carte_visite.pdf\r\n` +
    `   -> Votre carte de visite au format d'impression standard (85 mm x 55 mm).\r\n` +
    `   -> Fichier prêt pour l'imprimeur (Recto bleu marine #0B1F3A + Verso avec QR code).\r\n\r\n` +
    `4. signature_email.html\r\n` +
    `   -> Signature email professionnelle table-based compatible Gmail, Outlook et Apple Mail.\r\n` +
    `   -> Ouvrez ce fichier dans un navigateur, sélectionnez tout (Ctrl+A), copiez (Ctrl+C)\r\n` +
    `      et collez directement dans les paramètres de signature de votre boîte mail.\r\n\r\n` +
    `5. message_whatsapp.txt\r\n` +
    `   -> Message de prise de contact commercial optimisé pour les restaurateurs.\r\n` +
    `   -> Prêt à être copié et envoyé lors de vos démarches de prospection.\r\n\r\n` +
    `6. LISEZ-MOI.txt\r\n` +
    `   -> Ce présent guide récapitulatif.\r\n\r\n` +
    `═════════════════════════════════════════════════════════════════════\r\n` +
    `Lou Ame Tay — La transition digitale de la restauration au Sénégal.\r\n` +
    `Support Hotline : +221 76 231 20 03 | contact@louametay.com\r\n`;
}

/**
 * Fonction maîtresse : génère et télécharge le Pack Kit Networking ZIP
 * @param {Object} commercial 
 */
export async function genererKitNetworking(commercial) {
  if (typeof window.JSZip === 'undefined') {
    showToast('⚠️ Chargement du module ZIP en cours, veuillez patienter...', 'error');
    return;
  }

  const prenom = commercial?.prenom || 'Conseiller';
  const nom = commercial?.nom || 'Terrain';
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.louametay.online';
  const urlCarte = `${baseUrl}/carte.html?id=${commercial?.id || '11111111-1111-1111-1111-111111111111'}`;

  // Récupérer le bouton pour état de chargement
  const boutonsKit = document.querySelectorAll('.btn-outil-kit, #btn-kit, #btn-telecharger-kit');
  boutonsKit.forEach(b => {
    b.dataset.origText = b.textContent;
    b.textContent = '⏳ Génération du Pack ZIP...';
    b.disabled = true;
  });

  try {
    const zip = new window.JSZip();

    // 1. contact.vcf
    const vcardContenu = genererVCardTexte(commercial, urlCarte);
    zip.file('contact.vcf', vcardContenu);

    // 2. qr_code.png (HD 1000x1000)
    const qrBlob = await genererQRCodeHD(urlCarte);
    zip.file('qr_code.png', qrBlob);

    // 3. carte_visite.pdf (85x55mm)
    try {
      const pdfBlob = await genererCartePDF(commercial, { retourBlob: true });
      zip.file('carte_visite.pdf', pdfBlob);
    } catch (ePdf) {
      console.warn('Génération PDF dans ZIP reportée :', ePdf);
    }

    // 4. signature_email.html
    const signatureHtml = genererSignatureHTML(commercial);
    zip.file('signature_email.html', signatureHtml);

    // 5. message_whatsapp.txt
    const messageWa = genererMessageWhatsAppTexte(commercial, urlCarte);
    zip.file('message_whatsapp.txt', messageWa);

    // 6. LISEZ-MOI.txt
    const lisezMoi = genererLisezMoiTexte(commercial, urlCarte);
    zip.file('LISEZ-MOI.txt', lisezMoi);

    // Génération du blob ZIP final
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    // Téléchargement dans le navigateur
    const nomZip = `Kit_Networking_${prenom}_${nom}.zip`.replace(/\s+/g, '_');
    const lien = document.createElement('a');
    lien.href = URL.createObjectURL(zipBlob);
    lien.download = nomZip;
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);
    URL.revokeObjectURL(lien.href);

    showToast(`📦 Pack Kit Networking (${(zipBlob.size / 1024).toFixed(0)} Ko) téléchargé !`, 'success');
  } catch (err) {
    console.error('Erreur génération Kit Networking ZIP :', err);
    showToast('❌ Erreur lors de la création du ZIP.', 'error');
  } finally {
    boutonsKit.forEach(b => {
      b.textContent = b.dataset.origText || '📦 Télécharger mon kit networking';
      b.disabled = false;
    });
  }
}
