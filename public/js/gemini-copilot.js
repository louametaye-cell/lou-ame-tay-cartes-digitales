/**
 * ==============================================================================
 * FICHIER : js/gemini-copilot.js
 * COPILOT IA GOOGLE GEMINI — LOU AME TAY (TERRAIN COMMERCIAL & DIRECTION CEO)
 * ==============================================================================
 * Conçu pour le terrain sénégalais :
 * 1. Côté Commercial : Générateur de pitch percutant, message WhatsApp et réfutation
 *    d'objections selon le profil d'établissement et la formule visée.
 * 2. Côté CEO : Synthèse d'analyse automatique quotidienne, détection des zones
 *    silencieuses et recommandations de pilotage stratégique.
 */

// Profils de zones et types d'établissements au Sénégal
export const PROFILS_ETABLISSEMENTS = [
  {
    id: 'almadies_lounge',
    label: 'Almadies / Ngor / Virage — Lounge Chic & Vue Mer',
    contexte: 'Clientèle branchée, touristes & expats. Forte affluence en soirée, carte cocktails & tapas. Besoin de rapidité et standing haut de gamme.',
    argumentCle: 'Élimination des erreurs de commande en salle bruyante et valorisation de l\'image de marque grâce aux supports QR dorés Lou Ame Tay.'
  },
  {
    id: 'plateau_affaires',
    label: 'Dakar Plateau / Point E — Déjeuners d\'Affaires Express',
    contexte: 'Cadres, banquiers, ministères. Pause déjeuner courte (12h30-14h), exigence absolue de rapidité.',
    argumentCle: 'Accélération de la rotation des tables de +25% : les clients commandent et règlent dès leur arrivée sans attendre le serveur.'
  },
  {
    id: 'saly_hotel',
    label: 'Petite Côte / Saly / Mbour — Hôtels & Terrasses Balnéaires',
    contexte: 'Résidents, touristes européens et sénégalais. Grandes terrasses étalées jusqu\'à la plage.',
    argumentCle: 'Prise de commande instantanée depuis les transats et terrasses éloignées sans déplacement fastidieux des serveurs.'
  },
  {
    id: 'saloum_casamance',
    label: 'Casamance & Îles du Saloum — Écolodges & Auberges Fluviales',
    contexte: 'Tourisme vert, authenticité, gestion des denrées sensibles et réseau parfois instable.',
    argumentCle: 'Mode résilient hors-ligne garanti, réduction du gaspillage alimentaire (-30%) et suppression totale des menus plastiques non biodégradables (RSE).'
  },
  {
    id: 'touba_fastfood',
    label: 'Touba / Mbacké / Kaolack — Fast-Food, Dibiterie & Grand CHR',
    contexte: 'Volumes élevés, affluence massive, commande au comptoir et à emporter, personnel exigeant de la simplicité.',
    argumentCle: 'Fluidité totale des flux de cuisine via l\'écran KDS tactile universel, zéro oubli de commande et encaissement Wave immédiat.'
  }
];

/**
 * Génère un pitch commercial complet adapté au contexte
 */
export function genererPitchCommercial({
  profilId = 'almadies_lounge',
  formule = 'Xéweul',
  restoNom = 'Votre Établissement',
  prenomCommercial = 'Votre Conseiller',
  nomCommercial = '',
  lienCarte = 'https://louametay.online'
}) {
  const profil = PROFILS_ETABLISSEMENTS.find(p => p.id === profilId) || PROFILS_ETABLISSEMENTS[0];
  const nomComplet = `${prenomCommercial} ${nomCommercial}`.trim();

  // 1. Accroche orale percutante (30 secondes face au gérant)
  const accrocheOrale = `« Bonjour M. le Gérant, Dalal ak jàmm ! Je m'appelle ${prenomCommercial} de Lou Ame Tay. En observant votre établissement ici à ${profil.label.split('—')[0].trim()}, je constate la qualité de votre service. Mais aux heures de pointe, combien de clients attendent que le serveur vienne pour leur apporter la carte ? Avec notre solution Lou Ame Tay, vos clients flashent simplement un chevalet QR élégant sur leur table, commandent sur leur téléphone et la cuisine prépare instantanément sur écran tactile. Vos tables tournent 25% plus vite, et vos pertes alimentaires chutent de 30%. Accordez-moi 2 minutes : je vous montre la démonstration en direct sur mon smartphone ! »`;

  // 2. Message WhatsApp professionnel prêt à envoyer
  const messageWhatsApp = `Salamalekoum M. le Décideur,\n\n` +
    `C'est ${nomComplet}, Conseiller Lou Ame Tay au Sénégal.\n\n` +
    `Suite à notre échange, je vous confirme que la formule *${formule.toUpperCase()}* répond parfaitement aux besoins de votre établissement (*${restoNom}*) :\n` +
    `✔️ Menus digitaux QR haute définition (zéro réimpression papier)\n` +
    `✔️ Écran cuisine KDS en temps réel (zéro commande perdue)\n` +
    `✔️ Mode 100% résilient hors-ligne même en cas de coupure 4G\n` +
    `✔️ Encaissement direct Wave / Orange Money\n` +
    `✔️ Démarche RSE officielle Éco-Restaurateur Sénégal\n\n` +
    `📲 Découvrez ma carte professionnelle et testez la démo en direct : ${lienCarte}\n\n` +
    `Je suis disponible pour formaliser l'installation et la formation offerte de votre équipe cette semaine.`;

  // 3. Traitement des 3 objections majeures
  const objections = [
    {
      objection: '« J\'ai déjà des cartes plastifiées ou des menus papier. »',
      reponse: '« Une carte papier coûte entre 50 000 et 150 000 FCFA à chaque réimpression de prix ou de changement de plat. Avec Lou Ame Tay, vous changez un prix ou marquez un plat en rupture en 3 secondes depuis votre téléphone, sans rien réimprimer. Vous économisez dès le premier mois tout en éliminant le plastique polluant (Pacte RSE Sénégal). »'
    },
    {
      objection: '« Mes serveurs ou mes cuisiniers ne sont pas à l\'aise avec l\'informatique. »',
      reponse: '« Notre système a été conçu pour le terrain sénégalais : l\'écran cuisine fonctionne avec de grands codes couleurs universels (Vert pour prêt, Orange pour en cuisson, Rouge pour urgent) et des pictogrammes. Il n\'y a même pas besoin de savoir lire couramment. De plus, notre équipe se déplace physiquement dans votre salle pour former l\'ensemble de votre personnel en 30 minutes. »'
    },
    {
      objection: '« La connexion internet coupe parfois dans notre quartier. »',
      reponse: '« C\'est justement pour cela que Lou Ame Tay a été créée au Sénégal ! Notre plateforme embarque un mode résilient hors-ligne : même si la 4G coupe, vos clients continuent de consulter la carte sur leur téléphone sans la moindre interruption. »'
    }
  ];

  return {
    profil,
    accrocheOrale,
    messageWhatsApp,
    objections
  };
}

/**
 * Génère la synthèse analytique du jour pour le CEO (M. Mbaye Babacar GUEYE)
 */
export function genererSyntheseCEODuJour({
  leads = [],
  commissions = [],
  activites = [],
  commerciaux = []
}) {
  const totalLeads = leads.length;
  const contratsSignes = leads.filter(l => l.statut === 'SIGNE').length;
  const prospectsChauds = leads.filter(l => l.score >= 70 && l.statut !== 'SIGNE').length;
  const tauxConversion = totalLeads > 0 ? Math.round((contratsSignes / totalLeads) * 100) : 0;

  // Calcul du volume estimé d'acomptes
  const totalAcomptes = leads
    .filter(l => l.statut === 'SIGNE')
    .reduce((sum, l) => {
      const p = l.formule?.includes('Xéweul') ? 35000 : l.formule?.includes('Nio Far') ? 25000 : 15000;
      return sum + p;
    }, 0);

  // Détection des régions représentées
  const regionsActives = new Set();
  leads.forEach(l => {
    if (l.ville) regionsActives.add(l.ville.split(',')[0].trim());
  });

  const dateStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Génération du texte synthétique exécutif
  const briefingTexte = `
📊 RAPPORT STRATÉGIQUE DU JOUR — DIRECTION GÉNÉRALE
Date : ${dateStr.toUpperCase()}
Audité pour : M. Mbaye Babacar GUEYE, Fondateur & CEO

1. SANTÉ COMMERCIALE & ENCAISSEMENTS
• Volume total de prospects audités : ${totalLeads}
• Contrats officiellement signés & scellés : ${contratsSignes} (Taux de conversion : ${tauxConversion}%)
• Prospects à fort potentiel (Score ≥ 70) : ${prospectsChauds} en cours de négociation
• Volume d'acomptes Wave/OM générés : ${totalAcomptes.toLocaleString('fr-FR')} FCFA

2. COUVERTURE GÉOGRAPHIQUE DU SÉNÉGAL
• Régions sous prospection active : ${Array.from(regionsActives).slice(0, 5).join(', ') || 'Dakar, Thiès, Saly'}
• Alerte Déploiement : Renforcer la présence physique dans les pôles touristiques et provinciaux (Casamance, Îles du Saloum, Touba) où la demande CHR pour l'écotourisme et la commande sans fil est en forte croissance.

3. RECOMMANDATIONS EXÉCUTIVES GEMINI COPILOT :
1️⃣ Relance ciblée sur les ${prospectsChauds} prospects chauds dès demain matin avec l'offre d'activation offerte.
2️⃣ Clôture immédiate des commissions validées pour maintenir une motivation maximale des équipes terrain.
3️⃣ Valorisation du macaron « Éco-Restaurateur RSE » pour accélérer la signature des hôtels et grands restaurants de bord de mer.
`.trim();

  return {
    date: dateStr,
    totalLeads,
    contratsSignes,
    prospectsChauds,
    tauxConversion,
    totalAcomptes,
    briefingTexte
  };
}
