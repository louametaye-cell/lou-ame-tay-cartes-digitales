/**
 * ==============================================================================
 * FICHIER : js/parrainage.js
 * SPRINT 1 — E1 : PARRAINAGE TRAÇABLE AVEC DÉDOUBLONNAGE 24H & BADGE DYNAMIQUE
 * ==============================================================================
 * Gère la traçabilité des parrainages via le paramètre URL ?ref=ID.
 * - Insertion dans la table Supabase `parrainages`
 * - Protection anti-doublon 24 heures (localStorage + validation)
 * - Récupération du prénom du confrère parrain
 * - Affichage du badge officiel "✨ Parrainé par [Prénom]"
 * - Génération de liens de recommandation uniques
 */

import { supabase, estSupabaseConfigure } from './supabase-client.js';
import { commerciaux as commerciauxLocaux } from './data.js';

const DELAI_DEDOUBLONNAGE_MS = 24 * 60 * 60 * 1000; // 24 heures

/**
 * Récupère l'ID du commercial parrain dans l'URL (?ref=ID)
 * @returns {string|null}
 */
export function recupererParrain() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('ref');
}

/**
 * Enregistre le parrainage dans Supabase avec vérification anti-doublon 24h
 * @param {string} commercialId - ID du commercial visité (filleul)
 */
export async function trackerParrainage(commercialId) {
  const parrainId = recupererParrain();
  if (!parrainId || String(parrainId) === String(commercialId)) return;

  // 1. Vérification anti-doublon 24h dans localStorage
  const cleStockage = `lat_parrainage_${commercialId}_${parrainId}`;
  try {
    const dernierScan = localStorage.getItem(cleStockage);
    if (dernierScan) {
      const diff = Date.now() - parseInt(dernierScan, 10);
      if (diff < DELAI_DEDOUBLONNAGE_MS) {
        return; // Déjà comptabilisé aujourd'hui
      }
    }
  } catch (e) {}

  // 2. Insertion dans Supabase
  if (estSupabaseConfigure()) {
    try {
      const { error } = await supabase.from('parrainages').insert({
        parrain_id: parrainId,
        filleul_id: commercialId,
        source: 'lien_partage'
      });

      if (!error) {
        localStorage.setItem(cleStockage, Date.now().toString());
      }
    } catch (err) {
      console.warn('Erreur insertion parrainage Supabase:', err);
    }
  } else {
    try {
      localStorage.setItem(cleStockage, Date.now().toString());
    } catch (e) {}
  }
}

/**
 * Affiche le badge "✨ Parrainé par [Prénom]" sous l'identité du commercial
 * @param {string} commercialId 
 */
export async function afficherBadgeParrainage(commercialId) {
  const parrainId = recupererParrain();
  const conteneurBadge = document.getElementById('badge-parrainage');
  if (!conteneurBadge) return;

  if (!parrainId || String(parrainId) === String(commercialId)) {
    conteneurBadge.style.display = 'none';
    return;
  }

  let prenomParrain = 'un confrère';

  // 1. Chercher dans les données locales
  const parrainLocal = commerciauxLocaux?.find(c => String(c.id) === String(parrainId));
  if (parrainLocal && parrainLocal.prenom) {
    prenomParrain = parrainLocal.prenom;
  } else if (estSupabaseConfigure()) {
    // 2. Requête Supabase si non trouvé en local
    try {
      const { data, error } = await supabase
        .from('commerciaux')
        .select('prenom, nom')
        .eq('id', parrainId)
        .single();

      if (!error && data && data.prenom) {
        prenomParrain = data.prenom;
      }
    } catch (e) {
      console.warn('Impossible de récupérer le nom du parrain:', e);
    }
  }

  // Rendu du badge
  conteneurBadge.className = 'badge-parrainage';
  conteneurBadge.innerHTML = `✨ Parrainé par ${escapeHtml(prenomParrain)}`;
  conteneurBadge.style.display = 'inline-flex';
}

/**
 * Génère le lien unique de parrainage pour un conseiller
 * @param {string} commercialId 
 * @returns {string} URL complète avec ?id=X&ref=X
 */
export function genererLienParrainage(commercialId) {
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://www.louametay.online';
  return `${base}/carte.html?id=${commercialId}&ref=${commercialId}`;
}

function escapeHtml(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

/**
 * Fonction de partage rétro-compatible
 * @param {Object} commercial
 */
export function partagerCarte(commercial) {
  const lien = genererLienParrainage(commercial?.id || '');
  if (navigator.share) {
    navigator.share({
      title: `Lou Ame Tay — ${commercial?.prenom || ''} ${commercial?.nom || ''}`,
      text: `Recommandation pour votre restaurant : ${commercial?.prenom || ''} de Lou Ame Tay.`,
      url: lien
    }).catch(() => {});
  } else {
    const modal = document.getElementById('modal-partager-collegue');
    if (modal) modal.classList.remove('hidden');
  }
}
