/**
 * API ROUTE SERVERLESS VERCEL : /api/messages
 * Messagerie Direction ↔ Commerciaux
 * Utilise la table annonces_equipe de Supabase avec la clé service_role.
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ugmdpjncplnlizhpongo.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      const {
        expediteur = 'Direction Lou Ame Tay',
        destinataire_id = 'ALL',
        titre,
        contenu,
        type = 'message_direction',
        priorite = 'normale'
      } = req.body || {};

      if (!contenu) {
        return res.status(400).json({ error: 'Le contenu du message est obligatoire.' });
      }

      // Préfixe de ciblage dans le titre si destinataire ciblé
      const titreFormate = destinataire_id && destinataire_id !== 'ALL'
        ? `[@${destinataire_id}] ${titre || 'Message de la Direction'}`
        : `${titre || 'Message pour l\'équipe'}`;

      const payload = {
        titre: titreFormate,
        contenu: String(contenu).trim(),
        auteur: expediteur,
        type: 'info', // Respecte la contrainte PostgreSQL annonces_equipe_type_check
        actif: true,
        created_at: new Date().toISOString()
      };

      const response = await fetch(`${SUPABASE_URL}/rest/v1/annonces_equipe`, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({ error: errText });
      }

      const inserted = await response.json();
      return res.status(201).json({ success: true, message: inserted[0] || inserted });
    }

    if (req.method === 'GET') {
      const { commercial_id, limit = 50 } = req.query || {};

      const response = await fetch(`${SUPABASE_URL}/rest/v1/annonces_equipe?select=*&order=created_at.desc&limit=${limit}`, {
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`
        }
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({ error: errText });
      }

      const annonces = await response.json();
      
      // Filtrer : garder les messages d'équipe généraux + ceux adressés spécifiquement au commercial
      const messagesFiltres = annonces.filter(a => {
        if (!a.titre) return true;
        if (!commercial_id) return true;
        if (a.titre.startsWith('[@') && !a.titre.startsWith(`[@${commercial_id}]`) && !a.titre.startsWith('[@ALL]')) {
          return false;
        }
        return true;
      });

      return res.status(200).json({ success: true, messages: messagesFiltres });
    }

    return res.status(405).json({ error: 'Méthode non autorisée' });
  } catch (error) {
    console.error('Erreur API messages:', error);
    return res.status(500).json({ error: error.message || 'Erreur interne' });
  }
}
