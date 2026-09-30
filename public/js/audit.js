/**
 * ==============================================================================
 * FICHIER : js/audit.js
 * MOTEUR D'AUDIT EN TEMPS RÉEL, CHECK-IN GPS ANTI-FRAUDE & ÉCOSYSTÈME GOOGLE
 * LOU AME TAY — SÉNÉGAL
 * ==============================================================================
 */

import { supabase, estSupabaseConfigure } from './supabase-client.js';

/**
 * Enregistre une action horodatée dans le journal d'activités immuable
 */
export async function enregistrerActivite({
  typeAction,
  description,
  details = {},
  commercialId = null,
  commercialNom = null,
  statut = 'SUCCES'
}) {
  try {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Inconnu';
    
    // Détection simplifiée de l'appareil
    const isMobile = /Android|iPhone|iPad|iPod/i.test(userAgent);
    const appareil = isMobile 
      ? (/iPhone|iPad|iPod/i.test(userAgent) ? 'iPhone / iOS' : 'Android')
      : 'Ordinateur / Desktop';

    const payload = {
      type_action: typeAction,
      description,
      details: {
        ...details,
        appareil,
        ecran: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A',
        timestamp_client: new Date().toISOString()
      },
      commercial_id: commercialId || null,
      commercial_nom: commercialNom || 'Système',
      statut,
      user_agent: userAgent
    };

    if (estSupabaseConfigure()) {
      const { error } = await supabase.from('journal_activites').insert([payload]);
      if (error) {
        console.warn('Erreur insertion journal_activites (table en cours de création ?) :', error.message);
      }
    }
  } catch (err) {
    console.warn('Erreur lors de l’audit d’activité :', err);
  }
}

/**
 * Calcule la distance orthodromique entre 2 points GPS (formule de Haversine)
 * @returns {number} Distance en mètres
 */
export function calculerDistanceGPS(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371e3; // Rayon de la Terre en mètres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Récupère la position GPS physique de l'utilisateur avec haute précision
 * @returns {Promise<{latitude: number, longitude: number, precision: number}>}
 */
export function obtenirPositionActuelle() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('La géolocalisation GPS n’est pas supportée par votre navigateur.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          precision: Math.round(position.coords.accuracy)
        });
      },
      (error) => {
        let msg = 'Impossible d’obtenir votre position GPS.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Autorisation GPS refusée. Veuillez activer la localisation sur votre smartphone.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Signal GPS indisponible. Assurez-vous d’être à ciel ouvert.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Délai d’attente GPS dépassé. Réessayez.';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );
  });
}

/**
 * Génère le lien d'itinéraire Google Maps
 */
export function genererLienItineraireGoogle(destinationNom, lat = null, lon = null) {
  if (lat && lon) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&query=${encodeURIComponent(destinationNom)}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinationNom + ', Sénégal')}`;
}

/**
 * Génère l'URL d'ajout à Google Calendar
 */
export function genererLienGoogleCalendar({
  titre,
  description = '',
  lieu = '',
  dateDebutISO,
  dureeMinutes = 45
}) {
  try {
    const debut = new Date(dateDebutISO);
    const fin = new Date(debut.getTime() + dureeMinutes * 60 * 1000);

    const formatGCal = (d) =>
      d.toISOString().replace(/-|:|\.\d\d\d/g, '');

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: titre,
      details: description,
      location: lieu,
      dates: `${formatGCal(debut)}/${formatGCal(fin)}`
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  } catch (err) {
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(titre)}`;
  }
}
