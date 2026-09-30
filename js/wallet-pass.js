/**
 * ==========================================================================
 * FICHIER : js/wallet-pass.js
 * GESTION DE L'AJOUT AU PORTE-CARTES NUMÉRIQUE (APPLE & GOOGLE WALLET)
 * Lou Ame Tay — Cartes de visite digitales
 * ==========================================================================
 */

import { SUPABASE_URL } from './supabase-client.js';

/**
 * Détecte l'environnement utilisateur (iOS, Android, Desktop)
 */
export function detecterPlateforme() {
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
    return 'ios';
  }
  if (/android/i.test(ua)) {
    return 'android';
  }
  return 'desktop';
}

/**
 * Déclenche l'ajout au Wallet selon la plateforme
 * @param {Object} commercial - Données du commercial
 */
export async function ajouterAuWallet(commercial) {
  if (!commercial || !commercial.id) {
    alert('Impossible de générer le pass : commercial non identifié.');
    return;
  }

  const plateforme = detecterPlateforme();
  const baseUrl = SUPABASE_URL && !SUPABASE_URL.includes('votre-projet')
    ? SUPABASE_URL
    : 'https://ugmdpjncplnlizhpongo.supabase.co';

  if (plateforme === 'ios') {
    // Redirection directe vers le fichier .pkpass Apple Wallet
    const urlApplePass = `${baseUrl}/functions/v1/generate-apple-pass?id=${encodeURIComponent(commercial.id)}`;
    window.location.href = urlApplePass;
  } else if (plateforme === 'android') {
    // Redirection vers le flux Google Wallet 'Save to Google Wallet'
    const urlGooglePass = `${baseUrl}/functions/v1/generate-google-pass?id=${encodeURIComponent(commercial.id)}`;
    window.location.href = urlGooglePass;
  } else {
    // Desktop : Affichage de la modale de choix avec QR Code ou options
    afficherModalChoixWallet(commercial, baseUrl);
  }
}

/**
 * Affiche une modale interactive pour les utilisateurs sur Desktop
 */
function afficherModalChoixWallet(commercial, baseUrl) {
  let modal = document.getElementById('modal-choix-wallet');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-choix-wallet';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-contenu modal-wallet-contenu">
        <button type="button" class="btn-fermer-modal" id="btn-fermer-modal-wallet" aria-label="Fermer">✕</button>
        <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">📱</div>
        <h3 style="font-family: 'Poppins', sans-serif; font-size: 1.25rem; color: #0B1F3A; font-weight: 800; margin-bottom: 0.5rem;">
          Ajouter au Porte-cartes
        </h3>
        <p style="font-size: 0.88rem; color: #64748B; margin-bottom: 1.5rem; line-height: 1.4;">
          Conservez la carte de <strong>${commercial.prenom} ${commercial.nom}</strong> directement dans votre smartphone sans connexion Internet.
        </p>

        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <a id="lien-wallet-apple" href="#" class="btn-wallet-action" style="background: #000000; color: #FFFFFF;">
            <span class="wallet-icone">🍏</span>
            <span>Ajouter à Apple Wallet (iPhone)</span>
          </a>
          
          <a id="lien-wallet-google" href="#" class="btn-wallet-action" style="background: #1A73E8; color: #FFFFFF;">
            <span class="wallet-icone">💳</span>
            <span>Ajouter à Google Wallet (Android)</span>
          </a>

          <button type="button" id="btn-wallet-vcard-secours" class="btn btn-contour" style="margin-top: 0.5rem; font-size: 0.85rem;">
            📇 Télécharger le contact (.vcf standard)
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#btn-fermer-modal-wallet').addEventListener('click', () => {
      modal.classList.remove('active', 'actif');
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active', 'actif');
    });
  }

  // Configuration des URLs dynamiques
  const urlApple = `${baseUrl}/functions/v1/generate-apple-pass?id=${encodeURIComponent(commercial.id)}`;
  const urlGoogle = `${baseUrl}/functions/v1/generate-google-pass?id=${encodeURIComponent(commercial.id)}`;

  const btnApple = modal.querySelector('#lien-wallet-apple');
  const btnGoogle = modal.querySelector('#lien-wallet-google');
  const btnVcf = modal.querySelector('#btn-wallet-vcard-secours');

  if (btnApple) btnApple.href = urlApple;
  if (btnGoogle) btnGoogle.href = urlGoogle;
  if (btnVcf) {
    btnVcf.onclick = () => {
      telechargerPassDigitalNFC(commercial);
      modal.classList.remove('active', 'actif');
    };
  }

  modal.classList.add('active', 'actif');
}

/**
 * Génère et télécharge une vCard 4.0 enrichie compatible NFC & Porte-cartes natif (iOS / Android)
 * Fonctionne 100% hors-ligne sans dépendance serveur
 */
export function telechargerPassDigitalNFC(commercial) {
  if (!commercial) return;
  const prenom = commercial.prenom || 'Conseiller';
  const nom = commercial.nom || 'Lou Ame Tay';
  const tel = commercial.telephone || '+221 77 458 74 74';
  const whatsapp = commercial.whatsapp || '221774587474';
  const email = commercial.email || 'contact@louametay.online';
  const role = commercial.role || 'Conseiller Commercial CHR';
  const ville = commercial.ville || 'Dakar, Sénégal';
  const siteUrl = 'https://louametay.online';

  const vcard = [
    'BEGIN:VCARD',
    'VERSION:4.0',
    `N:${nom};${prenom};;;`,
    `FN:${prenom} ${nom}`,
    `ORG:Lou Ame Tay SASU;Médias Graphisme Sénégal`,
    `TITLE:${role}`,
    `TEL;TYPE=cell,voice;VALUE=uri:tel:${tel.replace(/\s+/g, '')}`,
    `EMAIL;TYPE=work:${email}`,
    `URL:${siteUrl}`,
    `ADR;TYPE=work:;;Grand Standing;Thiès;;;Sénégal`,
    `NOTE:Plateforme Digitale de Commande sur Table & Gestion CHR (Menu QR Code + KDS Cuisine). Direction Générale : M. Mbaye Babacar GUEYE (+221 77 458 74 74). WhatsApp : https://wa.me/${whatsapp.replace(/\D/g, '')}`,
    'CATEGORIES:Lou Ame Tay,CHR,Restaurant,Partenaire',
    'END:VCARD'
  ].join('\r\n');

  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8;' });
  const lien = document.createElement('a');
  lien.href = URL.createObjectURL(blob);
  lien.download = `LouAmeTay_Pass_${prenom}_${nom}.vcf`;
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
  URL.revokeObjectURL(lien.href);
}
