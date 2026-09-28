/**
 * ==============================================================================
 * FICHIER : js/lead-scoring.js
 * CALCUL DU SCORE INTELLIGENT DES PROSPECTS (LEAD SCORING 0 - 100)
 * ==============================================================================
 * Évalue la valeur et l'urgence commerciale d'une demande soumise sur une carte :
 * - Formule choisie (Sur Mesure +40, Xéweul +30, Nio Far +20, Tàmbali +10)
 * - Localisation géographique (Dakar +20, Thiès/Mbour +15, autres +5)
 * - Créneau horaire d'envoi (8h-18h +15, sinon +5)
 * - Précision du besoin / message (+15)
 * - Validité du numéro de téléphone sénégalais (+10)
 */

/**
 * Calcule le score d'un lead entre 0 et 100
 * @param {Object} donneesLead - { formule, ville, message, telephone }
 * @returns {number} Score de 0 à 100
 */
export function calculerScoreLead(donneesLead) {
  let score = 0;

  // 1. Barème par Formule SaaS
  const formule = (donneesLead.formule || '').toLowerCase();
  if (formule.includes('sur mesure') || formule.includes('complexe')) {
    score += 40;
  } else if (formule.includes('xéweul') || formule.includes('xeweul')) {
    score += 30;
  } else if (formule.includes('nio far')) {
    score += 20;
  } else if (formule.includes('tàmbali') || formule.includes('tambali')) {
    score += 10;
  } else {
    score += 15;
  }

  // 2. Barème par Zone Géographique
  const ville = (donneesLead.ville || '').toLowerCase();
  if (ville.includes('dakar') || ville.includes('almadies') || ville.includes('plateau') || ville.includes('point e')) {
    score += 20;
  } else if (ville.includes('thiès') || ville.includes('thies') || ville.includes('mbour') || ville.includes('saly')) {
    score += 15;
  } else {
    score += 5;
  }

  // 3. Heure de soumission (Heures d'activité commerciale 8h - 18h)
  const heureActuelle = new Date().getHours();
  if (heureActuelle >= 8 && heureActuelle <= 18) {
    score += 15;
  } else {
    score += 5;
  }

  // 4. Message détaillé / besoin explicite renseigné
  if (donneesLead.message && donneesLead.message.trim().length >= 10) {
    score += 15;
  } else if (donneesLead.restaurant_nom && donneesLead.restaurant_nom.trim().length > 2) {
    score += 5;
  }

  // 5. Numéro de téléphone sénégalais valide (+221, 77, 78, 76, 75, 70)
  const telNettoye = (donneesLead.telephone || '').replace(/\D/g, '');
  if (telNettoye.length >= 9 && (telNettoye.startsWith('221') || ['77', '78', '76', '75', '70', '33'].some(p => telNettoye.startsWith(p)))) {
    score += 10;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Retourne le badge de priorité associé au score
 * @param {number} score
 * @returns {{ libelle: string, classe: string, icone: string }}
 */
export function getPrioriteLead(score) {
  if (score >= 80) {
    return { libelle: 'Priorité Haute 🔥', classe: 'priorite-haute', icone: '🔥' };
  } else if (score >= 50) {
    return { libelle: 'Priorité Moyenne ⚡', classe: 'priorite-moyenne', icone: '⚡' };
  }
  return { libelle: 'Standard 📋', classe: 'priorite-basse', icone: '📋' };
}
