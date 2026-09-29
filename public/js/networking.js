/**
 * ==============================================================================
 * FICHIER : js/networking.js
 * SPRINT B & D : ÉCHANGE DE CARTE ET GÉNÉRATEUR DE KIT NETWORKING ZIP
 * ==============================================================================
 */

import { supabase } from './supabase-client.js';
import { enregistrerVisiteur } from './whatsapp-intelligent.js';

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
 * B1 : Envoi de l'échange de carte (Prospect -> Commercial)
 */
export async function echangerCarte(commercialId) {
  const form = document.getElementById('form-echange');
  if (!form) return;
  const data = Object.fromEntries(new FormData(form));

  // Mémorisation pour contextualisation WhatsApp intelligent (B3)
  if (data.nom) {
    enregistrerVisiteur(data.nom, data.entreprise || '');
  }

  try {
    const { error } = await supabase.from('echanges_cartes').insert({
      commercial_id: commercialId,
      nom_visiteur: data.nom,
      telephone_visiteur: data.telephone,
      email_visiteur: data.email || null,
      entreprise_visiteur: data.entreprise || null,
      message: data.message || null
    });

    if (error) {
      console.warn('Erreur Supabase echanges_cartes:', error);
      showToast('❌ Erreur lors de l\'enregistrement. Réessayez.', 'error');
      return;
    }

    // Notification WhatsApp au commercial
    const msg = encodeURIComponent(
      `🔄 NOUVEL ÉCHANGE DE CARTE !\n\n` +
      `👤 Nom : ${data.nom}\n` +
      `📞 Tél : ${data.telephone}\n` +
      (data.entreprise ? `🏢 Établissement : ${data.entreprise}\n` : '') +
      (data.email ? `✉️ Email : ${data.email}\n` : '') +
      (data.message ? `💬 Message : ${data.message}` : '')
    );
    window.open(`https://wa.me/221762312003?text=${msg}`, '_blank');

    showToast('✅ Votre carte a été transmise avec succès !', 'success');
    document.getElementById('modal-echange')?.classList.add('hidden');
    form.reset();
  } catch (err) {
    console.error('Erreur echangerCarte:', err);
    showToast('❌ Erreur technique. Réessayez.', 'error');
  }
}

/**
 * D1, D2, D3 : Génération du Kit Networking ZIP complet
 */
export async function genererKitNetworking(commercial) {
  if (typeof JSZip === 'undefined') {
    showToast('⏳ Chargement du module ZIP...', 'error');
    return;
  }

  showToast('📦 Préparation de votre kit networking...', 'success');

  try {
    const zip = new JSZip();
    const dossierNom = `Kit_Networking_${commercial.prenom}_${commercial.nom}`;
    const folder = zip.folder(dossierNom);

    // 1. vCard (.vcf)
    folder.file('contact.vcf', genererVCard(commercial));

    // 2. QR Code PNG
    const qrBlob = await genererQRBlob(commercial.id);
    if (qrBlob) {
      folder.file('qr_code.png', qrBlob);
    }

    // 3. Carte PDF 85x55mm
    const pdfBlob = await genererCartePDF(commercial);
    if (pdfBlob) {
      folder.file('carte_visite.pdf', pdfBlob);
    }

    // 4. Signature email HTML
    folder.file('signature_email.html', genererSignatureHTML(commercial));

    // 5. Message WhatsApp pré-rempli
    folder.file('message_whatsapp.txt', genererMessageWhatsApp(commercial));

    // 6. Instructions
    folder.file(
      'LISEZ-MOI.txt',
      `Kit Networking — ${commercial.prenom} ${commercial.nom}\n\n` +
      `Contenu du pack :\n` +
      `- contact.vcf : Fiche contact universelle à importer dans vos contacts (iPhone/Android)\n` +
      `- qr_code.png : Image haute définition prête pour menus, affiches et supports de table\n` +
      `- carte_visite.pdf : Fichier prêt pour impression professionnelle (85x55mm recto/verso)\n` +
      `- signature_email.html : Code signature HTML à copier dans Gmail / Outlook\n` +
      `- message_whatsapp.txt : Modèle de message pour recommander Lou Ame Tay\n\n` +
      `Lou Ame Tay — La transition digitale de la restauration au Sénégal.\n`
    );

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Kit_Networking_${commercial.prenom}_${commercial.nom}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('✅ Kit Networking ZIP téléchargé !', 'success');
  } catch (err) {
    console.error('Erreur genererKitNetworking:', err);
    showToast('❌ Erreur lors de la création du ZIP.', 'error');
  }
}

export function genererVCard(c) {
  const tel = (c.telephone || '').replace(/\s+/g, '');
  return `BEGIN:VCARD
VERSION:3.0
N:${c.nom};${c.prenom};;;
FN:${c.prenom} ${c.nom}
TITLE:${c.poste || 'Conseiller Terrain'}
TEL;TYPE=CELL:${tel}
EMAIL:${c.email || ''}
URL:https://www.louametay.online/carte.html?id=${c.id}
NOTE:${c.bio || 'Lou Ame Tay — Solution SaaS Restauration & Hôtellerie'}
END:VCARD`;
}

export function genererSignatureHTML(c) {
  const photo = c.photo_url || `https://www.louametay.online/images/commercial${c.id}.jpg`;
  return `<!DOCTYPE html>
<html><body style="font-family: Arial, sans-serif; margin: 0; padding: 10px;">
<table cellpadding="0" cellspacing="0" style="max-width:500px; font-family: Arial, sans-serif;">
<tr>
<td style="padding-right:16px; border-right:3px solid #C9A227; vertical-align: middle;">
  <img src="${photo}" width="80" height="80" style="border-radius:50%; object-fit: cover; display:block;" alt="${c.prenom} ${c.nom}">
</td>
<td style="padding-left:16px; vertical-align: middle;">
  <div style="font-size:18px; font-weight:bold; color:#0B1F3A;">${c.prenom} ${c.nom}</div>
  <div style="font-size:13px; color:#C9A227; font-weight:600; margin:4px 0;">${c.poste || 'Conseiller Commercial'}</div>
  <div style="font-size:12px; color:#666; line-height: 1.6; margin-top:8px;">
    📞 ${c.telephone || '+221 77 130 36 78'}<br>
    💬 WhatsApp: ${c.whatsapp || '+221 76 231 20 03'}<br>
    ✉️ ${c.email || 'contact@louametay.com'}<br>
    🌐 <a href="https://www.louametay.online/carte.html?id=${c.id}" style="color:#0B1F3A; font-weight:bold;">Ma carte digitale</a>
  </div>
</td>
</tr>
</table>
</body></html>`;
}

export function genererMessageWhatsApp(c) {
  const lien = `https://www.louametay.online/carte.html?id=${c.id}`;
  return `👋 Bonjour ! Je vous recommande ${c.prenom} ${c.nom}, conseiller chez Lou Ame Tay (solution de commande QR Code et écrans cuisine KDS pour restaurants au Sénégal).\n\nDécouvrez sa carte de visite digitale interactive ici : ${lien}`;
}

async function genererQRBlob(commercialId) {
  // 1. Essayer de récupérer le canvas déjà généré sur la page
  const canvas = document.querySelector('#qrcode-cadre canvas');
  if (canvas) {
    return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  }
  // 2. Fallback via API QR Server
  try {
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&margin=10&data=${encodeURIComponent(`https://www.louametay.online/carte.html?id=${commercialId}`)}`;
    const resp = await fetch(url);
    return await resp.blob();
  } catch (e) {
    return null;
  }
}

async function genererCartePDF(c) {
  if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
    return null;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85, 55] });

  // Page 1 : Recto
  doc.setFillColor(11, 31, 58); // #0B1F3A
  doc.rect(0, 0, 85, 55, 'F');
  doc.setTextColor(201, 162, 39); // Doré
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('LOU AME TAY', 7, 12);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  doc.text('Menu Digital & Commande QR Code', 7, 16);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`${c.prenom} ${c.nom}`, 7, 28);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(201, 162, 39);
  doc.text(c.poste || 'Conseiller Commercial Terrain', 7, 33);
  doc.setFontSize(7);
  doc.setTextColor(220, 220, 220);
  doc.text(`Tél : ${c.telephone || '+221 77 130 36 78'}`, 7, 41);
  doc.text(`Email : ${c.email || 'contact@louametay.com'}`, 7, 45);
  doc.text(`Web : www.louametay.online`, 7, 49);

  // Page 2 : Verso
  doc.addPage([85, 55], 'landscape');
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 85, 55, 'F');
  doc.setTextColor(11, 31, 58);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('LA SOLUTION N°1 DU CHR AU SÉNÉGAL', 42.5, 14, { align: 'center' });
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(70, 70, 70);
  doc.text('• Menu Digital interactif (Wolof, FR, EN)', 10, 24);
  doc.text('• Écran Cuisine KDS en temps réel (0 erreur)', 10, 29);
  doc.text('• Encaissement direct Wave & Orange Money', 10, 34);
  doc.text('• Déploiement en salle et formation en 48h', 10, 39);
  doc.setTextColor(201, 162, 39);
  doc.setFont('helvetica', 'bold');
  doc.text('Thiès — Dakar — Mbour — Saly', 42.5, 48, { align: 'center' });

  return doc.output('blob');
}
