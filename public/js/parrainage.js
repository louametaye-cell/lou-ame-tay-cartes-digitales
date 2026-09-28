/**
 * ==============================================================================
 * FICHIER : js/parrainage.js
 * SPRINT E1 & E2 : PARRAINAGE TRAÇABLE & PARTAGE WHATSAPP VIRAL
 * ==============================================================================
 */

import { supabase } from './supabase-client.js';

// Récupérer le paramètre ?ref=ID dans l'URL
export function recupererParrain() {
  const params = new URLSearchParams(window.location.search);
  return params.get('ref'); // ID du commercial parrain
}

// Tracker le parrainage au chargement
export async function trackerParrainage(commercialId) {
  const parrainId = recupererParrain();
  if (!parrainId || parrainId === commercialId) return;

  try {
    await supabase.from('parrainages').insert({
      parrain_id: parrainId,
      filleul_id: commercialId,
      source: 'lien_partage'
    });
  } catch (err) {
    console.warn('Erreur tracking parrainage:', err);
  }
}

// Générer un lien de parrainage
export function genererLienParrainage(commercialId) {
  const base = window.location.origin;
  return `${base}/carte.html?id=${commercialId}&ref=${commercialId}`;
}

// Bouton partager
export function partagerCarte(commercial) {
  const lien = genererLienParrainage(commercial.id);
  const msg = encodeURIComponent(
    `👋 Je te recommande ${commercial.prenom} ${commercial.nom} de Lou Ame Tay.\n` +
    `Découvre sa carte : ${lien}`
  );
  window.open(`https://wa.me/?text=${msg}`, '_blank');
}
