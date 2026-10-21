/**
 * API ROUTE SERVERLESS VERCEL : /api/drive-rag
 * Base de Connaissances RAG & Dossier d'Entreprise "Aissatou_Knowledge_Base"
 * Permet l'indexation et l'interrogation des documents de direction et de formation.
 */

const KNOWLEDGE_DOCS = [
  {
    id: 'reglement-interieur-2026',
    titre: 'Règlement Intérieur & Charte de Terrain 2026',
    dossier: 'Aissatou_Knowledge_Base/Direction',
    tags: ['reglement', 'horaires', 'discipline', 'retards', 'pointage', 'gps', 'derogation', 'confidentialite'],
    confidentielCeo: false,
    resume: 'Horaires 8h30-18h00. Premier pointage avant 10h00. Géolocalisation GPS obligatoire à moins de 200m. Dérogation motivée avec photo réelle. Secret absolu des marges DAW (85-92%).'
  },
  {
    id: 'grille-marges-et-commissions-ceo',
    titre: 'Grille Tarifaire, Marges B2B & Rentabilité DAW (Fiche 10)',
    dossier: 'Aissatou_Knowledge_Base/Direction',
    tags: ['marges', 'finance', 'ceo', 'salaires', 'rentabilite', 'tresorerie', 'expansion'],
    confidentielCeo: true,
    resume: 'TÀMBALI 15k (85% marge), XÉWEUL 35k (88% marge), NIO FAR 65k (90% marge), BÈGG BÀMBA 120k (92% marge). Règle DAF : versement conditionné à la référence Wave/OM certifiée.'
  },
  {
    id: 'guide-negociation-objections-chr',
    titre: 'Guide Stratégique des 10 Parades aux Objections CHR',
    dossier: 'Aissatou_Knowledge_Base/Commercial',
    tags: ['objections', 'trop cher', 'mafalia', 'scanifood', 'connexion', 'hors ligne', 'menu digital'],
    confidentielCeo: false,
    resume: 'Réfutation de l\'objection prix (économie dès M1 face au papier 150k). Mode Offline-First garanti sans connexion 4G. Différenciation avec Mafalia (forfait annuel sans prélèvement sur les plats).'
  }
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { query = '', is_ceo = false } = req.method === 'POST' ? req.body || {} : req.query || {};

    const reqLower = String(query).toLowerCase().trim();
    const mots = reqLower.split(/\s+/).filter(m => m.length > 2);

    const docsFiltres = KNOWLEDGE_DOCS.filter(doc => {
      // Si confidentiel CEO et que l'utilisateur n'est pas CEO -> masquage absolu
      if (doc.confidentielCeo && !Boolean(is_ceo)) {
        return false;
      }

      if (!reqLower) return true;

      // Correspondance par tags ou titre
      return doc.tags.some(t => reqLower.includes(t)) ||
             mots.some(m => doc.titre.toLowerCase().includes(m) || doc.resume.toLowerCase().includes(m));
    });

    return res.status(200).json({
      succes: true,
      dossierRacine: 'Aissatou_Knowledge_Base',
      totalDocuments: docsFiltres.length,
      documents: docsFiltres
    });

  } catch (error) {
    console.error('Erreur Drive RAG:', error);
    return res.status(500).json({ error: 'Erreur lors de l\'interrogation de la base de connaissances' });
  }
}
