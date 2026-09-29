/**
 * ==============================================================================
 * FICHIER : js/signature-email.js
 * SPRINT 2 — D3 : SIGNATURE EMAIL HTML TABLE-BASED (GMAIL, OUTLOOK, APPLE MAIL)
 * ==============================================================================
 * Génère une signature email HTML professionnelle strictement basée sur <table>
 * sans flexbox ni grid, pour une compatibilité totale avec les clients email :
 * - Outlook Desktop & Web
 * - Gmail Web & Mobile
 * - Apple Mail
 * - Thunderbird
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
 * Génère le code HTML table-based de la signature email
 * @param {Object} commercial 
 * @returns {string} Code HTML de la signature
 */
export function genererSignatureHTML(commercial) {
  const prenom = commercial?.prenom || 'Conseiller';
  const nom = commercial?.nom || 'Terrain';
  const poste = commercial?.poste || 'Conseiller Commercial CHR';
  const tel = commercial?.telephone || '+221 77 130 36 78';
  const wa = commercial?.whatsapp || '+221 76 231 20 03';
  const email = commercial?.email || 'contact@louametay.com';

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.louametay.online';
  const urlCarte = commercial?.id ? `${baseUrl}/carte.html?id=${commercial.id}` : `${baseUrl}/carte.html`;

  let photoUrl = commercial?.photo_url || commercial?.photo || `${baseUrl}/images/commercial1.jpg`;
  if (photoUrl.startsWith('/') || photoUrl.startsWith('images/')) {
    photoUrl = `${baseUrl}/${photoUrl.replace(/^\//, '')}`;
  }

  return `<!-- Début Signature Lou Ame Tay -->
<table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.4; color: #333333; max-width: 520px;">
  <tr>
    <td valign="middle" style="padding-right: 18px; border-right: 3px solid #C9A227; text-align: center;">
      <img src="${photoUrl}" alt="${prenom} ${nom}" width="80" height="80" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; display: block; border: 2px solid #C9A227;" />
    </td>
    <td valign="middle" style="padding-left: 18px;">
      <div style="font-size: 17px; font-weight: bold; color: #0B1F3A; letter-spacing: 0.3px; line-height: 1.2;">
        ${prenom} ${nom}
      </div>
      <div style="font-size: 13px; font-weight: 600; color: #C9A227; margin: 4px 0 8px 0;">
        ${poste} — Lou Ame Tay 🍽️
      </div>
      <div style="font-size: 12px; color: #555555; line-height: 1.6;">
        <span style="color: #0B1F3A; font-weight: 600;">📞 Tél :</span> <a href="tel:${tel.replace(/\s+/g, '')}" style="color: #555555; text-decoration: none;">${tel}</a><br>
        <span style="color: #25D366; font-weight: 600;">💬 WhatsApp :</span> <a href="https://wa.me/${wa.replace(/\D/g, '')}" style="color: #555555; text-decoration: none;">${wa}</a><br>
        <span style="color: #0B1F3A; font-weight: 600;">✉️ Email :</span> <a href="mailto:${email}" style="color: #555555; text-decoration: none;">${email}</a><br>
        <span style="color: #0B1F3A; font-weight: 600;">🌐 Carte :</span> <a href="${urlCarte}" target="_blank" rel="noopener noreferrer" style="color: #0B1F3A; font-weight: bold; text-decoration: underline;">Consulter ma carte de visite digitale</a>
      </div>
      <div style="font-size: 11px; color: #888888; margin-top: 6px; font-style: italic;">
        Lou Ame Tay • Menu Digital & Commande QR Code pour Restaurants et Hôtels
      </div>
    </td>
  </tr>
</table>
<!-- Fin Signature Lou Ame Tay -->`;
}

/**
 * Copie la signature HTML dans le presse-papier avec double format (HTML riche + Texte brut)
 * @param {Object} commercial 
 */
export async function copierSignature(commercial) {
  const html = genererSignatureHTML(commercial);
  const plainText = `${commercial?.prenom || ''} ${commercial?.nom || ''}\n${commercial?.poste || ''} — Lou Ame Tay\nTél: ${commercial?.telephone || ''}\nWhatsApp: ${commercial?.whatsapp || ''}\nEmail: ${commercial?.email || ''}\nCarte: https://www.louametay.online/carte.html?id=${commercial?.id || ''}`;

  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const blobHtml = new Blob([html], { type: 'text/html' });
      const blobText = new Blob([plainText], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': blobHtml,
          'text/plain': blobText
        })
      ]);
      showToast('📋 Signature email copiée pour Gmail & Outlook !', 'success');
      return true;
    } else {
      // Fallback
      copierFallback(html);
      showToast('📋 Signature email copiée (format texte) !', 'success');
      return true;
    }
  } catch (err) {
    console.warn('ClipboardItem non supporté, utilisation fallback:', err);
    try {
      copierFallback(html);
      showToast('📋 Signature copiée dans le presse-papier !', 'success');
      return true;
    } catch (e2) {
      showToast('❌ Erreur lors de la copie de la signature.', 'error');
      return false;
    }
  }
}

function copierFallback(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}
