/**
 * ==============================================================================
 * FICHIER : js/admin-v2.js
 * LOGIQUE AVANCÉE ADMIN V2 : DASHBOARD CEO, CRM LEADS, AVIS & PARRAINAGES
 * Lou Ame Tay — Charte : #0B1F3A (marine), #C9A227 (doré), blanc, Poppins
 * ==============================================================================
 */

import { supabase, estSupabaseConfigure } from './supabase-client.js';
import { initialiserGraphiqueLeads30Jours } from './charts-admin.js';
import { initialiserCarteSenegalLeads, rafraichirTailleCarte } from './map-admin.js';

// État global Admin v2
let leadsGlobal = [];
let commerciauxGlobal = [];
let avisGlobal = [];
let parrainagesGlobal = [];
let rdvsGlobal = [];
let timerAutoRefresh = null;
let canalRealtimeSupabase = null;

// Objectifs mensuels CEO
const CIBLES_CEO = {
  mrr: 500000,          // 500 000 FCFA
  leadsSemaine: 10,     // 10 leads / semaine
  clientsActifs: 20,    // 20 clients CHR
  tauxConversion: 25    // 25% de conversion
};

// Tarifs mensuels des formules Lou Ame Tay
const TARIFS_FORMULES = {
  'tàmbali': 15000,
  'tambali': 15000,
  'nio far': 25000,
  'niofar': 25000,
  'xéweul': 35000,
  'xeweul': 35000,
  'sur mesure': 50000,
  'autre': 25000
};

/**
 * Initialisation principale de l'Admin v2
 */
export async function initialiserAdminV2(commerciaux = [], leads = []) {
  commerciauxGlobal = commerciaux;
  leadsGlobal = leads;

  // Charger les rendez-vous terrain pour la carte des points chauds
  if (estSupabaseConfigure() && supabase) {
    try {
      const { data: rdvs } = await supabase
        .from('rendez_vous')
        .select('*')
        .order('date_rdv', { ascending: false });
      if (rdvs) rdvsGlobal = rdvs;
    } catch (e) {
      console.debug('RDVs non chargés pour la carte:', e);
    }
  }

  // 1. Initialiser le Dashboard CEO
  calculerEtAfficherKpisCEO();
  initialiserVisuelsCEO();

  // 2. Initialiser le module Parrainages
  initialiserModuleParrainages();
  await chargerParrainages();

  // 3. Activer l'abonnement WebSocket Realtime Supabase (<1s)
  initialiserAbonnementsRealtime();

  // 4. Configurer l'auto-refresh temps réel en fallback (toutes les 30 secondes)
  demarrerAutoRefreshTempsReel();
}

/**
 * ==============================================================================
 * 1. DASHBOARD CEO — KPIS TEMPS RÉEL & OBJECTIFS
 * ==============================================================================
 */
export function calculerEtAfficherKpisCEO() {
  const totalLeads = leadsGlobal.length;
  
  // Clients actifs (leads convertis)
  const leadsConvertis = leadsGlobal.filter(l => {
    const st = (l.statut || '').toLowerCase();
    return st === 'converti' || st === 'client' || st === 'gagné';
  });
  const nbClientsActifs = leadsConvertis.length;

  // Calcul du MRR
  let mrrCalcule = 0;
  leadsConvertis.forEach(l => {
    const f = (l.formule || '').toLowerCase().trim();
    const prix = TARIFS_FORMULES[f] || 25000;
    mrrCalcule += prix;
  });
  // Si démo / aucun lead encore converti, MRR base réaliste sur les formules en cours
  const mrrAffiche = mrrCalcule > 0 ? mrrCalcule : (nbClientsActifs * 25000);

  // Nouveaux leads cette semaine (7 derniers jours)
  const ilYa7Jours = new Date();
  ilYa7Jours.setDate(ilYa7Jours.getDate() - 7);
  const leadsSemaine = leadsGlobal.filter(l => {
    if (!l.created_at) return false;
    return new Date(l.created_at) >= ilYa7Jours;
  }).length;

  // Taux de conversion
  const tauxConversion = totalLeads > 0 ? Math.round((nbClientsActifs / totalLeads) * 100) : 0;

  // Mise à jour de l'affichage des KPIs dans le DOM
  mettreAJourElement('kpi-ceo-mrr', `${mrrAffiche.toLocaleString('fr-FR')} FCFA`);
  mettreAJourElement('kpi-ceo-clients', nbClientsActifs);
  mettreAJourElement('kpi-ceo-leads-semaine', leadsSemaine);
  mettreAJourElement('kpi-ceo-conversion', `${tauxConversion}%`);

  // Mise à jour des indicateurs d'objectifs (🔴 <80%, 🟡 80-99%, 🟢 ≥100%)
  appliquerAlerteObjectif('badge-cible-mrr', mrrAffiche, CIBLES_CEO.mrr, '500k FCFA');
  appliquerAlerteObjectif('badge-cible-leads', leadsSemaine, CIBLES_CEO.leadsSemaine, '10/sem.');
  appliquerAlerteObjectif('badge-cible-clients', nbClientsActifs, CIBLES_CEO.clientsActifs, '20 clients');
  appliquerAlerteObjectif('badge-cible-conversion', tauxConversion, CIBLES_CEO.tauxConversion, '25%');

  // Top 3 Commerciaux
  afficherPodiumTop3Commerciaux();
}

/**
 * Applique le badge de couleur selon le % de réalisation de l'objectif
 */
function appliquerAlerteObjectif(elementId, valeurActuelle, cible, libelleCible) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const pourcentage = cible > 0 ? Math.round((valeurActuelle / cible) * 100) : 0;
  el.className = 'kpi-badge-alerte';

  if (pourcentage >= 100) {
    el.classList.add('vert');
    el.innerHTML = `🟢 ${pourcentage}% <span class="kpi-cible-txt">/ ${libelleCible}</span>`;
  } else if (pourcentage >= 80) {
    el.classList.add('jaune');
    el.innerHTML = `🟡 ${pourcentage}% <span class="kpi-cible-txt">/ ${libelleCible}</span>`;
  } else {
    el.classList.add('rouge');
    el.innerHTML = `🔴 ${pourcentage}% <span class="kpi-cible-txt">/ ${libelleCible}</span>`;
  }
}

/**
 * Affiche le podium des 3 meilleurs commerciaux (par signatures et leads)
 */
function afficherPodiumTop3Commerciaux() {
  const conteneur = document.getElementById('podium-top3-commerciaux');
  if (!conteneur) return;

  // Calcul du score commercial basé sur les leads convertis et totaux
  const statsCommerciaux = commerciauxGlobal.map(c => {
    const leadsDuCommercial = leadsGlobal.filter(l => String(l.commercial_id) === String(c.id));
    const convertis = leadsDuCommercial.filter(l => {
      const st = (l.statut || '').toLowerCase();
      return st === 'converti' || st === 'client' || st === 'gagné';
    }).length;

    return {
      commercial: c,
      totalLeads: leadsDuCommercial.length,
      convertis: convertis,
      points: (convertis * 10) + leadsDuCommercial.length
    };
  });

  // Trier par points décroissants
  statsCommerciaux.sort((a, b) => b.points - a.points);
  const top3 = statsCommerciaux.slice(0, 3);

  if (top3.length === 0) {
    conteneur.innerHTML = `<p style="color: #64748B; font-size: 0.85rem;">Aucun commercial enregistré.</p>`;
    return;
  }

  const rangs = [
    { classe: 'or', medaille: '🥇', rang: '1er' },
    { classe: 'argent', medaille: '🥈', rang: '2e' },
    { classe: 'bronze', medaille: '🥉', rang: '3e' }
  ];

  conteneur.innerHTML = top3.map((item, index) => {
    const r = rangs[index] || { classe: '', medaille: '👤', rang: `${index + 1}e` };
    const nom = `${item.commercial.prenom} ${item.commercial.nom}`;
    const poste = item.commercial.poste || 'Conseiller CHR';

    return `
      <div class="podium-item ${r.classe}">
        <div class="podium-rang-badge">${r.medaille}</div>
        <div class="podium-infos">
          <strong class="podium-nom">${nom}</strong>
          <span style="font-size: 0.75rem; color: #64748B;">${poste}</span>
          <span class="podium-score" style="margin-top: 4px; font-weight: 700; color: #0B1F3A;">
            🎯 ${item.convertis} conversion${item.convertis > 1 ? 's' : ''} <span style="font-weight: 400; color: #94A3B8;">(${item.totalLeads} leads)</span>
          </span>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Initialise le graphique 30 jours et la carte Leaflet
 */
export function initialiserVisuelsCEO() {
  // Graphique Leads 30 jours
  initialiserGraphiqueLeads30Jours('chart-leads-30j-ceo', leadsGlobal);

  // Carte Sénégal des 9 points chauds nationaux (Leads + RDVs)
  initialiserCarteSenegalLeads('map-senegal-leads', leadsGlobal, rdvsGlobal);
}

/**
 * Active l'écoute WebSocket Supabase Realtime pour une actualisation instantanée (< 1s)
 */
function initialiserAbonnementsRealtime() {
  if (!estSupabaseConfigure() || !supabase) return;
  if (canalRealtimeSupabase) return;

  try {
    canalRealtimeSupabase = supabase
      .channel('admin-realtime-hotspots')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, async (payload) => {
        console.log('⚡ [Realtime Supabase] Nouveau lead / conversion reçu :', payload.eventType);
        const badgeRefresh = document.getElementById('indicateur-temps-reel-pulse');
        if (badgeRefresh) {
          badgeRefresh.style.transform = 'scale(1.25)';
          setTimeout(() => { badgeRefresh.style.transform = 'scale(1)'; }, 400);
        }
        await actualiserDonneesSilencieusement();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rendez_vous' }, async (payload) => {
        console.log('⚡ [Realtime Supabase] Nouveau RDV / pointage GPS terrain :', payload.eventType);
        await actualiserDonneesSilencieusement();
      })
      .subscribe((status) => {
        console.log('📡 [Supabase Realtime] Statut du canal :', status);
      });
  } catch (err) {
    console.warn('Fallback WebSocket Realtime :', err);
  }
}

/**
 * Démarre le rafraîchissement temps réel automatique toutes les 30s en fallback
 */
function demarrerAutoRefreshTempsReel() {
  if (timerAutoRefresh) clearInterval(timerAutoRefresh);

  timerAutoRefresh = setInterval(async () => {
    const badgeRefresh = document.getElementById('indicateur-temps-reel-pulse');
    if (badgeRefresh) {
      badgeRefresh.style.opacity = '0.5';
      setTimeout(() => { badgeRefresh.style.opacity = '1'; }, 500);
    }
    await actualiserDonneesSilencieusement();
  }, 30000);
}

/**
 * Actualise silencieusement les données sans recharger la page
 */
async function actualiserDonneesSilencieusement() {
  if (!estSupabaseConfigure()) return;

  try {
    const [resLeads, resRdvs] = await Promise.all([
      supabase
        .from('leads')
        .select('*, commerciaux(prenom, nom, telephone, whatsapp)')
        .order('created_at', { ascending: false }),
      supabase
        .from('rendez_vous')
        .select('*')
        .order('date_rdv', { ascending: false })
    ]);

    if (resLeads && resLeads.data) {
      leadsGlobal = resLeads.data;
    }
    if (resRdvs && resRdvs.data) {
      rdvsGlobal = resRdvs.data;
    }

    calculerEtAfficherKpisCEO();
    initialiserVisuelsCEO();
  } catch (err) {
    console.debug('Refresh silencieux en cours :', err);
  }
}

/**
 * ==============================================================================
 * 2. GESTION DES PARRAINAGES (?ref=ID)
 * ==============================================================================
 */
export function initialiserModuleParrainages() {
  const btnActualiser = document.getElementById('btn-actualiser-parrainages');
  const btnExport = document.getElementById('btn-export-parrainages-csv');

  btnActualiser?.addEventListener('click', chargerParrainages);
  btnExport?.addEventListener('click', exporterParrainagesCSV);
}

/**
 * Charge la liste des parrainages depuis la table Supabase 'parrainages'
 */
export async function chargerParrainages() {
  const tbody = document.getElementById('tbody-parrainages');
  if (!tbody) return;

  if (!estSupabaseConfigure()) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-chargement" style="color: #B45309;">Supabase non configuré.</td></tr>`;
    return;
  }

  try {
    const { data, error } = await supabase
      .from('parrainages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    parrainagesGlobal = data || [];
    actualiserKpisParrainages(parrainagesGlobal);
    rendreTableauParrainages(parrainagesGlobal);

  } catch (err) {
    console.error('Erreur chargement parrainages :', err);
    tbody.innerHTML = `<tr><td colspan="6" class="table-chargement" style="color: #DC2626;">Erreur : ${err.message}</td></tr>`;
  }
}

/**
 * Actualise les 3 cartes KPIs de la section Parrainages
 */
function actualiserKpisParrainages(liste) {
  const total = liste.length;
  const convertis = liste.filter(p => p.converti === true).length;
  const taux = total > 0 ? Math.round((convertis / total) * 100) : 0;

  mettreAJourElement('stat-parrainages-total', total);
  mettreAJourElement('stat-parrainages-convertis', convertis);
  mettreAJourElement('stat-parrainages-taux', `${taux}%`);

  const badgeNav = document.getElementById('badge-compteur-parrainages');
  if (badgeNav) {
    badgeNav.textContent = total;
    badgeNav.style.display = total > 0 ? 'inline-block' : 'none';
  }
}

/**
 * Rendu du tableau des parrainages
 */
function rendreTableauParrainages(liste) {
  const tbody = document.getElementById('tbody-parrainages');
  if (!tbody) return;

  if (liste.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="table-vide">
          <div style="padding: 2rem; text-align: center;">
            <p style="color: #475569; font-size: 0.95rem; margin-bottom: 4px;">Aucun parrainage enregistré pour le moment.</p>
            <span style="font-size: 0.8rem; color: #94A3B8;">Les visites via liens trackés (?ref=ID) apparaîtront ici automatiquement.</span>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = liste.map(p => {
    const dateStr = p.created_at
      ? new Date(p.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
      : '—';

    // Trouver le parrain dans les commerciaux
    const parrain = commerciauxGlobal.find(c => String(c.id) === String(p.parrain_id));
    const nomParrain = parrain ? `${parrain.prenom} ${parrain.nom}` : `Conseiller #${p.parrain_id || '?'}`;

    // Trouver le filleul si applicable
    const filleul = commerciauxGlobal.find(c => String(c.id) === String(p.filleul_id));
    const nomFilleul = filleul ? `${filleul.prenom} ${filleul.nom}` : (p.filleul_nom || p.restaurant_nom || `Prospect affilié`);

    const estConverti = p.converti === true;

    return `
      <tr>
        <td style="white-space: nowrap; font-size: 0.82rem; color: #64748B;">📅 ${dateStr}</td>
        <td>
          <strong style="color: #0B1F3A;">${nomParrain}</strong>
          <span style="display: block; font-size: 0.75rem; color: #C9A227;">Parrain vérifié</span>
        </td>
        <td>
          <strong style="color: #0B1F3A;">${nomFilleul}</strong>
          <span style="display: block; font-size: 0.75rem; color: #64748B;">${p.source || 'Lien ?ref='}</span>
        </td>
        <td>
          <span class="badge-parrainage-converti ${estConverti ? 'oui' : 'non'}">
            ${estConverti ? '✓ Converti (Client)' : '○ En attente'}
          </span>
        </td>
        <td>
          <span style="font-weight: 700; color: ${estConverti ? '#15803D' : '#94A3B8'};">
            ${estConverti ? '10 000 FCFA' : '0 FCFA'}
          </span>
        </td>
        <td style="text-align: right;">
          ${!estConverti ? `
            <button type="button" class="btn-convertir-rapide btn-valider-conversion-parrainage" data-id="${p.id}" title="Valider la signature du client parrainé">
              🎯 Valider conversion
            </button>
          ` : `
            <span style="font-size: 0.78rem; color: #15803D; font-weight: 600;">✓ Validé</span>
          `}
        </td>
      </tr>
    `;
  }).join('');

  // Événements de conversion 1-clic
  tbody.querySelectorAll('.btn-valider-conversion-parrainage').forEach(btn => {
    btn.addEventListener('click', async () => {
      const parrainageId = btn.getAttribute('data-id');
      await validerConversionParrainage(parrainageId);
    });
  });
}

/**
 * Valide un parrainage comme converti (1-clic)
 */
export async function validerConversionParrainage(id) {
  try {
    const { error } = await supabase
      .from('parrainages')
      .update({ converti: true })
      .eq('id', id);

    if (error) throw error;

    afficherToastAdmin("✓ Parrainage converti ! Commission de 10 000 FCFA débloquée.");
    await chargerParrainages();
    // Rafraîchir aussi le MRR CEO
    calculerEtAfficherKpisCEO();

  } catch (err) {
    console.error('Erreur validation conversion :', err);
    afficherToastAdmin("❌ Erreur : " + err.message);
  }
}

/**
 * Export CSV de la table parrainages
 */
function exporterParrainagesCSV() {
  if (parrainagesGlobal.length === 0) {
    afficherToastAdmin("⚠️ Aucun parrainage à exporter.");
    return;
  }

  const entetes = ['ID', 'Date', 'ID Parrain', 'Nom Parrain', 'Filleul/Restaurant', 'Source', 'Converti', 'Commission FCFA'];
  const lignes = parrainagesGlobal.map(p => {
    const parrain = commerciauxGlobal.find(c => String(c.id) === String(p.parrain_id));
    const nomParrain = parrain ? `${parrain.prenom} ${parrain.nom}` : '';
    const dateStr = p.created_at ? new Date(p.created_at).toISOString() : '';
    const com = p.converti ? 10000 : 0;

    return [
      p.id,
      dateStr,
      p.parrain_id || '',
      `"${nomParrain.replace(/"/g, '""')}"`,
      `"${(p.filleul_nom || p.restaurant_nom || '').replace(/"/g, '""')}"`,
      `"${(p.source || '').replace(/"/g, '""')}"`,
      p.converti ? 'OUI' : 'NON',
      com
    ].join(';');
  });

  const contenuCSV = '\uFEFF' + [entetes.join(';'), ...lignes].join('\n');
  const blob = new Blob([contenuCSV], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `louametay_parrainages_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  afficherToastAdmin("✓ Export CSV des parrainages téléchargé !");
}

/**
 * ==============================================================================
 * UTILITAIRES
 * ==============================================================================
 */
function mettreAJourElement(id, texte) {
  const el = document.getElementById(id);
  if (el) el.textContent = texte;
}

function afficherToastAdmin(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = msg;
  toast.classList.add('visible');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('visible');
  }, 3500);
}
