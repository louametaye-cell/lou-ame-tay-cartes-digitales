/**
 * ==========================================================================
 * FICHIER : js/map-admin.js
 * MODULE CARTO LEAFLET SÉNÉGAL — POINTS CHAUDS DU DASHBOARD CEO
 * Couverture nationale : Dakar, Thiès, Saly/Mbour, Saint-Louis, Louga,
 * Touba/Mbacké, Kaolack, Îles du Saloum, Casamance (Ziguinchor & Cap Skirring)
 * Charte Lou Ame Tay : #0B1F3A (marine), #C9A227 (doré), blanc
 * ==========================================================================
 */

let mapInstance = null;
let markersLayerGroup = null;

/**
 * 9 Pôles & Régions stratégiques du Sénégal
 */
export const REGIONS_SENEGAL = [
  {
    id: 'dakar',
    nom: 'Dakar & Presqu\'île',
    coords: [14.6928, -17.4467],
    description: 'Capitale — Plateau, Almadies, Ngor, Point E, Mermoz, Yoff, Banlieue'
  },
  {
    id: 'thies',
    nom: 'Thiès & Environs',
    coords: [14.7910, -16.9359],
    description: 'Carrefour ferroviaire, Tivaouane, Khombole, Pout'
  },
  {
    id: 'saly',
    nom: 'Petite Côte (Saly / Mbour)',
    coords: [14.4430, -17.0253],
    description: 'Pôle balnéaire & hôtelier, Somone, Ngaparou, Popenguine, Joal'
  },
  {
    id: 'saint-louis',
    nom: 'Saint-Louis (Ndar)',
    coords: [16.0326, -16.5050],
    description: 'Capitale du Nord, patrimoine UNESCO, hôtellerie et fleuve'
  },
  {
    id: 'louga',
    nom: 'Louga & Ndiambour',
    coords: [15.6187, -16.2244],
    description: 'Pôle agro-pastoral, Kébémer, Linguère, carrefour du Nord'
  },
  {
    id: 'touba',
    nom: 'Touba & Mbacké (Baol)',
    coords: [14.8633, -15.8756],
    description: 'Deuxième métropole économique du pays, commerce & CHR Baol'
  },
  {
    id: 'kaolack',
    nom: 'Kaolack & Bassin Saloum',
    coords: [14.1500, -16.0833],
    description: 'Cœur commercial, carrefour sous-régional, Kahone, Ndoffane'
  },
  {
    id: 'saloum',
    nom: 'Îles & Delta du Saloum',
    coords: [14.0772, -16.4678],
    description: 'Écotourisme insulaire, Foundiougne, Mar Lodj, Toubacouta, Ndangane, Sokone'
  },
  {
    id: 'casamance',
    nom: 'Casamance (Ziguinchor & Cap Skirring)',
    coords: [12.5680, -16.2733],
    description: 'Joyau touristique du Sud, Cap Skirring, Oussouye, Ziguinchor, Kafountine'
  }
];

/**
 * Détecte intelligemment la région sénégalaise à partir d'une chaîne (ville, adresse, quartier)
 * @param {string} texte - Ex: "Ziguinchor Escale", "Touba Mosquée", "Mar Lodj", etc.
 * @returns {string|null} - Identifiant de la région ('dakar', 'casamance', 'louga', etc.)
 */
export function detecterRegionSenegal(texte) {
  if (!texte || typeof texte !== 'string') return null;
  const s = texte.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  // 1. Casamance / Cap Skirring / Ziguinchor
  if (/casamance|ziguinchor|cap\s*skirring|skiring|oussouye|bignona|kafountine|kolda|sedhiou/.test(s)) {
    return 'casamance';
  }

  // 2. Îles du Saloum / Delta
  if (/iles?\s*(du\s*)?saloum|mar\s*lodj|marlodj|foundiougne|toubacouta|ndangane|sokone|fatick|djiffer|palmarin/.test(s)) {
    return 'saloum';
  }

  // 3. Kaolack
  if (/kaolack|ndoffane|kahone|guinguineo|koutal|sing-sing/.test(s)) {
    return 'kaolack';
  }

  // 4. Touba / Mbacké
  if (/touba|mbacke|baol|darou\s*mousty|diourbel/.test(s)) {
    return 'touba';
  }

  // 5. Louga
  if (/louga|kebemer|linguere|potou|ndiambour|dahra/.test(s)) {
    return 'louga';
  }

  // 6. Saint-Louis
  if (/saint[\s-]louis|st[\s-]louis|ndar|ross\s*bethio|sor|hydrobase|gandon/.test(s)) {
    return 'saint-louis';
  }

  // 7. Petite Côte / Saly / Mbour
  if (/saly|mbour|somone|ngaparou|popenguine|joal|fadiouth|pointe\s*sarene|nguerigne|warang|niane/.test(s)) {
    return 'saly';
  }

  // 8. Thiès
  if (/thies|tivaouane|khombole|notto|kayar|pout/.test(s)) {
    return 'thies';
  }

  // 9. Dakar
  if (/dakar|plateau|almadies|ngor|point\s*e|mermoz|yoff|ouakam|fann|medina|parcelles|rufisque|pikine|guediawaye|keur\s*massar|diamniadio|maristes|scat\s*urbam|liberte|sicap/.test(s)) {
    return 'dakar';
  }

  return null;
}

/**
 * Initialise ou actualise la carte Leaflet avec la géolocalisation des leads et RDV
 * @param {string} containerId - ID du conteneur HTML (ex: 'map-senegal-leads')
 * @param {Array} leads - Liste des leads
 * @param {Array} rdvs - Liste optionnelle des rendez-vous terrain
 */
export function initialiserCarteSenegalLeads(containerId, leads = [], rdvs = []) {
  if (typeof L === 'undefined') {
    console.warn('Leaflet (L) n\'est pas encore chargé.');
    return null;
  }

  const container = document.getElementById(containerId);
  if (!container) return null;

  // Si la carte n'est pas encore créée
  if (!mapInstance) {
    // Cadrage optimisé pour couvrir tout le Sénégal (du Nord Saint-Louis au Sud Casamance)
    mapInstance = L.map(containerId, {
      center: [14.30, -16.20],
      zoom: 7,
      minZoom: 6,
      maxZoom: 14,
      scrollWheelZoom: false
    });

    // Tuiles OpenStreetMap officielles rapides et gratuites
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> — Lou Ame Tay CRM',
      maxZoom: 19
    }).addTo(mapInstance);

    markersLayerGroup = L.layerGroup().addTo(mapInstance);
  } else {
    // Invalider la taille si le conteneur a changé de dimensions
    setTimeout(() => {
      mapInstance.invalidateSize();
    }, 100);
  }

  if (markersLayerGroup) {
    markersLayerGroup.clearLayers();
  }

  // Préparation du dictionnaire de statistiques par région
  const statsParRegion = {};
  REGIONS_SENEGAL.forEach(reg => {
    statsParRegion[reg.id] = {
      totalLeads: 0,
      totalRdvs: 0,
      restaurants: []
    };
  });

  // 1. Agrégation des leads
  leads.forEach(lead => {
    const villeBrute = lead.ville || '';
    const resto = lead.restaurant_nom || lead.prospect_nom || 'Établissement';
    let regionId = detecterRegionSenegal(villeBrute);

    // Si la ville n'a pas matché, tenter sur le nom du resto ou le message
    if (!regionId && lead.message) {
      regionId = detecterRegionSenegal(lead.message);
    }

    // Par défaut Dakar si non spécifié
    if (!regionId) {
      regionId = 'dakar';
    }

    if (statsParRegion[regionId]) {
      statsParRegion[regionId].totalLeads++;
      if (statsParRegion[regionId].restaurants.length < 3 && resto && !statsParRegion[regionId].restaurants.includes(resto)) {
        statsParRegion[regionId].restaurants.push(resto);
      }
    }
  });

  // 2. Agrégation des rendez-vous terrain
  if (Array.isArray(rdvs)) {
    rdvs.forEach(rdv => {
      const adresse = rdv.adresse_restaurant || '';
      const resto = rdv.restaurant_prospect || 'Établissement RDV';
      let regionId = detecterRegionSenegal(adresse);

      if (!regionId && rdv.notes) {
        regionId = detecterRegionSenegal(rdv.notes);
      }

      if (regionId && statsParRegion[regionId]) {
        statsParRegion[regionId].totalRdvs++;
        if (statsParRegion[regionId].restaurants.length < 3 && resto && !statsParRegion[regionId].restaurants.includes(resto)) {
          statsParRegion[regionId].restaurants.push(resto);
        }
      }
    });
  }

  // 3. Tracé des marqueurs pour les 9 régions du Sénégal
  REGIONS_SENEGAL.forEach(region => {
    const stat = statsParRegion[region.id] || { totalLeads: 0, totalRdvs: 0, restaurants: [] };
    const totalActivite = stat.totalLeads + stat.totalRdvs;
    const aDesLeads = totalActivite > 0;

    const iconHtml = `
      <div class="custom-leaflet-marker ${aDesLeads ? 'has-leads' : 'zone-vide'}" style="width: 32px; height: 32px;" title="${region.nom}">
        ${totalActivite}
      </div>
    `;

    const customIcon = L.divIcon({
      className: 'custom-div-icon',
      html: iconHtml,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const marqueur = L.marker(region.coords, { icon: customIcon });

    const restosList = stat.restaurants.length > 0
      ? `<div style="font-size: 0.74rem; color: #475569; margin-top: 6px; line-height: 1.4;">
           <span style="font-weight: 600; color: #0B1F3A;">Derniers contacts / RDV :</span><br>• ${stat.restaurants.join('<br>• ')}
         </div>`
      : `<div style="font-size: 0.72rem; color: #94A3B8; margin-top: 6px; font-style: italic;">
           Zone ouverte aux commerciaux Lou Ame Tay
         </div>`;

    const popupHtml = `
      <div class="popup-titre-ville">📍 ${region.nom}</div>
      <div style="font-size: 0.7rem; color: #64748B; margin-bottom: 6px;">${region.description}</div>
      <div class="popup-stat-ligne" style="margin-bottom: 3px;">
        <strong>${stat.totalLeads}</strong> demande${stat.totalLeads > 1 ? 's' : ''} de devis enregistrée${stat.totalLeads > 1 ? 's' : ''}
      </div>
      ${stat.totalRdvs > 0 ? `
        <div class="popup-stat-ligne" style="margin-bottom: 3px; color: #0284C7; font-weight: 600;">
          🚗 <strong>${stat.totalRdvs}</strong> rendez-vous terrain pointé${stat.totalRdvs > 1 ? 's' : ''} GPS
        </div>
      ` : ''}
      ${restosList}
      <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #E2E8F0; font-size: 0.7rem; color: ${aDesLeads ? '#16A34A' : '#94A3B8'}; font-weight: 700; display: flex; align-items: center; gap: 5px;">
        <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: ${aDesLeads ? '#16A34A' : '#CBD5E1'};"></span>
        ${aDesLeads ? 'Point chaud actif Lou Ame Tay' : 'Zone en prospection'}
      </div>
    `;

    marqueur.bindPopup(popupHtml);
    markersLayerGroup.addLayer(marqueur);
  });

  return mapInstance;
}

/**
 * Force l'actualisation de la taille de la carte (après affichage de l'onglet ou redimensionnement)
 */
export function rafraichirTailleCarte() {
  if (mapInstance) {
    setTimeout(() => {
      mapInstance.invalidateSize();
    }, 150);
  }
}
