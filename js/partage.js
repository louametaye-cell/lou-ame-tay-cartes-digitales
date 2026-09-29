/**
 * ==============================================================================
 * FICHIER : js/partage.js
 * SPRINT 1 — E2 : BOUTON & MODAL "PARTAGER AVEC UN COLLÈGUE" (4 OPTIONS)
 * ==============================================================================
 * Gère le partage viral entre pairs du secteur CHR avec 4 options indépendantes :
 * 1. WhatsApp (message pré-rédigé avec lien de parrainage)
 * 2. Email (mailto pré-rempli)
 * 3. Copie du lien (Clipboard API + Toast)
 * 4. QR Code de partage direct (scan écran à écran)
 */

import { genererLienParrainage } from './parrainage.js';

let qrcodePartageInstance = null;

function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = `toast-notification visible ${type === 'error' ? 'toast-erreur' : ''}`;
  setTimeout(() => {
    toast.className = 'toast-notification';
  }, 4000);
}

/**
 * Initialise les écouteurs du modal de partage
 * @param {Object} commercial 
 */
export function initialiserPartage(commercial) {
  const modal = document.getElementById('modal-partager-collegue');
  const btnOuvrir = document.getElementById('btn-partager-collegue');
  const btnFermer = document.getElementById('btn-fermer-modal-partager-collegue');

  if (btnOuvrir && modal) {
    btnOuvrir.addEventListener('click', () => ouvrirModalPartage(commercial));
  }

  if (btnFermer && modal) {
    btnFermer.addEventListener('click', fermerModalPartage);
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) fermerModalPartage();
    });
  }

  // Échap pour fermer
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
      fermerModalPartage();
    }
  });

  // 1. Bouton Option WhatsApp
  const btnOptWa = document.getElementById('btn-partage-opt-whatsapp');
  btnOptWa?.addEventListener('click', () => {
    const lien = genererLienParrainage(commercial.id);
    const msg = encodeURIComponent(
      `👋 Salut ! Je te recommande ${commercial.prenom} de Lou Ame Tay.\n` +
      `Il aide les restaurants comme le nôtre à digitaliser leur service (menu QR code et écran cuisine KDS).\n\n` +
      `Découvre sa carte : ${lien}`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  });

  // 2. Bouton Option Email
  const btnOptEmail = document.getElementById('btn-partage-opt-email');
  btnOptEmail?.addEventListener('click', () => {
    const lien = genererLienParrainage(commercial.id);
    const sujet = encodeURIComponent(`Recommandation Lou Ame Tay — ${commercial.prenom} ${commercial.nom}`);
    const corps = encodeURIComponent(
      `Bonjour,\n\nJe te recommande vivement ${commercial.prenom} de Lou Ame Tay pour moderniser le service dans ton restaurant.\n\n` +
      `Découvre sa carte de visite digitale interactive ici :\n${lien}\n\nÀ très vite !`
    );
    window.location.href = `mailto:?subject=${sujet}&body=${corps}`;
  });

  // 3. Bouton Option Copier le lien
  const btnOptCopier = document.getElementById('btn-partage-opt-copier');
  btnOptCopier?.addEventListener('click', async () => {
    const lien = genererLienParrainage(commercial.id);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(lien);
      } else {
        const inputTemp = document.createElement('input');
        inputTemp.value = lien;
        document.body.appendChild(inputTemp);
        inputTemp.select();
        document.execCommand('copy');
        document.body.removeChild(inputTemp);
      }
      showToast('📋 Lien copié dans le presse-papier !', 'success');
    } catch (e) {
      showToast('❌ Impossible de copier le lien automatiquement.', 'error');
    }
  });

  // 4. Bouton Option QR Code
  const btnOptQr = document.getElementById('btn-partage-opt-qrcode');
  const zoneQr = document.getElementById('partage-qrcode-zone');
  btnOptQr?.addEventListener('click', () => {
    if (!zoneQr) return;
    const estVisible = zoneQr.style.display !== 'none';
    if (estVisible) {
      zoneQr.style.display = 'none';
    } else {
      zoneQr.style.display = 'flex';
      genererQRCodePartage(commercial.id);
    }
  });
}

/**
 * Ouvre le modal de partage
 * @param {Object} commercial 
 */
export function ouvrirModalPartage(commercial) {
  const modal = document.getElementById('modal-partager-collegue');
  if (!modal) return;
  modal.classList.remove('hidden');

  // Mettre à jour le texte du lien affiché
  const txtLien = document.getElementById('partage-lien-affiche');
  if (txtLien) {
    txtLien.textContent = genererLienParrainage(commercial.id);
  }
}

/**
 * Ferme le modal de partage
 */
export function fermerModalPartage() {
  const modal = document.getElementById('modal-partager-collegue');
  if (modal) modal.classList.add('hidden');
}

/**
 * Génère le QR Code de partage dans le conteneur du modal
 * @param {string} commercialId 
 */
function genererQRCodePartage(commercialId) {
  const conteneurQr = document.getElementById('partage-qrcode-canvas');
  if (!conteneurQr) return;
  conteneurQr.innerHTML = '';

  const lien = genererLienParrainage(commercialId);

  if (typeof QRCode !== 'undefined') {
    qrcodePartageInstance = new QRCode(conteneurQr, {
      text: lien,
      width: 160,
      height: 160,
      colorDark: '#0B1F3A',
      colorLight: '#FFFFFF',
      correctLevel: QRCode.CorrectLevel.M
    });
  } else {
    // Fallback QR Server si QRCode.js indisponible
    const img = document.createElement('img');
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(lien)}`;
    img.alt = 'QR Code de partage';
    img.style.width = '160px';
    img.style.height = '160px';
    conteneurQr.appendChild(img);
  }
}
