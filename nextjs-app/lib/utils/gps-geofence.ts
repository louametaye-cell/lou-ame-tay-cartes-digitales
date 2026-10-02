/**
 * ==============================================================================
 * FICHIER : nextjs-app/lib/utils/gps-geofence.ts
 * GEOFENCING TOLÉRANT & GPS LOW-POWER SÉNÉGAL (NEXT.JS / TYPESCRIPT)
 * ==============================================================================
 */

export type StatutGeofence = 'VALIDE_EXACT' | 'VALIDE_TOLERANCE' | 'DEROGATION_REQUISE';

export interface MotifDerogation {
  code: string;
  label: string;
  description: string;
}

export const MOTIFS_DEROGATION_SENEGAL: MotifDerogation[] = [
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

export interface GeofenceEvaluation {
  statut: StatutGeofence;
  valide: boolean;
  derogationRequise: boolean;
  distanceMetres: number;
  badgeColor: string;
  badgeText: string;
  message: string;
}

const EARTH_RADIUS_METERS = 6371000;

export function calculerDistanceHaversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_METERS * c);
}

export function evaluerGeofencing(
  agentLat: number,
  agentLng: number,
  targetLat: number,
  targetLng: number,
  toleranceMax = 100
): GeofenceEvaluation {
  const distance = calculerDistanceHaversine(agentLat, agentLng, targetLat, targetLng);

  if (distance <= 50) {
    return {
      statut: 'VALIDE_EXACT',
      valide: true,
      derogationRequise: false,
      distanceMetres: distance,
      badgeColor: '#10b981',
      badgeText: '📍 Présent sur site (≤ 50m)',
      message: `Pointage immédiat validé : vous êtes à ${distance}m de l'établissement.`
    };
  }

  if (distance <= toleranceMax) {
    return {
      statut: 'VALIDE_TOLERANCE',
      valide: true,
      derogationRequise: false,
      distanceMetres: distance,
      badgeColor: '#f59e0b',
      badgeText: `📍 Sur site (tolérance ${distance}m)`,
      message: `Pointage accepté dans le périmètre élargi (${distance}m du point repère).`
    };
  }

  return {
    statut: 'DEROGATION_REQUISE',
    valide: false,
    derogationRequise: true,
    distanceMetres: distance,
    badgeColor: '#ef4444',
    badgeText: `⚠️ Éloigné (${distance}m)`,
    message: `Vous êtes à ${distance}m de l'établissement. Une justification terrain avec motif est requise.`
  };
}

export interface PositionGPS {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: string;
}

export function obtenirPositionLowPower(timeoutMs = 8000): Promise<PositionGPS> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('La géolocalisation n’est pas disponible.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          timestamp: new Date().toISOString()
        });
      },
      () => {
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
            reject(new Error(`Erreur GPS (${errEco.message}). Localisation requise.`));
          },
          { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 15000 }
    );
  });
}
