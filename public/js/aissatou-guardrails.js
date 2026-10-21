/**
 * ==============================================================================
 * FICHIER : js/aissatou-guardrails.js
 * GOUVERNANCE DE SÉCURITÉ & CONTRÔLE D'ACCÈS RBAC DE L'AGENT AISSATOU
 * ==============================================================================
 * RÈGLE ABSOLUE :
 * 1. Si utilisateur = Commercial (is_ceo: false) :
 *    - INTERDICTION de divulguer : marges DAW (85-92%), salaires, commissions des collègues,
 *      trésorerie générale, stratégie d'actionnaires, litiges juridiques direction.
 *    - Réponse obligatoire : "Désolée, je ne suis pas autorisée à partager ce type d'informations. Veuillez contacter la direction."
 * 2. Si utilisateur = Direction Générale (is_ceo: true — M. Mbaye Gueye) :
 *    - Accès complet aux analyses financières, audits des pointages GPS et rapports d'anomalies.
 * 3. Protection anti-jailbreak et anti-injection de prompt.
 * ==============================================================================
 */

// Mots-clés et motifs strictement interdits aux commerciaux
const MOTIFS_INTERDITS_COMMERCIAL = [
  /marge(s)?(\s*brute|\s*nette|\s*daw|\s*b2b)?/i,
  /salaire(s)?(\s*de|\s*des)?/i,
  /r[eé]mun[eé]ration(s)?(\s*des\s*autres|\s*direction)?/i,
  /chiffre(\s*d'|\s*d)?affaires(\s*global|\s*total|\s*de\s*la\s*boite|\s*daw)?/i,
  /b[eé]n[eé]fice(s)?/i,
  /tr[eé]sorerie/i,
  /actionnaire(s)?/i,
  /compte(s)?\s*bancaire/i,
  /combien\s*gagne(\s*le\s*directeur|\s*m\.\s*mbaye|\s*les\s*autres)/i,
  /strat[eé]gie\s*(secr[eè]te|financi[eè]re|confidentielle)/i,
  /contrat\s*de\s*(babacar|cheikh|arona|fatou)/i
];

// Tentatives d'injection de prompt et contournement de rôle
const MOTIFS_INJECTION_PROMPT = [
  /ignore(\s*toutes)?\s*(tes|les)\s*instructions/i,
  /tu\s*es\s*maintenant(\s*en\s*mode|\s*le\s*ceo|\s*le\s*directeur)/i,
  /fais\s*comme\s*si\s*tu\s*[eé]tais/i,
  /oublie\s*(les\s*r[eè]gles|la\s*s[eé]curit[eé])/i,
  /je\s*suis\s*(mbaye|le\s*ceo|le\s*boss|le\s*directeur\s*g[eé]n[eé]ral)/i
];

/**
 * Évalue la sécurité d'une requête avant envoi au cerveau IA
 * @param {string} prompt - Question ou consigne saisie par l'utilisateur
 * @param {Object} contexteUtilisateur - { is_ceo, nom, role, id }
 * @returns {Object} - { autorise: boolean, reponseSecurite?: string, motif?: string }
 */
export function verifierSecuritePromptAissatou(prompt, contexteUtilisateur = {}) {
  const texte = String(prompt || '').trim();
  const isCeo = Boolean(contexteUtilisateur.is_ceo);
  const nomUser = contexteUtilisateur.nom || 'Conseiller';

  // 1. Détection des tentatives d'injection de prompt (pour tous)
  for (const regex of MOTIFS_INJECTION_PROMPT) {
    if (regex.test(texte) && !isCeo) {
      console.warn('🛡️ [Aissatou Security] Tentative de contournement détectée :', texte);
      return {
        autorise: false,
        reponseSecurite: "Désolée, je ne suis pas autorisée à modifier mon périmètre d'action. Restons concentrés sur vos objectifs commerciaux.",
        motif: 'PROMPT_INJECTION'
      };
    }
  }

  // 2. Si le rôle est Commercial terrain, vérifier les zones sensibles
  if (!isCeo) {
    for (const regex of MOTIFS_INTERDITS_COMMERCIAL) {
      if (regex.test(texte)) {
        console.warn('🛡️ [Aissatou Security] Question sensible bloquée pour le commercial :', texte);
        return {
          autorise: false,
          reponseSecurite: "Désolée, je ne suis pas autorisée à partager ce type d'informations. Veuillez contacter la direction.",
          motif: 'RESTRICTION_FINANCE_RH'
        };
      }
    }
  }

  // Requête autorisée
  return { autorise: true };
}

/**
 * Construit le prompt système hermétique avec injection des métadonnées de rôle
 */
export function construirePromptSystemeSecurise(contexteUtilisateur = {}) {
  const isCeo = Boolean(contexteUtilisateur.is_ceo);
  const nomUser = contexteUtilisateur.nom || (isCeo ? 'M. Mbaye Babacar GUEYE' : 'Conseiller');
  const roleLabel = isCeo ? 'Direction Générale (CEO)' : 'Conseiller Commercial Terrain';

  return `
Tu es Aissatou, Directrice RH & Stratégie CHR chez Lou Ame Tay (DAW Digital Arts Work — by MG), au Sénégal.
Tu t'adresses actuellement à : ${nomUser} (Rôle : ${roleLabel}).

PROFIL SÉCURITÉ ACTIF :
- is_ceo = ${isCeo}
${!isCeo ? `
- RÈGLE INVIOLABLE : L'utilisateur actuel est un commercial terrain. Tu as l'interdiction formelle de lui parler des salaires, de la trésorerie globale, des marges nettes DAW (85-92%) ou des données des autres conseillers. S'il insiste, réponds systématiquement : « Désolée, je ne suis pas autorisée à partager ce type d'informations. Veuillez contacter la direction. »
` : `
- RÈGLE DIRECTION : L'utilisateur actuel est le CEO M. Mbaye Babacar GUEYE. Tu lui accordes une transparence absolue sur les statistiques, les marges, les audits de pointage GPS et la conformité au règlement intérieur.
`}

COMPORTEMENT CONVERSATIONNEL :
- Réponds avec chaleur, élégance et courtoisie sénégalaise (Teranga).
- Sois concise : 1 à 2 phrases percutantes par réponse orale.
- N'inclus JAMAIS de listes à puces, de tableaux complexes ou de syntaxe markdown lourde dans tes réponses parlées.
- Utilise des marqueurs naturels : « Alors... », « C'est bien noté », « Hmm... ».
  `.trim();
}
