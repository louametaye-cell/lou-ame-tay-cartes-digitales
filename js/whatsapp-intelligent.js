/**
 * ==============================================================================
 * FICHIER : js/whatsapp-intelligent.js
 * SPRINT 1 — B3 : MESSAGE WHATSAPP PRÉ-REMPLI INTELLIGENT CONTEXTUALISÉ
 * ==============================================================================
 * Construit un message personnalisé selon le contexte du visiteur :
 * - Prénom du commercial
 * - Nom et restaurant du prospect (si mémorisés dans localStorage)
 * - Formule d'offre consultée (Tàmbali, Nio Far, Xéweul, Ndajé...)
 * - Source de découverte (Scan QR, Recommandation/Parrainage, Lien direct)
 */

const STORAGE_KEYS = {
  NOM: 'lat_visiteur_nom',
  RESTAURANT: 'lat_visiteur_restaurant',
  FORMULE: 'lat_formule_consultee',
  SOURCE: 'lat_source'
};

/**
 * Enregistre le nom et l'établissement du visiteur dans le localStorage
 * @param {string} nom 
 * @param {string} restaurant 
 */
export function enregistrerVisiteur(nom, restaurant = '') {
  try {
    if (nom) localStorage.setItem(STORAGE_KEYS.NOM, nom.trim());
    if (restaurant) localStorage.setItem(STORAGE_KEYS.RESTAURANT, restaurant.trim());
  } catch (e) {
    console.warn('Impossible de sauvegarder dans localStorage:', e);
  }
}

/**
 * Enregistre la formule consultée par le visiteur
 * @param {string} formuleNom 
 */
export function enregistrerFormuleConsultee(formuleNom) {
  try {
    if (formuleNom) {
      localStorage.setItem(STORAGE_KEYS.FORMULE, formuleNom.trim());
    }
  } catch (e) {
    console.warn('Impossible de sauvegarder la formule:', e);
  }
}

/**
 * Enregistre la source de navigation
 * @param {string} source 
 */
export function enregistrerSource(source) {
  try {
    if (source) localStorage.setItem(STORAGE_KEYS.SOURCE, source.trim());
  } catch (e) {
    console.warn('Impossible de sauvegarder la source:', e);
  }
}

/**
 * Récupère le contexte actuel du visiteur
 * @returns {Object}
 */
export function recupererContexteVisiteur() {
  let nom = '';
  let restaurant = '';
  let formule = '';
  let source = '';

  try {
    nom = localStorage.getItem(STORAGE_KEYS.NOM) || '';
    restaurant = localStorage.getItem(STORAGE_KEYS.RESTAURANT) || '';
    formule = localStorage.getItem(STORAGE_KEYS.FORMULE) || '';
    source = localStorage.getItem(STORAGE_KEYS.SOURCE) || '';
  } catch (e) {}

  // Détection automatique de la source via l'URL si non définie
  if (!source && typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('ref')) {
      source = 'la recommandation d\'un confrère';
    } else if (params.get('source') === 'qr' || window.location.hash.includes('qr')) {
      source = 'un QR Code en salle';
    } else {
      source = 'votre carte de visite digitale';
    }
    enregistrerSource(source);
  }

  return { nom, restaurant, formule, source };
}

/**
 * Construit le message WhatsApp personnalisé
 * @param {Object} commercial 
 * @param {Object} contexteOptionnel 
 * @returns {string} URL WhatsApp encodée
 */
export function construireMessageWhatsApp(commercial, contexteOptionnel = {}) {
  const prenomCommercial = commercial?.prenom || 'Conseiller';
  const contexteLocal = recupererContexteVisiteur();
  const ctx = { ...contexteLocal, ...contexteOptionnel };

  let message = '';

  const aIdentite = Boolean(ctx.nom);
  const aFormule = Boolean(ctx.formule);
  // Nettoyage pour éviter le doublon "la formule Formule XXX"
  const formuleNettoyee = formaterNomFormule(ctx.formule);

  if (aIdentite && aFormule) {
    // Message le plus complet
    message = `Bonjour ${prenomCommercial}, je suis ${ctx.nom}${ctx.restaurant ? ` de ${ctx.restaurant}` : ''}.\n` +
      `J'ai découvert votre carte via ${ctx.source || 'votre carte digitale'} et je suis particulièrement intéressé par la formule ${formuleNettoyee}.\n\n` +
      `Pouvez-vous me recontacter pour une démonstration en salle ?`;
  } else if (aIdentite) {
    // Visiteur identifié sans formule spécifique
    message = `Bonjour ${prenomCommercial}, je suis ${ctx.nom}${ctx.restaurant ? ` de ${ctx.restaurant}` : ''}.\n` +
      `J'ai découvert votre carte via ${ctx.source || 'votre carte digitale'}.\n\n` +
      `Pouvez-vous me recontacter pour une démonstration des solutions Lou Ame Tay (Menu QR & Écran Cuisine KDS) ?`;
  } else if (aFormule) {
    // Visiteur anonyme mais ayant consulté une formule
    message = `Bonjour ${prenomCommercial},\n` +
      `J'ai découvert votre carte Lou Ame Tay et je suis vivement intéressé par votre formule ${formuleNettoyee}.\n\n` +
      `J'aimerais en savoir plus sur vos tarifs et planifier une démonstration pour mon établissement.`;
  } else {
    // Fallback standard
    message = `Bonjour ${prenomCommercial},\n` +
      `J'ai découvert votre carte Lou Ame Tay.\n\n` +
      `J'aimerais en savoir plus sur vos offres de menu digital QR code et écran cuisine KDS pour mon restaurant.`;
  }

  const telWhatsApp = (commercial?.whatsapp || '221762312003').replace(/\D/g, '');
  return `https://wa.me/${telWhatsApp}?text=${encodeURIComponent(message)}`;
}

/**
 * Déclenche l'ouverture de WhatsApp avec le message intelligent
 * @param {Object} commercial 
 * @param {Object} contexteOptionnel 
 */
export function ouvrirWhatsAppIntelligent(commercial, contexteOptionnel = {}) {
  const url = construireMessageWhatsApp(commercial, contexteOptionnel);
  window.open(url, '_blank');
}

/**
 * Nettoie le nom de la formule pour éviter le doublon "la formule Formule XXX"
 * @param {string} formule 
 * @returns {string}
 */
export function formaterNomFormule(formule) {
  if (!formule) return '';
  return formule.replace(/^formule\s+/i, '').trim();
}

