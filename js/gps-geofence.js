/**
 * ==============================================================================
 * FICHIER : js/gps-geofence.js
 * MOTEUR GEOFENCING TOLÉRANT & GPS LOW-POWER SÉNÉGAL
 * ==============================================================================
 * Conçu pour les réalités géographiques de Dakar, Thiès, Saly et régions :
 * - Absence de numérotation standard et rues enclavées (urban canyon).
 * - Tolérance de 100m pour compenser la dérive satellite sous toitures zinc et dalles.
 * - Échantillonnage GPS à la demande (Low-Power) pour préserver la batterie de 8h à 18h.
 * - Système de dérogation justifiée avec motif terrain et photo de contrôle.
 */

/**
 * Motifs de dérogation officiels adaptés au terrain sénégalais
 */
export const MOTIFS_DEROGATION_TERRAIN = [
  {
    code: 'TERRASSE_ANNEXE',
    label: '☕ Gérant rencontré à proximité immédiate (terrasse / café voisin / bureau annexe)',
    description: 'Le gérant a donné rendez-vous en terrasse extérieure ou dans un local attenant.'
  },
  {
    code: 'ACCES_IMPOSSIBLE',
    label: '🛵 Stationnement éloigné (moto/voiture sur axe principal, ruelle ensablée/étroite)',
    description: 'Accès véhicule impossible jusqu’au seuil de l’établissement.'
  },
  {
    code: 'TRAVAUX_VOIRIE',
    label: '🚧 Travaux de voirie / Déviation / Chantiers urbains (BRT, pavage, hivernage)',
    description: 'Passage piéton ou routier temporairement barré par des travaux.'
  },
  {
    code: 'SIGNAL_INTERIEUR',
    label: '📡 Signal GPS faible (sous-sol, toiture zinc ou cuisine fermée)',
    description: 'Atténuation du signal satellite à l’intérieur du restaurant.'
  }
];

/**
 * Rayon moyen de la Terre en mètres
 */
const EARTH_RADIUS_METERS = 6371000;

/**
 * Calcule la distance orthodromique (Haversine) entre deux coordonnées GPS en mètres
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distance en mètres
 */
export function calculerDistanceHaversine(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;

  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_METERS * c);
}

/**
 * Évalue le statut de pointage géolocalisé selon les paliers de tolérance sénégalais
 * @param {number} agentLat 
 * @param {number} agentLng 
 * @param {number} targetLat 
 * @param {number} targetLng 
 * @param {number} precisionAppareil Précision renvoyée par le GPS en mètres
 * @param {number} toleranceMax Rayon de tolérance max (par défaut 100m)
 * @returns {Object} Résultat détaillé avec code statut et message clair
 */
export function evaluerGeofencing(agentLat, agentLng, targetLat, targetLng, precisionAppareil = 0, toleranceMax = 100) {
  const distance = calculerDistanceHaversine(agentLat, agentLng, targetLat, targetLng);

  // Palier 1 : Directement sur site (≤ 50 mètres)
  if (distance <= 50) {
    return {
      statut: 'VALIDE_EXACT',
      valide: true,
      derogationRequise: false,
      distanceMettres: distance,
      badgeColor: '#10b981', // Vert émeraude
      badgeText: '📍 Présent sur site (≤ 50m)',
      message: `Pointage immédiat validé : vous êtes à ${distance}m de l'établissement.`
    };
  }

  // Palier 2 : Tolérance urbaine sénégalaise (51m à 100m)
  if (distance <= toleranceMax) {
    return {
      statut: 'VALIDE_TOLERANCE',
      valide: true,
      derogationRequise: false,
      distanceMettres: distance,
      badgeColor: '#f59e0b', // Ambre / Orange
      badgeText: `📍 Sur site (tolérance ${distance}m)`,
      message: `Pointage accepté dans le périmètre élargi (${distance}m du point repère).`
    };
  }

  // Palier 3 : Hors zone (> 100 mètres) -> Nécessite justification terrain
  return {
    statut: 'DEROGATION_REQUISE',
    valide: false,
    derogationRequise: true,
    distanceMettres: distance,
    badgeColor: '#ef4444', // Rouge vif
    badgeText: `⚠️ Éloigné (${distance}m)`,
    message: `Vous êtes à ${distance}m de l'établissement. Une justification terrain avec motif est requise pour valider ce pointage.`
  };
}

/**
 * Récupère la position GPS en mode "Low-Power On-Demand" (Évite de vider la batterie)
 * @param {Object} options 
 * @returns {Promise<{lat: number, lng: number, accuracy: number, timestamp: string}>}
 */
export function obtenirPositionLowPower(options = {}) {
  const timeoutMs = options.timeoutMs || 8000;

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('La géolocalisation n’est pas supportée par cet appareil.'));
      return;
    }

    // Essai 1 : Haute précision avec timeout court pour ne pas bloquer
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          timestamp: new Date().toISOString()
        });
      },
      (err) => {
        console.warn('GPS haute précision indisponible, tentative en mode éco standard...', err.message);
        
        // Essai 2 : Basse consommation / réseau cellulaire
        navigator.geolocation.getCurrentPosition(
          (posEco) => {
            resolve({
              lat: posEco.coords.latitude,
              lng: posEco.coords.longitude,
              accuracy: Math.round(posEco.coords.accuracy),
              timestamp: new Date().toISOString()
            });
          },
          (errEco) => {
            reject(new Error(`Impossible d'obtenir la position GPS (${errEco.message}). Vérifiez que la localisation est activée.`));
          },
          { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 15000 }
    );
  });
}
