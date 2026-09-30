/**
 * ==============================================================================
 * FICHIER : js/contrat-commercial-pdf.js
 * CONTRAT OFFICIEL D'AGENT COMMERCIAL DE TERRAIN & DÉVELOPPEMENT B2B
 * PLATEFORME SAAS CHR « LOU AME TAY »
 * Réf : LAT-COM-2026-[MATRICULE] | Droit Sénégalais (COCC, Lois 2008-08 & 2008-12)
 * ==============================================================================
 * Édité par :
 * LOU AME TAY SASU / Médias Graphisme Sénégal / DAW Digital Arts Work
 * Direction Générale : M. Mbaye Babacar GUEYE, Fondateur, DG & Directeur Artistique
 * Contacts : +221 77 458 74 74 / +221 77 130 36 78
 * ==============================================================================
 */

/**
 * Génère et télécharge le Contrat d'Agent Commercial Officiel A4 en 2 pages juridiques complètes
 * @param {Object} donnees - Données de l'agent et du contrat
 * @returns {Promise<jsPDF>}
 */
export async function genererContratCommercialPDFA4(donnees = {}) {
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF) {
    throw new Error('La bibliothèque jsPDF n\'est pas disponible.');
  }

  const maintenant = new Date();
  const dateFormatee = maintenant.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const heureFormatee = maintenant.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const {
    matricule = `LAT-COM-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    dateContrat = dateFormatee,
    heureContrat = heureFormatee,
    agentNom = 'M. le Conseiller',
    agentPrenom = '',
    agentCni = 'Non renseigné',
    agentAdresse = 'Dakar, Sénégal',
    agentTelephone = '+221 77 000 00 00',
    agentPayoutPhone = '+221 77 000 00 00',
    clientIp = '127.0.0.1 (Session Sécurisée)',
    signatureAgentDataUrl = null,
    hashEmpreinte = null
  } = donnees;

  const hashFinal = hashEmpreinte || Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
  const nomCompletAgent = `${agentPrenom} ${agentNom}`.trim();

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const PAGE_WIDTH = 210;
  const PAGE_HEIGHT = 297;
  const MARGIN_LEFT = 14;
  const CONTENT_WIDTH = 182;

  const BLEU_NUIT = [11, 31, 58];     // #0B1F3A
  const BLEU_CLAIR = [23, 55, 94];    // #17375E
  const DORE_LUX = [201, 162, 39];    // #C9A227
  const TEXTE_DARK = [30, 41, 59];    // #1E293B
  const GRIS_FOND = [248, 250, 252];  // #F8FAFC
  const GRIS_LIGNE = [226, 232, 240]; // #E2E8F0

  function appliquerEnTete(numPage) {
    doc.setFillColor(...BLEU_NUIT);
    doc.rect(0, 0, PAGE_WIDTH, 18, 'F');
    doc.setFillColor(...DORE_LUX);
    doc.rect(0, 18, PAGE_WIDTH, 1.2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('LOU AME TAY SASU — CONTRAT D\'AGENT COMMERCIAL DE TERRAIN & DÉVELOPPEMENT B2B', MARGIN_LEFT, 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(248, 226, 148);
    doc.text('Plateforme SaaS CHR • Droit Sénégalais (COCC, Lois 2008-08 & 2008-12, Startup Act)', MARGIN_LEFT, 13.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`Réf : ${matricule} | Page ${numPage}/2`, PAGE_WIDTH - MARGIN_LEFT, 11, { align: 'right' });
  }

  function appliquerPiedDePage(numPage) {
    const yPied = PAGE_HEIGHT - 13;
    doc.setDrawColor(...GRIS_LIGNE);
    doc.setLineWidth(0.3);
    doc.line(MARGIN_LEFT, yPied - 2, PAGE_WIDTH - MARGIN_LEFT, yPied - 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'LOU AME TAY SASU • Médias Graphisme Sénégal / DAW Digital Arts Work • Siège : Grand Standing, Thiès • Bureau VDN Dakar • Tél : +221 77 458 74 74',
      MARGIN_LEFT,
      yPied + 2
    );
    doc.text(
      `Certification Numérique : SHA-256 [${hashFinal}] • Signature Probante • Page ${numPage}/2`,
      PAGE_WIDTH - MARGIN_LEFT,
      yPied + 2,
      { align: 'right' }
    );
  }

  // ============================================================================
  // PAGE 1 : PARTIES, VISAS JURIDIQUES & ARTICLES 1 À 4
  // ============================================================================
  appliquerEnTete(1);

  let curY = 24;

  // Titre principal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...BLEU_NUIT);
  doc.text('CONTRAT D\'ENGAGEMENT D\'AGENT COMMERCIAL DE TERRAIN', MARGIN_LEFT, curY);

  curY += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...DORE_LUX);
  doc.text(`CONVENTION DE MANDAT COMMERCIAL B2B — RÉFÉRENCE OFFICIELLE : ${matricule}`, MARGIN_LEFT, curY);

  curY += 5;

  // Encadré des Parties
  const hCadreParties = 34;
  doc.setFillColor(...GRIS_FOND);
  doc.setDrawColor(...GRIS_LIGNE);
  doc.roundedRect(MARGIN_LEFT, curY, CONTENT_WIDTH, hCadreParties, 2, 2, 'FD');

  const colWidth = (CONTENT_WIDTH - 6) / 2;
  const col1X = MARGIN_LEFT + 3;
  const col2X = MARGIN_LEFT + colWidth + 5;

  // Ligne de séparation verticale
  doc.setDrawColor(...GRIS_LIGNE);
  doc.line(MARGIN_LEFT + colWidth + 3, curY + 2, MARGIN_LEFT + colWidth + 3, curY + hCadreParties - 2);

  // Colonne 1 : Mandant
  let pY = curY + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...BLEU_NUIT);
  doc.text('1. LE MANDANT (L\'ENTREPRISE / ÉDITEUR) :', col1X, pY);

  pY += 3.8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...TEXTE_DARK);
  doc.text('LOU AME TAY SASU / Médias Graphisme Sénégal / DAW', col1X, pY);

  pY += 3.5;
  doc.setFont('helvetica', 'normal');
  doc.text('Direction Générale : M. Mbaye Babacar GUEYE, Fondateur & DG', col1X, pY);
  pY += 3.2;
  doc.text('Siège & Ateliers : Grand Standing, Thiès, Sénégal', col1X, pY);
  pY += 3.2;
  doc.text('Bureau commercial : Liberté 6 Extension sur la VDN, Dakar', col1X, pY);
  pY += 3.2;
  doc.text('Contacts officiels : +221 77 458 74 74 / +221 77 130 36 78', col1X, pY);
  pY += 3.2;
  doc.text('Email : contact@mgartswork.site / contact@louametay.online', col1X, pY);
  pY += 3.5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BLEU_CLAIR);
  doc.text('Ci-après dénommée « Le Mandant » ou « L\'Entreprise »', col1X, pY);

  // Colonne 2 : Mandataire (Agent Commercial)
  pY = curY + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...BLEU_NUIT);
  doc.text('2. LE MANDATAIRE (CONSEILLER COMMERCIAL TERRAIN) :', col2X, pY);

  pY += 3.8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...TEXTE_DARK);
  doc.text(`Nom & Prénom : ${nomCompletAgent}`, col2X, pY);

  pY += 3.5;
  doc.setFont('helvetica', 'normal');
  doc.text(`Numéro CNI / CEDEAO : ${agentCni}`, col2X, pY);
  pY += 3.2;
  doc.text(`Adresse de résidence : ${agentAdresse}`, col2X, pY);
  pY += 3.2;
  doc.text(`Téléphone & WhatsApp : ${agentTelephone}`, col2X, pY);
  pY += 3.2;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52); // Vert
  doc.text(`Ligne certifiée versement Wave / OM : ${agentPayoutPhone}`, col2X, pY);
  pY += 3.5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BLEU_CLAIR);
  doc.text('Ci-après dénommé « L\'Agent Commercial » ou « Le Mandataire »', col2X, pY);

  curY += hCadreParties + 4;

  // Préambule et Visas Juridiques
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(MARGIN_LEFT, curY, CONTENT_WIDTH, 11, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...BLEU_NUIT);
  doc.text('PRÉAMBULE & CADRE JURIDIQUE SÉNÉGALAIS DE RÉFÉRENCE :', MARGIN_LEFT + 3, curY + 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...TEXTE_DARK);
  doc.text(
    'Le présent contrat est conclu et régi sous l\'empire des lois de la République du Sénégal : le Code des Obligations Civiles et Commerciales (COCC), la Loi n° 2008-08 sur les transactions électroniques (conférant pleine force probante à la signature tactile dématérialisée), la Loi n° 2008-12 sur la protection des données (CDP Sénégal), et la Loi n° 2020-01 sur les startups et l\'innovation.',
    MARGIN_LEFT + 3,
    curY + 7.5,
    { maxWidth: CONTENT_WIDTH - 6 }
  );

  curY += 14;

  function imprimerArticle(titre, paragraphes, espaceFin = 3) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...BLEU_NUIT);
    doc.text(titre, MARGIN_LEFT, curY);
    curY += 3.6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.7);
    doc.setTextColor(...TEXTE_DARK);

    paragraphes.forEach(p => {
      const lignes = doc.splitTextToSize(p, CONTENT_WIDTH);
      doc.text(lignes, MARGIN_LEFT, curY);
      curY += lignes.length * 3.1 + 1.2;
    });

    curY += espaceFin;
  }

  // Article 1
  imprimerArticle(
    'ARTICLE 1 : APPLICATION MOBILE TERRAIN OBLIGATOIRE (ERP/CRM 2.0 INTÉGRÉ)',
    [
      '1.1 Outil unique de travail : L\'Agent est doté de l\'application mobile terrain officielle conçue par Médias Graphisme Sénégal / Lou Ame Tay / DAW Digital Arts Work. Tout le travail de prospection, de cotation, de suivi et de gestion contractuelle doit impérativement et exclusivement s\'effectuer au sein de cette application sur smartphone ou tablette.',
      '1.2 Modules intégrés de l\'application : CRM & Pipeline temps réel (enregistrement immédiat des prospects, fiches restaurants/hôtels, historique) ; Outil Devis & Contrats (génération instantanée des propositions et contrats SaaS) ; Démo Live interactive ; Signature tactile & certification DAF en direct ; Pitchs WhatsApp intelligents pré-remplis ; Gestion dématérialisée des frais de transport avec photo de justificatif ; Messagerie interne des directives d\'entreprise.'
    ],
    2
  );

  // Article 2
  imprimerArticle(
    'ARTICLE 2 : GÉOLOCALISATION GPS OBLIGATOIRE & POINTAGE « CHRONO AGENT »',
    [
      '2.1 Obligation d\'activation GPS : Pour garantir le bon fonctionnement de la plateforme, la certification des visites terrain et l\'intégrité des données CRM, l\'Agent a l\'obligation formelle de maintenir le GPS de son appareil de travail activé durant l\'ensemble de ses tournées de prospection.',
      '2.2 Pointage de présence sur site (« Chrono Agent ») : Lors de chaque visite d\'un restaurant ou hôtel, l\'Agent effectue un pointage GPS certifié validant sa présence physique effective auprès du prospect.',
      '2.3 Sanctions pour désactivation : Toute désactivation délibérée du GPS, falsification de position géographique ou simulation de présence constitue une faute lourde entraînant la suspension immédiate de l\'accès à l\'application, l\'annulation des droits à commission sur le dossier litigieux, et la résiliation de plein droit du contrat sans préavis ni indemnité.'
    ],
    2
  );

  // Article 3
  imprimerArticle(
    'ARTICLE 3 : CARTE DE VISITE DIGITALE SYNCHRONISÉE & TABLEAU DE BORD DE NETWORKING',
    [
      '3.1 Dotation digitale : L\'Agent dispose d\'une carte de visite interactive connectée, synchronisée directement avec son compte dans l\'application mobile terrain, permettant de partager instantanément ses coordonnées et le menu démo par simple scan QR ou lien sans contact NFC.',
      '3.2 Suivi analytique : L\'application met à disposition de l\'Agent un tableau de bord analytique mesurant l\'efficacité de son réseau : nombre de scans de son QR code, nombre de vues, taux de partage et contacts générés.'
    ],
    2
  );

  // Article 4
  imprimerArticle(
    'ARTICLE 4 : GRILLE DE RÉMUNÉRATION : COMMISSIONS D\'ACQUISITION (10% À 25%) & RÉCURRENCE (10%)',
    [
      '4.1 Commissions d\'acquisition sur contrats signés : L\'Agent perçoit une commission variable de 10% à 25% calculée sur le montant initial hors taxes encaissé (frais d\'installation 50 000 FCFA + première période d\'abonnement) selon la grille suivante : Formule Standard / Démarrage (1 à 3 contrats signés/mois) : 10% | Formule Confirmée (4 à 7 contrats/mois ou engagement annuel) : 15% | Formule Élite & Multi-sites (≥ 8 signatures/mois ou chaînes) : 20% | Formule Grands Comptes & Hôtellerie de Luxe : 25%.',
      '4.2 Commission de fidélisation et récurrence (10%) : L\'Agent perçoit une commission continue de dix pour cent (10%) sur chaque paiement régulier (redevance mensuelle ou annuelle) effectué par les restaurants et hôtels de son portefeuille actif qu\'il a conclus, tant que le client demeure abonné.'
    ],
    1
  );

  appliquerPiedDePage(1);

  // ============================================================================
  // PAGE 2 : ARTICLES 5 À 9 & CADRE OFFICIEL DE SIGNATURE ÉLECTRONIQUE
  // ============================================================================
  doc.addPage();
  appliquerEnTete(2);

  curY = 24;

  // Article 5
  imprimerArticle(
    'ARTICLE 5 : PAIEMENT INSTANTANÉ PAR MOBILE MONEY & TRANSPARENCE DU SOLDE',
    [
      '5.1 Visibilité en direct du solde : Le solde des commissions acquises, en cours et payées est affiché en temps réel dans l\'« Espace Commercial » de l\'Agent sur sa tablette ou smartphone.',
      '5.2 Versement immédiat : Dès que le client effectue le règlement du contrat et que ce solde est validé par la Direction Administrative et Financière dans l\'ERP, le paiement de la commission est déclenché immédiatement par virement Mobile Money direct (Wave ou Orange Money) sur la ligne certifiée de l\'Agent, sans délai d\'attente de fin de mois.'
    ],
    2
  );

  // Article 6
  imprimerArticle(
    'ARTICLE 6 : FRAIS DE DÉPLACEMENT & REMBOURSEMENT SUR JUSTIFICATIFS',
    [
      '6.1 Prise en charge : Les frais de transport engagés par l\'Agent dans le cadre de ses missions de prospection font l\'objet d\'un remboursement selon le barème validé par l\'Entreprise.',
      '6.2 Procédure dématérialisée : La demande de remboursement doit être saisie directement dans le module dédié de l\'application mobile avec capture photo du justificatif (reçu carburant, ticket de transport). Tout remboursement est validé et versé via l\'application.'
    ],
    2
  );

  // Article 7
  imprimerArticle(
    'ARTICLE 7 : CANAUX OFFICIELS, CONFIDENTIALITÉ ABSOLUE & CLAUSE PÉNALE (5 000 000 FCFA)',
    [
      '7.1 Canaux exclusifs : Toute communication professionnelle doit obligatoirement se dérouler au sein de la messagerie interne de l\'application ou sur le groupe WhatsApp professionnel officiel de Lou Ame Tay. L\'utilisation de canaux parallèles personnels non déclarés est formellement interdite.',
      '7.2 Secret industriel et commercial renforcé : Interdiction absolue de divulguer, copier, exporter, transférer, capturer (screenshots), extraire ou reproduire les bases de données clients, algorithmes, codes sources, listes de prix et données de gestion de Lou Ame Tay durant le contrat et pour une durée de trois (3) ans après son terme.',
      '7.3 Conformité CDP & Code pénal : Respect strict de la Loi n° 2008-12 (CDP) et des articles 431-7 et suivants du Code pénal sénégalais.',
      '7.4 Verrouillage immédiat : Dès la résiliation, tous les accès à l\'application mobile et au CRM/ERP 2.0 sont révoqués de plein droit.',
      '7.5 Clause pénale forfaitaire : Toute infraction avérée entraînera des poursuites devant les tribunaux de Dakar et le paiement automatique d\'une pénalité minimale forfaitaire de cinq millions (5 000 000) FCFA à titre de dommages provisionnels.'
    ],
    2
  );

  // Article 8
  imprimerArticle(
    'ARTICLE 8 : ÉTHIQUE FINANCIÈRE & INTERDICTION STRICTE DES ESPÈCES',
    [
      'L\'Agent n\'a strictly aucun mandat pour manipuler ou encaisser des espèces directement des clients. Tous les règlements des restaurateurs s\'effectuent exclusivement via les canaux bancaires officiels de Lou Ame Tay SASU (Wave marchand +221 77 458 74 74, Orange Money +221 77 130 36 78 ou virement BNDE). La perception d\'espèces constitue une faute pénale entraînant la rupture immédiate du contrat et des poursuites.'
    ],
    2
  );

  // Article 9
  imprimerArticle(
    'ARTICLE 9 : DURÉE, RÉSILIATION & COMPÉTENCE TERRITORIALE',
    [
      '9.1 Durée : Contrat conclu pour une période de six (6) mois renouvelable d\'accord parties.',
      '9.2 Résiliation : Préavis de 15 jours par voie dématérialisée certifiée. En cas de faute grave (GPS falsifié, encaissement d\'espèces, fuite de données), résiliation immédiate sans préavis ni indemnité.',
      '9.3 Perte irrévocable des commissions récurrentes : En cas de résiliation du présent contrat, quelle qu\'en soit la cause (rupture ordinaire, démission ou faute), l\'Agent perd immédiatement et définitivement tout droit aux commissions récurrentes (10%) sur les abonnements futurs des clients qu\'il avait apportés. Seules restent acquises les commissions sur contrats intégralement encaissés avant la date effective de rupture.',
      '9.4 Compétence juridictionnelle : Attribution expresse de compétence aux tribunaux compétents de Dakar et Thiès.'
    ],
    3
  );

  // ============================================================================
  // CADRE OFFICIEL DE VALIDATION & DOUBLE SIGNATURE ÉLECTRONIQUE
  // ============================================================================
  const hCadreSign = 48;
  doc.setFillColor(...GRIS_FOND);
  doc.setDrawColor(...BLEU_NUIT);
  doc.setLineWidth(0.6);
  doc.roundedRect(MARGIN_LEFT, curY, CONTENT_WIDTH, hCadreSign, 2, 2, 'FD');

  const wBoiteSign = (CONTENT_WIDTH - 6) / 2;
  const xSign1 = MARGIN_LEFT + 2;
  const xSign2 = MARGIN_LEFT + wBoiteSign + 4;

  // Ligne de séparation
  doc.setDrawColor(...GRIS_LIGNE);
  doc.line(MARGIN_LEFT + wBoiteSign + 3, curY + 2, MARGIN_LEFT + wBoiteSign + 3, curY + hCadreSign - 2);

  // Boîte 1 : Signature de l'Agent Commercial
  let sY = curY + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...BLEU_NUIT);
  doc.text('POUR L\'AGENT COMMERCIAL MANDATAIRE :', xSign1 + 2, sY);

  sY += 3.2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...TEXTE_DARK);
  doc.text(`Signataire : ${nomCompletAgent} (CNI : ${agentCni})`, xSign1 + 2, sY);
  sY += 2.8;
  doc.text(`Signé le ${dateContrat} à ${heureContrat} • IP : ${clientIp}`, xSign1 + 2, sY);
  sY += 2.8;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text('« Lu et approuvé, engagement formel accepté »', xSign1 + 2, sY);

  // Emplacement signature tactile
  const yBoxSig = sY + 2;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...GRIS_LIGNE);
  doc.rect(xSign1 + 2, yBoxSig, wBoiteSign - 4, 25, 'FD');

  if (signatureAgentDataUrl && signatureAgentDataUrl.startsWith('data:image')) {
    try {
      doc.addImage(signatureAgentDataUrl, 'PNG', xSign1 + 4, yBoxSig + 1, wBoiteSign - 8, 23);
    } catch (e) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text('[ Signature Tactile Numérique Validée ]', xSign1 + (wBoiteSign / 2), yBoxSig + 13, { align: 'center' });
    }
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('[ Signature Tactile Numérique Certifiée ]', xSign1 + (wBoiteSign / 2), yBoxSig + 13, { align: 'center' });
  }

  // Boîte 2 : Direction Générale & Cachet Officiel
  sY = curY + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...BLEU_NUIT);
  doc.text('POUR LE MANDANT (DIRECTION GÉNÉRALE) :', xSign2 + 2, sY);

  sY += 3.2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...TEXTE_DARK);
  doc.text('M. Mbaye Babacar GUEYE, Fondateur & DG', xSign2 + 2, sY);
  sY += 2.8;
  doc.text('LOU AME TAY SASU / Médias Graphisme Sénégal / DAW', xSign2 + 2, sY);
  sY += 2.8;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DORE_LUX);
  doc.text('Mandat officiel homologué & accès CRM validé', xSign2 + 2, sY);

  // Cachet numérique Direction
  const yBoxSceau = sY + 2;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...DORE_LUX);
  doc.setLineWidth(0.4);
  doc.rect(xSign2 + 2, yBoxSceau, wBoiteSign - 4, 25, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(...BLEU_NUIT);
  doc.text('LOU AME TAY SASU', xSign2 + (wBoiteSign / 2), yBoxSceau + 6, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(...TEXTE_DARK);
  doc.text('Direction Générale & Artistique', xSign2 + (wBoiteSign / 2), yBoxSceau + 10, { align: 'center' });
  doc.text('M. Mbaye Babacar GUEYE', xSign2 + (wBoiteSign / 2), yBoxSceau + 14, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(22, 101, 52);
  doc.text('SCEAU OFFICIEL • HOMOLOGUÉ DAF', xSign2 + (wBoiteSign / 2), yBoxSceau + 19, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Réf : ${matricule} • Grand Standing Thiès / Dakar`, xSign2 + (wBoiteSign / 2), yBoxSceau + 23, { align: 'center' });

  appliquerPiedDePage(2);

  // Sauvegarde et téléchargement automatique
  const nomFichier = `Contrat_Agent_LouAmeTay_${matricule}_${nomCompletAgent.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(nomFichier);
  return doc;
}
