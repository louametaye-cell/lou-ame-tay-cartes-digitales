/**
 * ==============================================================================
 * FICHIER : js/analytics.js
 * TRACKING DES SCANS QR, GÉOLOCALISATION ET ÉVÉNEMENTS CONSEILLERS
 * ==============================================================================
 * - trackerScan(commercialId) : Géolocalise l'IP et stocke le scan dans 'scans'
 * - trackerEvenement(type, commercialId) : Enregistre les clics d'appel/WhatsApp/partage
 * - chargerStats(commercialId, jours) : Agrège les statistiques pour les graphiques
 */

import { supabase, estSupabaseConfigure } from './supabase-client.js';

/**
 * Enregistre un scan de carte avec géolocalisation IP
 * @param {string} commercialId - ID du commercial scanné
 */
export async function trackerScan(commercialId) {
  if (!commercialId || !estSupabaseConfigure()) return;

  try {
    // 1. Récupération de la géolocalisation IP (fallback rapide avec timeout)
    let pays = 'Sénégal';
    let ville = 'Dakar';
    let lat = 14.6937;
    let lon = -17.4441;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const geo = await res.json();
        pays = geo.country_name || pays;
        ville = geo.city || ville;
        lat = geo.latitude || lat;
        lon = geo.longitude || lon;
      }
    } catch (e) {
      // Échec silencieux de la géoloc IP, conservation des valeurs par défaut
    }

    // 2. Insertion dans la table public.scans
    await supabase.from('scans').insert([{
      commercial_id: commercialId,
      pays,
      ville,
      latitude: lat,
      longitude: lon,
      user_agent: navigator.userAgent,
      referrer: document.referrer || 'scan_direct'
    }]);

    // 3. Mise à jour de la table analytics_daily
    await incrementerAnalyticsDaily(commercialId, 'nb_scans');

  } catch (err) {
    // Aucune gêne visuelle pour le prospect
    console.debug('Analytics scan bypassé :', err);
  }
}

/**
 * Enregistre une interaction commerciale clé (appel, whatsapp, partage)
 * @param {'appel'|'whatsapp'|'partage'|'lead'} type
 * @param {string} commercialId
 */
export async function trackerEvenement(type, commercialId) {
  if (!commercialId || !estSupabaseConfigure()) return;

  const colonnes = {
    appel: 'nb_appels',
    whatsapp: 'nb_whatsapp',
    partage: 'nb_partages',
    lead: 'nb_leads'
  };

  const colonne = colonnes[type];
  if (!colonne) return;

  try {
    await incrementerAnalyticsDaily(commercialId, colonne);
  } catch (err) {
    console.debug('Analytics événement bypassé :', err);
  }
}

/**
 * Incrémente le compteur journalier dans analytics_daily
 */
async function incrementerAnalyticsDaily(commercialId, colonne) {
  const dateJour = new Date().toISOString().slice(0, 10);

  // Recherche de l'entrée du jour
  const { data: ligne } = await supabase
    .from('analytics_daily')
    .select('id, ' + colonne)
    .eq('commercial_id', commercialId)
    .eq('date', dateJour)
    .maybeSingle();

  if (ligne) {
    const maj = {};
    maj[colonne] = (ligne[colonne] || 0) + 1;
    await supabase
      .from('analytics_daily')
      .update(maj)
      .eq('id', ligne.id);
  } else {
    const nouv = {
      commercial_id: commercialId,
      date: dateJour
    };
    nouv[colonne] = 1;
    await supabase
      .from('analytics_daily')
      .insert([nouv]);
  }
}

/**
 * Charge les statistiques d'un commercial ou globales pour les graphiques
 * @param {string|null} commercialId - ID du commercial ou null pour tous
 * @param {number} jours - Nombre de jours d'historique (ex: 7 ou 30)
 */
export async function chargerStats(commercialId = null, jours = 7) {
  if (!estSupabaseConfigure()) {
    return genererStatsDemo(jours);
  }

  try {
    const dateDebut = new Date();
    dateDebut.setDate(dateDebut.getDate() - jours);
    const dateStr = dateDebut.toISOString().slice(0, 10);

    let query = supabase
      .from('analytics_daily')
      .select('*')
      .gte('date', dateStr)
      .order('date', { ascending: true });

    if (commercialId && commercialId !== 'tous') {
      query = query.eq('commercial_id', commercialId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data && data.length > 0 ? data : genererStatsDemo(jours);

  } catch (err) {
    console.warn('Erreur chargement stats Supabase, utilisation démo :', err);
    return genererStatsDemo(jours);
  }
}

/**
 * Données simulées pour graphiques en mode démo / localhost sans base
 */
function genererStatsDemo(jours) {
  const resultats = [];
  for (let i = jours - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    resultats.push({
      date: d.toISOString().slice(0, 10),
      nb_scans: Math.floor(Math.random() * 25) + 15,
      nb_leads: Math.floor(Math.random() * 4) + 1,
      nb_appels: Math.floor(Math.random() * 6) + 2,
      nb_whatsapp: Math.floor(Math.random() * 10) + 5,
      nb_partages: Math.floor(Math.random() * 5) + 1
    });
  }
  return resultats;
}
