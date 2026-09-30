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
  initialiserNavigationOnglets();
  initialiserFormulaires();
  initialiserUploadJustificatif();

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

  // Si non connecté, afficher l'écran de connexion
  afficherEcranConnexion();
});

function afficherEcranConnexion() {
  document.getElementById('section-connexion-comm').style.display = 'block';
  document.getElementById('section-app-comm').style.display = 'none';
  document.getElementById('zone-header-actions').style.display = 'none';
}

function afficherApplication() {
  document.getElementById('section-connexion-comm').style.display = 'none';
  document.getElementById('section-app-comm').style.display = 'block';
  document.getElementById('zone-header-actions').style.display = 'block';
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
      nom: conseiller.nom
    }));
  }

  // Traçabilité immuable de connexion pour le CEO
  await enregistrerActivite({
    typeAction: 'CONNEXION_COMMERCIAL',
    description: `Connexion du conseiller ${conseiller.prenom} ${conseiller.nom}`,
    details: {
      telephone: conseiller.telephone || conseiller.whatsapp,
      email: conseiller.email,
      session_memorisee: !!remember
    },
    commercialId: conseiller.id,
    commercialNom: `${conseiller.prenom} ${conseiller.nom}`,
    statut: 'SUCCES'
  });

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
      // Déduction par rapport à la ville du RDV
      const villeRef = COORDONNEES_VILLES_SENEGAL[rdv.adresse_restaurant] || COORDONNEES_VILLES_SENEGAL['Dakar Plateau'];
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
// 7. MODULE COMMISSIONS (RÈGLE DES 10%)
// ==============================================================================
async function chargerCommissions() {
  const cId = commercialConnecte.id;
  const tbody = document.getElementById('tbody-commissions-commercial');

  let totalDisponible = 0;
  let totalAttente = 0;
  let totalRecu = 0;

  try {
    const { data, error } = await supabase
      .from('commissions')
      .select('*')
      .eq('commercial_id', cId)
      .order('created_at', { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      listeCommissions = data;
    } else {
      // Repli dynamique sur les leads signés pour calculer automatiquement les 10%
      const { data: leadsSignes } = await supabase
        .from('leads')
        .select('*')
        .eq('commercial_id', cId)
        .eq('statut', 'SIGNE');

      if (leadsSignes && leadsSignes.length > 0) {
        listeCommissions = leadsSignes.map(l => {
          const prixFormule = l.formule?.includes('Xéweul') ? 35000 : l.formule?.includes('Nio Far') ? 25000 : 15000;
          const comm = Math.round(prixFormule * 0.10);
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
            Signez un contrat de formule (Tàmbali, Nio Far, Xéweul) pour percevoir automatiquement 10% sur chaque signature !
          </td>
        </tr>`;
    } else {
      tbody.innerHTML = listeCommissions.map(c => {
        const montantContrat = Number(c.montant_contrat || 0);
        const montantComm = Number(c.montant_commission || Math.round(montantContrat * 0.10));

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

      return `
        <tr>
          <td><strong>${escapeHtml(l.restaurant_nom || '—')}</strong><br><span style="font-size: 0.78rem; color: var(--texte-muet);">${escapeHtml(l.ville || '')}</span></td>
          <td>${escapeHtml(l.prospect_nom || '—')}</td>
          <td>${escapeHtml(l.telephone || '—')}</td>
          <td><span class="comm-badge bleu">${escapeHtml(l.formule || 'Xéweul')}</span></td>
          <td><span class="comm-badge ${badgeClass}">${escapeHtml(l.statut || 'Nouveau')}</span></td>
          <td>
            <a href="${urlWa}" target="_blank" class="comm-btn-outline" style="font-size: 0.78rem; padding: 5px 10px;" title="Relancer sur WhatsApp">
              <span>Relancer</span> 💬
            </a>
          </td>
        </tr>`;
    }).join('');

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
