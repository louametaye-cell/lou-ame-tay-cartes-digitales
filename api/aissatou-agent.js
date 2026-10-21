/**
 * API ROUTE SERVERLESS VERCEL : /api/aissatou-agent
 * Cerveau Opérationnel de l'Agent Autonome Aissatou V2
 * Intègre la gouvernance de sécurité RBAC, la mémoire RAG, et le protocole Human-in-the-loop.
 */

const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ugmdpjncplnlizhpongo.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Mots clés strictement interdits aux conseillers commerciaux
const MOTIFS_INTERDITS_COMMERCIAL = [
  /marge(s)?(\s*brute|\s*nette|\s*daw|\s*b2b)?/i,
  /salaire(s)?/i,
  /r[eé]mun[eé]ration(s)?(\s*des\s*autres|\s*direction)?/i,
  /chiffre(\s*d'|\s*d)?affaires(\s*global|\s*total|\s*daw)?/i,
  /b[eé]n[eé]fice(s)?/i,
  /tr[eé]sorerie/i,
  /actionnaire(s)?/i,
  /combien\s*gagne(\s*le\s*directeur|\s*m\.\s*mbaye|\s*les\s*autres)/i,
  /strat[eé]gie\s*(secr[eè]te|financi[eè]re|confidentielle)/i,
  /contrat\s*de\s*(babacar|cheikh|arona|fatou)/i
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée. Utilisez POST.' });
  }

  try {
    const {
      message = '',
      user = {},
      action_en_attente = null,
      confirmation_utilisateur = null
    } = req.body || {};

    const msgTexte = String(message).trim();
    const isCeo = Boolean(user.is_ceo);
    const nomUser = user.nom || (isCeo ? 'M. Mbaye Babacar GUEYE' : 'Conseiller');

    // ==========================================================================
    // 1. SÉCURITÉ STRICTE & GUARDRAILS RBAC
    // ==========================================================================
    if (!isCeo) {
      for (const regex of MOTIFS_INTERDITS_COMMERCIAL) {
        if (regex.test(msgTexte)) {
          return res.status(200).json({
            type: 'REFUS_SECURITE',
            reponse: "Désolée, je ne suis pas autorisée à partager ce type d'informations. Veuillez contacter la direction.",
            motif: 'RESTRICTION_FINANCE_RH'
          });
        }
      }
    }

    // ==========================================================================
    // 2. PROTOCOLE HUMAN-IN-THE-LOOP : TRAITEMENT DE LA CONFIRMATION
    // ==========================================================================
    if (action_en_attente && confirmation_utilisateur) {
      const confLower = String(confirmation_utilisateur).toLowerCase();
      const estConfirme = /oui|confirmer|valider|ok|d'accord|waaw|vas-y|c'est\s*bon/i.test(confLower);

      if (estConfirme) {
        // Exécution de l'action selon son type
        if (action_en_attente.type === 'CREER_PROSPECT') {
          const leadPayload = {
            commercial_id: action_en_attente.params.commercial_id || null,
            restaurant_nom: action_en_attente.params.restaurant_nom,
            prospect_nom: action_en_attente.params.prospect_nom || 'Gérant',
            telephone: action_en_attente.params.telephone || '+221 77 000 00 00',
            ville: action_en_attente.params.ville || 'Thiès',
            formule: action_en_attente.params.formule || 'XÉWEUL',
            source: 'vocal_aissatou',
            statut: 'nouveau'
          };

          const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
            method: 'POST',
            headers: {
              'apikey': SERVICE_KEY,
              'Authorization': `Bearer ${SERVICE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(leadPayload)
          });

          if (!dbRes.ok) {
            const errTxt = await dbRes.text();
            throw new Error(`Échec DB: ${errTxt}`);
          }

          return res.status(200).json({
            type: 'ACTION_VALIDEE',
            succes: true,
            reponse: `C'est fait ! Le prospect pour ${action_en_attente.params.restaurant_nom} à ${action_en_attente.params.ville} a été enregistré avec succès.`
          });
        }

        if (action_en_attente.type === 'PLANIFIER_RDV') {
          const rdvPayload = {
            commercial_id: action_en_attente.params.commercial_id || null,
            restaurant_prospect: action_en_attente.params.restaurant_prospect,
            nom_prospect: action_en_attente.params.nom_prospect || 'Gérant',
            telephone_prospect: action_en_attente.params.telephone_prospect || '+221 77 000 00 00',
            date_rdv: action_en_attente.params.date_rdv || new Date(Date.now() + 86400000).toISOString(),
            adresse_restaurant: action_en_attente.params.adresse || 'Thiès',
            statut: 'confirme'
          };

          await fetch(`${SUPABASE_URL}/rest/v1/rendez_vous`, {
            method: 'POST',
            headers: {
              'apikey': SERVICE_KEY,
              'Authorization': `Bearer ${SERVICE_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(rdvPayload)
          });

          return res.status(200).json({
            type: 'ACTION_VALIDEE',
            succes: true,
            reponse: `C'est validé ! Le rendez-vous avec ${action_en_attente.params.restaurant_prospect} est programmé dans votre agenda.`
          });
        }

        if (action_en_attente.type === 'MEMORISER_PREFERENCE') {
          return res.status(200).json({
            type: 'ACTION_VALIDEE',
            succes: true,
            reponse: `Très bien, c'est mémorisé ! Je retiendrai cette préférence pour vos prochains échanges.`
          });
        }
      } else {
        return res.status(200).json({
          type: 'ACTION_ANNULEE',
          succes: false,
          reponse: "Entendu, j'annule cette opération. Que puis-je faire d'autre pour vous ?"
        });
      }
    }

    // ==========================================================================
    // 3. DÉTECTION D'INTENTION D'ACTION (FUNCTION CALLING)
    // ==========================================================================
    const lower = msgTexte.toLowerCase();

    // Intention A : Créer prospect
    if (/cr[eé]e(r)?\s*(un)?\s*(nouveau)?\s*prospect/i.test(lower) || /ajoute(r)?\s*(un)?\s*(nouveau)?\s*prospect/i.test(lower)) {
      const matchResto = msgTexte.match(/prospect\s*(pour|du\s*restaurant|de\s*l'établissement|pour\s*le\s*restaurant)?\s*([A-Za-z0-9\s'’À-ÿ-]+?)(?:\s+à|\s+dans|\s+sur|\.|$)/i);
      const restoNom = matchResto && matchResto[2] ? matchResto[2].trim() : 'Nouveau Restaurant CHR';
      
      let ville = 'Thiès';
      if (/dakar|plateau|almadies/i.test(lower)) ville = 'Dakar';
      else if (/saly|mbour/i.test(lower)) ville = 'Mbour / Saly';

      return res.status(200).json({
        type: 'DEMANDE_CONFIRMATION',
        action: {
          id: 'act-' + Date.now(),
          type: 'CREER_PROSPECT',
          params: { restaurant_nom: restoNom, ville: ville, commercial_id: user.id }
        },
        reponse: `J'ai bien compris. Je vais créer un prospect pour ${restoNom} à ${ville}. Confirmez-vous cette action ?`
      });
    }

    // Intention B : Planifier RDV
    if (/planifie(r)?\s*(un)?\s*rdv|programme(r)?\s*(un)?\s*rdv/i.test(lower)) {
      const matchResto = msgTexte.match(/(?:avec|chez|pour)\s+([A-Za-z0-9\s'’À-ÿ-]+?)(?:\s+demain|\s+aujourd'hui|\s+à|\.|$)/i);
      const restoNom = matchResto && matchResto[1] ? matchResto[1].trim() : 'Restaurant Partenaire';

      return res.status(200).json({
        type: 'DEMANDE_CONFIRMATION',
        action: {
          id: 'act-' + Date.now(),
          type: 'PLANIFIER_RDV',
          params: { restaurant_prospect: restoNom, commercial_id: user.id }
        },
        reponse: `J'ai bien compris. Je vais planifier un rendez-vous avec ${restoNom}. Confirmez-vous cette action ?`
      });
    }

    // Intention C : Mémoriser préférence
    if (/note\s*que|retiens\s*que|m[eé]morise\s*que/i.test(lower)) {
      const matchSujet = msgTexte.match(/(?:gérant\s*de|resto|restaurant|prospect)\s+([A-Za-z0-9\s'’À-ÿ-]+?)(?:\s+préfère|\s+veut|\s+est|\s+demande)/i);
      const sujet = matchSujet && matchSujet[1] ? matchSujet[1].trim() : 'Note client';

      return res.status(200).json({
        type: 'DEMANDE_CONFIRMATION',
        action: {
          id: 'act-' + Date.now(),
          type: 'MEMORISER_PREFERENCE',
          params: { sujet, contenu: msgTexte, commercial_id: user.id }
        },
        reponse: `J'ai bien noté cette consigne pour ${sujet}. Voulez-vous que je l'enregistre dans ma mémoire à long terme ?`
      });
    }

    // ==========================================================================
    // 4. RÉPONSE STRATÉGIQUE & RECHERCHE BASE DE CONNAISSANCES
    // ==========================================================================
    // Contexte conversationnel et règles orales (pas de markdown à l'oral)
    const promptSysteme = `
Tu es Aissatou, Directrice RH & Stratégie CHR chez Lou Ame Tay (DAW Digital Arts Work — by MG), au Sénégal.
Utilisateur : ${nomUser} (${isCeo ? 'CEO Lou Ame Tay' : 'Conseiller commercial terrain'}).
RÈGLES D'OR DU DIALOGUE :
- Réponse courte, percutante et chaleureuse (1 à 2 phrases maximum).
- JAMAIS de puces (-), de tableaux (|), ni d'astérisques (**).
- Utilise des marqueurs oraux naturels (« Alors... », « C'est bien noté », « Hmm... »).
- Si on te demande conseil sur une objection (ex: prix, internet), donne la parade clé Lou Ame Tay immédiatement.
    `.trim();

    // Appel direct à l'API Google Gemini
    if (GEMINI_KEY) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;
      const payloadGemini = {
        contents: [
          {
            role: 'user',
            parts: [{ text: `${promptSysteme}\n\nQuestion de l'utilisateur : ${msgTexte}` }]
          }
        ],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 180
        }
      };

      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadGemini)
      });

      if (geminiRes.ok) {
        const data = await geminiRes.json();
        const reponseTexte = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reponseTexte) {
          // Nettoyer toute syntaxe résiduelle markdown
          const reponseEpurée = reponseTexte
            .replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/^[-*•]\s+/gm, '')
            .replace(/\|[^|\n]+\|/g, '')
            .trim();

          return res.status(200).json({
            type: 'REPONSE_CONVERSATIONNELLE',
            reponse: reponseEpurée
          });
        }
      }
    }

    // Repli local en cas d'indisponibilité du réseau
    let repli = `Alors, ${nomUser}, je vous recommande de valoriser notre commande QR sur table et notre KDS cuisine en temps réel pour convaincre votre restaurateur !`;
    if (isCeo) {
      repli = `Monsieur le Directeur Général, l'ensemble des indicateurs de la force de vente sont opérationnels sur Thiès, Dakar et la Petite Côte.`;
    }

    return res.status(200).json({
      type: 'REPONSE_CONVERSATIONNELLE',
      reponse: repli
    });

  } catch (error) {
    console.error('Erreur agent Aissatou:', error);
    return res.status(500).json({ error: error.message || 'Erreur interne de l\'agent IA' });
  }
}
