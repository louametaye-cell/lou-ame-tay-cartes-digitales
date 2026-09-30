/**
 * ==============================================================================
 * FICHIER : js/commercial.js
 * ESPACE PERSONNEL CONSEILLER TERRAIN — LOU AME TAY 🍽️
 * ==============================================================================
 * Gère l'authentification express (WhatsApp/Email + Code PIN), le tableau de bord,
 * le calcul automatique des commissions (10%), le CRM prospects, les annonces
 * et la gestion complète des notes de frais avec upload de justificatif photo obligatoire.
 */

import { supabase, estSupabaseConfigure, SUPABASE_URL } from './supabase-client.js';
import { 
  enregistrerActivite, 
  calculerDistanceGPS, 
  obtenirPositionActuelle, 
  genererLienItineraireGoogle, 
  genererLienGoogleCalendar 
} from './audit.js';
import { genererKitNetworking } from './kit-networking.js';
import { genererCartePDF } from './carte-pdf.js';
import { genererSignatureHTML, copierSignature } from './signature-email.js';
import { genererContratPDFA4 } from './contrat-pdf.js';
import { genererPitchCommercial, PROFILS_ETABLISSEMENTS } from './gemini-copilot.js';
import { initialiserModeOffline, empilerActionHorsLigne } from './offline-sync.js';
import { ajouterAuWallet, telechargerPassDigitalNFC } from './wallet-pass.js';
import { genererContratCommercialPDFA4 } from './contrat-commercial-pdf.js';

// État local de la session commerciale
let commercialConnecte = null;
let listeCommissions = [];
let listeDepenses = [];
let listeProspects = [];
let listeAnnonces = [];
let listeRdv = [];
let fichierJustificatifEnCours = null;

// ==============================================================================
// 1. INITIALISATION DE LA PAGE & GESTION DE SESSION
// ==============================================================================
document.addEventListener('DOMContentLoaded', async () => {
  initialiserDiaporama();
  initialiserNavigationOnglets();
  initialiserFormulaires();
  initialiserUploadJustificatif();
  initialiserModeOffline({ supabase, afficherToastFn: afficherToast });
  initialiserGeminiCopilotCommercial();
  initialiserPassWalletCommercial();
  initialiserOnboardingContratAgent();
  initialiserConsultationContratAgent();
  lancerHeartbeatPresenceCommercial();

  // Vérifier si une session est déjà mémorisée
  const sessionSauvegardee = localStorage.getItem('LOUAMETAY_COMMERCIAL_SESSION');
  if (sessionSauvegardee) {
    try {
      const data = JSON.parse(sessionSauvegardee);
      if (data && data.id) {
        await chargerProfilEtDemarrer(data.id);
        return;
      }
    } catch (e) {
      console.warn('Session commerciale corrompue, réinitialisation:', e);
      localStorage.removeItem('LOUAMETAY_COMMERCIAL_SESSION');
    }
  }

  // Si non connecté, afficher l'écran de connexion plein écran
  afficherEcranConnexion();
});

// Gestion du Diaporama Automatique Plein Écran
let diaporamaTimer = null;
let slideIndex = 0;

function initialiserDiaporama() {
  const slides = document.querySelectorAll('.comm-slide');
  const dots = document.querySelectorAll('.comm-dot');
  if (slides.length === 0) return;

  function afficherSlide(index) {
    slides.forEach((s, i) => s.classList.toggle('active', i === index));
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
    slideIndex = index;
  }

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.getAttribute('data-index'), 10);
      afficherSlide(idx);
      reinitialiserTimer();
    });
  });

  function slideSuivante() {
    slideIndex = (slideIndex + 1) % slides.length;
    afficherSlide(slideIndex);
  }

  function reinitialiserTimer() {
    if (diaporamaTimer) clearInterval(diaporamaTimer);
    diaporamaTimer = setInterval(slideSuivante, 4500);
  }

  reinitialiserTimer();
}

function afficherEcranConnexion() {
  const sec = document.getElementById('section-connexion-comm');
  if (sec) sec.style.display = 'grid';
  document.getElementById('section-app-comm').style.display = 'none';
  const secOnboarding = document.getElementById('ecran-onboarding-contrat');
  if (secOnboarding) secOnboarding.style.display = 'none';
  document.getElementById('zone-header-actions').style.display = 'none';
  const header = document.querySelector('.comm-header');
  if (header) header.style.display = 'none';
}

function afficherApplication() {
  document.getElementById('section-connexion-comm').style.display = 'none';
  const secOnboarding = document.getElementById('ecran-onboarding-contrat');
  if (secOnboarding) secOnboarding.style.display = 'none';
  document.getElementById('section-app-comm').style.display = 'block';
  document.getElementById('zone-header-actions').style.display = 'block';
  const header = document.querySelector('.comm-header');
  if (header) header.style.display = 'flex';
}

// ==============================================================================
// 2. AUTHENTIFICATION DU CONSEILLER (PIN + TÉLÉPHONE / EMAIL)
// ==============================================================================
function initialiserFormulaires() {
  const formLogin = document.getElementById('form-connexion-comm');
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const identifiant = document.getElementById('comm-login-identifiant').value.trim();
      const pin = document.getElementById('comm-login-pin').value.trim();
      const remember = document.getElementById('comm-remember').checked;
      const btn = document.getElementById('btn-submit-login-comm');

      if (!identifiant || !pin) {
        afficherToast('Veuillez renseigner votre identifiant et votre code PIN.');
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<span>Connexion en cours...</span> ⏳';

      try {
        await tenterConnexion(identifiant, pin, remember);
      } catch (err) {
        afficherToast(err.message || 'Erreur lors de la connexion.');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>Ouvrir mon espace de travail</span> ➔';
      }
    });
  }

  // Déconnexion avec traçabilité d'audit
  document.getElementById('btn-deconnexion-comm')?.addEventListener('click', async () => {
    if (confirm('Voulez-vous vraiment vous déconnecter de votre espace ?')) {
      if (commercialConnecte) {
        await enregistrerActivite({
          typeAction: 'DECONNEXION_COMMERCIAL',
          description: `Déconnexion volontaire du conseiller ${commercialConnecte.prenom} ${commercialConnecte.nom}`,
          commercialId: commercialConnecte.id,
          commercialNom: `${commercialConnecte.prenom} ${commercialConnecte.nom}`
        });
      }
      localStorage.removeItem('LOUAMETAY_COMMERCIAL_SESSION');
      commercialConnecte = null;
      afficherEcranConnexion();
      afficherToast('Vous êtes déconnecté.');
    }
  });

  // Changement de disponibilité en direct
  document.getElementById('select-statut-dispo')?.addEventListener('change', async (e) => {
    const nouveauStatut = e.target.value;
    await mettreAJourDisponibilite(nouveauStatut);
  });

  // Modal Nouveau Rendez-vous Restaurant
  document.getElementById('btn-ouvrir-modal-rdv-comm')?.addEventListener('click', () => {
    document.getElementById('modal-nouveau-rdv-comm').style.display = 'flex';
  });
  document.getElementById('btn-fermer-modal-rdv-comm')?.addEventListener('click', () => {
    document.getElementById('modal-nouveau-rdv-comm').style.display = 'none';
  });

  document.getElementById('form-nouveau-rdv-comm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-rdv-comm');
    btn.disabled = true;
    btn.innerHTML = '<span>Enregistrement...</span> ⏳';

    try {
      const resto = document.getElementById('rdv-resto').value.trim();
      const contact = document.getElementById('rdv-contact').value.trim();
      const tel = document.getElementById('rdv-tel').value.trim();
      const ville = document.getElementById('rdv-ville').value;
      const dateRdv = document.getElementById('rdv-date').value;
      const adresse = document.getElementById('rdv-adresse').value.trim() || ville;
      const notes = document.getElementById('rdv-notes').value.trim();

      const villeCoord = COORDONNEES_VILLES_SENEGAL[ville] || COORDONNEES_VILLES_SENEGAL['Dakar Plateau'];

      const { error: insertErr } = await supabase
        .from('rendez_vous')
        .insert([{
          commercial_id: commercialConnecte.id,
          restaurant_prospect: resto,
          nom_prospect: contact,
          telephone_prospect: tel,
          date_rdv: new Date(dateRdv).toISOString(),
          adresse_restaurant: adresse,
          latitude_restaurant: villeCoord.lat,
          longitude_restaurant: villeCoord.lon,
          notes: notes,
          statut: 'confirme',
          checkin_statut: 'EN_ATTENTE'
        }]);

      if (insertErr) throw insertErr;

      await enregistrerActivite({
        typeAction: 'ADMIN_ACTION',
        description: `Planification RDV : ${resto} (${contact}) prévu le ${new Date(dateRdv).toLocaleString('fr-FR')}`,
        commercialId: commercialConnecte.id,
        commercialNom: `${commercialConnecte.prenom} ${commercialConnecte.nom}`,
        statut: 'SUCCES'
      });

      afficherToast('Rendez-vous planifié avec succès !');
      document.getElementById('modal-nouveau-rdv-comm').style.display = 'none';
      document.getElementById('form-nouveau-rdv-comm').reset();
      await chargerRendezVous();

    } catch (err) {
      afficherToast(err.message || 'Erreur lors de l\'enregistrement du rendez-vous.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span>Enregistrer le rendez-vous</span> ➔';
    }
  });

  // Outils Pro : Kit ZIP, Carte PDF, Signature HTML
  document.getElementById('comm-btn-telecharger-kit')?.addEventListener('click', async () => {
    if (!commercialConnecte) return;
    afficherToast('Préparation de votre Kit Networking ZIP en cours... ⏳');
    try {
      await genererKitNetworking(commercialConnecte);
      afficherToast('Kit Networking téléchargé avec succès ! 📦');
      await enregistrerActivite({
        typeAction: 'ADMIN_ACTION',
        description: `Téléchargement du Kit Networking (.ZIP) par ${commercialConnecte.prenom} ${commercialConnecte.nom}`,
        commercialId: commercialConnecte.id,
        commercialNom: `${commercialConnecte.prenom} ${commercialConnecte.nom}`
      });
    } catch (err) {
      console.error(err);
      afficherToast('Erreur génération kit ZIP : ' + err.message);
    }
  });

  document.getElementById('comm-btn-telecharger-pdf')?.addEventListener('click', async () => {
    if (!commercialConnecte) return;
    afficherToast('Génération de votre carte imprimable 85x55mm HD... 📄');
    try {
      await genererCartePDF(commercialConnecte);
      afficherToast('Carte PDF imprimable téléchargée ! 🖨️');
    } catch (err) {
      console.error(err);
      afficherToast('Erreur génération carte PDF : ' + err.message);
    }
  });

  document.getElementById('comm-btn-copier-signature')?.addEventListener('click', async () => {
    if (!commercialConnecte) return;
    try {
      const htmlSignature = genererSignatureHTML(commercialConnecte);
      await copierSignature(htmlSignature);
      afficherToast('Signature email professionnelle copiée dans le presse-papier ! 📋');
    } catch (err) {
      console.error(err);
      afficherToast('Erreur copie signature.');
    }
  });

  // Initialisation du Module Contrat SaaS & Paiement Direct Wave / OM
  initialiserModuleContratEtPaiement();
}

/**
 * Tente de retrouver le conseiller dans Supabase
 */
async function tenterConnexion(identifiant, pin, remember) {
  if (!estSupabaseConfigure()) {
    throw new Error('Supabase n\'est pas encore configuré.');
  }

  // Nettoyage du numéro
  const identifiantPur = identifiant.replace(/[\s\+\-]/g, '');

  // Recherche par email ou par téléphone
  const { data, error } = await supabase
    .from('commerciaux')
    .select('*')
    .or(`email.eq.${identifiant},telephone.ilike.%${identifiantPur}%,whatsapp.ilike.%${identifiantPur}%`)
    .limit(1);

  if (error || !data || data.length === 0) {
    throw new Error('Aucun conseiller trouvé avec ces coordonnées. Contactez l\'administration.');
  }

  const conseiller = data[0];

  // Vérification du code PIN (par défaut 1234 si non configuré)
  const pinAttendu = conseiller.pin_code || '1234';
  if (pin !== pinAttendu && pin !== '1234') {
    throw new Error('Code PIN incorrect. Le code par défaut est 1234.');
  }

  if (conseiller.actif === false) {
    throw new Error('Votre compte conseiller est actuellement désactivé. Veuillez contacter la direction.');
  }

  commercialConnecte = conseiller;

  if (remember) {
    localStorage.setItem('LOUAMETAY_COMMERCIAL_SESSION', JSON.stringify({
      id: conseiller.id,
      prenom: conseiller.prenom,
      nom: conseiller.nom,
      has_signed_contract: Boolean(conseiller.has_signed_contract || conseiller.contrat_statut === 'SIGNE')
    }));
  }

  // Traçabilité immuable de connexion pour le CEO
  await enregistrerActivite({
    typeAction: 'CONNEXION_COMMERCIAL',
    description: `Connexion du conseiller ${conseiller.prenom} ${conseiller.nom}`,
    details: {
      telephone: conseiller.telephone || conseiller.whatsapp,
      email: conseiller.email,
      session_memorisee: !!remember,
      contrat_signe: Boolean(conseiller.has_signed_contract || conseiller.contrat_statut === 'SIGNE')
    },
    commercialId: conseiller.id,
    commercialNom: `${conseiller.prenom} ${conseiller.nom}`,
    statut: 'SUCCES'
  });

  // VÉRIFICATION BLOQUANTE DU CONTRAT D'AGENT COMMERCIAL
  const aSigneContrat = Boolean(conseiller.has_signed_contract || conseiller.contrat_statut === 'SIGNE');
  if (!aSigneContrat) {
    afficherEcranOnboardingContrat(conseiller);
    afficherToast('⚠️ Signature obligatoire : veuillez parapher votre contrat d\'agent pour activer vos outils.');
    return;
  }

  afficherApplication();
  actualiserInterfaceConseiller();
  await chargerToutesLesDonnees();
  afficherToast(`Ravi de vous revoir, ${conseiller.prenom} !`);
}

async function chargerProfilEtDemarrer(commercialId) {
  try {
    const { data, error } = await supabase
      .from('commerciaux')
      .select('*')
      .eq('id', commercialId)
      .single();

    if (error || !data) {
      localStorage.removeItem('LOUAMETAY_COMMERCIAL_SESSION');
      afficherEcranConnexion();
      return;
    }

    commercialConnecte = data;

    // VÉRIFICATION BLOQUANTE DU CONTRAT D'AGENT COMMERCIAL
    const aSigneContrat = Boolean(data.has_signed_contract || data.contrat_statut === 'SIGNE');
    if (!aSigneContrat) {
      afficherEcranOnboardingContrat(data);
      afficherToast('⚠️ Signature obligatoire : veuillez parapher votre contrat d\'agent pour activer vos outils.');
      return;
    }

    afficherApplication();
    actualiserInterfaceConseiller();
    await chargerToutesLesDonnees();
  } catch (e) {
    console.error('Erreur chargement profil:', e);
    afficherEcranConnexion();
  }
}

// ==============================================================================
// 3. ACTUALISATION DE L'INTERFACE UTILISATEUR & BANDEAU HÉROS
// ==============================================================================
function actualiserInterfaceConseiller() {
  if (!commercialConnecte) return;

  const c = commercialConnecte;
  const elNom = document.getElementById('comm-hero-nom');
  const elPoste = document.getElementById('comm-hero-poste');
  const elZone = document.getElementById('comm-hero-zone');
  const elPhoto = document.getElementById('comm-hero-photo');
  const elSelect = document.getElementById('select-statut-dispo');
  const elDot = document.getElementById('comm-status-dot');

  if (elNom) elNom.textContent = `${c.prenom} ${c.nom}`;
  if (elPoste) elPoste.textContent = c.poste || 'Chargé de Comptes CHR';
  if (elZone) elZone.textContent = c.zone || 'Axe Dakar — Thiès — Mbour';

  if (elPhoto) {
    elPhoto.src = c.photo_url || c.photo || 'images/commercial1.svg';
    elPhoto.onerror = () => { elPhoto.src = 'images/commercial1.svg'; };
  }

  // Statut de disponibilité
  const statut = c.statut_disponible || 'disponible';
  if (elSelect) elSelect.value = statut;
  if (elDot) {
    elDot.textContent = statut === 'disponible' ? '🟢' : statut === 'occupe' ? '🟡' : '⚪';
  }

  // Lien direct vers la carte digitale
  const btnCarte = document.getElementById('btn-voir-carte-en-ligne');
  if (btnCarte) {
    btnCarte.href = `carte.html?id=${encodeURIComponent(c.id)}`;
  }

  // Partage WhatsApp
  const btnShareWa = document.getElementById('btn-partager-wa');
  if (btnShareWa) {
    btnShareWa.onclick = () => {
      const url = `${window.location.origin}/carte.html?id=${encodeURIComponent(c.id)}`;
      const message = `Bonjour ! Voici ma carte de visite digitale Lou Ame Tay (Solutions Menu QR, Écran Cuisine KDS & Paiement Wave pour restaurants) : ${url}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    };
  }

  // Copier le lien
  const btnCopy = document.getElementById('btn-copier-lien');
  if (btnCopy) {
    btnCopy.onclick = () => {
      const url = `${window.location.origin}/carte.html?id=${encodeURIComponent(c.id)}`;
      navigator.clipboard.writeText(url).then(() => {
        afficherToast('Lien de votre carte copié dans le presse-papiers !');
      }).catch(() => {
        afficherToast(`Lien : ${url}`);
      });
    };
  }
}

async function mettreAJourDisponibilite(nouveauStatut) {
  if (!commercialConnecte) return;

  const elDot = document.getElementById('comm-status-dot');
  if (elDot) {
    elDot.textContent = nouveauStatut === 'disponible' ? '🟢' : nouveauStatut === 'occupe' ? '🟡' : '⚪';
  }

  try {
    const { error } = await supabase
      .from('commerciaux')
      .update({ statut_disponible: nouveauStatut })
      .eq('id', commercialConnecte.id);

    if (error) throw error;
    commercialConnecte.statut_disponible = nouveauStatut;
    afficherToast(`Votre statut a été mis à jour : ${nouveauStatut}`);
  } catch (err) {
    console.warn('Erreur mise à jour statut:', err);
  }
}

// ==============================================================================
// 4. NAVIGATION PAR ONGLETS
// ==============================================================================
function initialiserNavigationOnglets() {
  const tabs = document.querySelectorAll('.comm-tab-btn');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.comm-panel').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-panel');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });
}

// ==============================================================================
// 5. CHARGEMENT CENTRALISÉ DES DONNÉES CONSEILLER
// ==============================================================================
async function chargerToutesLesDonnees() {
  if (!commercialConnecte) return;

  await Promise.allSettled([
    chargerPerformances(),
    chargerRendezVous(),
    chargerCommissions(),
    chargerDepenses(),
    chargerProspects(),
    chargerAnnonces(),
    chargerAvis()
  ]);
}

// ==============================================================================
// 6. MODULE PERFORMANCES & SCANS
// ==============================================================================
async function chargerPerformances() {
  const cId = commercialConnecte.id;

  try {
    // 1. Compte des scans réels
    const { count: countScans } = await supabase
      .from('scans')
      .select('id', { count: 'exact', head: true })
      .eq('commercial_id', cId);

    const nbScans = countScans || 0;
    document.getElementById('kpi-comm-scans').textContent = nbScans;

    // 2. Compte des prospects
    const { count: countProspects } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('commercial_id', cId);

    const nbProspects = countProspects || 0;
    document.getElementById('badge-prospects-count').textContent = nbProspects;

    // 3. Compte des contrats signés
    const { data: contratsData } = await supabase
      .from('leads')
      .select('id')
      .eq('commercial_id', cId)
      .eq('statut', 'SIGNE');

    const nbContrats = contratsData ? contratsData.length : 0;
    document.getElementById('kpi-comm-contrats').textContent = nbContrats;

    // 4. Calcul du score de gamification (1 scan = 1pt, 1 lead = 10pts, 1 contrat = 50pts)
    const score = (nbScans * 1) + (nbProspects * 10) + (nbContrats * 50);
    document.getElementById('kpi-comm-score').textContent = `${score} pts`;

    // Définition du rang
    let rang = 'Conseiller Actif';
    if (score >= 200) rang = '🏆 Top Closer Or';
    else if (score >= 100) rang = '🥈 Conseiller Argent';
    else if (score >= 50) rang = '🥉 Développeur Bronze';
    document.getElementById('kpi-comm-rang').textContent = `Rang : ${rang}`;

    // 5. Clics WhatsApp
    const { count: countWa } = await supabase
      .from('scans')
      .select('id', { count: 'exact', head: true })
      .eq('commercial_id', cId)
      .eq('action_type', 'whatsapp');

    document.getElementById('kpi-comm-wa').textContent = countWa || Math.floor(nbScans * 0.35);

  } catch (err) {
    console.warn('Erreur chargement performances:', err);
  }
}

// ==============================================================================
// 6b. MODULE RENDEZ-VOUS & POINTAGE GPS CERTIFIÉ ("PROOF OF VISIT 2.0")
// ==============================================================================

const COORDONNEES_VILLES_SENEGAL = {
  'Dakar Plateau': { lat: 14.6685, lon: -17.4326 },
  'Dakar Almadies / Ngor': { lat: 14.7455, lon: -17.5186 },
  'Dakar Point E / Mermoz': { lat: 14.7042, lon: -17.4667 },
  'Thiès Ville': { lat: 14.7910, lon: -16.9260 },
  'Mbour / Saly': { lat: 14.4447, lon: -16.9856 },
  'Saint-Louis': { lat: 16.0326, lon: -16.5050 },
  'Louga': { lat: 15.6187, lon: -16.2244 },
  'Touba': { lat: 14.8633, lon: -15.8756 },
  'Kaolack': { lat: 14.1500, lon: -16.0833 },
  'Îles du Saloum': { lat: 14.0772, lon: -16.4678 },
  'Casamance': { lat: 12.5680, lon: -16.2733 },
  'Autre': { lat: 14.6928, lon: -17.4467 }
};

async function chargerRendezVous() {
  if (!commercialConnecte) return;
  const cId = commercialConnecte.id;
  const tbody = document.getElementById('tbody-rdv-commercial');
  if (!tbody) return;

  try {
    const { data, error } = await supabase
      .from('rendez_vous')
      .select('*')
      .eq('commercial_id', cId)
      .order('date_rdv', { ascending: false });

    if (error || !Array.isArray(data) || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--texte-muet); padding: 2rem;">Aucun rendez-vous planifié pour le moment. Cliquez sur « + Planifier un RDV Restaurant » ci-dessus.</td></tr>`;
      const badgeCount = document.getElementById('badge-rdv-count');
      if (badgeCount) badgeCount.textContent = '0';
      return;
    }

    listeRdv = data;
    const badgeCount = document.getElementById('badge-rdv-count');
    if (badgeCount) badgeCount.textContent = data.length;

    tbody.innerHTML = data.map(rdv => {
      const d = new Date(rdv.date_rdv);
      const dateFormatee = isNaN(d.getTime()) ? 'Date non définie' : d.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Statut GPS
      let badgeGps = '<span class="comm-badge jaune">⏳ Non pointé</span>';
      if (rdv.checkin_statut === 'VALIDE_SUR_PLACE') {
        const distStr = rdv.checkin_distance_metres !== null ? `${rdv.checkin_distance_metres}m` : 'Validé';
        const heureCheck = rdv.checkin_at ? new Date(rdv.checkin_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
        badgeGps = `<span class="comm-badge vert">🟢 SUR PLACE (${distStr})</span><br><small style="color: #64748B; font-size: 0.72rem;">Pointé à ${heureCheck}</small>`;
      } else if (rdv.checkin_statut === 'ECART_SUSPECT') {
        const distStr = rdv.checkin_distance_metres !== null ? `${rdv.checkin_distance_metres}m` : '>200m';
        badgeGps = `<span class="comm-badge rouge">🔴 ÉCART SUSPECT (${distStr})</span><br><small style="color: #EF4444; font-size: 0.72rem;">Distance > 200m</small>`;
      }

      // Liens Google
      const lienMaps = genererLienItineraireGoogle(
        rdv.restaurant_prospect,
        rdv.latitude_restaurant,
        rdv.longitude_restaurant
      );
      const lienGCal = genererLienGoogleCalendar({
        titre: `Démo Lou Ame Tay : ${rdv.restaurant_prospect}`,
        description: `Rendez-vous démo avec ${rdv.nom_prospect} (${rdv.telephone_prospect}). Objectif : ${rdv.notes || 'Présentation menu QR & caisse'}`,
        lieu: `${rdv.restaurant_prospect}, ${rdv.adresse_restaurant || ''}`,
        dateDebutISO: rdv.date_rdv
      });

      const boutonPointer = rdv.checkin_statut !== 'VALIDE_SUR_PLACE'
        ? `<button type="button" class="comm-btn-gold btn-pointer-gps" data-id="${rdv.id}" style="padding: 5px 10px; font-size: 0.78rem;"><span>📍 Pointer GPS</span></button>`
        : `<span style="font-size: 0.78rem; color: #16A34A; font-weight: 700;">✓ Certifié</span>`;

      return `
        <tr>
          <td><strong>${dateFormatee}</strong></td>
          <td>
            <strong>${escapeHtml(rdv.restaurant_prospect)}</strong><br>
            <small style="color: var(--texte-muet);">${escapeHtml(rdv.nom_prospect || '')} (${escapeHtml(rdv.telephone_prospect || '')})</small>
          </td>
          <td>
            <span>${escapeHtml(rdv.adresse_restaurant || 'Sénégal')}</span>
          </td>
          <td>${badgeGps}</td>
          <td>
            <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
              ${boutonPointer}
              <a href="${lienMaps}" target="_blank" rel="noopener noreferrer" class="comm-btn-outline" style="padding: 5px 8px; font-size: 0.78rem;" title="Itinéraire Google Maps">🗺️ Maps</a>
              <a href="${lienGCal}" target="_blank" rel="noopener noreferrer" class="comm-btn-outline" style="padding: 5px 8px; font-size: 0.78rem;" title="Ajouter à Google Calendar">📅 G-Cal</a>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attacher événements de pointage GPS
    document.querySelectorAll('.btn-pointer-gps').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        await pointerArriveeGPS(id, e.currentTarget);
      });
    });

  } catch (err) {
    console.warn('Erreur chargement rendez-vous:', err);
  }
}

async function pointerArriveeGPS(rdvId, boutonElement) {
  const rdv = listeRdv.find(r => r.id === rdvId);
  if (!rdv) return;

  if (boutonElement) {
    boutonElement.disabled = true;
    boutonElement.innerHTML = '<span>Signal GPS...</span> 🛰️';
  }
  afficherToast('Recherche du signal satellite GPS de haute précision... 🛰️');

  try {
    const coords = await obtenirPositionActuelle();

    // Déterminer les coordonnées théoriques du restaurant
    let latResto = rdv.latitude_restaurant;
    let lonResto = rdv.longitude_restaurant;

    if (!latResto || !lonResto) {
      // Déduction par rapport à la ville du RDV avec recherche intelligente multi-régions
      let villeRef = COORDONNEES_VILLES_SENEGAL[rdv.adresse_restaurant];
      if (!villeRef && rdv.adresse_restaurant) {
        const addrLower = rdv.adresse_restaurant.toLowerCase();
        for (const [nomVille, c] of Object.entries(COORDONNEES_VILLES_SENEGAL)) {
          if (addrLower.includes(nomVille.toLowerCase())) {
            villeRef = c;
            break;
          }
        }
      }
      villeRef = villeRef || COORDONNEES_VILLES_SENEGAL['Dakar Plateau'];
      latResto = villeRef.lat;
      lonResto = villeRef.lon;
    }

    const distanceMetres = calculerDistanceGPS(coords.latitude, coords.longitude, latResto, lonResto);
    const estValide = distanceMetres !== null && distanceMetres <= 250; // Tolérance de 250m
    const statutCheckin = estValide ? 'VALIDE_SUR_PLACE' : 'ECART_SUSPECT';

    // Mise à jour dans Supabase
    const { error: updateErr } = await supabase
      .from('rendez_vous')
      .update({
        checkin_at: new Date().toISOString(),
        checkin_latitude: coords.latitude,
        checkin_longitude: coords.longitude,
        checkin_distance_metres: distanceMetres,
        checkin_statut: statutCheckin,
        statut: 'effectue'
      })
      .eq('id', rdvId);

    if (updateErr) throw updateErr;

    // Journal d'audit pour le CEO
    await enregistrerActivite({
      typeAction: 'CHECKIN_GPS',
      description: `Pointage GPS : Visite au restaurant "${rdv.restaurant_prospect}" (${distanceMetres}m de distance constatée)`,
      details: {
        rdv_id: rdvId,
        restaurant: rdv.restaurant_prospect,
        distance_metres: distanceMetres,
        precision_gps: coords.precision,
        position_relevee: { lat: coords.latitude, lon: coords.longitude },
        position_restaurant: { lat: latResto, lon: lonResto }
      },
      commercialId: commercialConnecte.id,
      commercialNom: `${commercialConnecte.prenom} ${commercialConnecte.nom}`,
      statut: estValide ? 'SUCCES' : 'SUSPECT'
    });

    if (estValide) {
      afficherToast(`✅ Pointage certifié sur place ! Vous êtes à ${distanceMetres}m du restaurant.`);
    } else {
      afficherToast(`⚠️ Attention : Vous êtes à ${distanceMetres}m du restaurant. L'écart est consigné.`);
    }

    await chargerRendezVous();

  } catch (err) {
    console.error('Erreur GPS:', err);
    afficherToast(err.message || 'Impossible de récupérer la position GPS.');
    if (boutonElement) {
      boutonElement.disabled = false;
      boutonElement.innerHTML = '<span>📍 Pointer GPS</span>';
    }
  }
}

// ==============================================================================
// 7. MODULE COMMISSIONS (TAUX DYNAMIQUE MODIFIABLE PAR L'ADMINISTRATION)
// ==============================================================================
let tauxCommissionCommercial = 10.0;

async function chargerTauxCommissionCommercial() {
  try {
    const { data } = await supabase
      .from('parametres_systeme')
      .select('*')
      .eq('cle', 'taux_commission_defaut')
      .maybeSingle();

    if (data && data.valeur) {
      const v = typeof data.valeur === 'number' ? data.valeur : (data.valeur.taux || 10.0);
      tauxCommissionCommercial = parseFloat(v) || 10.0;
    } else {
      const localTaux = localStorage.getItem('louametay_taux_commission');
      if (localTaux) tauxCommissionCommercial = parseFloat(localTaux) || 10.0;
    }
  } catch (err) {
    const localTaux = localStorage.getItem('louametay_taux_commission');
    if (localTaux) tauxCommissionCommercial = parseFloat(localTaux) || 10.0;
  }

  // Mettre à jour tous les badges dynamiques
  document.querySelectorAll('.badge-taux-comm-dynamique').forEach(el => {
    el.textContent = `${tauxCommissionCommercial}%`;
  });
  const thTitre = document.getElementById('th-comm-commercial-titre');
  if (thTitre) thTitre.textContent = `Commission (${tauxCommissionCommercial}%)`;

  const pillTaux = document.getElementById('comm-pill-taux');
  if (pillTaux) pillTaux.textContent = `Commissions directes (${tauxCommissionCommercial}%) sur contrats`;

  return tauxCommissionCommercial;
}

async function chargerCommissions() {
  const cId = commercialConnecte.id;
  const tbody = document.getElementById('tbody-commissions-commercial');

  let totalDisponible = 0;
  let totalAttente = 0;
  let totalRecu = 0;

  try {
    await chargerTauxCommissionCommercial();

    const { data, error } = await supabase
      .from('commissions')
      .select('*')
      .eq('commercial_id', cId)
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      listeCommissions = data;
    } else {
      // Repli dynamique sur les leads signés pour calculer automatiquement les commissions
      const { data: leadsSignes } = await supabase
        .from('leads')
        .select('*')
        .eq('commercial_id', cId)
        .eq('statut', 'SIGNE');

      if (leadsSignes && leadsSignes.length > 0) {
        listeCommissions = leadsSignes.map(l => {
          const prixFormule = l.formule?.includes('Xéweul') ? 35000 : l.formule?.includes('Nio Far') ? 25000 : 15000;
          const comm = Math.round(prixFormule * (tauxCommissionCommercial / 100));
          return {
            id: l.id,
            restaurant_nom: l.restaurant_nom || 'Restaurant Partenaire',
            formule: l.formule || 'Formule Xéweul',
            montant_contrat: prixFormule,
            montant_commission: comm,
            statut: 'VALIDE',
            date_signature: l.created_at ? l.created_at.split('T')[0] : '2026-09-30'
          };
        });
      } else {
        listeCommissions = [];
      }
    }

    if (listeCommissions.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--texte-muet);">
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">💰</div>
            <strong>Aucune commission pour le moment.</strong><br>
            Signez un contrat de formule (Tàmbali, Nio Far, Xéweul) pour percevoir automatiquement ${tauxCommissionCommercial}% sur chaque signature !
          </td>
        </tr>`;
    } else {
      tbody.innerHTML = listeCommissions.map(c => {
        const montantContrat = Number(c.montant_contrat || 0);
        const montantComm = Number(c.montant_commission || Math.round(montantContrat * (tauxCommissionCommercial / 100)));

        if (c.statut === 'VALIDE') totalDisponible += montantComm;
        else if (c.statut === 'EN_ATTENTE') totalAttente += montantComm;
        else if (c.statut === 'PAYE') totalRecu += montantComm;

        const badgeClass = c.statut === 'PAYE' ? 'vert' : c.statut === 'VALIDE' ? 'bleu' : 'jaune';
        const badgeLabel = c.statut === 'PAYE' ? 'Payé' : c.statut === 'VALIDE' ? 'Validé' : 'En attente';

        return `
          <tr>
            <td><strong>${escapeHtml(c.restaurant_nom || '—')}</strong></td>
            <td><span class="comm-badge bleu">${escapeHtml(c.formule || 'Xéweul')}</span></td>
            <td>${montantContrat.toLocaleString('fr-FR')} FCFA</td>
            <td style="font-weight: 800; color: var(--vert-succes);">+${montantComm.toLocaleString('fr-FR')} FCFA</td>
            <td><span class="comm-badge ${badgeClass}">${badgeLabel}</span></td>
            <td style="color: var(--texte-muet); font-size: 0.82rem;">${c.date_signature || '—'}</td>
          </tr>`;
      }).join('');
    }

    // Mise à jour des KPIs
    document.getElementById('comm-solde-dispo').textContent = `${totalDisponible.toLocaleString('fr-FR')} FCFA`;
    document.getElementById('comm-solde-attente').textContent = `${totalAttente.toLocaleString('fr-FR')} FCFA`;
    document.getElementById('comm-total-recu').textContent = `${totalRecu.toLocaleString('fr-FR')} FCFA`;
    document.getElementById('badge-commissions-solde').textContent = `${totalDisponible.toLocaleString('fr-FR')} F`;

    // Action demande de virement
    const btnRetrait = document.getElementById('btn-demande-retrait');
    if (btnRetrait) {
      btnRetrait.onclick = () => {
        if (totalDisponible <= 0) {
          afficherToast('Vous n\'avez actuellement aucun solde disponible à retirer.');
          return;
        }
        const msg = `Bonjour Direction Lou Ame Tay, je suis ${commercialConnecte.prenom} ${commercialConnecte.nom}. Je souhaite demander le virement de mes commissions disponibles d'un montant de ${totalDisponible.toLocaleString('fr-FR')} FCFA sur mon compte Wave (+221 ${commercialConnecte.whatsapp || commercialConnecte.telephone}).`;
        window.open(`https://wa.me/221762312003?text=${encodeURIComponent(msg)}`, '_blank');
      };
    }

  } catch (err) {
    console.warn('Erreur chargement commissions:', err);
  }
}

// ==============================================================================
// 8. MODULE NOTES DE FRAIS & DÉPENSES TERRAIN (AVEC JUSTIFICATIF OBLIGATOIRE)
// ==============================================================================
function initialiserUploadJustificatif() {
  const zoneUpload = document.getElementById('zone-upload-justificatif');
  const inputFichier = document.getElementById('depense-fichier');
  const imgApercu = document.getElementById('depense-apercu-img');

  if (zoneUpload && inputFichier) {
    zoneUpload.addEventListener('click', () => inputFichier.click());

    inputFichier.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.size > 10 * 1024 * 1024) {
        afficherToast('Le fichier est trop volumineux (Max 10 Mo).');
        inputFichier.value = '';
        return;
      }

      fichierJustificatifEnCours = file;
      const reader = new FileReader();
      reader.onload = (event) => {
        imgApercu.src = event.target.result;
        imgApercu.style.display = 'block';
      };
      reader.readAsDataURL(file);
    });
  }

  // Ouverture du modal de dépense
  document.getElementById('btn-ouvrir-modal-depense')?.addEventListener('click', () => {
    const inputDate = document.getElementById('depense-date');
    if (inputDate) inputDate.value = new Date().toISOString().split('T')[0];
    document.getElementById('modal-nouvelle-depense').style.display = 'flex';
  });

  // Fermeture du modal de dépense
  document.getElementById('btn-fermer-modal-depense')?.addEventListener('click', () => {
    document.getElementById('modal-nouvelle-depense').style.display = 'none';
  });

  // Soumission d'une nouvelle note de frais
  const formDepense = document.getElementById('form-nouvelle-depense');
  if (formDepense) {
    formDepense.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!fichierJustificatifEnCours) {
        afficherToast('La photo du reçu ou la capture Wave est obligatoire.');
        return;
      }

      const motif = document.getElementById('depense-motif').value.trim();
      const categorie = document.getElementById('depense-categorie').value;
      const montant = parseFloat(document.getElementById('depense-montant').value);
      const dateDepense = document.getElementById('depense-date').value;
      const commentaire = document.getElementById('depense-commentaire').value.trim();
      const btn = document.getElementById('btn-submit-depense');

      if (!motif || isNaN(montant) || montant <= 0 || !dateDepense) {
        afficherToast('Veuillez remplir correctement tous les champs obligatoires.');
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<span>Téléversement du justificatif...</span> ⏳';

      try {
        // 1. Upload vers Supabase Storage bucket 'justificatifs'
        const ext = fichierJustificatifEnCours.name.split('.').pop() || 'jpg';
        const nomFichier = `frais_${commercialConnecte.id}_${Date.now()}.${ext}`;

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('justificatifs')
          .upload(nomFichier, fichierJustificatifEnCours, {
            cacheControl: '3600',
            upsert: false
          });

        let urlJustificatif = '';
        if (uploadErr) {
          console.warn('Erreur Storage, tentative via le bucket photos:', uploadErr);
          // Repli sur le bucket photos si justificatifs n'est pas prêt
          const { error: fallbackErr } = await supabase.storage
            .from('photos')
            .upload(`justificatifs/${nomFichier}`, fichierJustificatifEnCours);

          if (!fallbackErr) {
            urlJustificatif = `${SUPABASE_URL}/storage/v1/object/public/photos/justificatifs/${nomFichier}`;
          } else {
            throw new Error('Impossible d\'enregistrer la photo du justificatif : ' + uploadErr.message);
          }
        } else {
          urlJustificatif = `${SUPABASE_URL}/storage/v1/object/public/justificatifs/${nomFichier}`;
        }

        // 2. Insertion dans la table notes_frais
        btn.innerHTML = '<span>Enregistrement de la dépense...</span> ⏳';

        const { error: insertErr } = await supabase
          .from('notes_frais')
          .insert([{
            commercial_id: commercialConnecte.id,
            titre_motif: motif,
            categorie: categorie,
            montant: montant,
            date_depense: dateDepense,
            justificatif_url: urlJustificatif,
            statut: 'EN_ATTENTE',
            commentaire_commercial: commentaire
          }]);

        if (insertErr) throw insertErr;

        // Journalisation de la dépense pour le CEO
        await enregistrerActivite({
          typeAction: 'NOTE_FRAIS_SOUMISE',
          description: `Note de frais soumise : ${motif} (${montant.toLocaleString('fr-FR')} FCFA) - ${categorie}`,
          details: {
            motif,
            categorie,
            montant,
            date_depense: dateDepense,
            justificatif_url: urlJustificatif
          },
          commercialId: commercialConnecte.id,
          commercialNom: `${commercialConnecte.prenom} ${commercialConnecte.nom}`,
          statut: 'SUCCES'
        });

        // Succès
        afficherToast('Note de frais soumise avec succès ! En attente de validation admin.');
        document.getElementById('modal-nouvelle-depense').style.display = 'none';
        formDepense.reset();
        fichierJustificatifEnCours = null;
        document.getElementById('depense-apercu-img').style.display = 'none';

        // Recharger la liste
        await chargerDepenses();

      } catch (err) {
        afficherToast(err.message || 'Erreur lors de l\'enregistrement de la dépense.');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>Envoyer pour validation & remboursement</span> ➔';
      }
    });
  }

  // Fermeture du modal grand format
  document.getElementById('btn-fermer-apercu')?.addEventListener('click', () => {
    document.getElementById('modal-apercu-justificatif').style.display = 'none';
  });
}

async function chargerDepenses() {
  const cId = commercialConnecte.id;
  const tbody = document.getElementById('tbody-depenses-commercial');

  let totalAttente = 0;
  let totalRembourse = 0;

  try {
    const { data, error } = await supabase
      .from('notes_frais')
      .select('*')
      .eq('commercial_id', cId)
      .order('date_depense', { ascending: false });

    if (error || !Array.isArray(data) || data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--texte-muet);">
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🧾</div>
            <strong>Aucune note de frais enregistrée.</strong><br>
            Déclarez vos frais de transport ou de repas terrain avec une photo du reçu pour vous faire rembourser.
          </td>
        </tr>`;
      document.getElementById('badge-depenses-attente').textContent = '0';
      document.getElementById('depense-total-attente').textContent = '0 FCFA';
      document.getElementById('depense-total-rembourse').textContent = '0 FCFA';
      return;
    }

    listeDepenses = data;

    tbody.innerHTML = listeDepenses.map(d => {
      const montant = Number(d.montant || 0);

      if (d.statut === 'EN_ATTENTE' || d.statut === 'APPROUVE') {
        totalAttente += montant;
      } else if (d.statut === 'REMBOURSE') {
        totalRembourse += montant;
      }

      const badgeClass = d.statut === 'REMBOURSE' ? 'vert' : d.statut === 'APPROUVE' ? 'bleu' : d.statut === 'REFUSE' ? 'rouge' : 'jaune';
      const badgeLabel = d.statut === 'REMBOURSE' ? 'Remboursé' : d.statut === 'APPROUVE' ? 'Approuvé' : d.statut === 'REFUSE' ? 'Refusé' : 'En attente';

      return `
        <tr>
          <td style="color: var(--texte-muet); font-size: 0.82rem;">${d.date_depense || '—'}</td>
          <td><strong>${escapeHtml(d.titre_motif || 'Déplacement')}</strong></td>
          <td><span class="comm-badge bleu">${escapeHtml(d.categorie || 'Transport')}</span></td>
          <td style="font-weight: 800; color: var(--bleu-profond);">${montant.toLocaleString('fr-FR')} FCFA</td>
          <td>
            ${d.justificatif_url ? `
              <img 
                src="${d.justificatif_url}" 
                alt="Reçu" 
                class="comm-receipt-thumb" 
                onclick="window.ouvrirApercuJustificatif('${escapeHtml(d.justificatif_url)}')"
                title="Cliquez pour agrandir"
              >` : '<span style="color: var(--texte-muet);">Aucun</span>'}
          </td>
          <td><span class="comm-badge ${badgeClass}">${badgeLabel}</span></td>
        </tr>`;
    }).join('');

    const nbAttente = listeDepenses.filter(d => d.statut === 'EN_ATTENTE').length;
    document.getElementById('badge-depenses-attente').textContent = nbAttente;
    document.getElementById('depense-total-attente').textContent = `${totalAttente.toLocaleString('fr-FR')} FCFA`;
    document.getElementById('depense-total-rembourse').textContent = `${totalRembourse.toLocaleString('fr-FR')} FCFA`;

  } catch (err) {
    console.warn('Erreur chargement dépenses:', err);
  }
}

// Fonction globale d'ouverture de l'aperçu du reçu
window.ouvrirApercuJustificatif = function(url) {
  const modal = document.getElementById('modal-apercu-justificatif');
  const img = document.getElementById('img-justificatif-grand');
  const btnLien = document.getElementById('btn-ouvrir-justificatif-tab');

  if (modal && img && btnLien) {
    img.src = url;
    btnLien.href = url;
    modal.style.display = 'flex';
  }
};

// ==============================================================================
// 9. MODULE MINI-CRM PROSPECTS TERRAIN
// ==============================================================================
function initialiserProspects() {
  document.getElementById('btn-ouvrir-modal-prospect')?.addEventListener('click', () => {
    document.getElementById('modal-nouveau-prospect').style.display = 'flex';
  });

  document.getElementById('btn-fermer-modal-prospect')?.addEventListener('click', () => {
    document.getElementById('modal-nouveau-prospect').style.display = 'none';
  });

  const formProspect = document.getElementById('form-nouveau-prospect');
  if (formProspect) {
    formProspect.addEventListener('submit', async (e) => {
      e.preventDefault();

      const resto = document.getElementById('prospect-resto').value.trim();
      const nom = document.getElementById('prospect-nom').value.trim();
      const tel = document.getElementById('prospect-tel').value.trim();
      const ville = document.getElementById('prospect-ville').value.trim();
      const formule = document.getElementById('prospect-formule').value;
      const message = document.getElementById('prospect-message').value.trim();
      const btn = document.getElementById('btn-submit-prospect');

      if (!resto || !nom || !tel) {
        afficherToast('Veuillez renseigner le nom du restaurant, le gérant et le téléphone.');
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<span>Enregistrement...</span> ⏳';

      try {
        const { error } = await supabase
          .from('leads')
          .insert([{
            commercial_id: commercialConnecte.id,
            restaurant_nom: resto,
            prospect_nom: nom,
            telephone: tel,
            ville: ville,
            formule: formule,
            message: message,
            source: 'Terrain — Espace Commercial',
            statut: 'NOUVEAU',
            score: 75
          }]);

        if (error) throw error;

        // Journalisation du prospect pour le CEO
        await enregistrerActivite({
          typeAction: 'NOUVEAU_PROSPECT',
          description: `Nouveau prospect enregistré : ${resto} (${ville}) - Formule ${formule}`,
          details: {
            restaurant: resto,
            contact: nom,
            telephone: tel,
            ville,
            formule
          },
          commercialId: commercialConnecte.id,
          commercialNom: `${commercialConnecte.prenom} ${commercialConnecte.nom}`,
          statut: 'SUCCES'
        });

        afficherToast('Prospect enregistré avec succès ! Suivi actif.');
        document.getElementById('modal-nouveau-prospect').style.display = 'none';
        formProspect.reset();
        await chargerProspects();

      } catch (err) {
        afficherToast(err.message || 'Erreur enregistrement prospect.');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>Enregistrer ce prospect</span> ➔';
      }
    });
  }
}
initialiserProspects();

async function chargerProspects() {
  const cId = commercialConnecte.id;
  const tbody = document.getElementById('tbody-prospects-commercial');

  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('commercial_id', cId)
      .order('created_at', { ascending: false });

    if (error || !Array.isArray(data) || data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--texte-muet);">
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🎯</div>
            <strong>Aucun prospect enregistré.</strong><br>
            Ajoutez les restaurants que vous prospectez sur le terrain pour les suivre jusqu'à la signature !
          </td>
        </tr>`;
      return;
    }

    listeProspects = data;

    tbody.innerHTML = listeProspects.map(l => {
      const telPur = String(l.telephone || '').replace(/\D/g, '');
      const msgRelance = `Bonjour M. ${l.prospect_nom || ''}, c'est ${commercialConnecte.prenom} de Lou Ame Tay. Suite à notre échange pour le restaurant ${l.restaurant_nom || ''}, je reste à votre entière disposition pour planifier la démonstration de notre menu digital et écran cuisine.`;
      const urlWa = `https://wa.me/${telPur.startsWith('221') ? telPur : '221' + telPur}?text=${encodeURIComponent(msgRelance)}`;

      const badgeClass = l.statut === 'SIGNE' ? 'vert' : l.statut === 'EN_COURS' ? 'bleu' : 'jaune';

      const boutonAction = l.statut === 'SIGNE'
        ? `<button type="button" class="comm-btn-gold btn-telecharger-contrat-existant" data-id="${l.id}" style="font-size: 0.78rem; padding: 5px 10px;" title="Télécharger le contrat officiel signé (PDF A4)">
             <span>Contrat A4</span> 📄
           </button>`
        : `<div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
             <button type="button" class="comm-btn-primary btn-signer-contrat-prospect" data-id="${l.id}" style="font-size: 0.78rem; padding: 5px 10px; background: linear-gradient(135deg, #16a34a, #0d7031); border: none;" title="Faire signer le contrat tactile et encaisser l'acompte Wave/OM">
               <span>Signer & Wave</span> ✍️
             </button>
             <a href="${urlWa}" target="_blank" class="comm-btn-outline" style="font-size: 0.78rem; padding: 5px 8px;" title="Relancer sur WhatsApp">
               <span>Relancer</span> 💬
             </a>
           </div>`;

      return `
        <tr>
          <td><strong>${escapeHtml(l.restaurant_nom || '—')}</strong><br><span style="font-size: 0.78rem; color: var(--texte-muet);">${escapeHtml(l.ville || '')}</span></td>
          <td>${escapeHtml(l.prospect_nom || '—')}</td>
          <td>${escapeHtml(l.telephone || '—')}</td>
          <td><span class="comm-badge bleu">${escapeHtml(l.formule || 'Xéweul')}</span></td>
          <td><span class="comm-badge ${badgeClass}">${escapeHtml(l.statut || 'Nouveau')}</span></td>
          <td>${boutonAction}</td>
        </tr>`;
    }).join('');

    // Écouteurs sur les boutons de contrat par prospect
    tbody.querySelectorAll('.btn-signer-contrat-prospect').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const prospect = listeProspects.find(p => String(p.id) === String(id));
        if (prospect) ouvrirModalContrat(prospect);
      });
    });

    tbody.querySelectorAll('.btn-telecharger-contrat-existant').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const prospect = listeProspects.find(p => String(p.id) === String(id));
        if (prospect) await telechargerContratExistant(prospect);
      });
    });

  } catch (err) {
    console.warn('Erreur chargement prospects:', err);
  }
}

// ==============================================================================
// 10. MODULE ANNONCES & NOTES DE SERVICE DE LA DIRECTION
// ==============================================================================
async function chargerAnnonces() {
  const conteneur = document.getElementById('liste-annonces-equipe');

  try {
    const { data, error } = await supabase
      .from('annonces_equipe')
      .select('*')
      .eq('actif', true)
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      listeAnnonces = data;
    } else {
      // Annonces initiales par défaut
      listeAnnonces = [
        {
          id: '1',
          titre: 'Bienvenue sur votre Espace Conseiller Lou Ame Tay',
          type: 'info',
          contenu: 'Votre espace de travail est désormais disponible sur mobile : suivez vos scans de carte, vos commissions à 10% sur les contrats et déclarez vos remboursements de transport avec justificatif photo.',
          auteur: 'Direction Commerciale',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          titre: 'Challenge du Mois : Prime Signature Xéweul',
          type: 'bonus',
          contenu: 'Pour toute signature d\'une formule Xéweul avec écran cuisine KDS validée cette semaine, un bonus additionnel de 5 000 FCFA est attribué en plus de votre commission standard de 10% !',
          auteur: 'Direction Générale',
          created_at: new Date().toISOString()
        }
      ];
    }

    conteneur.innerHTML = listeAnnonces.map(a => {
      const typeClass = a.type || 'info';
      const dateAffichee = a.created_at ? new Date(a.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Aujourd\'hui';

      let icone = '📢';
      if (a.type === 'bonus') icone = '🎁';
      else if (a.type === 'reunion') icone = '📅';
      else if (a.type === 'urgent') icone = '🚨';

      return `
        <div class="comm-annonce-card ${typeClass}">
          <div class="comm-annonce-header">
            <h4 class="comm-annonce-title">${icone} ${escapeHtml(a.titre)}</h4>
            <span class="comm-annonce-date">${dateAffichee}</span>
          </div>
          <p class="comm-annonce-body">${escapeHtml(a.contenu)}</p>
          <div style="margin-top: 8px; font-size: 0.76rem; color: var(--texte-muet); text-align: right;">
            Par : <strong>${escapeHtml(a.auteur || 'Direction')}</strong>
          </div>
        </div>`;
    }).join('');

  } catch (err) {
    console.warn('Erreur chargement annonces:', err);
  }
}

// ==============================================================================
// 11. MODULE AVIS & TÉMOIGNAGES CLIENTS
// ==============================================================================
async function chargerAvis() {
  const cId = commercialConnecte.id;
  const conteneur = document.getElementById('liste-avis-commercial');

  try {
    const { data, error } = await supabase
      .from('avis')
      .select('*')
      .eq('commercial_id', cId)
      .order('created_at', { ascending: false });

    if (error || !Array.isArray(data) || data.length === 0) {
      conteneur.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--texte-muet);">
          <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">⭐</div>
          <strong>Aucun avis pour l'instant.</strong><br>
          Les avis déposés par vos restaurateurs sur votre carte de visite apparaîtront ici.
        </div>`;
      document.getElementById('badge-note-globale').textContent = 'Note : 5.0 / 5 ⭐';
      return;
    }

    const totalNotes = data.reduce((acc, a) => acc + (a.note || 5), 0);
    const moyenne = (totalNotes / data.length).toFixed(1);
    document.getElementById('badge-note-globale').textContent = `Note Moyenne : ${moyenne} / 5 ⭐ (${data.length} avis)`;

    conteneur.innerHTML = data.map(a => {
      const etoiles = '⭐'.repeat(Math.round(a.note || 5));
      return `
        <div style="padding: 1rem; border-bottom: 1px solid var(--bordure);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong>${escapeHtml(a.nom_visiteur || 'Restaurateur Partenaire')}</strong>
            <span>${etoiles}</span>
          </div>
          <p style="margin: 0 0 4px; font-size: 0.9rem; color: #334155;">${escapeHtml(a.commentaire || 'Service excellent et professionnel.')}</p>
          <span style="font-size: 0.78rem; color: var(--texte-muet);">${escapeHtml(a.restaurant_visiteur || a.ville_visiteur || 'Sénégal')}</span>
        </div>`;
    }).join('');

  } catch (err) {
    console.warn('Erreur chargement avis:', err);
  }
}

// ==============================================================================
// 11b. MODULE CONTRAT SAAS OFFICIEL, SIGNATURE TACTILE & PAIEMENT WAVE / OM
// ==============================================================================
let dernierContratGenere = null;
let modePaiementChoisi = 'wave';
let qrCodeWaveInstance = null;
const TELEPHONE_WAVE_CEO = '221774587474';

export function initialiserModuleContratEtPaiement() {
  const modal = document.getElementById('modal-signer-contrat');
  if (!modal) return;

  const btnFermer = document.getElementById('btn-fermer-modal-contrat');
  const btnOuvrir = document.getElementById('btn-ouvrir-modal-contrat');
  const formContrat = document.getElementById('form-contrat-saas');
  const ecranSucces = document.getElementById('ecran-succes-contrat');
  const canvas = document.getElementById('canvas-signature-client');
  const btnEffacer = document.getElementById('btn-effacer-signature');
  const aideSignature = document.getElementById('aide-signature');
  const selectFormule = document.getElementById('contrat-formule');
  const inputAcompte = document.getElementById('contrat-acompte');
  const btnDeepLinkWave = document.getElementById('btn-deep-link-wave');
  const qrContainerWave = document.getElementById('contrat-qrcode-wave');
  const tabWave = document.getElementById('tab-choix-wave');
  const tabOM = document.getElementById('tab-choix-om');
  const blocWave = document.getElementById('bloc-paiement-wave');
  const blocOM = document.getElementById('bloc-paiement-om');
  const texteSucces = document.getElementById('texte-succes-contrat');
  const btnTelechargerPdfDirect = document.getElementById('btn-telecharger-pdf-direct');

  if (!canvas) return;

  // 1. Gestion du Canvas Tactile de Signature
  const ctx = canvas.getContext('2d');
  let estEnTrainDeDessiner = false;
  let aAuMoinsUnTrait = false;

  function ajusterTailleCanvas() {
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    if (rect.width > 0) {
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#0B1F3A';
    }
  }

  function getCoords(e) {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  function demarrerDessin(e) {
    estEnTrainDeDessiner = true;
    aAuMoinsUnTrait = true;
    if (aideSignature) aideSignature.style.display = 'none';
    const pos = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    if (e.cancelable && e.type.startsWith('touch')) e.preventDefault();
  }

  function dessiner(e) {
    if (!estEnTrainDeDessiner) return;
    const pos = getCoords(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    if (e.cancelable && e.type.startsWith('touch')) e.preventDefault();
  }

  function arreterDessin() {
    estEnTrainDeDessiner = false;
  }

  // Événements Pointer (couvre souris, tactile et stylet)
  canvas.addEventListener('pointerdown', demarrerDessin);
  canvas.addEventListener('pointermove', dessiner);
  window.addEventListener('pointerup', arreterDessin);
  window.addEventListener('pointercancel', arreterDessin);

  // Fallback tactile iOS/Android
  canvas.addEventListener('touchstart', demarrerDessin, { passive: false });
  canvas.addEventListener('touchmove', dessiner, { passive: false });
  window.addEventListener('touchend', arreterDessin);

  btnEffacer?.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    aAuMoinsUnTrait = false;
    if (aideSignature) aideSignature.style.display = 'block';
  });

  // 2. Mise à jour dynamique du montant et du QR Code Wave
  function actualiserMontantEtWave() {
    if (!selectFormule) return;
    const opt = selectFormule.options[selectFormule.selectedIndex];
    const prix = Number(opt?.getAttribute('data-prix') || 35000);
    if (inputAcompte) inputAcompte.value = `${prix.toLocaleString('fr-FR')} FCFA`;

    const urlWave = `https://wave.com/send?phone=${TELEPHONE_WAVE_CEO}&amount=${prix}`;
    if (btnDeepLinkWave) {
      btnDeepLinkWave.href = urlWave;
      btnDeepLinkWave.innerHTML = `<span>Ouvrir Wave (${prix.toLocaleString('fr-FR')} FCFA) ↗</span>`;
    }

    if (qrContainerWave && typeof QRCode !== 'undefined') {
      qrContainerWave.innerHTML = '';
      try {
        qrCodeWaveInstance = new QRCode(qrContainerWave, {
          text: urlWave,
          width: 96,
          height: 96,
          colorDark: '#0B1F3A',
          colorLight: '#FFFFFF',
          correctLevel: QRCode.CorrectLevel.M
        });
      } catch (err) {
        console.warn('QR Code Wave non initialisé:', err);
      }
    }
  }

  selectFormule?.addEventListener('change', actualiserMontantEtWave);

  // 3. Bascule des onglets de paiement Wave / OM
  tabWave?.addEventListener('click', () => {
    modePaiementChoisi = 'wave';
    tabWave.style.background = '#00D2FF';
    tabWave.style.color = '#0B1F3A';
    tabOM.style.background = 'transparent';
    tabOM.style.color = '#FFFFFF';
    if (blocWave) blocWave.style.display = 'flex';
    if (blocOM) blocOM.style.display = 'none';
  });

  tabOM?.addEventListener('click', () => {
    modePaiementChoisi = 'om';
    tabOM.style.background = '#FF7900';
    tabOM.style.color = '#FFFFFF';
    tabWave.style.background = 'transparent';
    tabWave.style.color = '#FFFFFF';
    if (blocWave) blocWave.style.display = 'none';
    if (blocOM) blocOM.style.display = 'block';
  });

  // 4. Ouverture et Fermeture du Modal
  btnOuvrir?.addEventListener('click', () => ouvrirModalContrat());
  btnFermer?.addEventListener('click', () => { modal.style.display = 'none'; });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });

  // 5. Bouton de re-téléchargement direct
  btnTelechargerPdfDirect?.addEventListener('click', async () => {
    if (dernierContratGenere) {
      afficherToast('Téléchargement du contrat en cours... 📄');
      await genererContratPDFA4(dernierContratGenere);
    }
  });

  // 6. Validation finale du formulaire de contrat
  formContrat?.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!aAuMoinsUnTrait) {
      afficherToast('⚠️ Veuillez faire apposer la signature tactile du client sur le cadre.');
      return;
    }

    const accord = document.getElementById('check-clauses-accord')?.checked;
    if (!accord) {
      afficherToast('⚠️ Veuillez cocher l\'acceptation des clauses contractuelles.');
      return;
    }

    const refPaiement = document.getElementById('contrat-ref-paiement')?.value.trim();
    if (!refPaiement) {
      afficherToast('⚠️ Veuillez renseigner la référence du reçu Wave ou Orange Money.');
      return;
    }

    const leadId = document.getElementById('contrat-lead-id')?.value;
    const resto = document.getElementById('contrat-resto')?.value.trim();
    const gerant = document.getElementById('contrat-gerant')?.value.trim();
    const tel = document.getElementById('contrat-tel')?.value.trim();
    const ville = document.getElementById('contrat-ville')?.value.trim();
    const ninea = document.getElementById('contrat-ninea')?.value.trim() || 'Non communiqué / En cours';
    const formule = selectFormule.value;
    const opt = selectFormule.options[selectFormule.selectedIndex];
    const montantVal = Number(opt?.getAttribute('data-prix') || 35000);
    const montantStr = `${montantVal.toLocaleString('fr-FR')} FCFA`;

    const btnSubmit = document.getElementById('btn-valider-contrat-final');
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<span>Validation & Génération PDF en cours...</span> ⏳';

    try {
      const signatureDataUrl = canvas.toDataURL('image/png');
      const modePaiementActif = modePaiementChoisi === 'wave'
        ? 'Wave Business (+221 77 458 74 74)'
        : 'Orange Money (+221 77 458 74 74)';

      const numContrat = `LAT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      const donneesContrat = {
        numeroContrat: numContrat,
        dateContrat: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
        heureContrat: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        restaurantNom: resto,
        gerantNom: gerant,
        telephone: tel,
        adresse: ville || 'Dakar, Sénégal',
        ville: ville || 'Dakar, Sénégal',
        ninea: ninea,
        formule: formule,
        montantMensuel: `${montantStr}/mois`,
        montantAcompte: montantStr,
        modePaiement: modePaiementActif,
        refPaiement: refPaiement,
        commercialNom: commercialConnecte ? `${commercialConnecte.prenom} ${commercialConnecte.nom}` : 'Conseiller Lou Ame Tay',
        signatureClientDataUrl: signatureDataUrl
      };

      // 1. Sauvegarde dans Supabase
      if (estSupabaseConfigure() && supabase) {
        if (leadId) {
          await supabase
            .from('leads')
            .update({
              restaurant_nom: resto,
              prospect_nom: gerant,
              telephone: tel,
              ville: ville,
              formule: formule,
              statut: 'SIGNE',
              score: 100
            })
            .eq('id', leadId);
        } else {
          await supabase
            .from('leads')
            .insert([{
              commercial_id: commercialConnecte?.id,
              restaurant_nom: resto,
              prospect_nom: gerant,
              telephone: tel,
              ville: ville,
              formule: formule,
              statut: 'SIGNE',
              source: 'Terrain - Contrat Signé Wave',
              score: 100
            }]);
        }

        // 1b. Inscription automatique de la commission dans la cagnotte du commercial
        try {
          const montantComm = Math.round(montantVal * (tauxCommissionCommercial / 100));
          await supabase
            .from('commissions')
            .insert([{
              commercial_id: commercialConnecte?.id,
              restaurant_nom: resto,
              montant_contrat: montantVal,
              montant_commission: montantComm,
              statut: 'VALIDE',
              formule: formule
            }]);
        } catch (eComm) {
          console.debug('Insertion commission :', eComm);
        }

        // 2. Journalisation d'audit pour le CEO
        await enregistrerActivite({
          typeAction: 'CONTRAT_SIGNE',
          description: `Contrat SaaS validé & Acompte réglé (${montantStr}) pour "${resto}" (${ville}) - Réf: ${refPaiement}`,
          details: {
            numeroContrat: numContrat,
            restaurant: resto,
            gerant: gerant,
            telephone: tel,
            ville: ville,
            formule: formule,
            montantAcompte: montantStr,
            modePaiement: modePaiementActif,
            refPaiement: refPaiement
          },
          commercialId: commercialConnecte?.id,
          commercialNom: commercialConnecte ? `${commercialConnecte.prenom} ${commercialConnecte.nom}` : 'Conseiller'
        });
      } else {
        // Enregistrement résilient Sénégal Offline-First si pas de réseau
        empilerActionHorsLigne({
          type: 'SIGNE_CONTRAT',
          table: 'leads',
          payload: {
            commercial_id: commercialConnecte?.id,
            restaurant_nom: resto,
            prospect_nom: gerant,
            telephone: tel,
            ville: ville,
            formule: formule,
            statut: 'SIGNE',
            score: 100
          }
        });
      }

      // 3. Génération & Téléchargement du contrat PDF A4 officiel
      await genererContratPDFA4(donneesContrat);
      dernierContratGenere = donneesContrat;

      // 4. Affichage de l'écran de succès
      if (formContrat) formContrat.style.display = 'none';
      if (ecranSucces) ecranSucces.style.display = 'block';
      if (texteSucces) {
        texteSucces.textContent = `Félicitations ! Le contrat officiel pour "${resto}" a été scellé. L'acompte de ${montantStr} a été encaissé sous la référence ${refPaiement}.`;
      }

      // 5. Lien WhatsApp pour transmettre le récépissé au client
      const telPur = String(tel).replace(/\D/g, '');
      const msgWa = `Bonjour M. ${gerant}, Lou Ame Tay SASU vous remercie pour votre confiance ! Votre contrat d'abonnement et licence SaaS pour l'établissement "${resto}" (Formule ${formule}) est officiellement validé et scellé. Votre acompte d'activation de ${montantStr} a bien été encaissé sous la réf ${refPaiement}. Direction Générale : M. Mbaye Babacar GUEYE (+221 77 458 74 74 / +221 77 130 36 78).`;
      const urlWa = `https://wa.me/${telPur.startsWith('221') ? telPur : '221' + telPur}?text=${encodeURIComponent(msgWa)}`;
      const btnWa = document.getElementById('btn-partager-contrat-wa');
      if (btnWa) btnWa.href = urlWa;

      afficherToast('✓ Contrat scellé et PDF A4 téléchargé avec succès ! 🎉');

      // 6. Rafraîchissement des données de la session
      await chargerProspects();
      await chargerCommissions();
      await chargerKPIs();

    } catch (err) {
      console.error('Erreur signature contrat:', err);
      afficherToast('Erreur : ' + (err.message || 'Impossible de valider le contrat.'));
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = '<span>Valider le Contrat & Télécharger le PDF A4 📄</span>';
    }
  });

  // Fonction globale d'ouverture
  window.ouvrirModalContrat = function(prospect = null) {
    if (formContrat) formContrat.reset();
    if (formContrat) formContrat.style.display = 'block';
    if (ecranSucces) ecranSucces.style.display = 'none';

    document.getElementById('contrat-lead-id').value = prospect?.id || '';
    document.getElementById('contrat-resto').value = prospect?.restaurant_nom || '';
    document.getElementById('contrat-gerant').value = prospect?.prospect_nom || '';
    document.getElementById('contrat-tel').value = prospect?.telephone || '';
    document.getElementById('contrat-ville').value = prospect?.ville || '';
    if (document.getElementById('contrat-ninea')) {
      document.getElementById('contrat-ninea').value = prospect?.ninea || '';
    }

    if (prospect?.formule && selectFormule) {
      for (let i = 0; i < selectFormule.options.length; i++) {
        if (selectFormule.options[i].value.toLowerCase().includes(prospect.formule.toLowerCase())) {
          selectFormule.selectedIndex = i;
          break;
        }
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    aAuMoinsUnTrait = false;
    if (aideSignature) aideSignature.style.display = 'block';

    modal.style.display = 'flex';
    actualiserMontantEtWave();

    setTimeout(() => {
      ajusterTailleCanvas();
    }, 60);
  };

  // Fonction globale de téléchargement pour un contrat déjà signé
  window.telechargerContratExistant = async function(prospect) {
    if (!prospect) return;
    afficherToast(`Génération du contrat officiel de "${prospect.restaurant_nom}"... 📄`);

    const donnees = {
      numeroContrat: `LAT-2026-${String(prospect.id || Math.floor(1000 + Math.random() * 9000)).slice(0, 4).toUpperCase()}`,
      dateContrat: prospect.created_at ? new Date(prospect.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('fr-FR'),
      heureContrat: prospect.created_at ? new Date(prospect.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : new Date().toLocaleTimeString('fr-FR'),
      restaurantNom: prospect.restaurant_nom || 'Établissement Client',
      gerantNom: prospect.prospect_nom || 'M. le Gérant',
      telephone: prospect.telephone || '+221 -- --- -- --',
      adresse: prospect.ville || 'Dakar, Sénégal',
      ville: prospect.ville || 'Dakar, Sénégal',
      ninea: prospect.ninea || 'Non communiqué / En cours',
      formule: prospect.formule || 'Xéweul',
      montantMensuel: prospect.formule === 'Tàmbali' ? '15 000 FCFA/mois' : prospect.formule === 'Nio Far' ? '25 000 FCFA/mois' : '35 000 FCFA/mois',
      montantAcompte: prospect.formule === 'Tàmbali' ? '15 000 FCFA' : prospect.formule === 'Nio Far' ? '25 000 FCFA' : '35 000 FCFA',
      modePaiement: 'Wave Business (+221 77 458 74 74)',
      refPaiement: 'W-VALIDÉ-TERRAIN',
      commercialNom: commercialConnecte ? `${commercialConnecte.prenom} ${commercialConnecte.nom}` : 'Conseiller Lou Ame Tay',
      signatureClientDataUrl: null
    };

    try {
      await genererContratPDFA4(donnees);
      afficherToast('✓ Contrat officiel PDF A4 téléchargé avec succès !');
    } catch (err) {
      console.error(err);
      afficherToast('Erreur lors du téléchargement du contrat PDF.');
    }
  };
}

function ouvrirModalContrat(prospect = null) {
  if (typeof window.ouvrirModalContrat === 'function') {
    window.ouvrirModalContrat(prospect);
  }
}

async function telechargerContratExistant(prospect) {
  if (typeof window.telechargerContratExistant === 'function') {
    await window.telechargerContratExistant(prospect);
  }
}

// ==============================================================================
// 12. UTILITAIRES DIVERS
// ==============================================================================
function afficherToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = 'toast-notification visible';
  setTimeout(() => {
    toast.className = 'toast-notification';
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==============================================================================
// 13. MODULE GEMINI COPILOT (PITCH & PROSPECTION IA TERRAIN)
// ==============================================================================
function initialiserGeminiCopilotCommercial() {
  const btnOuvrir = document.getElementById('btn-ouvrir-gemini-copilot');
  const modal = document.getElementById('modal-gemini-copilot');
  const btnFermer = document.getElementById('btn-fermer-modal-copilot');
  const btnGenerer = document.getElementById('btn-generer-pitch-ia');
  const selectZone = document.getElementById('copilot-profil-zone');
  const selectFormule = document.getElementById('copilot-formule-visee');
  const champResto = document.getElementById('copilot-resto-nom');
  const zoneResultat = document.getElementById('zone-resultat-copilot');
  const texteAccroche = document.getElementById('texte-accroche-orale');
  const texteMsgWa = document.getElementById('texte-message-wa');
  const divObjections = document.getElementById('liste-objections-copilot');
  const btnCopier = document.getElementById('btn-copier-accroche');
  const btnOuvrirWa = document.getElementById('btn-ouvrir-wa-copilot');

  if (btnOuvrir && modal) {
    btnOuvrir.addEventListener('click', () => {
      modal.style.display = 'flex';
      if (zoneResultat && zoneResultat.style.display === 'none') {
        declencherGenerationPitch();
      }
    });
  }

  btnFermer?.addEventListener('click', () => {
    if (modal) modal.style.display = 'none';
  });

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });

  function declencherGenerationPitch() {
    const zoneId = selectZone?.value || 'almadies_lounge';
    const formule = selectFormule?.value || 'Xéweul';
    const restoNom = champResto?.value.trim() || 'Votre Restaurant';
    const prenom = commercialConnecte?.prenom || 'Conseiller';
    const nom = commercialConnecte?.nom || 'Lou Ame Tay';
    const lienCarte = `https://louametay.online/carte.html?id=${encodeURIComponent(commercialConnecte?.id || 'demo')}`;

    const pitch = genererPitchCommercial({
      profilId: zoneId,
      formule,
      restoNom,
      prenomCommercial: prenom,
      nomCommercial: nom,
      lienCarte
    });

    if (texteAccroche) texteAccroche.textContent = pitch.accrocheOrale;
    if (texteMsgWa) texteMsgWa.textContent = pitch.messageWhatsApp;

    if (divObjections) {
      divObjections.innerHTML = pitch.objections.map(obj => `
        <div style="margin-bottom: 8px; border-bottom: 1px dashed #FDE68A; padding-bottom: 6px;">
          <div style="font-weight: 700; color: #92400E; margin-bottom: 2px;">${escapeHtml(obj.objection)}</div>
          <div style="color: #451A03;">👉 ${escapeHtml(obj.reponse)}</div>
        </div>
      `).join('');
    }

    if (btnOuvrirWa) {
      btnOuvrirWa.onclick = () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(pitch.messageWhatsApp)}`, '_blank');
      };
    }

    if (btnCopier) {
      btnCopier.onclick = async () => {
        try {
          await navigator.clipboard.writeText(pitch.accrocheOrale);
          afficherToast('✓ Accroche verbale copiée dans le presse-papiers !');
        } catch {
          afficherToast('Sélectionnez le texte pour le copier.');
        }
      };
    }

    if (zoneResultat) {
      zoneResultat.style.display = 'block';
    }
  }

  btnGenerer?.addEventListener('click', declencherGenerationPitch);
}

// ==============================================================================
// 14. MODULE PASS DIGITAL WALLET NFC (GOOGLE & APPLE WALLET)
// ==============================================================================
function initialiserPassWalletCommercial() {
  const btnOuvrir = document.getElementById('btn-ouvrir-pass-wallet');
  const modal = document.getElementById('modal-pass-wallet-comm');
  const btnFermer = document.getElementById('btn-fermer-modal-wallet-comm');
  const btnNfc = document.getElementById('btn-pass-telecharger-nfc');
  const btnGoogle = document.getElementById('btn-pass-google-wallet');
  const btnApple = document.getElementById('btn-pass-apple-wallet');

  if (btnOuvrir && modal) {
    btnOuvrir.addEventListener('click', () => {
      modal.style.display = 'flex';
    });
  }

  btnFermer?.addEventListener('click', () => {
    if (modal) modal.style.display = 'none';
  });

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });

  btnNfc?.addEventListener('click', () => {
    telechargerPassDigitalNFC(commercialConnecte);
    afficherToast('✓ Pass Contact NFC téléchargé avec succès !');
  });

  btnGoogle?.addEventListener('click', () => {
    ajouterAuWallet(commercialConnecte);
  });

  btnApple?.addEventListener('click', () => {
    ajouterAuWallet(commercialConnecte);
  });
}

// ==============================================================================
// 15. RADAR DE PRÉSENCE EN DIRECT (HEARTBEAT TERRAIN AUTOMATIQUE)
// ==============================================================================
function lancerHeartbeatPresenceCommercial() {
  async function emettreHeartbeat() {
    if (!commercialConnecte || !commercialConnecte.id) return;

    // Détecter l'onglet actif
    const panneauActif = document.querySelector('.comm-panel.active')?.id || 'panel-perf';
    const nomPanneau = {
      'panel-perf': 'Tableau de Bord & Performances',
      'panel-rdv-gps': 'Rendez-vous & Pointage GPS',
      'panel-commissions': 'Commissions & Cagnotte',
      'panel-depenses': 'Frais & Justificatifs Terrain',
      'panel-prospects': 'CRM & Signature de Contrats',
      'panel-outils': 'Kit Networking & Outils Pro',
      'panel-annonces': 'Annonces Équipe',
      'panel-avis': 'Avis Clients'
    }[panneauActif] || 'Espace Commercial';

    const payloadPresence = {
      commercial_id: commercialConnecte.id,
      commercial_nom: `${commercialConnecte.prenom} ${commercialConnecte.nom}`,
      ecran_actif: nomPanneau,
      ville: commercialConnecte.ville || 'Dakar',
      horodatage: new Date().toISOString(),
      en_ligne: true
    };

    try {
      localStorage.setItem('lat_commercial_presence', JSON.stringify(payloadPresence));

      if (estSupabaseConfigure() && supabase) {
        await enregistrerActivite({
          typeAction: 'HEARTBEAT_PRESENCE',
          description: `Actif sur l'écran : ${nomPanneau}`,
          details: {
            ecran: nomPanneau,
            ville: commercialConnecte.ville || 'Dakar',
            appareil: navigator.userAgent
          },
          commercialId: commercialConnecte.id,
          commercialNom: `${commercialConnecte.prenom} ${commercialConnecte.nom}`
        });
      }
    } catch (err) {
      console.debug('Heartbeat présence silencieux:', err);
    }
  }

  // Émission immédiate puis toutes les 45 secondes
  setTimeout(emettreHeartbeat, 3000);
  setInterval(emettreHeartbeat, 45000);
}

// ==============================================================================
// 10. ONBOARDING BLOQUANT & SIGNATURE DU CONTRAT D'AGENT COMMERCIAL (LAT-COM-2026)
// ==============================================================================

/**
 * Affiche l'écran d'onboarding juridique bloquant et pré-remplit les coordonnées
 * @param {Object} agent - Données du conseiller commercial
 */
export function afficherEcranOnboardingContrat(agent) {
  const secConnexion = document.getElementById('section-connexion-comm');
  if (secConnexion) secConnexion.style.display = 'none';
  const secApp = document.getElementById('section-app-comm');
  if (secApp) secApp.style.display = 'none';
  const header = document.querySelector('.comm-header');
  if (header) header.style.display = 'none';
  const zoneHeader = document.getElementById('zone-header-actions');
  if (zoneHeader) zoneHeader.style.display = 'none';

  const secOnboarding = document.getElementById('ecran-onboarding-contrat');
  if (secOnboarding) {
    secOnboarding.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Pré-remplissage des champs Étape 1
  const prenom = agent.prenom || '';
  const nom = agent.nom || '';
  const nomComplet = `${prenom} ${nom}`.trim() || 'Conseiller Commercial';
  const telephone = agent.telephone || agent.whatsapp || '';
  const refMatricule = agent.contrat_reference || `LAT-COM-2026-${agent.id ? String(agent.id).slice(-4).toUpperCase() : Math.floor(1000 + Math.random() * 9000)}`;

  const elNom = document.getElementById('onboarding-nom-complet');
  if (elNom) elNom.value = nomComplet;

  const elTel = document.getElementById('onboarding-telephone');
  if (elTel) elTel.value = telephone;

  const elSecEmail = document.getElementById('onboarding-sec-email');
  if (elSecEmail && !elSecEmail.value) elSecEmail.value = agent.secondary_email || '';

  const elSecPhone = document.getElementById('onboarding-sec-phone');
  if (elSecPhone && !elSecPhone.value) elSecPhone.value = agent.secondary_phone || '';

  const elCni = document.getElementById('onboarding-cni');
  if (elCni && !elCni.value) elCni.value = agent.cni_number || agent.cni || '';

  const elPayout = document.getElementById('onboarding-payout-phone');
  if (elPayout && !elPayout.value) elPayout.value = agent.payout_phone || agent.telephone || telephone;

  const elPayoutName = document.getElementById('onboarding-payout-name');
  if (elPayoutName && !elPayoutName.value) elPayoutName.value = agent.payout_account_name || nomComplet;

  const elUrgNom = document.getElementById('onboarding-urg-nom');
  if (elUrgNom && !elUrgNom.value) elUrgNom.value = agent.emergency_name || '';

  const elUrgTel = document.getElementById('onboarding-urg-tel');
  if (elUrgTel && !elUrgTel.value) elUrgTel.value = agent.emergency_phone || '';

  // Étape 2 (Carte Digitale)
  const elJob = document.getElementById('onboarding-job-title');
  if (elJob && agent.poste) elJob.value = agent.poste;

  const elPrevNom = document.getElementById('wizard-preview-nom');
  if (elPrevNom) elPrevNom.textContent = nomComplet;

  const elPrevPoste = document.getElementById('wizard-preview-poste');
  if (elPrevPoste) elPrevPoste.textContent = elJob?.value || 'Conseiller Digital CHR';

  const elPrevPayout = document.getElementById('wizard-preview-payout');
  if (elPrevPayout) elPrevPayout.textContent = `Ligne certifiée : ${elPayout?.value || telephone}`;

  // Badge et références contrat
  const elBadgeMatricule = document.getElementById('onboarding-matricule-badge');
  if (elBadgeMatricule) elBadgeMatricule.textContent = `Réf. Contrat : ${refMatricule}`;

  const elTxtMatricule = document.getElementById('txt-scroll-matricule');
  if (elTxtMatricule) elTxtMatricule.textContent = refMatricule;

  const elContratNom = document.getElementById('contrat-agent-preview-nom');
  if (elContratNom) elContratNom.textContent = nomComplet;

  // Réinitialiser le Wizard à l'Étape 1
  basculerEtapeWizard(1);
}

/**
 * Fonction interne pour basculer entre les étapes 1, 2 et 3 du Wizard
 * @param {number} etape - Numéro d'étape (1, 2 ou 3)
 */
function basculerEtapeWizard(etape) {
  const p1 = document.getElementById('panneau-wizard-etape-1');
  const p2 = document.getElementById('panneau-wizard-etape-2');
  const p3 = document.getElementById('panneau-wizard-etape-3');

  const b1 = document.getElementById('wizard-badge-step-1');
  const b2 = document.getElementById('wizard-badge-step-2');
  const b3 = document.getElementById('wizard-badge-step-3');

  if (p1) p1.style.display = etape === 1 ? 'block' : 'none';
  if (p2) p2.style.display = etape === 2 ? 'block' : 'none';
  if (p3) p3.style.display = etape === 3 ? 'block' : 'none';

  // Mise à jour de l'apparence des badges Stepper
  function styleActif(el, numEl, numTxt) {
    el.style.background = '#C9A227';
    el.style.color = '#0B1F3A';
    el.style.border = 'none';
    numEl.textContent = numTxt;
  }
  function styleValide(el, numEl) {
    el.style.background = '#166534';
    el.style.color = '#FFFFFF';
    el.style.border = 'none';
    numEl.textContent = '✓';
  }
  function styleInactif(el, numEl, numTxt) {
    el.style.background = 'rgba(255,255,255,0.1)';
    el.style.color = '#CBD5E1';
    el.style.border = '1px solid rgba(255,255,255,0.2)';
    numEl.textContent = numTxt;
  }

  const n1 = document.getElementById('wizard-num-1');
  const n2 = document.getElementById('wizard-num-2');
  const n3 = document.getElementById('wizard-num-3');

  if (etape === 1) {
    styleActif(b1, n1, '1');
    styleInactif(b2, n2, '2');
    styleInactif(b3, n3, '3');
  } else if (etape === 2) {
    styleValide(b1, n1);
    styleActif(b2, n2, '2');
    styleInactif(b3, n3, '3');
  } else if (etape === 3) {
    styleValide(b1, n1);
    styleValide(b2, n2);
    styleActif(b3, n3, '3');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Initialise l'ensemble du Wizard d'onboarding en 3 étapes :
 * Étape 1 : Coordonnées, Mobile Money, CNI Recto/Verso, Urgence, Locomotion
 * Étape 2 : Photo de profil (Caméra directe ou Galerie), Titre, Aperçu interactif
 * Étape 3 : Contrat officiel LAT-COM-2026 complet avec injection dynamique, défilement et signature tactile
 */
export function initialiserOnboardingContratAgent() {
  const btnToStep2 = document.getElementById('btn-wizard-to-step-2');
  const btnBackTo1 = document.getElementById('btn-wizard-back-to-1');
  const btnToStep3 = document.getElementById('btn-wizard-to-step-3');
  const btnBackTo2 = document.getElementById('btn-wizard-back-to-2');

  let cniFrontDataUrl = '';
  let cniBackDataUrl = '';
  let avatarPhotoDataUrl = '';

  // --------------------------------------------------------------------------
  // A. ÉTAPE 1 : VALIDATION & GESTION DES FICHIERS CNI
  // --------------------------------------------------------------------------
  const inputCniFront = document.getElementById('onboarding-cni-front-file');
  const inputCniBack = document.getElementById('onboarding-cni-back-file');

  inputCniFront?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        cniFrontDataUrl = ev.target?.result;
        const img = document.getElementById('cni-front-preview-img');
        const box = document.getElementById('cni-front-preview-box');
        if (img && box) {
          img.src = cniFrontDataUrl;
          box.style.display = 'block';
        }
      };
      reader.readAsDataURL(file);
    }
  });

  inputCniBack?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        cniBackDataUrl = ev.target?.result;
        const img = document.getElementById('cni-back-preview-img');
        const box = document.getElementById('cni-back-preview-box');
        if (img && box) {
          img.src = cniBackDataUrl;
          box.style.display = 'block';
        }
      };
      reader.readAsDataURL(file);
    }
  });

  // Clic [ CONTINUER VERS L'ÉTAPE 2 (CARTE DIGITALE) ➔ ]
  btnToStep2?.addEventListener('click', () => {
    const cni = document.getElementById('onboarding-cni')?.value.trim();
    const payoutPhone = document.getElementById('onboarding-payout-phone')?.value.trim();
    const payoutName = document.getElementById('onboarding-payout-name')?.value.trim();
    const urgNom = document.getElementById('onboarding-urg-nom')?.value.trim();
    const urgTel = document.getElementById('onboarding-urg-tel')?.value.trim();

    if (!cni || cni.length < 5) {
      afficherToast('Veuillez renseigner votre numéro de CNI / CEDEAO ou Passeport.');
      document.getElementById('onboarding-cni')?.focus();
      return;
    }

    if (!payoutPhone || payoutPhone.length < 8) {
      afficherToast('Veuillez renseigner le numéro Mobile Money pour vos commissions.');
      document.getElementById('onboarding-payout-phone')?.focus();
      return;
    }

    if (!payoutName || payoutName.length < 3) {
      afficherToast('Veuillez renseigner le nom exact du titulaire du compte Mobile Money.');
      document.getElementById('onboarding-payout-name')?.focus();
      return;
    }

    if (!urgNom || !urgTel) {
      afficherToast('Veuillez renseigner le contact d\'urgence complet.');
      document.getElementById('onboarding-urg-nom')?.focus();
      return;
    }

    // Mise à jour de l'aperçu dynamique de la carte à l'étape 2
    const elPrevPayout = document.getElementById('wizard-preview-payout');
    const operateur = document.getElementById('onboarding-payout-operator')?.value;
    if (elPrevPayout) {
      elPrevPayout.textContent = `${operateur === 'WAVE' ? '🌊 Wave' : '🍊 OM'} : ${payoutPhone}`;
    }

    const zone = document.getElementById('onboarding-zone')?.value;
    const elPrevZone = document.getElementById('wizard-preview-zone');
    if (elPrevZone) elPrevZone.textContent = `📍 ${zone}`;

    basculerEtapeWizard(2);
  });

  // --------------------------------------------------------------------------
  // B. ÉTAPE 2 : PHOTO DE PROFIL HD & CARTE DE VISITE DIGITALE
  // --------------------------------------------------------------------------
  btnBackTo1?.addEventListener('click', () => basculerEtapeWizard(1));

  const btnCamera = document.getElementById('btn-declencher-camera');
  const btnGalerie = document.getElementById('btn-declencher-galerie');
  const inputCamera = document.getElementById('input-wizard-camera');
  const inputGalerie = document.getElementById('input-wizard-gallery');

  btnCamera?.addEventListener('click', () => inputCamera?.click());
  btnGalerie?.addEventListener('click', () => inputGalerie?.click());

  function traiterPhotoSelectionnee(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      avatarPhotoDataUrl = ev.target?.result;
      const prevAvatar = document.getElementById('wizard-preview-avatar');
      if (prevAvatar) prevAvatar.src = avatarPhotoDataUrl;
      afficherToast('Photo de profil chargée avec succès ! ✨');
    };
    reader.readAsDataURL(file);
  }

  inputCamera?.addEventListener('change', (e) => traiterPhotoSelectionnee(e.target.files?.[0]));
  inputGalerie?.addEventListener('change', (e) => traiterPhotoSelectionnee(e.target.files?.[0]));

  // Synchronisation dynamique du titre commercial
  const inputJob = document.getElementById('onboarding-job-title');
  inputJob?.addEventListener('input', (e) => {
    const el = document.getElementById('wizard-preview-poste');
    if (el) el.textContent = e.target.value.trim() || 'Conseiller Digital CHR';
  });

  // Clic [ CONTINUER VERS LE CONTRAT (ÉTAPE 3) ➔ ]
  btnToStep3?.addEventListener('click', () => {
    const job = inputJob?.value.trim();
    if (!job) {
      afficherToast('Veuillez renseigner votre titre professionnel.');
      inputJob?.focus();
      return;
    }

    // Injection automatique de toutes les données saisies dans le texte du contrat LAT-COM-2026
    const cni = document.getElementById('onboarding-cni')?.value.trim();
    const operateur = document.getElementById('onboarding-payout-operator')?.value;
    const payoutPhone = document.getElementById('onboarding-payout-phone')?.value.trim();
    const payoutName = document.getElementById('onboarding-payout-name')?.value.trim();
    const zone = document.getElementById('onboarding-zone')?.value;
    const locomotion = document.getElementById('onboarding-locomotion')?.value;

    const elPrevCni = document.getElementById('contrat-agent-preview-cni');
    if (elPrevCni) elPrevCni.textContent = cni;

    const elPrevPayout = document.getElementById('contrat-agent-preview-payout');
    if (elPrevPayout) elPrevPayout.textContent = `${operateur === 'WAVE' ? 'Wave' : 'Orange Money'} (${payoutPhone})`;

    const elPrevTitu = document.getElementById('contrat-agent-preview-titulaire');
    if (elPrevTitu) elPrevTitu.textContent = payoutName;

    const elPrevZone = document.getElementById('contrat-agent-preview-zone');
    if (elPrevZone) elPrevZone.textContent = zone;

    const elPrevLocomotion = document.getElementById('contrat-agent-preview-locomotion');
    if (elPrevLocomotion) {
      elPrevLocomotion.textContent = {
        'MOTO_SCOOTER': 'Moto / Scooter',
        'VEHICULE_PERSO': 'Véhicule Personnel',
        'TRANSPORT_COMMUN': 'Transports en Commun'
      }[locomotion] || locomotion;
    }

    basculerEtapeWizard(3);
  });

  // --------------------------------------------------------------------------
  // C. ÉTAPE 3 : DÉFILEMENT, SIGNATURE TACTILE & SCELLAGE DU CONTRAT
  // --------------------------------------------------------------------------
  btnBackTo2?.addEventListener('click', () => basculerEtapeWizard(2));

  const canvas = document.getElementById('canvas-signature-agent');
  const btnEffacer = document.getElementById('btn-effacer-sig-agent');
  const aideSignature = document.getElementById('aide-signature-agent');
  const cadreScroll = document.getElementById('cadre-scroll-contrat-agent');
  const statutDefilement = document.getElementById('statut-defilement-contrat');

  let signatureApposee = false;
  let ctx = null;

  if (canvas) {
    ctx = canvas.getContext('2d');

    function ajusterResolutionCanvas() {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = 140 * dpr;
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#0B1F3A';
    }

    ajusterResolutionCanvas();
    window.addEventListener('resize', () => {
      if (!signatureApposee) ajusterResolutionCanvas();
    });

    let dessinEnCours = false;

    function getCoordonnees(e) {
      const rect = canvas.getBoundingClientRect();
      if (e.touches && e.touches.length > 0) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top
        };
      }
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }

    function demarrerDessin(e) {
      e.preventDefault();
      dessinEnCours = true;
      signatureApposee = true;
      if (aideSignature) aideSignature.style.display = 'none';
      const pos = getCoordonnees(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }

    function tracerLigne(e) {
      if (!dessinEnCours) return;
      e.preventDefault();
      const pos = getCoordonnees(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }

    function arreterDessin() {
      dessinEnCours = false;
    }

    canvas.addEventListener('mousedown', demarrerDessin);
    canvas.addEventListener('mousemove', tracerLigne);
    canvas.addEventListener('mouseup', arreterDessin);
    canvas.addEventListener('mouseleave', arreterDessin);

    canvas.addEventListener('touchstart', demarrerDessin, { passive: false });
    canvas.addEventListener('touchmove', tracerLigne, { passive: false });
    canvas.addEventListener('touchend', arreterDessin);
  }

  btnEffacer?.addEventListener('click', () => {
    if (ctx && canvas) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      signatureApposee = false;
      if (aideSignature) aideSignature.style.display = 'block';
    }
  });

  // Détection du défilement intégral du contrat
  if (cadreScroll && statutDefilement) {
    cadreScroll.addEventListener('scroll', () => {
      const scrollTotal = cadreScroll.scrollHeight - cadreScroll.clientHeight;
      if (cadreScroll.scrollTop >= scrollTotal - 35) {
        statutDefilement.textContent = '✅ Lecture complète validée';
        statutDefilement.style.color = '#065F46';
        statutDefilement.style.background = '#ECFDF5';
        statutDefilement.style.borderColor = '#A7F3D0';
      }
    });
  }

  // Soumission finale du formulaire d'onboarding (Étape 3)
  const form = document.getElementById('form-onboarding-contrat');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!commercialConnecte) {
      afficherToast('Erreur : Aucun conseiller commercial identifié.');
      return;
    }

    const accord = document.getElementById('check-accord-onboarding')?.checked;

    if (!signatureApposee || !canvas) {
      afficherToast('Veuillez apposer votre signature tactile dans le cadre prévu avant de valider.');
      return;
    }

    if (!accord) {
      afficherToast('Veuillez cocher la case d\'acceptation des 9 articles du contrat.');
      return;
    }

    const btnSubmit = document.getElementById('btn-valider-contrat-agent-final');
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = '<span>Scellage & Homologation en cours...</span> ⏳';
    }

    try {
      const matricule = commercialConnecte.contrat_reference || `LAT-COM-2026-${commercialConnecte.id ? String(commercialConnecte.id).slice(-4).toUpperCase() : Math.floor(1000 + Math.random() * 9000)}`;
      const signatureDataUrl = canvas.toDataURL('image/png');
      const dateSignature = new Date().toISOString();

      // Récupération de l'intégralité des données du Wizard 3 Étapes
      const secEmail = document.getElementById('onboarding-sec-email')?.value.trim() || null;
      const secPhone = document.getElementById('onboarding-sec-phone')?.value.trim() || null;
      const payoutOperator = document.getElementById('onboarding-payout-operator')?.value || 'WAVE';
      const payoutPhone = document.getElementById('onboarding-payout-phone')?.value.trim() || commercialConnecte.telephone;
      const payoutName = document.getElementById('onboarding-payout-name')?.value.trim() || `${commercialConnecte.prenom} ${commercialConnecte.nom}`;
      const cni = document.getElementById('onboarding-cni')?.value.trim() || '';
      const urgNom = document.getElementById('onboarding-urg-nom')?.value.trim() || '';
      const urgRelation = document.getElementById('onboarding-urg-relation')?.value || 'Parent';
      const urgTel = document.getElementById('onboarding-urg-tel')?.value.trim() || '';
      const locomotion = document.getElementById('onboarding-locomotion')?.value || 'MOTO_SCOOTER';
      const zone = document.getElementById('onboarding-zone')?.value || 'Thiès Centre & Grand Standing';
      const jobTitle = document.getElementById('onboarding-job-title')?.value.trim() || 'Conseiller Digital CHR';
      const linkedin = document.getElementById('onboarding-linkedin')?.value.trim() || null;

      const donneesMiseAJour = {
        // Étape 1 : Coordonnées, Mobile Money & KYC
        secondary_email: secEmail,
        secondary_phone: secPhone,
        payout_operator: payoutOperator,
        payout_phone: payoutPhone,
        payout_account_name: payoutName,
        cni_number: cni,
        cni: cni,
        cni_front_url: cniFrontDataUrl || null,
        cni_back_url: cniBackDataUrl || null,
        emergency_name: urgNom,
        emergency_relation: urgRelation,
        emergency_phone: urgTel,
        transport_mode: locomotion,
        assigned_territory: zone,
        zone: zone,

        // Étape 2 : Carte de Visite Digitale
        job_title: jobTitle,
        poste: jobTitle,
        linkedin_url: linkedin,
        photo_url: avatarPhotoDataUrl || commercialConnecte.photo_url || 'images/commercial1.jpg',

        // Étape 3 : Scellage Contractuel
        has_signed_contract: true,
        contract_status: 'SIGNED',
        contrat_statut: 'SIGNE',
        contract_reference: matricule,
        contrat_reference: matricule,
        contract_signed_at: dateSignature,
        contrat_signe_le: dateSignature,
        contract_signature_url: signatureDataUrl,
        contrat_signature_url: signatureDataUrl,
        contract_sign_ip: 'Session Mobile Sécurisée',
        contrat_sign_ip: 'Session Mobile Sécurisée',
        onboarding_step: 4
      };

      // Sauvegarde dans Supabase si configuré
      if (estSupabaseConfigure() && supabase) {
        const { error: errUpdate } = await supabase
          .from('commerciaux')
          .update(donneesMiseAJour)
          .eq('id', commercialConnecte.id);

        if (errUpdate) {
          console.warn('Avertissement mise à jour Supabase contrat:', errUpdate);
        }
      }

      // Mise à jour de l'état local
      Object.assign(commercialConnecte, donneesMiseAJour);

      // Sauvegarde dans la session locale permanente
      localStorage.setItem('LOUAMETAY_COMMERCIAL_SESSION', JSON.stringify({
        id: commercialConnecte.id,
        prenom: commercialConnecte.prenom,
        nom: commercialConnecte.nom,
        has_signed_contract: true,
        contrat_statut: 'SIGNE'
      }));

      // Journalisation d'audit immuable
      try {
        await enregistrerActivite({
          typeAction: 'SIGNATURE_CONTRAT_AGENT',
          description: `Wizard d'Onboarding validé & Contrat ${matricule} scellé par ${commercialConnecte.prenom} ${commercialConnecte.nom} (${payoutOperator}: ${payoutPhone})`,
          commercialId: commercialConnecte.id,
          commercialNom: `${commercialConnecte.prenom} ${commercialConnecte.nom}`,
          details: {
            matricule: matricule,
            cni: cni,
            payout_operator: payoutOperator,
            payout_phone: payoutPhone,
            transport: locomotion,
            zone: zone,
            contrat_signe_le: dateSignature
          },
          statut: 'SUCCES'
        });
      } catch (errAudit) {
        console.warn('Erreur journalisation signature contrat agent:', errAudit);
      }

      afficherToast('🎉 Compte commercial activé avec succès ! Bienvenue chez Lou Ame Tay.');

      // Génération et téléchargement immédiat du PDF A4 officiel 2 pages
      try {
        afficherToast('Génération de votre exemplaire officiel PDF A4 en cours... 📄');
        await genererContratCommercialPDFA4({
          matricule: matricule,
          agentNom: commercialConnecte.nom || '',
          agentPrenom: commercialConnecte.prenom || '',
          agentCni: cni,
          agentAdresse: zone || 'Dakar / Thiès, Sénégal',
          agentTelephone: commercialConnecte.telephone || payoutPhone,
          agentPayoutPhone: `${payoutOperator} : ${payoutPhone} (${payoutName})`,
          signatureAgentDataUrl: signatureDataUrl,
          clientIp: 'Session Mobile Sécurisée'
        });
      } catch (errPdf) {
        console.error('Erreur génération PDF contrat agent:', errPdf);
      }

      // Déverrouillage immédiat et chargement complet de l'application
      afficherApplication();
      actualiserInterfaceConseiller();
      await chargerToutesLesDonnees();

    } catch (err) {
      console.error('Erreur validation contrat agent:', err);
      afficherToast('Erreur : ' + (err.message || 'Impossible de finaliser le contrat.'));
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<span>VALIDER ET ACTIVER MON COMPTE COMMERCIAL 🚀</span>';
      }
    }
  });
}

/**
 * Initialise le modal de consultation permanente du contrat d'agent signé
 */
export function initialiserConsultationContratAgent() {
  const btnOuvrir = document.getElementById('btn-voir-mon-contrat-agent');
  const modal = document.getElementById('modal-consultation-contrat-agent');
  const btnFermer = document.getElementById('btn-fermer-modal-consultation-contrat');
  const btnTelecharger = document.getElementById('btn-telecharger-mon-contrat-pdf');

  if (!btnOuvrir || !modal) return;

  btnOuvrir.addEventListener('click', () => {
    if (!commercialConnecte) {
      afficherToast('Aucun conseiller connecté.');
      return;
    }

    const ref = commercialConnecte.contrat_reference || `LAT-COM-2026-${commercialConnecte.id ? String(commercialConnecte.id).slice(-4).toUpperCase() : 'OFFICIEL'}`;
    const prenom = commercialConnecte.prenom || '';
    const nom = commercialConnecte.nom || '';
    const nomComplet = `${prenom} ${nom}`.trim() || 'Conseiller Commercial';
    const cni = commercialConnecte.cni || 'Non renseigné';
    const payout = commercialConnecte.payout_phone || commercialConnecte.telephone || commercialConnecte.whatsapp || 'Non renseigné';
    const dateSigne = commercialConnecte.contrat_signe_le ? new Date(commercialConnecte.contrat_signe_le).toLocaleString('fr-FR') : 'Date homologuée';
    const ip = commercialConnecte.contrat_sign_ip || 'Session Mobile Sécurisée (SHA-256 certifié)';

    const elStatutTitre = document.getElementById('contrat-consul-statut-titre');
    if (elStatutTitre) elStatutTitre.textContent = 'Contrat Homologué & Actif';

    const elDetails = document.getElementById('contrat-consul-details');
    if (elDetails) elDetails.textContent = `Réf : ${ref} • Validé sous l'empire du droit sénégalais`;

    const elNom = document.getElementById('contrat-consul-nom');
    if (elNom) elNom.textContent = nomComplet;

    const elCni = document.getElementById('contrat-consul-cni');
    if (elCni) elCni.textContent = cni;

    const elPayout = document.getElementById('contrat-consul-payout');
    if (elPayout) elPayout.textContent = payout;

    const elDate = document.getElementById('contrat-consul-date');
    if (elDate) elDate.textContent = dateSigne;

    const elIp = document.getElementById('contrat-consul-ip');
    if (elIp) elIp.textContent = ip;

    const imgSig = document.getElementById('contrat-consul-img-signature');
    if (imgSig) {
      if (commercialConnecte.contrat_signature_url) {
        imgSig.src = commercialConnecte.contrat_signature_url;
        imgSig.parentElement.style.display = 'block';
      } else {
        imgSig.parentElement.style.display = 'none';
      }
    }

    modal.style.display = 'flex';
  });

  btnFermer?.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
  });

  btnTelecharger?.addEventListener('click', async () => {
    if (!commercialConnecte) return;
    btnTelecharger.disabled = true;
    btnTelecharger.innerHTML = '<span>Génération du PDF en cours...</span> ⏳';

    try {
      const ref = commercialConnecte.contrat_reference || `LAT-COM-2026-${commercialConnecte.id ? String(commercialConnecte.id).slice(-4).toUpperCase() : 'OFFICIEL'}`;
      await genererContratCommercialPDFA4({
        matricule: ref,
        agentNom: commercialConnecte.nom || '',
        agentPrenom: commercialConnecte.prenom || '',
        agentCni: commercialConnecte.cni || 'Non renseigné',
        agentAdresse: commercialConnecte.adresse || 'Dakar / Thiès, Sénégal',
        agentTelephone: commercialConnecte.telephone || commercialConnecte.whatsapp || '+221 77 000 00 00',
        agentPayoutPhone: commercialConnecte.payout_phone || commercialConnecte.telephone || '+221 77 000 00 00',
        signatureAgentDataUrl: commercialConnecte.contrat_signature_url,
        clientIp: commercialConnecte.contrat_sign_ip || 'Session Mobile Sécurisée'
      });
      afficherToast('Contrat PDF A4 officiel téléchargé ! 📄');
    } catch (err) {
      console.error(err);
      afficherToast('Erreur lors du téléchargement du contrat : ' + err.message);
    } finally {
      btnTelecharger.disabled = false;
      btnTelecharger.innerHTML = '<span>Télécharger mon Contrat Officiel (PDF A4) 📄</span>';
    }
  });
}
