/**
 * ==============================================================================
 * FICHIER : js/aissatou-drive.js
 * CONNECTEUR DE BASE DE CONNAISSANCES DRIVE RAG (Aissatou_Knowledge_Base)
 * ==============================================================================
 * Permet à Aissatou d'accéder aux documents de référence de l'entreprise :
 * - Règlement Intérieur & Charte de Terrain 2026
 * - Grille Tarifaire, Marges B2B & Stratégie Direction (Fiche 10)
 * - Guide de négociation CHR et traitement des objections (Fiches 01 à 09)
 * - Fichiers connectés via Google Drive API
 * ==============================================================================
 */

// Documents clés indexés dans la base de connaissances locale/drive
const DOCUMENTS_BASE_ENTREPRISE = [
  {
    nom: 'REGLEMENT_INTERIEUR_LOUAMETAY_2026.md',
    titre: 'Règlement Intérieur & Charte de Terrain 2026',
    dossier: 'Aissatou_Knowledge_Base/Direction',
    tags: ['reglement', 'horaires', 'gps', 'pointage', 'discipline', 'retards', 'derogation', 'confidentialite'],
    contenu: `
ARTICLE 1 : Horaires de service 8h30 à 18h00. Premier pointage de rendez-vous obligatoire avant 10h00. Tout retard non motivé est signalé au CEO.
ARTICLE 2 : Géolocalisation GPS obligatoire à moins de 200 mètres du restaurant. Dérogation motivée avec photo réelle obligatoire en cas d'impossibilité technique.
ARTICLE 3 : Présentation exclusive de la carte de visite digitale connectée.
ARTICLE 4 : Confidentialité stricte des marges DAW (85-92%) et secrets d'affaires. Interdiction absolue de divulgation.
ARTICLE 5 : Validation obligatoire des paiements Wave/Orange Money avant tout versement de commission.
    `.trim()
  },
  {
    nom: '10_AISSATOU_CEO_STRATEGIE.md',
    titre: 'Fiche Stratégique Direction Générale & Marges DAW',
    dossier: 'Aissatou_Knowledge_Base/Direction',
    tags: ['marges', 'finance', 'ceo', 'tarifs', 'commissions', 'rentabilite', 'expansion'],
    confidentielCeo: true,
    contenu: `
Structure des marges DAW :
- TÀMBALI (15 000 F) : Marge 85%, Commission 1 500 F
- XÉWEUL (35 000 F) : Marge 88%, Commission 3 500 F
- NIO FAR (65 000 F) : Marge 90%, Commission 6 500 F
- BÈGG BÀMBA (120 000 F) : Marge 92%, Commission 12 000 F
- SUR MESURE : Devis > 250 000 F, Commission 10%
Règle DAF : Aucun versement sans référence de paiement Wave/Orange Money vérifiée.
    `.trim()
  },
  {
    nom: '06_OBJECTIONS_VENTE_CHR.md',
    titre: 'Guide des 10 Parades aux Objections Restaurateurs',
    dossier: 'Aissatou_Knowledge_Base/Commercial',
    tags: ['objections', 'trop cher', 'mafalia', 'scanifood', 'connexion', 'serveurs', 'menu papier'],
    contenu: `
1. « C'est trop cher » -> Une carte papier coûte 50k à 150k à réimprimer à chaque changement. Lou Ame Tay coûte 35k pour un an complet tout compris.
2. « Et si internet coupe ? » -> Lou Ame Tay fonctionne en mode 100% hors-ligne (Offline-First). Les commandes passent même sans réseau 4G.
3. « Mes serveurs ne savent pas lire » -> L'interface fonctionne avec des photos géantes, des codes couleurs stricts (Vert/Orange/Rouge) et des pictogrammes universels.
4. « Pourquoi pas Mafalia ? » -> Mafalia prend des commissions lourdes sur chaque commande. Lou Ame Tay est une formule forfaitaire annuelle sans commission prélevée sur vos plats.
    `.trim()
  }
];

/**
 * Recherche dans les documents de la base de connaissances
 * @param {string} requete - Termes de recherche
 * @param {boolean} isCeo - Si vrai, autorise la lecture des documents confidentiels
 * @returns {Array} - Liste des extraits de documents trouvés
 */
export async function interrogerBaseDriveRAG(requete, isCeo = false) {
  if (!requete) return [];
  const reqLower = String(requete).toLowerCase().trim();
  const motsCles = reqLower.split(/\s+/).filter(m => m.length > 2);

  const extraits = [];

  for (const doc of DOCUMENTS_BASE_ENTREPRISE) {
    // Si document confidentiel et que l'utilisateur n'est pas le CEO, masquer complètement
    if (doc.confidentielCeo && !isCeo) continue;

    let score = 0;
    for (const mot of motsCles) {
      if (doc.tags.some(t => t.includes(mot))) score += 3;
      if (doc.titre.toLowerCase().includes(mot)) score += 2;
      if (doc.contenu.toLowerCase().includes(mot)) score += 1;
    }

    if (score > 0) {
      extraits.push({
        document: doc.titre,
        dossier: doc.dossier,
        score,
        extrait: doc.contenu
      });
    }
  }

  return extraits.sort((a, b) => b.score - a.score);
}
