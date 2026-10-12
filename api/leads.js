/**
 * API ROUTE SERVERLESS VERCEL : /api/leads
 * Permet l'enregistrement et la consultation sécurisée des leads
 * Contourne les restrictions RLS côté client en utilisant la clé de service.
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ugmdpjncplnlizhpongo.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  // En-têtes CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      const {
        commercial_id,
        restaurant_nom,
        prospect_nom,
        telephone,
        ville,
        formule,
        message,
        source,
        score
      } = req.body || {};

      if (!restaurant_nom || !prospect_nom || !telephone) {
        return res.status(400).json({
          error: 'Champs obligatoires manquants : restaurant_nom, prospect_nom, telephone'
        });
      }

      // Format strict du statut pour respecter la contrainte check "leads_statut_check"
      const payload = {
        commercial_id: commercial_id || null,
        restaurant_nom: String(restaurant_nom).trim(),
        prospect_nom: String(prospect_nom).trim(),
        telephone: String(telephone).trim(),
        ville: ville ? String(ville).trim() : 'Dakar',
        formule: formule ? String(formule).trim() : 'TÀMBALI',
        message: message ? String(message).trim() : '',
        source: source || 'terrain',
        statut: 'nouveau', // Toujours en minuscule pour satisfaire la contrainte CHECK PostgreSQL
        score: Number(score) || 75
      };

      const response = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
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
        console.error('Erreur Supabase leads POST:', response.status, errText);
        return res.status(response.status).json({ error: errText });
      }

      const inserted = await response.json();
      return res.status(201).json({ success: true, lead: inserted[0] || inserted });
    }

    if (req.method === 'GET') {
      const { commercial_id, limit } = req.query || {};
      let queryUrl = `${SUPABASE_URL}/rest/v1/leads?select=*&order=created_at.desc`;

      if (commercial_id) {
        queryUrl += `&commercial_id=eq.${encodeURIComponent(commercial_id)}`;
      }
      if (limit) {
        queryUrl += `&limit=${encodeURIComponent(limit)}`;
      }

      const response = await fetch(queryUrl, {
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`
        }
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({ error: errText });
      }

      const leads = await response.json();
      return res.status(200).json({ success: true, leads });
    }

    return res.status(405).json({ error: 'Méthode non autorisée' });
  } catch (error) {
    console.error('Erreur API leads:', error);
    return res.status(500).json({ error: error.message || 'Erreur interne du serveur' });
  }
}
