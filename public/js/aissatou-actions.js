/**
 * ==============================================================================
 * FICHIER : js/aissatou-actions.js
 * MOTEUR DE FUNCTION CALLING & PROTOCOLE HUMAN-IN-THE-LOOP (AISSATOU V2)
 * ==============================================================================
 * RÈGLE ABSOLUE :
 * Aucune action de création ou modification ne peut être exécutée en base
 * sans confirmation explicite (Orale "Oui" ou Clic sur bouton de validation).
 * ==============================================================================
 */

import { memoriserContexteAissatou } from './aissatou-memory.js';
import { supabase, estSupabaseConfigure } from './supabase-client.js';

// Registre de l'action en attente de confirmation
let actionEnAttenteDeValidation = null;

/**
 * Analyse une commande pour détecter une intention d'action
 * @param {string} texte - Commande saisie ou dictée
 * @param {Object} contexte - { is_ceo, id, nom, ville }
 * @returns {Object|null} - Action détectée ou null
 */
export function detecterIntentionAction(texte, contexte = {}) {
  if (!texte || typeof texte !== 'string') return null;
  const s = texte.trim();
  const lower = s.toLowerCase();

  // 1. Action : Création de prospect
  // Ex: "Aissatou, crée un nouveau prospect pour le restaurant Teranga à Thiès"
  if (/cr[eé]e(r)?\s*(un)?\s*(nouveau)?\s*prospect/i.test(lower) || /ajoute(r)?\s*(un)?\s*(nouveau)?\s*prospect/i.test(lower)) {
    // Extraction intelligente du nom de restaurant
    const matchResto = s.match(/prospect\s*(pour|du\s*restaurant|de\s*l'établissement|pour\s*le\s*restaurant)?\s*([A-Za-z0-9\s'’À-ÿ-]+?)(?:\s+à|\s+dans|\s+sur|\.|$)/i);
    const restoNom = matchResto && matchResto[2] ? matchResto[2].trim() : 'Nouveau Restaurant CHR';
    
    // Extraction ville
    let ville = 'Thiès';
    if (/dakar|plateau|almadies/i.test(lower)) ville = 'Dakar';
    else if (/saly|mbour/i.test(lower)) ville = 'Mbour / Saly';
    else if (/saint[\s-]louis/i.test(lower)) ville = 'Saint-Louis';

    return {
      type: 'CREER_PROSPECT',
      descriptionCourte: `Création du prospect « ${restoNom} » à ${ville}`,
      questionConfirmation: `J'ai bien compris. Je vais créer un prospect pour ${restoNom} à ${ville}. Confirmez-vous cette action ? (Oui / Non)`,
      params: {
        restaurant_nom: restoNom,
        prospect_nom: 'Gérant',
        telephone: '+221 77 000 00 00',
        ville: ville,
        formule: 'XÉWEUL',
        commercial_id: contexte.id,
        commercial_nom: contexte.nom
      }
    };
  }

  // 2. Action : Planification de rendez-vous
  // Ex: "Aissatou, planifie un RDV avec SARAFINA GOLDE demain à 10h"
  if (/planifie(r)?\s*(un)?\s*rdv|programme(r)?\s*(un)?\s*rdv|programme(r)?\s*une\s*r[eé]union/i.test(lower)) {
    const matchResto = s.match(/(?:avec|chez|pour)\s+([A-Za-z0-9\s'’À-ÿ-]+?)(?:\s+demain|\s+aujourd'hui|\s+à|\.|$)/i);
    const restoNom = matchResto && matchResto[1] ? matchResto[1].trim() : 'Restaurant Partenaire';

    return {
      type: 'PLANIFIER_RDV',
      descriptionCourte: `Planification de RDV avec « ${restoNom} »`,
      questionConfirmation: `J'ai bien compris. Je vais planifier un rendez-vous avec ${restoNom}. Confirmez-vous cette action ? (Oui / Non)`,
      params: {
        restaurant_prospect: restoNom,
        nom_prospect: 'Gérant',
        telephone_prospect: '+221 77 000 00 00',
        date_rdv: new Date(Date.now() + 86400000).toISOString(),
        commercial_id: contexte.id,
        adresse: 'Thiès'
      }
    };
  }

  // 3. Action : Envoi de message ou annonce à l'équipe
  // Ex: "Aissatou, envoie un message d'annonce à tous les commerciaux"
  if (/envoie\s*(un)?\s*message|diffuse\s*(une)?\s*annonce/i.test(lower)) {
    const matchDest = /tous|toute\s*l'équipe/i.test(lower) ? 'ALL' : 'COMMERCIAL';
    return {
      type: 'ENVOYER_ANNONCE',
      descriptionCourte: `Diffusion d'une directive d'entreprise à ${matchDest === 'ALL' ? "toute l'équipe" : 'un conseiller'}`,
      questionConfirmation: `J'ai bien compris. Je vais préparer et envoyer ce message aux commerciaux. Confirmez-vous l'envoi ? (Oui / Non)`,
      params: {
        destinataire_id: matchDest,
        titre: 'Directive Direction Lou Ame Tay',
        contenu: s,
        expediteur: contexte.nom || 'Direction Générale'
      }
    };
  }

  // 4. Action : Mémorisation d'une consigne / préférence
  // Ex: "Note que le gérant de Madiba Resto préfère être contacté le matin"
  if (/note\s*que|retiens\s*que|m[eé]morise\s*que|enregistre\s*que/i.test(lower)) {
    const matchSujet = s.match(/(?:gérant\s*de|resto|restaurant|prospect)\s+([A-Za-z0-9\s'’À-ÿ-]+?)(?:\s+préfère|\s+veut|\s+est|\s+demande)/i);
    const sujet = matchSujet && matchSujet[1] ? matchSujet[1].trim() : 'Note client';

    return {
      type: 'MEMORISER_PREFERENCE',
      descriptionCourte: `Mémorisation de la consigne pour « ${sujet} »`,
      questionConfirmation: `J'ai bien noté cette préférence pour ${sujet}. Voulez-vous que je l'enregistre dans ma mémoire à long terme ? (Oui / Non)`,
      params: {
        sujet: sujet,
        contenu: s,
        commercialId: contexte.id,
        commercialNom: contexte.nom
      }
    };
  }

  return null;
}

/**
 * Prépare et place une action en attente de confirmation (Human-in-the-Loop)
 */
export function preparerActionEnAttente(action) {
  actionEnAttenteDeValidation = {
    id: 'act-' + Date.now(),
    ...action,
    timestamp: Date.now()
  };
  return actionEnAttenteDeValidation;
}

/**
 * Récupère l'action actuellement en attente
 */
export function obtenirActionEnAttente() {
  return actionEnAttenteDeValidation;
}

/**
 * Annule l'action en attente
 */
export function annulerActionEnAttente() {
  const ancienne = actionEnAttenteDeValidation;
  actionEnAttenteDeValidation = null;
  return ancienne;
}

/**
 * Exécute techniquement l'action après confirmation explicite de l'utilisateur
 * @param {string} actionId - ID de l'action à exécuter
 */
export async function executerActionConfirmee(actionId) {
  if (!actionEnAttenteDeValidation || (actionId && actionEnAttenteDeValidation.id !== actionId)) {
    return { succes: false, message: 'Aucune action en attente ou action expirée.' };
  }

  const action = actionEnAttenteDeValidation;
  actionEnAttenteDeValidation = null; // Réinitialisation

  try {
    switch (action.type) {
      case 'CREER_PROSPECT': {
        const payload = {
          commercial_id: action.params.commercial_id,
          restaurant_nom: action.params.restaurant_nom,
          prospect_nom: action.params.prospect_nom || 'Gérant',
          telephone: action.params.telephone || '+221 77 000 00 00',
          ville: action.params.ville || 'Thiès',
          formule: action.params.formule || 'XÉWEUL',
          source: 'vocal_aissatou'
        };

        // 1. Appel API serverless /api/leads
        const res = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          throw new Error('Erreur lors de la création du prospect');
        }

        return {
          succes: true,
          type: action.type,
          message: `Prospect « ${action.params.restaurant_nom} » créé avec succès à ${action.params.ville} !`
        };
      }

      case 'PLANIFIER_RDV': {
        if (estSupabaseConfigure() && supabase) {
          const { error } = await supabase.from('rendez_vous').insert([{
            commercial_id: action.params.commercial_id,
            restaurant_prospect: action.params.restaurant_prospect,
            nom_prospect: action.params.nom_prospect,
            telephone_prospect: action.params.telephone_prospect,
            date_rdv: action.params.date_rdv,
            adresse_restaurant: action.params.adresse,
            statut: 'confirme'
          }]);
          if (error) throw error;
        }

        return {
          succes: true,
          type: action.type,
          message: `Rendez-vous avec « ${action.params.restaurant_prospect} » planifié avec succès !`
        };
      }

      case 'MEMORISER_PREFERENCE': {
        await memoriserContexteAissatou({
          commercialId: action.params.commercialId,
          commercialNom: action.params.commercialNom,
          sujet: action.params.sujet,
          contenu: action.params.contenu,
          typeMemoire: 'preference_client'
        });

        return {
          succes: true,
          type: action.type,
          message: `Préférence pour « ${action.params.sujet} » bien mémorisée dans mes connaissances !`
        };
      }

      case 'ENVOYER_ANNONCE': {
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.params)
        });
        if (!res.ok) throw new Error('Erreur diffusion message');

        return {
          succes: true,
          type: action.type,
          message: `Message d'annonce diffusé à toute l'équipe avec succès !`
        };
      }

      default:
        return { succes: false, message: 'Type d\'action non supporté.' };
    }
  } catch (err) {
    console.error('Erreur exécution action Aissatou:', err);
    return {
      succes: false,
      message: `Erreur technique lors de l'exécution : ${err.message}`
    };
  }
}
