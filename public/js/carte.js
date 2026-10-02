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
import { jouerIntro, lancerAnimationIntro } from './intro-animation.js';
import { echangerCarte } from './networking.js';
import { genererKitNetworking } from './kit-networking.js';
import { genererCartePDF } from './carte-pdf.js';
import { genererSignatureHTML, copierSignature } from './signature-email.js';
import { ouvrirRdv, finaliserRdvFormulaire } from './rdv.js';
import { trackerParrainage, afficherBadgeParrainage, genererLienParrainage } from './parrainage.js';
import { initialiserPartage, ouvrirModalPartage } from './partage.js';
import { chargerTemoignages } from './temoignages.js';
import { 
  ouvrirWhatsAppIntelligent, 
  construireMessageWhatsApp, 
  enregistrerFormuleConsultee, 
  enregistrerVisiteur 
} from './whatsapp-intelligent.js';
import { ajouterAuWallet } from './wallet-pass.js';
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

  // Résolution d'équivalence entre identifiant court ('1', '2'...) et UUID Supabase
  const numVersUuid = {
    '1': '11111111-1111-1111-1111-111111111111',
    '2': '22222222-2222-2222-2222-222222222222',
    '3': '33333333-3333-3333-3333-333333333333',
    '4': '44444444-4444-4444-4444-444444444444'
  };
  const resolvedId = numVersUuid[commercialId] || commercialId;

  // 1. Recherche dans Supabase
  if (estSupabaseConfigure()) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedId);
      if (isUuid) {
        const { data, error } = await supabase
          .from('commerciaux')
          .select('*')
          .eq('id', resolvedId)
          .maybeSingle();

        if (!error && data) {
          commercial = data;
        }
      }
    } catch (err) {
      console.warn('Erreur Supabase, vérification des données de secours :', err);
    }
  }

  // 2. Fallback local de secours uniquement si des données locales existent et que Supabase n'a pas répondu
  if (!commercial && typeof commerciaux !== 'undefined' && Array.isArray(commerciaux) && commerciaux.length > 0) {
    commercial = commerciaux.find(c => 
      String(c.id) === String(commercialId) || 
      String(c.id) === String(resolvedId)
    );
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

  // Réseaux sociaux officiels Lou Ame Tay (par défaut pour l'entreprise)
  const RESEAUX_OFFICIELS_ENTREPRISE = {
    facebook: 'https://www.facebook.com/louametay/',
    instagram: 'https://www.instagram.com/louametaye/',
    linkedin: 'https://www.linkedin.com/company/lou-ame-tay',
    tiktok: 'https://www.tiktok.com/@louametay',
    youtube: 'https://youtube.com/@louametaye?si=wdfwRr2F-x0ho5PY'
  };

  // Règle d'or de gouvernance Lou Ame Tay :
  // Tous les réseaux sociaux sont 100% universels pour TOUTES les cartes de visite.
  // Les commerciaux ne présentent JAMAIS leurs réseaux personnels sur leur carte professionnelle.
  const reseauxObj = { ...RESEAUX_OFFICIELS_ENTREPRISE };

  // Traçabilité automatique du scan de la carte (géoloc IP + date)
  trackerScan(commercial.id);

  // 1. Photo géante 4:5 et identité
  remplirHeroGeant(commercial);

  // 2. Boutons d'action rapide ronds (Appel, WhatsApp, Email, Partage)
  configurerActionsRapides(commercial);

  // 3. Actions terrain (Modal RDV et Support direct WhatsApp)
  configurerActionsTerrain(commercial);

  // 3b. Localisation & Itinéraire (Google Maps / Apple Maps)
  afficherLocalisation(commercial);

  // 3c. Système d'avis et notations clients (0 à 10)
  initialiserAvis(commercial.id);

  // 4. vCard "Ajouter au contact" (.vcf)
  configurerVCard(commercial);

  // 5. Section biographie, zone & coordonnées directes
  remplirBioEtDetails(commercial);

  // 5b. Vidéo YouTube de démonstration
  afficherVideo(commercial);

  // 5c. Carrousel d'images de réalisations terrain
  afficherCarrousel(commercial);

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

  // Initialisations WOW Networking demandées
  jouerIntro(commercial);
  afficherStatut(commercial);
  afficherCompteur(commercial.id);
  afficherBadges(commercial.id);
  afficherClientsConfiance();
  await chargerTemoignages(commercial.id);
  await trackerParrainage(commercial.id);
  await afficherBadgeParrainage(commercial.id);
  initialiserPartage(commercial);

  // Écouteurs des boutons exacts
  const btnEchange = document.getElementById('btn-echange');
  const modalEchange = document.getElementById('modal-echange');
  const formEchange = document.getElementById('form-echange');
  const btnFermerEchange = document.getElementById('btn-fermer-modal-echange');

  if (btnEchange && modalEchange) {
    btnEchange.onclick = () => {
      trackerEvenement('clic_echange_carte', commercial.id);
      modalEchange.classList.remove('hidden');
    };
  }
  if (btnFermerEchange && modalEchange) {
    btnFermerEchange.onclick = () => modalEchange.classList.add('hidden');
  }
  if (modalEchange) {
    modalEchange.onclick = (e) => {
      if (e.target === modalEchange) modalEchange.classList.add('hidden');
    };
  }
  if (formEchange) {
    formEchange.onsubmit = (e) => {
      e.preventDefault();
      echangerCarte(commercial.id);
    };
  }

  const btnRdv = document.getElementById('btn-rdv');
  const modalRdv = document.getElementById('modal-rdv');
  const formRdv = document.getElementById('form-rdv');
  const btnFermerRdv = document.getElementById('btn-fermer-modal-rdv');

  if (btnRdv) {
    btnRdv.onclick = () => {
      trackerEvenement('clic_rdv', commercial.id);
      ouvrirRdv(commercial);
    };
  }
  if (btnFermerRdv && modalRdv) {
    btnFermerRdv.onclick = () => modalRdv.classList.add('hidden');
  }
  if (formRdv) {
    formRdv.onsubmit = (e) => {
      e.preventDefault();
      finaliserRdvFormulaire(commercial);
    };
  }

  const btnKit = document.getElementById('btn-kit');
  if (btnKit) {
    btnKit.onclick = () => {
      trackerEvenement('clic_kit_networking', commercial.id);
      genererKitNetworking(commercial);
    };
  }

  const btnPartager = document.getElementById('btn-partager');
  if (btnPartager) {
    btnPartager.onclick = () => {
      trackerEvenement('partager_carte', commercial.id);
      ouvrirModalPartage(commercial);
    };
  }

  // Bonus : Simulateur ROI, Wallet
  initialiserSimulateurROI();
  initialiserWallet(commercial);

  // Lien sécurisé discret vers l'Espace Commercial Pro
  const lienEspaceComm = document.getElementById('lien-espace-commercial');
  if (lienEspaceComm && commercial?.id) {
    lienEspaceComm.href = `commercial.html?id=${encodeURIComponent(commercial.id)}`;
  }

  // 11. Section Entreprise Lou Ame Tay et galerie
  remplirEntreprise();
}

/**
 * Configure les boutons de la section "Mes outils & Kit Networking"
 * @param {Object} commercial 
 */
function configurerSectionOutils(commercial) {
  const btnKitOutils = document.getElementById('btn-telecharger-kit-outils');
  const btnPdfOutils = document.getElementById('btn-telecharger-pdf-outils');
  const btnSigOutils = document.getElementById('btn-copier-signature-outils');

  if (btnKitOutils) {
    btnKitOutils.addEventListener('click', () => {
      trackerEvenement('clic_kit_networking_zip', commercial.id);
      genererKitNetworking(commercial);
    });
  }

  if (btnPdfOutils) {
    btnPdfOutils.addEventListener('click', () => {
      trackerEvenement('clic_carte_pdf', commercial.id);
      genererCartePDF(commercial);
    });
  }

  if (btnSigOutils) {
    btnSigOutils.addEventListener('click', () => {
      trackerEvenement('clic_copie_signature', commercial.id);
      copierSignature(commercial);
    });
  }
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
    btnWa.href = construireMessageWhatsApp(c);
    btnWa.addEventListener('click', (e) => {
      e.preventDefault();
      trackerEvenement('whatsapp', c.id);
      ouvrirWhatsAppIntelligent(c);
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

  const btnWeb = document.getElementById('action-siteweb');
  if (btnWeb) {
    btnWeb.href = 'https://www.louametay.com';
    btnWeb.addEventListener('click', () => {
      trackerEvenement('clic_site_web_officiel', c.id);
    });
  }

  if (btnPartage) {
    btnPartage.addEventListener('click', () => {
      trackerEvenement('partage', c.id);
      ouvrirModalPartage(c);
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
    btnSupportDirect.href = construireMessageWhatsApp(c);
    btnSupportDirect.addEventListener('click', (e) => {
      e.preventDefault();
      trackerEvenement('whatsapp', c.id);
      ouvrirWhatsAppIntelligent(c);
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
    ligneWa.href = construireMessageWhatsApp(c);
    if (valWa) valWa.textContent = `+${num}`;
    ligneWa.addEventListener('click', (e) => {
      e.preventDefault();
      trackerEvenement('whatsapp', c.id);
      ouvrirWhatsAppIntelligent(c);
    });
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
    div.addEventListener('click', () => {
      enregistrerFormuleConsultee(offre.nom);
    });

    const urlWA = construireMessageWhatsApp(c, { formule: offre.nom });

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
      <a href="${urlWA}" target="_blank" rel="noopener noreferrer" class="btn btn-primaire btn-choisir-offre">
        Commander / Discuter de cette formule ➔
      </a>
    `;

    const btnCommander = div.querySelector('.btn-choisir-offre');
    if (btnCommander) {
      btnCommander.addEventListener('click', (e) => {
        e.preventDefault();
        trackerEvenement('whatsapp', c.id);
        enregistrerFormuleConsultee(offre.nom);
        ouvrirWhatsAppIntelligent(c, { formule: offre.nom });
      });
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

  const infosReseaux = {
    facebook: {
      nom: 'Facebook',
      label: 'Page Facebook officielle Lou Ame Tay',
      svg: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`
    },
    instagram: {
      nom: 'Instagram',
      label: 'Compte Instagram @louametaye',
      svg: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`
    },
    linkedin: {
      nom: 'LinkedIn',
      label: 'Page LinkedIn officielle Lou Ame Tay',
      svg: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>`
    },
    tiktok: {
      nom: 'TikTok',
      label: 'Compte TikTok @louametay',
      svg: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.97-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>`
    },
    youtube: {
      nom: 'YouTube',
      label: 'Chaîne YouTube officielle Lou Ame Tay',
      svg: `<svg viewBox="0 0 24 24" aria-hidden="true" style="fill: #FF0000;"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`
    }
  };

  const ordreReseaux = ['facebook', 'instagram', 'linkedin', 'tiktok', 'youtube'];
  let totalAjoutes = 0;

  for (const reseau of ordreReseaux) {
    const url = reseaux[reseau];
    const info = infosReseaux[reseau];
    if (url && url.trim().length > 0 && info) {
      const a = document.createElement('a');
      a.className = `chimp-reseau-bulle ${reseau}`;
      a.href = url.trim();
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.title = info.label;
      a.setAttribute('aria-label', info.label);
      a.innerHTML = `${info.svg}<span class="chimp-reseau-nom">${info.nom}</span>`;
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

    // Mémorisation du contexte pour enrichir le WhatsApp intelligent
    enregistrerVisiteur(nom, etab);
    if (formule) enregistrerFormuleConsultee(formule);

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
function partagerCarteNatif(c) {
  const modalPartage = document.getElementById('modal-partager-wow');
  if (modalPartage) {
    modalPartage.classList.add('active');
    configurerModalPartage(c);
  } else {
    const url = window.location.href;
    const titre = `${c.prenom} ${c.nom} — Lou Ame Tay 🍽️`;
    const texte = `Découvrez la carte digitale de ${c.prenom} ${c.nom}, ${c.poste || 'Conseiller'} Lou Ame Tay : ${url}`;
    if (navigator.share) {
      navigator.share({ title: titre, text: texte, url: url }).catch(() => copierDansPressePapier(url, "✓ Lien copié !"));
    } else {
      copierDansPressePapier(url, "✓ Lien copié !");
    }
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

// ==============================================================================
// 12. LOCALISATION & ITINÉRAIRE (GOOGLE MAPS / APPLE MAPS)
// ==============================================================================
export function afficherLocalisation(c) {
  const section = document.getElementById('section-localisation');
  const adresseEl = document.getElementById('loc-adresse');
  const btn = document.getElementById('btn-itinerair');

  if (!section || !btn || !adresseEl) return;

  if (!c.adresse && !c.latitude && !c.maps_url) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'flex';
  adresseEl.textContent = c.adresse || 'Voir l\'emplacement sur la carte';

  let url = '#';
  if (c.maps_url) {
    url = c.maps_url;
  } else if (c.latitude && c.longitude) {
    url = `https://www.google.com/maps/dir/?api=1&destination=${c.latitude},${c.longitude}`;
  } else if (c.adresse) {
    url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.adresse)}`;
  }

  btn.href = url;

  btn.addEventListener('click', () => {
    trackerEvenement('itineraire_maps', c.id);
  });
}

// ==============================================================================
// 13. SYSTÈME D'AVIS & NOTATIONS CLIENTS (0 À 10)
// ==============================================================================
let noteSelectionnee = 0;

export function afficherEtoiles(noteMoyenne) {
  const nbEtoilesPleines = Math.round(Number(noteMoyenne) || 0);
  const container = document.getElementById('avis-etoiles-affichees');
  if (!container) return;

  container.innerHTML = '';
  for (let i = 1; i <= 10; i++) {
    const span = document.createElement('span');
    span.textContent = i <= nbEtoilesPleines ? '★' : '☆';
    span.style.color = i <= nbEtoilesPleines ? '#C9A227' : '#CBD5E1';
    span.style.fontSize = '22px';
    span.style.cursor = 'default';
    span.setAttribute('aria-hidden', 'true');
    container.appendChild(span);
  }
}

export function initialiserSelecteurNote() {
  const container = document.getElementById('note-selector');
  const input = document.getElementById('note-input');
  const affichee = document.getElementById('note-affichee');
  if (!container || !input || !affichee) return;

  container.innerHTML = '';
  for (let i = 1; i <= 10; i++) {
    const span = document.createElement('span');
    span.className = 'etoile';
    span.textContent = '★';
    span.dataset.valeur = String(i);
    span.setAttribute('role', 'radio');
    span.setAttribute('aria-label', `${i} sur 10`);
    span.tabIndex = 0;

    const appliquerNote = (val) => {
      noteSelectionnee = val;
      input.value = String(val);
      affichee.textContent = String(val);
      container.querySelectorAll('.etoile').forEach((e, idx) => {
        const estActif = idx < val;
        e.classList.toggle('active', estActif);
        e.style.color = estActif ? '#C9A227' : '#CBD5E1';
      });
    };

    span.addEventListener('click', () => appliquerNote(i));
    span.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        appliquerNote(i);
      }
    });

    span.addEventListener('mouseenter', () => {
      container.querySelectorAll('.etoile').forEach((e, idx) => {
        e.style.color = idx < i ? '#C9A227' : '#CBD5E1';
      });
    });

    container.appendChild(span);
  }

  container.addEventListener('mouseleave', () => {
    container.querySelectorAll('.etoile').forEach((e, idx) => {
      e.style.color = idx < noteSelectionnee ? '#C9A227' : '#CBD5E1';
    });
  });
}

export async function chargerAvis(commercialId) {
  const noteMoyenneEl = document.getElementById('note-moyenne');
  const nbAvisEl = document.getElementById('nb-avis');
  const listeEl = document.getElementById('liste-avis');
  if (!noteMoyenneEl || !nbAvisEl || !listeEl) return;

  try {
    let noteMoyenne = 0;
    let nbAvis = 0;

    if (estSupabaseConfigure()) {
      const { data: stats } = await supabase
        .from('commerciaux_notes')
        .select('*')
        .eq('commercial_id', commercialId)
        .maybeSingle();

      if (stats) {
        noteMoyenne = Number(stats.note_moyenne) || 0;
        nbAvis = Number(stats.nb_avis) || 0;
      }
    }

    noteMoyenneEl.textContent = noteMoyenne > 0 ? noteMoyenne.toFixed(1) : '—';
    nbAvisEl.textContent = nbAvis > 0 ? `(${nbAvis} avis)` : '(aucun avis)';
    afficherEtoiles(noteMoyenne);

    let avis = [];
    if (estSupabaseConfigure()) {
      const { data, error } = await supabase
        .from('avis')
        .select('nom_visiteur, note, commentaire, created_at, restaurant_visiteur')
        .eq('commercial_id', commercialId)
        .eq('statut', 'publie')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        avis = data;
      }
    }

    if (!avis || avis.length === 0) {
      listeEl.innerHTML = '<p style="text-align:center; color:#94A3B8; padding:1.25rem 0; font-size:0.9rem;">Soyez le premier à laisser une note ✨</p>';
      return;
    }

    listeEl.innerHTML = avis.map(a => `
      <div class="avis-item">
        <div class="avis-top">
          <span class="avis-auteur">${escapeHtml(a.nom_visiteur || 'Client partenaire')}${a.restaurant_visiteur ? ` — <em>${escapeHtml(a.restaurant_visiteur)}</em>` : ''}</span>
          <span class="avis-note">${a.note}/10 ⭐</span>
        </div>
        ${a.commentaire ? `<p class="avis-commentaire">${escapeHtml(a.commentaire)}</p>` : ''}
        <span class="avis-date">${formaterDateAvis(a.created_at)}</span>
      </div>
    `).join('');

  } catch (err) {
    console.warn('Erreur chargement avis :', err);
    noteMoyenneEl.textContent = '—';
    nbAvisEl.textContent = '(aucun avis)';
    afficherEtoiles(0);
  }
}

export function initialiserAvis(commercialId) {
  const sectionAvis = document.getElementById('section-avis');
  const btnLaisserAvis = document.getElementById('btn-laisser-avis');
  const formAvis = document.getElementById('formulaire-avis');
  if (!sectionAvis) return;

  initialiserSelecteurNote();

  btnLaisserAvis?.addEventListener('click', () => {
    formAvis?.classList.toggle('hidden');
    if (!formAvis?.classList.contains('hidden')) {
      formAvis?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  formAvis?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await envoyerAvis(commercialId);
  });

  // Lazy loading : Ne charger que lorsque la section devient visible à l'écran
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          chargerAvis(commercialId);
          obs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '200px' });
    observer.observe(sectionAvis);
  } else {
    chargerAvis(commercialId);
  }
}

async function envoyerAvis(commercialId) {
  if (noteSelectionnee <= 0 || noteSelectionnee > 10) {
    afficherToast('❌ Veuillez sélectionner une note entre 1 et 10 étoiles.');
    return;
  }

  // 1. Anti-spam côté client : Vérifier localStorage (1 avis par commercial par 24h)
  const cleAntiSpam = `LOUAMETAY_AVIS_${commercialId}`;
  const dernierEnvoi = localStorage.getItem(cleAntiSpam);
  if (dernierEnvoi) {
    const tempsEcouleMs = Date.now() - Number(dernierEnvoi);
    if (tempsEcouleMs < 24 * 60 * 60 * 1000) {
      const heuresRestantes = Math.ceil((24 * 60 * 60 * 1000 - tempsEcouleMs) / (60 * 60 * 1000));
      afficherToast(`⏳ Vous avez déjà noté ce conseiller. Prochain avis possible dans ~${heuresRestantes}h.`);
      return;
    }
  }

  const btnEnvoyer = document.getElementById('btn-envoyer-avis');
  const commInput = document.getElementById('avis-commentaire');
  const nomInput = document.getElementById('avis-nom');
  const restauInput = document.getElementById('avis-restaurant');

  const commentaire = commInput ? commInput.value.trim() : '';
  const nom = nomInput ? nomInput.value.trim() : '';
  const restaurant = restauInput ? restauInput.value.trim() : '';

  if (btnEnvoyer) {
    btnEnvoyer.disabled = true;
    btnEnvoyer.textContent = 'Envoi de votre avis...';
  }

  try {
    const ipHash = 'client_' + btoa(navigator.userAgent.substring(0, 30) + (window.screen ? window.screen.width : '0')).substring(0, 16);

    const { error } = await supabase.from('avis').insert({
      commercial_id: commercialId,
      note: noteSelectionnee,
      commentaire: commentaire || null,
      nom_visiteur: nom || null,
      restaurant_visiteur: restaurant || null,
      ip_hash: ipHash,
      user_agent: navigator.userAgent.substring(0, 200),
      statut: 'publie'
    });

    if (error) {
      console.error('Erreur Supabase envoi avis :', error);
      if (error.message && error.message.includes('24 heures')) {
        afficherToast('⏳ Vous avez déjà laissé un avis pour ce conseiller au cours des dernières 24 heures.');
      } else {
        afficherToast('❌ Erreur lors de l\'enregistrement. Veuillez réessayer.');
      }
      return;
    }

    // Sauvegarde anti-spam locale
    localStorage.setItem(cleAntiSpam, String(Date.now()));

    afficherToast('✅ Merci beaucoup pour votre avis !');

    // Réinitialisation
    if (commInput) commInput.value = '';
    if (nomInput) nomInput.value = '';
    if (restauInput) restauInput.value = '';
    noteSelectionnee = 0;
    const input = document.getElementById('note-input');
    const affichee = document.getElementById('note-affichee');
    if (input) input.value = '0';
    if (affichee) affichee.textContent = '0';
    document.querySelectorAll('#note-selector .etoile').forEach(e => {
      e.classList.remove('active');
      e.style.color = '#CBD5E1';
    });

    document.getElementById('formulaire-avis')?.classList.add('hidden');

    // Recharger la moyenne et les avis immédiatement
    await chargerAvis(commercialId);

  } catch (err) {
    console.error('Exception envoi avis :', err);
    afficherToast('❌ Une erreur est survenue lors de l\'envoi.');
  } finally {
    if (btnEnvoyer) {
      btnEnvoyer.disabled = false;
      btnEnvoyer.textContent = '📩 Envoyer mon avis';
    }
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formaterDateAvis(iso) {
  if (!iso) return "Récemment";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffJours = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffMs < 24 * 60 * 60 * 1000 && diffJours <= 0) return "Aujourd'hui";
  if (diffJours === 1) return "Hier";
  if (diffJours > 1 && diffJours < 7) return `Il y a ${diffJours} jours`;
  if (diffJours >= 7 && diffJours < 30) return `Il y a ${Math.floor(diffJours / 7)} sem.`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ═══════════════════════════════════════════════════════════════════
// 14. VIDÉO YOUTUBE DE DÉMONSTRATION (MINIATURE HD + NOCONTENT)
// ═══════════════════════════════════════════════════════════════════
function afficherVideo(commercial) {
  const section = document.getElementById('section-video');
  if (!section) return;

  // Vidéo de démonstration officielle Lou Ame Tay par défaut (garantit l'affichage sur toutes les cartes)
  const DEFAULT_VIDEO_ID = 'hZq2u-yPnAE';
  const DEFAULT_VIDEO_TITRE = 'Lou Ame Tay ? – Digitalisez Votre Restaurant en 3 Clics';
  const DEFAULT_VIDEO_DESC = 'Découvrez en vidéo la solution N°1 au Sénégal : Menu digital QR code sans application, écran cuisine KDS en temps réel et paiement direct Wave & Orange Money.';

  const videoId = (commercial && commercial.video_youtube_id && commercial.video_youtube_id.trim()) || DEFAULT_VIDEO_ID;
  
  section.style.display = 'block';
  
  // Charger la miniature YouTube HD
  const poster = document.getElementById('video-poster');
  if (poster) {
    poster.src = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    poster.onerror = () => {
      // Fallback si maxresdefault n'est pas généré par YouTube
      poster.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    };
  }
  
  const elTitre = document.getElementById('video-titre');
  if (elTitre) {
    elTitre.textContent = (commercial && commercial.video_titre) || DEFAULT_VIDEO_TITRE;
  }
  
  const elDesc = document.getElementById('video-description');
  if (elDesc) {
    elDesc.textContent = (commercial && commercial.video_description) || DEFAULT_VIDEO_DESC;
    elDesc.style.display = 'block';
  }
  
  // Clic ou clavier → charger l'iframe YouTube sécurisée sans cookies tiers
  const thumb = document.getElementById('video-thumbnail');
  const iframeContainer = document.getElementById('video-iframe-container');
  const iframe = document.getElementById('video-iframe');
  
  if (thumb && iframeContainer && iframe) {
    const activerVideo = () => {
      iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
      thumb.style.display = 'none';
      iframeContainer.classList.remove('hidden');
      if (typeof trackerEvenement === 'function') {
        trackerEvenement('video_play', commercial.id);
      }
    };
    
    thumb.addEventListener('click', activerVideo);
    thumb.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activerVideo();
      }
    });
  }
}

// ═══════════════════════════════════════════════════════════════════
// 15. CARROUSEL D'IMAGES DES RÉALISATIONS (SWIPE + AUTOPLAY 4S)
// ═══════════════════════════════════════════════════════════════════
let carrouselIndex = 0;
let carrouselInterval = null;
let carrouselNbSlides = 0;

function afficherCarrousel(commercial) {
  const section = document.getElementById('section-carrousel');
  if (!section) return;

  let images = commercial.carrousel_images || [];
  if (typeof images === 'string') {
    try {
      images = JSON.parse(images);
    } catch (e) {
      images = [];
    }
  }

  // Minimum 2 images requis pour afficher un carrousel
  if (!Array.isArray(images) || images.length < 2) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';

  const track = document.getElementById('carrousel-track');
  const dots = document.getElementById('carrousel-dots');
  const prevBtn = document.getElementById('carrousel-prev');
  const nextBtn = document.getElementById('carrousel-next');
  const container = document.getElementById('carrousel-container');

  if (!track || !dots) return;

  // Génération des diapositives
  track.innerHTML = images.map((img, i) => `
    <div class="carrousel-slide" data-index="${i}">
      <img src="${img.url}" alt="${escapeHtml(img.titre || 'Réalisation ' + (i + 1))}" loading="${i === 0 ? 'eager' : 'lazy'}">
      ${(img.legende || img.titre) ? `
        <div class="carrousel-slide-caption">${escapeHtml(img.titre || img.legende)}</div>
      ` : ''}
    </div>
  `).join('');

  // Génération des indicateurs (dots)
  dots.innerHTML = images.map((_, i) => `
    <button type="button" class="carrousel-dot ${i === 0 ? 'active' : ''}" 
            data-index="${i}" 
            aria-label="Aller à la diapositive ${i + 1}"></button>
  `).join('');

  carrouselNbSlides = images.length;
  carrouselIndex = 0;
  allerASlide(0);

  // Navigation par dots
  dots.querySelectorAll('.carrousel-dot').forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      allerASlide(parseInt(dot.dataset.index, 10));
      resetAutoPlay();
    });
  });

  // Boutons Précédent / Suivant
  prevBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    allerASlide(carrouselIndex - 1);
    resetAutoPlay();
  });

  nextBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    allerASlide(carrouselIndex + 1);
    resetAutoPlay();
  });

  // Swipe tactile sur smartphones et tablettes
  let touchStartX = 0;
  container?.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  container?.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 40) {
      allerASlide(diff > 0 ? carrouselIndex + 1 : carrouselIndex - 1);
      resetAutoPlay();
    }
  }, { passive: true });

  // Pause au survol sur ordinateur
  container?.addEventListener('mouseenter', () => {
    if (carrouselInterval) clearInterval(carrouselInterval);
  });
  container?.addEventListener('mouseleave', () => {
    demarrerAutoPlay();
  });

  // Démarrage du défilement automatique
  demarrerAutoPlay();
}

function allerASlide(index) {
  if (carrouselNbSlides <= 0) return;
  // Boucle infinie gauche / droite
  if (index < 0) index = carrouselNbSlides - 1;
  if (index >= carrouselNbSlides) index = 0;

  carrouselIndex = index;

  const track = document.getElementById('carrousel-track');
  if (track) {
    track.style.transform = `translateX(-${index * 100}%)`;
  }

  // Mise à jour de la classe active sur les indicateurs
  document.querySelectorAll('.carrousel-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });
}

function demarrerAutoPlay() {
  if (carrouselInterval) clearInterval(carrouselInterval);
  carrouselInterval = setInterval(() => {
    allerASlide(carrouselIndex + 1);
  }, 4000); // 4 secondes
}

function resetAutoPlay() {
  if (carrouselInterval) clearInterval(carrouselInterval);
  demarrerAutoPlay();
}

// ═══════════════════════════════════════════════════════════════════
// SPRINT A2 : STATUT DE DISPONIBILITÉ EN TEMPS RÉEL
// ═══════════════════════════════════════════════════════════════════
export function afficherStatut(commercial) {
  const el = document.getElementById('statut-dispo');
  if (!el) return;
  
  const statut = commercial.statut_disponible || 'disponible';
  const messages = {
    disponible: 'Disponible maintenant',
    occupe: commercial.statut_message || 'En rendez-vous',
    indisponible: commercial.statut_message || 'Indisponible aujourd\'hui'
  };
  
  el.className = `statut-dispo ${statut === 'disponible' ? '' : statut}`;
  const texteEl = el.querySelector('.statut-texte');
  if (texteEl) texteEl.textContent = messages[statut] || 'Disponible maintenant';
}

export const afficherStatutDisponibilite = afficherStatut;

// ═══════════════════════════════════════════════════════════════════
// SPRINT A3 : COMPTEUR DE VUES ANIMÉ
// ═══════════════════════════════════════════════════════════════════
export async function afficherCompteur(commercialId) {
  let cible = 148;
  if (estSupabaseConfigure()) {
    try {
      const { data } = await supabase
        .from('commerciaux_stats')
        .select('vues_mois')
        .eq('commercial_id', commercialId)
        .single();
      if (data && data.vues_mois) cible = data.vues_mois;
    } catch (e) {
      // Mode démo / fallback
    }
  }

  const el = document.getElementById('vues-num');
  if (el) animerNombre(el, 0, cible, 1000);
}

export const afficherCompteurVues = afficherCompteur;

function animerNombre(el, debut, fin, duree) {
  const start = performance.now();
  function update(now) {
    const progress = Math.min((now - start) / duree, 1);
    el.textContent = Math.floor(debut + (fin - debut) * progress);
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = fin;
  }
  requestAnimationFrame(update);
}

// ═══════════════════════════════════════════════════════════════════
// SPRINT C2 : BADGES DE CERTIFICATION
// ═══════════════════════════════════════════════════════════════════
export async function afficherBadges(commercialId) {
  let badges = [
    { libelle: "Expert CHR Certifié", icone: "🛡️", couleur: "#C9A227" },
    { libelle: "Déploiement 48h", icone: "⚡", couleur: "#22C55E" },
    { libelle: "Partenaire Wave & OM", icone: "💙", couleur: "#3B82F6" }
  ];

  if (estSupabaseConfigure()) {
    try {
      const { data } = await supabase
        .from('badges')
        .select('*')
        .eq('commercial_id', commercialId)
        .eq('actif', true)
        .order('ordre');
      if (data && data.length > 0) badges = data;
    } catch (e) {
      // Fallback
    }
  }

  const container = document.getElementById('badges-container');
  if (!container || !badges.length) return;
  
  container.innerHTML = badges.map(b => `
    <span class="badge-item" style="background: ${b.couleur || '#C9A227'}20; color: ${b.couleur || '#C9A227'}; border-color: ${b.couleur || '#C9A227'}40;">
      ${b.icone || '✦'} ${b.libelle || b.titre}
    </span>
  `).join('');
}

export const afficherBadgesCommercial = afficherBadges;

// ═══════════════════════════════════════════════════════════════════
// SPRINT C1 : CLIENTS DE CONFIANCE (MARQUEE TRACK)
// ═══════════════════════════════════════════════════════════════════
export async function afficherClientsConfiance() {
  const track = document.getElementById('marquee-track');
  if (!track) return;

  let logos = [
    { nom: "Le Teranga", logo_url: "images/deploiement1.jpg" },
    { nom: "Lagon 1", logo_url: "images/deploiement2.jpg" },
    { nom: "Café de Rome", logo_url: "images/deploiement3.jpg" },
    { nom: "Chez Loutcha", logo_url: "images/deploiement1.jpg" },
    { nom: "Hôtel Farid", logo_url: "images/deploiement2.jpg" },
    { nom: "Le Jardin Thaïlandais", logo_url: "images/deploiement3.jpg" }
  ];

  if (estSupabaseConfigure()) {
    try {
      const { data } = await supabase
        .from('clients_logos')
        .select('*')
        .eq('actif', true)
        .order('ordre');
      if (data && data.length) logos = data;
    } catch (e) {}
  }

  const doubleLogos = [...logos, ...logos];
  track.innerHTML = doubleLogos.map(l => `
    <img src="${l.logo_url || 'images/logo.svg'}" alt="${escapeHtml(l.nom)}" title="${escapeHtml(l.nom)}" onerror="this.src='images/logo.svg'">
  `).join('');
}

export const afficherLogosClients = afficherClientsConfiance;

// ═══════════════════════════════════════════════════════════════════
export async function afficherTemoignages(commercialId) {
  return await chargerTemoignages(commercialId);
}

// ═══════════════════════════════════════════════════════════════════
// SPRINT B & D : BARRE NETWORKING (ÉCHANGE, RDV 7J, KIT ZIP)
// ═══════════════════════════════════════════════════════════════════
function configurerBarreNetworking(commercial) {
  // 1. Modal Échange de carte (B1)
  const btnEchange = document.getElementById('btn-echange-carte');
  const modalEchange = document.getElementById('modal-echange-carte');
  const fermerEchange = document.getElementById('fermer-modal-echange');
  const formEchange = document.getElementById('form-echange-carte');

  if (btnEchange && modalEchange) {
    btnEchange.addEventListener('click', () => {
      trackerEvenement('clic_echange_carte', commercial.id);
      modalEchange.classList.add('active');
    });
  }

  fermerEchange?.addEventListener('click', () => modalEchange?.classList.remove('active'));
  modalEchange?.addEventListener('click', (e) => {
    if (e.target === modalEchange) modalEchange.classList.remove('active');
  });

  formEchange?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nom = document.getElementById('echange-nom')?.value.trim();
    const tel = document.getElementById('echange-tel')?.value.trim();
    const email = document.getElementById('echange-email')?.value.trim();
    const etab = document.getElementById('echange-etablissement')?.value.trim();
    const poste = document.getElementById('echange-poste')?.value.trim();
    const msg = document.getElementById('echange-message')?.value.trim();

    if (estSupabaseConfigure()) {
      try {
        await supabase.from('echanges_cartes').insert([{
          commercial_id: commercial.id,
          nom_prospect: nom,
          telephone_prospect: tel,
          email_prospect: email || null,
          etablissement_prospect: etab,
          poste_prospect: poste || null,
          message_prospect: msg || null
        }]);
      } catch (err) {
        console.warn('Erreur insertion échange de carte:', err);
      }
    }

    trackerEvenement('echange_carte_valide', commercial.id);

    // Alerte WhatsApp au commercial
    const numWA = (commercial.whatsapp || "221762312003").replace(/\D/g, '');
    const msgWA = encodeURIComponent(
      `Bonjour ${commercial.prenom},\n\n` +
      `🤝 NOUVEL ÉCHANGE DE CARTE (Lou Ame Tay) :\n` +
      `• Nom : ${nom}\n` +
      `• Établissement : ${etab}\n` +
      `• Téléphone : ${tel}\n` +
      (poste ? `• Poste : ${poste}\n` : '') +
      (email ? `• Email : ${email}\n` : '') +
      (msg ? `• Message : ${msg}\n` : '') +
      `\nÀ recontacter pour organiser une démo !`
    );
    window.open(`https://wa.me/${numWA}?text=${msgWA}`, '_blank');

    modalEchange?.classList.remove('active');
    formEchange.reset();
    afficherToast("✨ Carte échangée avec succès ! Le conseiller vous recontacte très vite.");
  });

  // 2. Modal RDV Intelligent 7 Jours (B2)
  const btnRdv = document.getElementById('btn-rdv-rapide');
  const modalRdvIntel = document.getElementById('modal-rdv-intelligent');
  const fermerRdvIntel = document.getElementById('fermer-modal-rdv-intel');
  const formRdvIntel = document.getElementById('form-rdv-intelligent');

  if (btnRdv && modalRdvIntel) {
    btnRdv.addEventListener('click', () => {
      trackerEvenement('clic_rdv_intelligent', commercial.id);
      modalRdvIntel.classList.add('active');
      genererJoursEtCreneauxRDV();
    });
  }

  fermerRdvIntel?.addEventListener('click', () => modalRdvIntel?.classList.remove('active'));
  modalRdvIntel?.addEventListener('click', (e) => {
    if (e.target === modalRdvIntel) modalRdvIntel.classList.remove('active');
  });

  formRdvIntel?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const dateChoisie = document.getElementById('rdv-intel-date-val')?.value;
    const creneauChoisi = document.getElementById('rdv-intel-creneau-val')?.value;
    const nom = document.getElementById('rdv-intel-nom')?.value.trim();
    const tel = document.getElementById('rdv-intel-tel')?.value.trim();
    const etab = document.getElementById('rdv-intel-etablissement')?.value.trim();
    const format = document.getElementById('rdv-intel-format')?.value;

    if (!dateChoisie || !creneauChoisi) {
      afficherToast("⚠️ Veuillez sélectionner un jour et un créneau horaire.");
      return;
    }

    if (estSupabaseConfigure()) {
      try {
        await supabase.from('rendez_vous').insert([{
          commercial_id: commercial.id,
          nom_client: nom,
          telephone_client: tel,
          etablissement_client: etab,
          date_rdv: dateChoisie,
          creneau_rdv: creneauChoisi,
          type_demo: format,
          statut: 'confirme'
        }]);
      } catch (err) {
        console.warn('Erreur enregistrement RDV:', err);
      }
    }

    trackerEvenement('rdv_reserve', commercial.id);

    // Lien Google Calendar
    const titreCal = encodeURIComponent(`Démo Lou Ame Tay — ${etab}`);
    const descCal = encodeURIComponent(`Démonstration de commande à table et menu digital avec ${commercial.prenom} ${commercial.nom} (${commercial.telephone}). Contact: ${nom} (${tel}).`);
    const dateIso = dateChoisie.replace(/-/g, '');
    const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${titreCal}&dates=${dateIso}T100000Z/${dateIso}T110000Z&details=${descCal}`;

    // Notification WhatsApp
    const numWA = (commercial.whatsapp || "221762312003").replace(/\D/g, '');
    const msgWA = encodeURIComponent(
      `Bonjour ${commercial.prenom},\n\n` +
      `📅 NOUVEAU RDV DÉMO PLANIFIÉ :\n` +
      `• Date : ${dateChoisie}\n` +
      `• Créneau : ${creneauChoisi}\n` +
      `• Établissement : ${etab}\n` +
      `• Contact : ${nom} (${tel})\n` +
      `• Format : ${format}\n\n` +
      `À très vite pour la démonstration !`
    );

    window.open(`https://wa.me/${numWA}?text=${msgWA}`, '_blank');
    setTimeout(() => {
      window.open(googleCalUrl, '_blank');
    }, 400);

    modalRdvIntel?.classList.remove('active');
    formRdvIntel.reset();
    afficherToast("📅 RDV validé ! Synchronisation WhatsApp et Google Calendar lancée.");
  });

  // 3. Modal Kit Networking ZIP (D1)
  const btnKit = document.getElementById('btn-telecharger-kit');
  const modalKit = document.getElementById('modal-kit-networking');
  const fermerKit = document.getElementById('fermer-modal-kit');
  const btnPackZip = document.getElementById('btn-generer-pack-zip');
  const btnPdfSeul = document.getElementById('btn-telecharger-seul-pdf');

  if (btnKit && modalKit) {
    btnKit.addEventListener('click', () => {
      trackerEvenement('clic_kit_networking', commercial.id);
      modalKit.classList.add('active');
    });
  }

  fermerKit?.addEventListener('click', () => modalKit?.classList.remove('active'));
  modalKit?.addEventListener('click', (e) => {
    if (e.target === modalKit) modalKit.classList.remove('active');
  });

  btnPackZip?.addEventListener('click', async () => {
    await genererKitNetworkingZIP(commercial);
  });

  btnPdfSeul?.addEventListener('click', () => {
    genererCarteVisitePDF(commercial);
  });
}

function genererJoursEtCreneauxRDV() {
  const containerJours = document.getElementById('calendrier-jours-grille');
  const containerCreneaux = document.getElementById('creneaux-horaires-grille');
  const inputDate = document.getElementById('rdv-intel-date-val');
  const inputCreneau = document.getElementById('rdv-intel-creneau-val');
  if (!containerJours || !containerCreneaux) return;

  const nomsJours = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const jours = [];
  const aujourdhui = new Date();

  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(aujourdhui.getDate() + i);
    if (d.getDay() === 0) continue;
    jours.push(d);
  }

  containerJours.innerHTML = jours.map((d, index) => {
    const jourNom = nomsJours[d.getDay()];
    const jourNum = d.getDate();
    const mois = (d.getMonth() + 1).toString().padStart(2, '0');
    const annee = d.getFullYear();
    const dateYMD = `${annee}-${mois}-${d.getDate().toString().padStart(2, '0')}`;
    return `
      <button type="button" class="jour-rdv-btn ${index === 0 ? 'actif' : ''}" data-date="${dateYMD}">
        <span class="jour-nom-court">${jourNom}</span>
        <span class="jour-num-date">${jourNum}</span>
      </button>
    `;
  }).join('');

  if (jours.length > 0 && inputDate) {
    const premier = jours[0];
    const mois = (premier.getMonth() + 1).toString().padStart(2, '0');
    inputDate.value = `${premier.getFullYear()}-${mois}-${premier.getDate().toString().padStart(2, '0')}`;
  }

  const creneaux = ['09h30', '11h00', '14h30', '16h00', '17h30'];
  containerCreneaux.innerHTML = creneaux.map((c, index) => `
    <button type="button" class="creneau-horaire-btn ${index === 0 ? 'actif' : ''}" data-creneau="${c}">
      ${c}
    </button>
  `).join('');

  if (inputCreneau) inputCreneau.value = creneaux[0];

  containerJours.querySelectorAll('.jour-rdv-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      containerJours.querySelectorAll('.jour-rdv-btn').forEach(b => b.classList.remove('actif'));
      btn.classList.add('actif');
      if (inputDate) inputDate.value = btn.dataset.date;
    });
  });

  containerCreneaux.querySelectorAll('.creneau-horaire-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      containerCreneaux.querySelectorAll('.creneau-horaire-btn').forEach(b => b.classList.remove('actif'));
      btn.classList.add('actif');
      if (inputCreneau) inputCreneau.value = btn.dataset.creneau;
    });
  });
}

// ═══════════════════════════════════════════════════════════════════
// SPRINT D1, D2, D3 : GÉNÉRATEUR KIT NETWORKING ZIP & PDF
// ═══════════════════════════════════════════════════════════════════
async function genererKitNetworkingZIP(c) {
  if (typeof window.JSZip === 'undefined') {
    afficherToast("⚠️ Module de compression ZIP en cours de chargement...");
    return;
  }

  const btnPack = document.getElementById('btn-generer-pack-zip');
  if (btnPack) {
    btnPack.disabled = true;
    btnPack.textContent = "⏳ Génération du Pack ZIP en cours...";
  }

  try {
    const zip = new window.JSZip();

    // 1. vCard 3.0
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
    zip.file(`contact_${c.prenom.toLowerCase()}_${c.nom.toLowerCase()}.vcf`, vCardContenu);

    // 2. QR Code PNG HD
    const qrCanvas = document.querySelector('#qrcode-cadre canvas');
    if (qrCanvas) {
      const dataUrl = qrCanvas.toDataURL('image/png');
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
      zip.file(`qr_code_${c.prenom.toLowerCase()}_${c.nom.toLowerCase()}.png`, base64Data, { base64: true });
    }

    // 3. Carte de Visite PDF 85x55mm
    if (window.jspdf && window.jspdf.jsPDF) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85, 55] });
      // Recto
      doc.setFillColor(11, 31, 58);
      doc.rect(0, 0, 85, 55, 'F');
      doc.setTextColor(201, 162, 39);
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
      doc.text(`Web : www.louametay.com`, 7, 49);

      // Verso
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
      doc.text('• Menu Digital interactif & multilingue (Wolof, FR, EN)', 10, 24);
      doc.text('• Écran Cuisine KDS en temps réel (0 erreur de bon)', 10, 29);
      doc.text('• Encaissement direct Wave & Orange Money', 10, 34);
      doc.text('• Déploiement en salle et formation en 48h', 10, 39);
      doc.setTextColor(201, 162, 39);
      doc.setFont('helvetica', 'bold');
      doc.text('Thiès — Dakar — Mbour — Saly', 42.5, 48, { align: 'center' });

      const pdfArrayBuffer = doc.output('arraybuffer');
      zip.file(`carte_visite_${c.prenom.toLowerCase()}_${c.nom.toLowerCase()}_85x55mm.pdf`, pdfArrayBuffer);
    }

    // 4. Signature Email HTML
    const htmlSig = (typeof genererSignatureEmail === 'function' && typeof entreprise !== 'undefined')
      ? genererSignatureEmail(c, entreprise)
      : `<div style="font-family:sans-serif;color:#0B1F3A;"><strong>${c.prenom} ${c.nom}</strong><br>${c.poste}<br>Lou Ame Tay — www.louametay.com</div>`;
    zip.file(`signature_email_${c.prenom.toLowerCase()}.html`, htmlSig);

    // 5. Message WhatsApp de recommandation
    const messageTxt = `Bonjour ! Je vous recommande vivement ${c.prenom} ${c.nom}, notre conseiller chez Lou Ame Tay (Menu QR Code et Écrans Cuisine pour restaurants). Voici sa carte digitale directe : ${window.location.href}`;
    zip.file(`message_recommandation_whatsapp.txt`, messageTxt);

    // 6. Fichier Lisez-moi
    const readmeTxt = `═══════════════════════════════════════════════════════════════\r\n` +
      `KIT NETWORKING OFFICIEL — LOU AME TAY\r\n` +
      `Conseiller : ${c.prenom} ${c.nom} (${c.poste})\r\n` +
      `Site : https://www.louametay.com\r\n` +
      `═══════════════════════════════════════════════════════════════\r\n\r\n` +
      `Ce kit contient tous les outils nécessaires pour vos présentations et impressions :\r\n` +
      `1. contact.vcf : Import direct dans votre carnet d'adresses (iPhone / Android).\r\n` +
      `2. qr_code.png : Image haute définition pour vos menus, affiches et chevalets.\r\n` +
      `3. carte_visite_85x55mm.pdf : Format d'impression standardisé recto/verso pour imprimeur.\r\n` +
      `4. signature_email.html : Signature professionnelle compatible Gmail & Outlook.\r\n` +
      `5. message_recommandation_whatsapp.txt : Texte prêt à l'envoi pour recommander le service.\r\n\r\n` +
      `Lou Ame Tay — La transition digitale de la restauration au Sénégal.`;
    zip.file(`LISEZ-MOI_LOU_AME_TAY.txt`, readmeTxt);

    // Génération et téléchargement
    const contenuBlob = await zip.generateAsync({ type: 'blob' });
    const lien = document.createElement('a');
    lien.href = URL.createObjectURL(contenuBlob);
    lien.download = `Kit_Networking_${c.prenom}_${c.nom}_LouAmeTay.zip`;
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);
    URL.revokeObjectURL(lien.href);

    afficherToast("✓ Pack Kit Networking ZIP téléchargé avec succès !");
  } catch (err) {
    console.error("Erreur génération ZIP:", err);
    afficherToast("❌ Erreur lors de la création du pack ZIP.");
  } finally {
    if (btnPack) {
      btnPack.disabled = false;
      btnPack.textContent = "⬇️ Télécharger le Pack ZIP complet (.zip)";
    }
  }
}

function genererCarteVisitePDF(c) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    afficherToast("⚠️ Module PDF en cours de chargement...");
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [85, 55] });

  // Recto
  doc.setFillColor(11, 31, 58);
  doc.rect(0, 0, 85, 55, 'F');
  doc.setTextColor(201, 162, 39);
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
  doc.text(`Web : www.louametay.com`, 7, 49);

  // Verso
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
  doc.text('• Menu Digital interactif & multilingue (Wolof, FR, EN)', 10, 24);
  doc.text('• Écran Cuisine KDS en temps réel (0 erreur de bon)', 10, 29);
  doc.text('• Encaissement direct Wave & Orange Money', 10, 34);
  doc.text('• Déploiement en salle et formation en 48h', 10, 39);
  doc.setTextColor(201, 162, 39);
  doc.setFont('helvetica', 'bold');
  doc.text('Thiès — Dakar — Mbour — Saly', 42.5, 48, { align: 'center' });

  doc.save(`Carte_Visite_${c.prenom}_${c.nom}_85x55mm.pdf`);
  afficherToast("✓ Carte de visite PDF (85x55mm) téléchargée !");
}

// ═══════════════════════════════════════════════════════════════════
// SPRINT E2 : MODAL PARTAGE AVANCÉ
// ═══════════════════════════════════════════════════════════════════
function configurerModalPartage(c) {
  const modal = document.getElementById('modal-partager-wow');
  const fermer = document.getElementById('fermer-modal-partage');
  const btnWa = document.getElementById('btn-partage-wa-wow');
  const btnCopier = document.getElementById('btn-partage-copier-wow');
  const btnMail = document.getElementById('btn-partage-mail-wow');
  if (!modal) return;

  const url = window.location.href;
  const messageWA = encodeURIComponent(
    `Salam ! Découvre la carte de visite de ${c.prenom} ${c.nom}, conseiller chez Lou Ame Tay (solutions QR code et écran cuisine pour restaurants) : ${url}`
  );

  btnWa?.addEventListener('click', () => {
    window.open(`https://wa.me/?text=${messageWA}`, '_blank');
  });

  btnCopier?.addEventListener('click', () => {
    copierDansPressePapier(url, "✓ Lien unique de recommandation copié !");
  });

  btnMail?.addEventListener('click', () => {
    const sujet = encodeURIComponent(`Recommandation : Carte digitale Lou Ame Tay`);
    const corps = encodeURIComponent(`Bonjour,\n\nJe vous recommande de consulter la carte de visite de ${c.prenom} ${c.nom} chez Lou Ame Tay :\n${url}\n\nBien cordialement.`);
    window.location.href = `mailto:?subject=${sujet}&body=${corps}`;
  });

  fermer?.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });
}

// ═══════════════════════════════════════════════════════════════════
// BONUS 1 : APPLE & GOOGLE WALLET
// ═══════════════════════════════════════════════════════════════════
function initialiserWallet(c) {
  const btnWallet = document.getElementById('btn-ajouter-wallet');
  if (btnWallet) {
    btnWallet.addEventListener('click', () => {
      trackerEvenement('clic_wallet_pass', c.id);
      ajouterAuWallet(c);
    });
  }

  const modalWallet = document.getElementById('modal-wallet');
  const fermerWallet = document.getElementById('fermer-modal-wallet');
  const btnApple = document.getElementById('btn-wallet-apple');
  const btnGoogle = document.getElementById('btn-wallet-google');

  fermerWallet?.addEventListener('click', () => modalWallet?.classList.remove('active'));
  modalWallet?.addEventListener('click', (e) => {
    if (e.target === modalWallet) modalWallet.classList.remove('active');
  });

  btnApple?.addEventListener('click', () => {
    ajouterAuWallet(c);
  });

  btnGoogle?.addEventListener('click', () => {
    ajouterAuWallet(c);
  });
}

// ═══════════════════════════════════════════════════════════════════
// BONUS 2 : SIMULATEUR DE RENTABILITÉ ROI CHR
// ═══════════════════════════════════════════════════════════════════
let chartRoiInstance = null;

function initialiserSimulateurROI() {
  const rangeTables = document.getElementById('simu-range-tables');
  const rangeTicket = document.getElementById('simu-range-ticket');
  const rangeRotation = document.getElementById('simu-range-rotation');
  const valTables = document.getElementById('simu-val-tables');
  const valTicket = document.getElementById('simu-val-ticket');
  const valRotation = document.getElementById('simu-val-rotation');
  const gainChiffre = document.getElementById('simu-chiffre-gain');
  if (!rangeTables || !rangeTicket || !rangeRotation) return;

  function calculerEtMettreAJour() {
    const tables = parseInt(rangeTables.value, 10);
    const ticket = parseInt(rangeTicket.value, 10);
    const rotation = parseFloat(rangeRotation.value);

    if (valTables) valTables.textContent = `${tables} tables`;
    if (valTicket) valTicket.textContent = `${ticket.toLocaleString('fr-FR')} FCFA`;
    if (valRotation) valRotation.textContent = `${rotation} service${rotation > 1 ? 's' : ''}`;

    const caActuel = Math.round(tables * rotation * ticket * 30);
    const gainMensuel = Math.round(caActuel * 0.18);
    const caAvec = caActuel + gainMensuel;

    if (gainChiffre) {
      gainChiffre.textContent = `+ ${gainMensuel.toLocaleString('fr-FR')} FCFA / mois`;
    }

    mettreAJourGraphiqueROI(caActuel, caAvec);
  }

  rangeTables.addEventListener('input', calculerEtMettreAJour);
  rangeTicket.addEventListener('input', calculerEtMettreAJour);
  rangeRotation.addEventListener('input', calculerEtMettreAJour);

  calculerEtMettreAJour();
}

function mettreAJourGraphiqueROI(caActuel, caAvec) {
  const canvas = document.getElementById('chart-roi-comparatif');
  if (!canvas || typeof window.Chart === 'undefined') return;

  if (chartRoiInstance) {
    chartRoiInstance.data.datasets[0].data = [Math.round(caActuel / 1000), Math.round(caAvec / 1000)];
    chartRoiInstance.update('none');
    return;
  }

  const ctx = canvas.getContext('2d');
  chartRoiInstance = new window.Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Sans Lou Ame Tay', 'Avec Lou Ame Tay ⭐'],
      datasets: [{
        label: 'CA Mensuel (en milliers FCFA)',
        data: [Math.round(caActuel / 1000), Math.round(caAvec / 1000)],
        backgroundColor: ['#64748B', '#C9A227'],
        borderRadius: 8,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.parsed.y.toLocaleString('fr-FR')} 000 FCFA`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#E2E8F0' },
          ticks: {
            callback: (val) => `${val} k`
          }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
}





