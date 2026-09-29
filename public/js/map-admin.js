/**
 * ==========================================================================
 * FICHIER : js/map-admin.js
 * MODULE CARTO LEAFLET SÉNÉGAL — POINTS CHAUDS DU DASHBOARD CEO
 * Charte Lou Ame Tay : #0B1F3A (marine), #C9A227 (doré), blanc
 * ==========================================================================
 */

let mapInstance = null;
let markersLayerGroup = null;

// Coordonnées GPS des principales villes du Sénégal
const COORDONNEES_VILLES = {
  'dakar': [14.6928, -17.4467],
  'thiès': [14.7910, -16.9359],
  'thies': [14.7910, -16.9359],
  'saly': [14.4430, -17.0253],
  'mbour': [14.4220, -16.9638],
  'saint-louis': [16.0326, -16.5050],
  'touba': [14.8633, -15.8756],
  'ziguinchor': [12.5680, -16.2733]
};

/**
 * Initialise ou actualise la carte Leaflet avec la géolocalisation des leads
 * @param {string} containerId - ID du conteneur HTML (ex: 'map-senegal-leads')
 * @param {Array} leads - Liste des leads
 */
export function initialiserCarteSenegalLeads(containerId, leads = []) {
  if (typeof L === 'undefined') {
    console.warn('Leaflet (L) n\'est pas encore chargé.');
    return null;
  }

  const container = document.getElementById(containerId);
  if (!container) return null;

  // Si la carte existe déjà, on invalide la taille et on rafraîchit les marqueurs
  if (!mapInstance) {
    // Initialisation centrée sur le Sénégal ouest (Dakar - Thiès - Mbour)
    mapInstance = L.map(containerId, {
      center: [14.65, -16.85],
      zoom: 8,
      minZoom: 6,
      maxZoom: 13,
      scrollWheelZoom: false
    });

    // Tuiles OpenStreetMap officielles (100% gratuites, stables et sans filigrane API KEY)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(mapInstance);

    markersLayerGroup = L.layerGroup().addTo(mapInstance);
  } else {
    // Invalider la taille au cas où le conteneur était caché
    setTimeout(() => {
      mapInstance.invalidateSize();
    }, 100);
  }

  if (markersLayerGroup) {
    markersLayerGroup.clearLayers();
  }

  // Aggrégation des leads par ville
  const statsParVille = {
    'Dakar': { total: 0, restaurants: [] },
    'Thiès': { total: 0, restaurants: [] },
    'Saly / Mbour': { total: 0, restaurants: [] },
    'Saint-Louis': { total: 0, restaurants: [] }
  };

  leads.forEach(lead => {
    const villeBrute = (lead.ville || '').toLowerCase().trim();
    const resto = lead.restaurant_nom || lead.prospect_nom || 'Établissement';

    if (villeBrute.includes('dakar') || villeBrute.includes('almadies') || villeBrute.includes('plateau') || villeBrute.includes('ngor')) {
      statsParVille['Dakar'].total++;
      if (statsParVille['Dakar'].restaurants.length < 3) statsParVille['Dakar'].restaurants.push(resto);
    } else if (villeBrute.includes('thiès') || villeBrute.includes('thies')) {
      statsParVille['Thiès'].total++;
      if (statsParVille['Thiès'].restaurants.length < 3) statsParVille['Thiès'].restaurants.push(resto);
    } else if (villeBrute.includes('saly') || villeBrute.includes('mbour') || villeBrute.includes('somone')) {
      statsParVille['Saly / Mbour'].total++;
      if (statsParVille['Saly / Mbour'].restaurants.length < 3) statsParVille['Saly / Mbour'].restaurants.push(resto);
    } else if (villeBrute.includes('saint-louis') || villeBrute.includes('ndar')) {
      statsParVille['Saint-Louis'].total++;
      if (statsParVille['Saint-Louis'].restaurants.length < 3) statsParVille['Saint-Louis'].restaurants.push(resto);
    } else {
      // Attribution par défaut à Dakar si non spécifié ou si ville majeure
      statsParVille['Dakar'].total++;
      if (statsParVille['Dakar'].restaurants.length < 3) statsParVille['Dakar'].restaurants.push(resto);
    }
  });

  // Définition des coordonnées pour l'affichage
  const villesConfig = [
    { nom: 'Dakar', coords: [14.6928, -17.4467], stat: statsParVille['Dakar'] },
    { nom: 'Thiès', coords: [14.7910, -16.9359], stat: statsParVille['Thiès'] },
    { nom: 'Saly / Mbour', coords: [14.4430, -17.0253], stat: statsParVille['Saly / Mbour'] },
    { nom: 'Saint-Louis', coords: [16.0326, -16.5050], stat: statsParVille['Saint-Louis'] }
  ];

  villesConfig.forEach(item => {
    const total = item.stat.total;
    // Si aucun lead dans la base, on garde au moins un indicateur visuel de présence commerciale
    const countDisplay = total > 0 ? total : 0;

    const iconHtml = `
      <div class="custom-leaflet-marker" style="width: 32px; height: 32px;">
        ${countDisplay}
      </div>
    `;

    const customIcon = L.divIcon({
      className: 'custom-div-icon',
      html: iconHtml,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const marqueur = L.marker(item.coords, { icon: customIcon });

    const restosList = item.stat.restaurants.length > 0
      ? `<div style="font-size: 0.75rem; color: #64748B; margin-top: 4px;">Derniers contacts :<br>• ${item.stat.restaurants.join('<br>• ')}</div>`
      : `<div style="font-size: 0.75rem; color: #94A3B8; margin-top: 4px;">Zone active Lou Ame Tay</div>`;

    const popupHtml = `
      <div class="popup-titre-ville">📍 ${item.nom}</div>
      <div class="popup-stat-ligne">
        <strong>${total}</strong> demande${total > 1 ? 's' : ''} de devis enregistrée${total > 1 ? 's' : ''}
      </div>
      ${restosList}
    `;

    marqueur.bindPopup(popupHtml);
    markersLayerGroup.addLayer(marqueur);
  });

  return mapInstance;
}

/**
 * Force l'actualisation de la taille de la carte (après affichage de l'onglet)
 */
export function rafraichirTailleCarte() {
  if (mapInstance) {
    setTimeout(() => {
      mapInstance.invalidateSize();
    }, 150);
  }
}
