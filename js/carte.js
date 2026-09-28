/**
 * ==============================================================================
 * FICHIER : js/carte.js
 * LOGIQUE DE LA CARTE DIGITALE (CARTE.HTML) STYLE QRCODECHIMP — LOU AME TAY
 * ==============================================================================
 * Requête principale : SELECT * FROM commerciaux WHERE id = ?
 * Gestion de l'état actif/inactif : si actif = false -> "Cette carte n'est plus active"
 * - Internationalisation FR / Wolof / EN
 * - Traçabilité automatique des scans (IP & géolocalisation) et interactions
 * - Capture de lead avec calcul de score de priorité (0 - 100) & alerte WhatsApp
 * - Signature email professionnelle HTML prête à copier
 * - Support PWA et mise en cache hors ligne
 */

import { supabase, estSupabaseConfigure } from './supabase-client.js';
import { trackerScan, trackerEvenement } from './analytics.js';
import { calculerScoreLead } from './lead-scoring.js';
import { notifierCommercial, genererLienWhatsAppClient } from './notifications.js';
import { initialiserI18n } from './i18n.js';
import { genererSignatureEmail } from './qrcode-export.js';
import { entreprise, commerciaux } from './data.js';
import './pwa-install.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialisation de l'internationalisation trilingue
  await initialiserI18n();

  // 2. Chargement des données du conseiller
  await initialiserCarte();
});

async function initialiserCarte() {
  const params = new URLSearchParams(window.location.search);
  const commercialId = params.get('id');

  const conteneurContenu = document.getElementById('carte-contenu');
  const blocErreur = document.getElementById('carte-erreur-bloc');
  const blocInactif = document.getElementById('carte-inactive-bloc');

  if (!commercialId) {
    afficherErreur("Aucun identifiant de conseiller n'a été spécifié dans l'adresse.");
    return;
  }

  let commercial = null;

  // 1. Recherche dans Supabase
  if (estSupabaseConfigure()) {
    try {
      const { data, error } = await supabase
        .from('commerciaux')
        .select('*')
        .eq('id', commercialId)
        .maybeSingle();

      if (!error && data) {
        commercial = data;
      }
    } catch (err) {
      console.warn('Erreur Supabase, vérification des données de secours :', err);
    }
  }

  // 2. Fallback de secours sur data.js (si hors-ligne, démo ou identifiant alternatif)
  if (!commercial && typeof commerciaux !== 'undefined' && Array.isArray(commerciaux)) {
    const uuidVersNum = {
      '11111111-1111-1111-1111-111111111111': '1',
      '22222222-2222-2222-2222-222222222222': '2',
      '33333333-3333-3333-3333-333333333333': '3',
      '44444444-4444-4444-4444-444444444444': '4'
    };
    const idEquiv = uuidVersNum[commercialId] || commercialId;
    commercial = commerciaux.find(c => String(c.id) === String(commercialId) || String(c.id) === String(idEquiv));
  }

  // 3. Vérification de l'existence du commercial
  if (!commercial) {
    afficherErreur(`Aucun conseiller terrain n'a été trouvé avec l'identifiant « ${commercialId} ».`);
    return;
  }

  // 4. VÉRIFICATION DU STATUT ACTIF / INACTIF
  // Si actif = false -> afficher "Cette carte n'est plus active"
  if (commercial.actif === false) {
    if (conteneurContenu) conteneurContenu.style.display = 'none';
    if (blocErreur) blocErreur.style.display = 'none';
    if (blocInactif) blocInactif.style.display = 'block';
    document.title = `Carte inactive — Lou Ame Tay 🍽️`;
    return;
  }

  // Tout est valide : affichage de la carte
  if (blocErreur) blocErreur.style.display = 'none';
  if (blocInactif) blocInactif.style.display = 'none';
  if (conteneurContenu) conteneurContenu.style.display = 'block';

  document.title = `${commercial.prenom} ${commercial.nom} — Lou Ame Tay 🍽️`;

  // Normalisation des réseaux sociaux
  const reseauxObj = {
    linkedin: commercial.linkedin || (commercial.reseaux && commercial.reseaux.linkedin) || '',
    facebook: commercial.facebook || (commercial.reseaux && commercial.reseaux.facebook) || '',
    instagram: commercial.instagram || (commercial.reseaux && commercial.reseaux.instagram) || '',
    tiktok: commercial.tiktok || (commercial.reseaux && commercial.reseaux.tiktok) || ''
  };

  // Traçabilité automatique du scan de la carte (géoloc IP + date)
  trackerScan(commercial.id);

  // 1. Photo géante 4:5 et identité
  remplirHeroGeant(commercial);

  // 2. Boutons d'action rapide ronds (Appel, WhatsApp, Email, Partage)
  configurerActionsRapides(commercial);

  // 3. Actions terrain (Modal RDV et Support direct WhatsApp)
  configurerActionsTerrain(commercial);

  // 4. vCard "Ajouter au contact" (.vcf)
  configurerVCard(commercial);

  // 5. Section biographie, zone & coordonnées directes
  remplirBioEtDetails(commercial);

  // 6. Liste des formules Lou Ame Tay
  remplirOffresProduits(commercial);

  // 7. Réseaux sociaux
  remplirReseaux(reseauxObj);

  // 8. QR Code dynamique scannable pointant vers window.location.href
  genererQRCode();

  // 9. Formulaire de capture de leads (BDD + Scoring + Notification WhatsApp)
  configurerFormulaireLeads(commercial);

  // 10. Signature email professionnelle (Modal HTML)
  configurerSignatureEmail(commercial);

  // 11. Section Entreprise Lou Ame Tay et galerie
  remplirEntreprise();
}

function afficherErreur(message) {
  const conteneurContenu = document.getElementById('carte-contenu');
  const blocErreur = document.getElementById('carte-erreur-bloc');
  const blocInactif = document.getElementById('carte-inactive-bloc');
  const msgErreur = document.getElementById('carte-erreur-msg');

  if (conteneurContenu) conteneurContenu.style.display = 'none';
  if (blocInactif) blocInactif.style.display = 'none';
  if (blocErreur) blocErreur.style.display = 'block';
  if (msgErreur && message) msgErreur.textContent = message;
}

/**
 * 1. Photo géante format 4:5 avec dégradé sombre et nom/poste superposés
 */
function remplirHeroGeant(c) {
  const elPhoto = document.getElementById('commercial-photo');
  const elNom = document.getElementById('commercial-nom-complet');
  const elPoste = document.getElementById('commercial-poste');

  if (elNom) elNom.textContent = `${c.prenom} ${c.nom}`;
  if (elPoste) elPoste.textContent = c.poste || 'Conseiller Terrain CHR';

  if (elPhoto) {
    elPhoto.src = c.photo_url || c.photo || 'images/commercial1.svg';
    elPhoto.alt = `Portrait de ${c.prenom} ${c.nom} — Lou Ame Tay`;
    elPhoto.onerror = function() {
      this.onerror = null;
      this.src = 'images/commercial1.svg';
    };
  }
}

/**
 * 2. Boutons d'action rapide ronds (Appel, WhatsApp, Email, Partage)
 */
function configurerActionsRapides(c) {
  const btnTel = document.getElementById('action-tel');
  const btnWa = document.getElementById('action-wa');
  const btnMail = document.getElementById('action-mail');
  const btnPartage = document.getElementById('btn-partager-action');

  if (btnTel && c.telephone) {
    btnTel.href = `tel:${c.telephone.replace(/\s+/g, '')}`;
    btnTel.addEventListener('click', () => {
      trackerEvenement('appel', c.id);
    });
  } else if (btnTel) {
    btnTel.style.display = 'none';
  }

  if (btnWa && c.whatsapp) {
    const num = c.whatsapp.replace(/\D/g, '');
    const msg = encodeURIComponent(`Bonjour ${c.prenom}, je vous contacte via votre carte digitale Lou Ame Tay.`);
    btnWa.href = `https://wa.me/${num}?text=${msg}`;
    btnWa.addEventListener('click', () => {
      trackerEvenement('whatsapp', c.id);
    });
  } else if (btnWa) {
    btnWa.style.display = 'none';
  }

  if (btnMail && c.email) {
    const sujet = encodeURIComponent(`Contact Lou Ame Tay - Démonstration Restaurant`);
    btnMail.href = `mailto:${c.email}?subject=${sujet}`;
  } else if (btnMail) {
    btnMail.style.display = 'none';
  }

  if (btnPartage) {
    btnPartage.addEventListener('click', () => {
      trackerEvenement('partage', c.id);
      partagerCarte(c);
    });
  }
}

/**
 * 3. Actions terrain : Modal Planifier Démo / RDV & Support WhatsApp
 */
function configurerActionsTerrain(c) {
  const btnOuvrirModal = document.getElementById('btn-ouvrir-modal-rdv');
  const modalRdv = document.getElementById('modal-rdv');
  const btnFermerModal = document.getElementById('btn-fermer-modal');
  const formModal = document.getElementById('form-modal-rdv');
  const btnSupportDirect = document.getElementById('btn-support-direct-wa');

  if (btnSupportDirect) {
    const fallbackWA = typeof entreprise !== 'undefined' ? entreprise.contact.whatsapp : "221762312003";
    const numSupport = (c.whatsapp || fallbackWA).replace(/\D/g, '');
    btnSupportDirect.href = `https://wa.me/${numSupport}?text=${encodeURIComponent(`Bonjour ${c.prenom}, j'ai besoin d'une assistance ou d'un devis pour mon restaurant.`)}`;
    btnSupportDirect.addEventListener('click', () => {
      trackerEvenement('whatsapp', c.id);
    });
  }

  if (btnOuvrirModal && modalRdv) {
    btnOuvrirModal.addEventListener('click', () => {
      modalRdv.classList.add('active');
      const inputEtab = document.getElementById('rdv-etablissement');
      if (inputEtab) inputEtab.focus();
    });
  }

  if (btnFermerModal && modalRdv) {
    btnFermerModal.addEventListener('click', () => {
      modalRdv.classList.remove('active');
    });
  }

  if (modalRdv) {
    modalRdv.addEventListener('click', (e) => {
      if (e.target === modalRdv) modalRdv.classList.remove('active');
    });
  }

  if (formModal) {
    formModal.addEventListener('submit', async (e) => {
      e.preventDefault();
      const etab = document.getElementById('rdv-etablissement').value.trim();
      const contact = document.getElementById('rdv-contact').value.trim();
      const date = document.getElementById('rdv-date').value;
      const creneau = document.getElementById('rdv-creneau').value;

      trackerEvenement('lead', c.id);

      const messageWA = encodeURIComponent(
        `Bonjour ${c.prenom},\n\nJe souhaite planifier une démonstration Lou Ame Tay en salle :\n` +
        `• Établissement : ${etab}\n` +
        `• Contact : ${contact}\n` +
        `• Date souhaitée : ${date}\n` +
        `• Créneau : ${creneau}\n\nMerci de me confirmer votre disponibilité !`
      );

      const numWA = (c.whatsapp || "221762312003").replace(/\D/g, '');
      window.open(`https://wa.me/${numWA}?text=${messageWA}`, '_blank');

      if (modalRdv) modalRdv.classList.remove('active');
      formModal.reset();
      afficherToast("✓ Demande de RDV transmise par WhatsApp !");
    });
  }
}

/**
 * 4. Téléchargement de la vCard (.vcf)
 */
function configurerVCard(c) {
  const btnVCard = document.getElementById('btn-telecharger-vcard');
  if (!btnVCard) return;

  btnVCard.addEventListener('click', () => {
    trackerEvenement('partage', c.id);

    const telPropre = (c.telephone || '').replace(/\s+/g, '');
    const bioLigne = (c.bio || "Lou Ame Tay — Solution SaaS Restauration & Hôtellerie").replace(/\r?\n/g, ' ');

    const vCardContenu = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:${c.nom};${c.prenom};;;`,
      `FN:${c.prenom} ${c.nom}`,
      `ORG:Lou Ame Tay;Restauration & Hôtellerie SaaS`,
      `TITLE:${c.poste || 'Conseiller Terrain'}`,
      `TEL;TYPE=CELL,VOICE,PREF:${telPropre}`,
      `EMAIL;TYPE=WORK,INTERNET:${c.email || ''}`,
      `URL:${window.location.href}`,
      `NOTE:${bioLigne}`,
      'END:VCARD'
    ].join('\r\n');

    const blob = new Blob([vCardContenu], { type: 'text/vcard;charset=utf-8;' });
    const lien = document.createElement('a');
    const nomFichier = `contact_${c.prenom.toLowerCase()}_${c.nom.toLowerCase()}.vcf`;

    lien.href = URL.createObjectURL(blob);
    lien.download = nomFichier;
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);
    URL.revokeObjectURL(lien.href);

    afficherToast("✓ Fiche contact ajoutée au téléchargement !");
  });
}

/**
 * 5. Remplissage de la biographie, zone et coordonnées directes
 */
function remplirBioEtDetails(c) {
  const elBio = document.getElementById('commercial-bio');
  const elDispo = document.getElementById('commercial-dispo');
  const elZone = document.getElementById('commercial-zone');

  const ligneTel = document.getElementById('ligne-tel');
  const valTel = document.getElementById('ligne-tel-valeur');
  const ligneWa = document.getElementById('ligne-wa');
  const valWa = document.getElementById('ligne-wa-valeur');
  const ligneMail = document.getElementById('ligne-mail');
  const valMail = document.getElementById('ligne-mail-valeur');

  if (elBio) elBio.textContent = c.bio || "Conseiller commercial terrain chez Lou Ame Tay.";
  if (elDispo) elDispo.textContent = c.disponibilite || "Disponible aujourd'hui";
  if (elZone) elZone.textContent = c.zone || "Axe Thiès — Dakar — Mbour";

  if (ligneTel && c.telephone) {
    ligneTel.href = `tel:${c.telephone.replace(/\s+/g, '')}`;
    if (valTel) valTel.textContent = c.telephone;
    ligneTel.addEventListener('click', () => trackerEvenement('appel', c.id));
  }

  if (ligneWa && c.whatsapp) {
    const num = c.whatsapp.replace(/\D/g, '');
    ligneWa.href = `https://wa.me/${num}`;
    if (valWa) valWa.textContent = `+${num}`;
    ligneWa.addEventListener('click', () => trackerEvenement('whatsapp', c.id));
  }

  if (ligneMail && c.email) {
    ligneMail.href = `mailto:${c.email}`;
    if (valMail) valMail.textContent = c.email;
  }
}

/**
 * 6. Formules Lou Ame Tay
 */
function remplirOffresProduits(c) {
  const conteneurOffres = document.getElementById('liste-offres-carte');
  if (!conteneurOffres || typeof entreprise === 'undefined' || !Array.isArray(entreprise.offres)) return;

  conteneurOffres.innerHTML = '';
  const numWA = (c.whatsapp || "221762312003").replace(/\D/g, '');

  entreprise.offres.forEach(offre => {
    const div = document.createElement('div');
    div.className = `carte-offre-item ${offre.populaire ? 'populaire' : ''}`;
    const msgOffre = encodeURIComponent(`Bonjour ${c.prenom}, je suis intéressé par la ${offre.nom} (${offre.prix}) pour mon établissement.`);

    div.innerHTML = `
      <div class="carte-offre-haut">
        <h3 class="offre-nom">${offre.nom}</h3>
        <span class="offre-badge">${offre.badge}</span>
      </div>
      <div class="offre-prix">${offre.prix}</div>
      <p class="offre-cible">${offre.cible}</p>
      <ul class="offre-details-liste">
        ${offre.details.map(d => `<li>${d}</li>`).join('')}
      </ul>
      <a href="https://wa.me/${numWA}?text=${msgOffre}" target="_blank" rel="noopener noreferrer" class="btn btn-primaire btn-choisir-offre">
        Commander / Discuter de cette formule ➔
      </a>
    `;

    const btnCommander = div.querySelector('.btn-choisir-offre');
    if (btnCommander) {
      btnCommander.addEventListener('click', () => trackerEvenement('whatsapp', c.id));
    }

    conteneurOffres.appendChild(div);
  });
}

/**
 * 7. Liens réseaux sociaux
 */
function remplirReseaux(reseaux) {
  const conteneur = document.getElementById('commercial-reseaux');
  const section = document.getElementById('section-reseaux');
  if (!conteneur) return;

  conteneur.innerHTML = '';

  if (!reseaux || Object.keys(reseaux).length === 0) {
    if (section) section.style.display = 'none';
    return;
  }

  const iconesSvg = {
    linkedin: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>`,
    facebook: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>`,
    instagram: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`,
    tiktok: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.97-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>`
  };

  let totalAjoutes = 0;
  for (const [reseau, url] of Object.entries(reseaux)) {
    if (url && url.trim().length > 0) {
      const a = document.createElement('a');
      a.className = 'chimp-reseau-bulle';
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.title = `Suivre sur ${reseau.charAt(0).toUpperCase() + reseau.slice(1)}`;
      a.setAttribute('aria-label', `Page ${reseau}`);
      a.innerHTML = iconesSvg[reseau] || '🔗';
      conteneur.appendChild(a);
      totalAjoutes++;
    }
  }

  if (totalAjoutes === 0 && section) {
    section.style.display = 'none';
  }
}

/**
 * 8. QR Code dynamique scannable pointant vers window.location.href
 */
function genererQRCode() {
  const conteneurQR = document.getElementById('qrcode-cadre');
  const btnCopier = document.getElementById('btn-copier-url');
  if (!conteneurQR) return;

  conteneurQR.innerHTML = '';
  const urlExacte = window.location.href;

  if (typeof QRCode !== 'undefined') {
    try {
      new QRCode(conteneurQR, {
        text: urlExacte,
        width: 200,
        height: 200,
        colorDark: "#0B1F3A",
        colorLight: "#FFFFFF",
        correctLevel: QRCode.CorrectLevel.H
      });
    } catch (e) {
      genererQRImageFallback(conteneurQR, urlExacte);
    }
  } else {
    genererQRImageFallback(conteneurQR, urlExacte);
  }

  if (btnCopier) {
    btnCopier.addEventListener('click', () => {
      copierDansPressePapier(urlExacte, "✓ Adresse de la carte copiée !");
    });
  }
}

function genererQRImageFallback(conteneur, url) {
  const img = document.createElement('img');
  img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=4&data=${encodeURIComponent(url)}`;
  img.alt = "QR code de la carte Lou Ame Tay";
  img.width = 200;
  img.height = 200;
  conteneur.appendChild(img);
}

/**
 * 9. Formulaire de capture de leads (BDD + Lead Scoring + Notification WhatsApp)
 */
function configurerFormulaireLeads(c) {
  const form = document.getElementById('form-lead-carte');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btnSubmit = document.getElementById('btn-envoyer-lead');
    const btnTexte = document.getElementById('btn-lead-texte');
    const btnSpinner = document.getElementById('btn-lead-spinner');

    const etab = document.getElementById('lead-etablissement').value.trim();
    const nom = document.getElementById('lead-nom').value.trim();
    const tel = document.getElementById('lead-tel').value.trim();
    const ville = document.getElementById('lead-ville').value;
    const formule = document.getElementById('lead-formule').value;

    if (btnSubmit) btnSubmit.disabled = true;
    if (btnSpinner) btnSpinner.style.display = 'inline-block';
    if (btnTexte) btnTexte.textContent = 'Enregistrement en cours...';

    // 1. Calcul du score d'urgence / valeur du prospect (0 - 100)
    const score = calculerScoreLead({
      formule,
      ville,
      restaurant_nom: etab,
      telephone: tel,
      message: `Demande de devis pour ${etab}`
    });

    const leadData = {
      commercial_id: c.id,
      restaurant_nom: etab,
      prospect_nom: nom,
      telephone: tel,
      ville: ville,
      formule: formule,
      message: `Formule souhaitée : ${formule}`,
      score: score,
      statut: 'nouveau',
      source: 'carte_qr'
    };

    // 2. Enregistrement dans Supabase
    if (estSupabaseConfigure()) {
      try {
        const { error } = await supabase.from('leads').insert([leadData]);
        if (error) {
          console.warn('Enregistrement lead Supabase reporté :', error);
        } else {
          await trackerEvenement('lead', c.id);
        }
      } catch (err) {
        console.warn('Erreur insertion lead :', err);
      }
    }

    // 3. Notification du conseiller (Edge Function si active)
    try {
      await notifierCommercial(leadData, c);
    } catch (err) {
      console.debug('Notification silencieuse :', err);
    }

    // 4. Ouverture automatique de WhatsApp pour le prospect
    const lienWA = genererLienWhatsAppClient(leadData, c);
    window.open(lienWA, '_blank');

    afficherToast("✓ Demande enregistrée et transmise au conseiller !");
    form.reset();

    if (btnSubmit) btnSubmit.disabled = false;
    if (btnSpinner) btnSpinner.style.display = 'none';
    if (btnTexte) {
      btnTexte.textContent = '🚀 Envoyer ma demande au conseiller';
      btnTexte.setAttribute('data-i18n', 'carte.envoyer');
    }
  });
}

/**
 * 10. Modal de Signature Email Professionnelle HTML
 */
function configurerSignatureEmail(c) {
  const btnOuvrir = document.getElementById('btn-ouvrir-modal-signature');
  const modal = document.getElementById('modal-signature');
  const btnFermer = document.getElementById('btn-fermer-modal-signature');
  const cadrePreview = document.getElementById('signature-preview-cadre');
  const btnCopier = document.getElementById('btn-copier-signature-html');

  if (!btnOuvrir || !modal) return;

  const htmlSignature = genererSignatureEmail(c);
  if (cadrePreview) {
    cadrePreview.innerHTML = htmlSignature;
  }

  btnOuvrir.addEventListener('click', () => {
    modal.classList.add('active');
  });

  if (btnFermer) {
    btnFermer.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  if (btnCopier) {
    btnCopier.addEventListener('click', async () => {
      try {
        if (navigator.clipboard && window.ClipboardItem) {
          const blobHtml = new Blob([htmlSignature], { type: 'text/html' });
          const blobText = new Blob([htmlSignature], { type: 'text/plain' });
          await navigator.clipboard.write([
            new ClipboardItem({
              'text/html': blobHtml,
              'text/plain': blobText
            })
          ]);
          afficherToast("✓ Signature HTML copiée pour Gmail / Outlook !");
        } else {
          copierDansPressePapier(htmlSignature, "✓ Signature HTML copiée !");
        }
      } catch (err) {
        copierDansPressePapier(htmlSignature, "✓ Signature HTML copiée !");
      }
    });
  }
}

/**
 * 11. Section Entreprise Lou Ame Tay et galerie
 */
function remplirEntreprise() {
  if (typeof entreprise === 'undefined') return;

  const elNom = document.getElementById('carte-entreprise-nom');
  const elSlogan = document.getElementById('carte-entreprise-slogan');
  const elDesc = document.getElementById('carte-entreprise-desc');
  const elLien = document.getElementById('carte-entreprise-lien');
  const elGalerie = document.getElementById('carte-entreprise-galerie');

  if (elNom && entreprise.nom) elNom.textContent = entreprise.nom;
  if (elSlogan && entreprise.slogan) elSlogan.textContent = entreprise.slogan;
  if (elDesc && entreprise.description) elDesc.textContent = entreprise.description;
  if (elLien && entreprise.siteWeb) elLien.href = entreprise.siteWeb;

  if (elGalerie && Array.isArray(entreprise.images)) {
    elGalerie.innerHTML = '';
    entreprise.images.slice(0, 3).forEach((imgSrc, idx) => {
      const item = document.createElement('div');
      item.className = 'chimp-galerie-item';
      item.innerHTML = `
        <img 
          src="${imgSrc}" 
          alt="Déploiement Lou Ame Tay ${idx + 1}"
          loading="lazy"
        >
      `;
      elGalerie.appendChild(item);
    });
  }
}

/**
 * Partage natif (Web Share API) ou copie du lien
 */
function partagerCarte(c) {
  const url = window.location.href;
  const titre = `${c.prenom} ${c.nom} — Lou Ame Tay 🍽️`;
  const texte = `Carte digitale de ${c.prenom} ${c.nom}, ${c.poste || 'Conseiller'} chez Lou Ame Tay (Transition digitale restauration CHR).`;

  if (navigator.share) {
    navigator.share({
      title: titre,
      text: texte,
      url: url
    }).catch(err => {
      if (err.name !== 'AbortError') {
        copierDansPressePapier(url, "✓ Lien de la carte copié !");
      }
    });
  } else {
    copierDansPressePapier(url, "✓ Lien de la carte copié !");
  }
}

function copierDansPressePapier(texte, messageConfirmation) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(texte)
      .then(() => afficherToast(messageConfirmation))
      .catch(() => fallbackCopie(texte, messageConfirmation));
  } else {
    fallbackCopie(texte, messageConfirmation);
  }
}

function fallbackCopie(texte, msg) {
  const ta = document.createElement('textarea');
  ta.value = texte;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    afficherToast(msg);
  } catch (e) {
    afficherToast("Lien : " + texte);
  }
  document.body.removeChild(ta);
}

function afficherToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('visible');

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('visible');
  }, 3200);
}
