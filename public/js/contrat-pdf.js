/**
 * ==============================================================================
 * FICHIER : js/contrat-pdf.js
 * CONTRAT OFFICIEL D'ABONNEMENT ET DE LICENCE SAAS « LOU AME TAY »
 * Plateforme Digitale de Commande sur Table & Gestion Intégrée CHR
 * Édition Officielle Conforme au Droit Sénégalais :
 * - Code des Obligations Civiles et Commerciales (COCC)
 * - Loi n° 2008-08 (Transactions électroniques & signature dématérialisée)
 * - Loi n° 2008-12 (Protection des données CDP Sénégal)
 * - Loi n° 2020-01 (Création et promotion de la startup au Sénégal)
 * - Code de l'Environnement (Loi n° 2001-01) & Orientations RSE
 * Direction Générale : M. Mbaye Babacar GUEYE, Fondateur & CEO
 * Siège social : Grand Standing, Thiès, Sénégal
 * Bureau d'exploitation : Liberté 6 Extension sur la VDN, Dakar, Sénégal
 * Contacts : +221 77 458 74 74 / +221 77 130 36 78
 * ==============================================================================
 */

/**
 * Génère et télécharge le Contrat Officiel SaaS A4 en 2 pages juridiques complètes
 * @param {Object} donnees - Données dynamiques du contrat, client et paiement
 * @returns {Promise<jsPDF>}
 */
export async function genererContratPDFA4(donnees = {}) {
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF) {
    throw new Error('La bibliothèque jsPDF n\'est pas disponible.');
  }

  const maintenant = new Date();
  const dateFormatee = maintenant.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const heureFormatee = maintenant.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const {
    numeroContrat = `LAT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    dateContrat = dateFormatee,
    heureContrat = heureFormatee,
    restaurantNom = 'Établissement Client',
    gerantNom = 'M. le Décideur',
    telephone = '+221 77 --- -- --',
    adresse = 'Adresse de l\'établissement',
    ville = 'Dakar, Sénégal',
    ninea = 'Non communiqué / En cours',
    formule = 'XÉWEUL',
    montantMensuel = '35 000 FCFA/mois',
    montantAcompte = '50 000 FCFA',
    modePaiement = 'Wave Business (+221 77 458 74 74)',
    refPaiement = 'W-VALIDE',
    commercialNom = 'Direction Lou Ame Tay',
    signatureClientDataUrl = null,
    hashEmpreinte = null
  } = donnees;

  // Calcul d'un hash SHA256 simulé d'empreinte électronique si non fourni
  const hashFinal = hashEmpreinte || Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();

  // Initialisation du document jsPDF (Format A4 portrait : 210 x 297 mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Palette chromatique officielle Lou Ame Tay
  const bleuMarine = [11, 31, 58];    // #0B1F3A
  const doreLux = [201, 162, 39];     // #C9A227
  const grisTexte = [71, 85, 105];    // #475569
  const noirTitre = [15, 23, 42];     // #0F172A

  // ============================================================================
  // PAGE 1 : CADRE OPÉRATIONNEL, ENGAGEMENTS RÉCIPROQUES & SÉCURITÉ
  // ============================================================================

  // 1. Bandeau Supérieur Prestige
  doc.setFillColor(...bleuMarine);
  doc.rect(0, 0, 210, 20, 'F');
  doc.setFillColor(...doreLux);
  doc.rect(0, 20, 210, 1.2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('CONTRAT OFFICIEL D\'ABONNEMENT ET DE LICENCE SAAS « LOU AME TAY »', 15, 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(248, 226, 148);
  doc.text('Plateforme Digitale de Commande sur Table & Gestion Intégrée CHR — Édition Officielle — Droit Sénégalais', 15, 16);

  // Réf Contrat & Date
  doc.setTextColor(...noirTitre);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`RÉFÉRENCE OFFICIELLE : ${numeroContrat}`, 15, 26);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...grisTexte);
  doc.text(`Fait à ${ville}, le ${dateContrat} à ${heureContrat}`, 145, 26);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(15, 28, 195, 28);

  // 2. Bloc des Parties Contractantes (2 Colonnes)
  // Colonne Gauche : Le Prestataire
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, 30, 88, 36, 1.5, 1.5, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(15, 30, 88, 36, 1.5, 1.5, 'D');

  doc.setTextColor(...bleuMarine);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('LE PRESTATAIRE (LOU AME TAY SASU) :', 18, 35);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...noirTitre);
  doc.text('LOU AME TAY SASU / Médias Graphisme Sénégal', 18, 40);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...grisTexte);
  doc.text('Direction Générale : M. Mbaye Babacar GUEYE, Fondateur & CEO', 18, 44);
  doc.text('Siège social & Ateliers : Grand Standing, Thiès, Sénégal', 18, 48);
  doc.text('Bureau d\'exploitation : Liberté 6 Extension sur la VDN, Dakar', 18, 52);
  doc.text('Contacts : +221 77 458 74 74 / +221 77 130 36 78', 18, 56);
  doc.text('Email : contact@mgartswork.site / contact@louametay.online', 18, 60);
  doc.text(`Conseiller apporteur : ${commercialNom}`, 18, 64);

  // Colonne Droite : Le Client
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(107, 30, 88, 36, 1.5, 1.5, 'F');
  doc.roundedRect(107, 30, 88, 36, 1.5, 1.5, 'D');

  doc.setTextColor(...bleuMarine);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('L\'ÉTABLISSEMENT CLIENT (LE RESTAURATEUR) :', 110, 35);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...noirTitre);
  doc.text(String(restaurantNom).slice(0, 38), 110, 40);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...grisTexte);
  doc.text(`Représenté par : ${String(gerantNom).slice(0, 38)}`, 110, 44);
  doc.text(`Contact & WhatsApp pro : ${telephone}`, 110, 48);
  doc.text(`Adresse & Région : ${String(adresse).slice(0, 25)}, ${ville}`, 110, 52);
  doc.text(`NINEA / Registre du Commerce : ${ninea}`, 110, 56);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text('Statut : Client Adhérent Partenaire Certifié', 110, 61);

  // 3. Cadre des Visas Juridiques de Référence
  doc.setFillColor(254, 252, 232); // Ambré pâle #FEFCE8
  doc.roundedRect(15, 68, 180, 16, 1.5, 1.5, 'F');
  doc.setDrawColor(254, 240, 138);
  doc.roundedRect(15, 68, 180, 16, 1.5, 1.5, 'D');

  doc.setTextColor(133, 77, 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('VISAS JURIDIQUES DE RÉFÉRENCE (RÉPUBLIQUE DU SÉNÉGAL) :', 18, 72.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(71, 85, 105);
  doc.text('• Code des Obligations Civiles et Commerciales (COCC)   |   • Loi n° 2008-08 (Valeur légale signature tactile & archivage électronique)', 18, 76.5);
  doc.text('• Loi n° 2008-12 (Protection des données à caractère personnel CDP)   |   • Loi n° 2020-01 (Création et promotion de la startup)', 18, 80);
  doc.text('• Code de l\'Environnement de la République du Sénégal (Loi n° 2001-01) et orientations nationales sur la RSE.', 18, 83.5);

  // Ligne Titre Page 1
  doc.setFillColor(...bleuMarine);
  doc.rect(15, 86, 180, 5.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('PAGE 1 : CADRE OPÉRATIONNEL, ENGAGEMENTS RÉCIPROQUES & SÉCURITÉ', 18, 90);

  // ARTICLE 1
  let y = 96;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...bleuMarine);
  doc.text('Article 1 — Objet de la Licence & Formule Souscrite', 15, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...noirTitre);
  y += 4;
  const txt1_1 = doc.splitTextToSize(
    "1.1 Octroi de Licence : Le Prestataire concède au Client, qui l'accepte, une licence d'utilisation non exclusive, personnelle et temporaire de la plateforme SaaS « Lou Ame Tay » (menu interactif QR code, prise de commande sur smartphone, écran tactile cuisine KDS en temps réel et tableau de bord analytique).",
    180
  );
  doc.text(txt1_1, 15, y);

  y += (txt1_1.length * 3.2) + 1.5;
  const fUpper = String(formule).toUpperCase();
  const cTambali = fUpper.includes('TAMBALI') || fUpper.includes('TÀMBALI') ? '[X]' : '[  ]';
  const cNioFar = fUpper.includes('NIO FAR') || fUpper.includes('NIOFAR') ? '[X]' : '[  ]';
  const cXeweul = fUpper.includes('XEWEUL') || fUpper.includes('XÉWEUL') ? '[X]' : '[  ]';
  const cSurMesure = fUpper.includes('SUR') ? '[X]' : '[  ]';

  doc.setFont('helvetica', 'bold');
  doc.text(`1.2 Formule Activée :  ${cTambali} TÀMBALI (15 000 F/m)   |   ${cNioFar} NIO FAR (25 000 F/m)   |   ${cXeweul} XÉWEUL (35 000 F/m)   |   ${cSurMesure} SUR-MESURE`, 15, y);

  y += 4;
  doc.setFont('helvetica', 'normal');
  const txt1_3 = doc.splitTextToSize(
    `1.3 Mise en service & Acompte initial : Forfait d'activation de ${montantAcompte} encaissé à la signature (comprenant la numérisation complète de la carte, l'attribution du sous-domaine sécurisé, la livraison de 15 à 25 supports de table QR codes haute résistance et la formation de l'équipe sur site). Référence de transaction Wave/OM : ${refPaiement} — Canal : ${modePaiement}.`,
    180
  );
  doc.text(txt1_3, 15, y);

  // ARTICLE 2
  y += (txt1_3.length * 3.2) + 2.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...bleuMarine);
  doc.text('Article 2 — Équilibre Contractuel & Engagements Réciproques (Gagnant-Gagnant)', 15, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...noirTitre);
  y += 4;
  const txt2_1 = doc.splitTextToSize(
    "2.1 Obligations et Garanties de Lou Ame Tay : (a) Garantie de Disponibilité (SLA) : Disponibilité garantie de 99,5% hors périodes de maintenance programmées la nuit. (b) Résilience Réseau Locale : Fonctionnement en mode résilient / hors-ligne pour permettre la consultation ininterrompue des menus même lors des perturbations de connexion internet. (c) Support Proactif 7j/7 : Assistance réactive en Français et Wolof via le canal WhatsApp dédié et intervention technique rapide sous 30 à 45 minutes en zone urbaine (Dakar et Thiès). (d) Évolutions Logicielles Incluses : Mises à jour correctives et nouvelles fonctionnalités intégrées sans surcoût.",
    180
  );
  doc.text(txt2_1, 15, y);

  y += (txt2_1.length * 3.2) + 1.5;
  const txt2_2 = doc.splitTextToSize(
    "2.2 Obligations du Restaurateur : (a) Ponctualité des Paiements : Règlement des mensualités à date convenue par Mobile Money (Wave / Orange Money) ou virement BNDE. (b) Exactitude des Données Alimentaires : Fourniture d'informations vérifiées sur les prix, les allergènes et les compositions culinaires. (c) Sécurité Interne des Accès : Préservation de la confidentialité des identifiants et codes PIN transmis au personnel de salle et de cuisine.",
    180
  );
  doc.text(txt2_2, 15, y);

  // ARTICLE 3
  y += (txt2_2.length * 3.2) + 2.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...bleuMarine);
  doc.text('Article 3 — Sécurité Cloud, Étanchéité & Propriété Totale des Données Client', 15, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...noirTitre);
  y += 4;
  const txt3_1 = doc.splitTextToSize(
    "3.1 Propriété Inaliénable des Données du Restaurateur : Le Client conserve la propriété exclusive, intégrale et perpétuelle de l'ensemble de ses données commerciales, fichiers clients, historiques de commandes et statistiques de vente. Lou Ame Tay s'interdit formellement toute commercialisation, exploitation dérivée ou transmission à des tiers.",
    180
  );
  doc.text(txt3_1, 15, y);

  y += (txt3_1.length * 3.2) + 1.5;
  const txt3_2 = doc.splitTextToSize(
    "3.2 Chiffrement & Sécurité : Hébergement cloud haute sécurité bénéficiant d'un protocole SSL/TLS 256 bits conforme aux standards de sécurisation bancaire, avec sauvegardes automatisées quotidiennes.",
    180
  );
  doc.text(txt3_2, 15, y);

  y += (txt3_2.length * 3.2) + 1.5;
  const txt3_3 = doc.splitTextToSize(
    "3.3 Conformité CDP (Loi n° 2008-12) : Traitement loyal et sécurisé des données nominatives des consommateurs finaux dans le strict respect des directives de la Commission de Protection des Données Personnelles du Sénégal.",
    180
  );
  doc.text(txt3_3, 15, y);

  y += (txt3_3.length * 3.2) + 1.5;
  const txt3_4 = doc.splitTextToSize(
    "3.4 Droit de Réversibilité : En cas de cessation des relations contractuelles, le Client bénéficie de la restitution intégrale et gratuite de ses données sous format standard ouvert (Excel / CSV) dans un délai de trente (30) jours.",
    180
  );
  doc.text(txt3_4, 15, y);

  // Pied de Page 1
  doc.setFontSize(6.8);
  doc.setTextColor(148, 163, 184);
  doc.line(15, 284, 195, 284);
  doc.text(`Contrat Lou Ame Tay SaaS — Réf. ${numeroContrat} — Page 1/2 — Droits & Lois de la République du Sénégal`, 15, 288);
  doc.text('Direction Générale M. Mbaye Babacar GUEYE (+221 77 458 74 74)', 130, 288);

  // ============================================================================
  // PAGE 2 : RSE, PROPRIÉTÉ INTELLECTUELLE, CLAUSE PÉNALE & SIGNATURES
  // ============================================================================
  doc.addPage('a4', 'portrait');

  // Mini-Bandeau supérieur Page 2
  doc.setFillColor(...bleuMarine);
  doc.rect(0, 0, 210, 13, 'F');
  doc.setFillColor(...doreLux);
  doc.rect(0, 13, 210, 1, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`LOU AME TAY ? — CONTRAT DE LICENCE SAAS (SUITE) — RÉF. ${numeroContrat}`, 15, 8.5);

  // Ligne Titre Page 2
  doc.setFillColor(...bleuMarine);
  doc.rect(15, 17, 180, 5.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('PAGE 2 : TRANSITION ÉCOLOGIQUE RSE, PROTECTION INTELLECTUELLE & VALIDATION', 18, 21);

  // ARTICLE 4 : PACTE RSE
  let y2 = 27;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...bleuMarine);
  doc.text('Article 4 — Pacte RSE, Écologie Numérique & Préservation de l\'Environnement', 15, y2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...noirTitre);
  y2 += 4;
  const txt4_1 = doc.splitTextToSize(
    "4.1 Alignement RSE & Code de l'Environnement : Le présent contrat formalise l'engagement mutuel des parties en faveur du développement durable et de la réduction de l'empreinte écologique dans le secteur de la restauration au Sénégal, conformément à la Loi n° 2001-01.",
    180
  );
  doc.text(txt4_1, 15, y2);

  y2 += (txt4_1.length * 3.2) + 1.2;
  const txt4_2 = doc.splitTextToSize(
    "4.2 Suppression du Plastique & Économie Circulaire : Élimination complète des cartes plastifiées pelliculées non biodégradables et des réimpressions papier systématiques génératrices de déchets. Fourniture exclusive de chevalets et supports de table durables et recyclables signés Médias Graphisme Sénégal.",
    180
  );
  doc.text(txt4_2, 15, y2);

  y2 += (txt4_2.length * 3.2) + 1.2;
  const txt4_3 = doc.splitTextToSize(
    "4.3 Lutte Active contre le Gaspillage Alimentaire : Le système d'interrupteur instantané de rupture de stock et la mise en avant dynamique du « Plat du Jour » permettent d'écouler les denrées périssables, réduisant les pertes alimentaires en cuisine de plus de 30%.",
    180
  );
  doc.text(txt4_3, 15, y2);

  y2 += (txt4_3.length * 3.2) + 1.2;
  const txt4_4 = doc.splitTextToSize(
    "4.4 Attribution du Label Éco-Restaurateur : Le Prestataire délivre au Client le macaron officiel numérique et physique « Éco-Restaurateur Engagé — Partenaire RSE Lou Ame Tay », attestant de sa démarche écoresponsable auprès de sa clientèle.",
    180
  );
  doc.text(txt4_4, 15, y2);

  // ARTICLE 5 : PROPRIÉTÉ INTELLECTUELLE & CLAUSE PÉNALE
  y2 += (txt4_4.length * 3.2) + 2.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...bleuMarine);
  doc.text('Article 5 — Propriété Intellectuelle Stricte & Clause Pénale Anti-Plagiat', 15, y2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...noirTitre);
  y2 += 4;
  const txt5_1 = doc.splitTextToSize(
    "5.1 Droits Exclusifs : La plateforme « Lou Ame Tay », son architecture logicielle, ses algorithmes, ses codes sources, ses interfaces graphiques, sa marque et ses concepts demeurent la propriété exclusive et inaliénable de Lou Ame Tay SASU et de son créateur, M. Mbaye Babacar GUEYE.",
    180
  );
  doc.text(txt5_1, 15, y2);

  y2 += (txt5_1.length * 3.2) + 1.2;
  const txt5_2 = doc.splitTextToSize(
    "5.2 Interdiction Formelle de Reproduction : Toute tentative de rétro-ingénierie, décompilation, copie d'écran servile, plagiat ou transfert de code est strictement interdite.",
    180
  );
  doc.text(txt5_2, 15, y2);

  y2 += (txt5_2.length * 3.2) + 1.2;
  const txt5_3 = doc.splitTextToSize(
    "5.3 Sanction Forfaitaire & Poursuites Judiciaires : Toute infraction constatée entraînera la coupure immédiate des accès, la résiliation sans indemnité du présent contrat et l'exigibilité de plein droit d'une clause pénale forfaitaire et provisionnelle minimale de dix millions (10 000 000) de Francs CFA, sans préjudice de poursuites pénales et civiles devant les tribunaux compétents de Dakar.",
    180
  );
  doc.text(txt5_3, 15, y2);

  // ARTICLE 6 : CONFIDENTIALITÉ ABSOLUE
  y2 += (txt5_3.length * 3.2) + 2.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...bleuMarine);
  doc.text('Article 6 — Confidentialité Absolue', 15, y2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...noirTitre);
  y2 += 4;
  const txt6 = doc.splitTextToSize(
    "Chacune des parties s'engage à observer le secret le plus strict sur les méthodes de gestion, conditions tarifaires préférentielles, codes sources et algorithmes de la solution, pendant toute la durée d'exécution du contrat et pendant une durée de cinq (5) ans suivant son expiration.",
    180
  );
  doc.text(txt6, 15, y2);

  // ARTICLE 7 : DURÉE, RÉSILIATION & COMPÉTENCE
  y2 += (txt6.length * 3.2) + 2.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...bleuMarine);
  doc.text('Article 7 — Durée, Résiliation & Compétence Juridictionnelle', 15, y2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...noirTitre);
  y2 += 4;
  const txt7 = doc.splitTextToSize(
    "7.1 Durée : Contrat conclu pour une période initiale ferme de trois (3) mois, reconductible tacitement de mois en mois. 7.2 Résiliation : Résiliation libre après la période initiale moyennant un préavis écrit de trente (30) jours formulé par voie électronique certifiée (WhatsApp d'entreprise ou email officiel). 7.3 Attribution de Compétence : En cas de différend non résolu par voie amiable sous quinze (15) jours, compétence expresse et exclusive est conférée au Tribunal de Commerce Hors Classe de Dakar et aux juridictions du ressort de la Cour d'Appel de Dakar (Sénégal).",
    180
  );
  doc.text(txt7, 15, y2);

  // ============================================================================
  // CADRE DE VALIDATION NUMÉRIQUE & MANDAT D'ACTIVATION
  // ============================================================================
  y2 += (txt7.length * 3.2) + 4;

  doc.setFillColor(...bleuMarine);
  doc.rect(15, y2, 180, 5.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('CADRE DE VALIDATION NUMÉRIQUE & MANDAT D\'ACTIVATION (DROIT SÉNÉGALAIS)', 18, y2 + 4);

  y2 += 7;

  // Boîte 2 Colonnes pour les Signatures
  // 1. Colonne Gauche : LE RESTAURATEUR (LE CLIENT)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, y2, 88, 72, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(15, y2, 88, 72, 2, 2, 'D');

  doc.setTextColor(...bleuMarine);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('POUR LE RESTAURATEUR (LE CLIENT) :', 19, y2 + 6);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.8);
  doc.setTextColor(22, 101, 52);
  doc.text('« Bon pour accord et mandat d\'activation »', 19, y2 + 10.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...noirTitre);
  doc.text(`Identité : ${String(gerantNom).slice(0, 32)}`, 19, y2 + 15.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...grisTexte);
  doc.text(`Établissement : ${String(restaurantNom).slice(0, 30)}`, 19, y2 + 19.5);
  doc.text(`Horodatage certifié : ${dateContrat} à ${heureContrat}`, 19, y2 + 23.5);

  // Emplacement de la signature tactile capturée
  doc.setDrawColor(201, 162, 39);
  doc.setLineWidth(0.5);
  doc.roundedRect(19, y2 + 26, 80, 28, 1, 1, 'D');

  if (signatureClientDataUrl) {
    try {
      doc.addImage(signatureClientDataUrl, 'PNG', 20, y2 + 27, 78, 26);
    } catch (e) {
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.text('[Signature Électronique Validée sur Écran]', 26, y2 + 41);
    }
  } else {
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.text('[Signature Électronique Validée sur Écran]', 26, y2 + 41);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(...grisTexte);
  doc.text(`Empreinte Numérique : SHA256-${hashFinal}`, 19, y2 + 58);
  doc.text(`Réf. Reçu Mobile Money : ${refPaiement} (${modePaiement.split(' ')[0]})`, 19, y2 + 62);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text('✓ VALIDATION TACTILE CONFORME LOI 2008-08', 19, y2 + 67);

  // 2. Colonne Droite : LOU AME TAY SASU (LE PRESTATAIRE)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(107, y2, 88, 72, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(107, y2, 88, 72, 2, 2, 'D');

  doc.setTextColor(...bleuMarine);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('POUR LOU AME TAY SASU (LE PRESTATAIRE) :', 111, y2 + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...grisTexte);
  doc.text('Visa Direction Générale & Validation Technique', 111, y2 + 10.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...noirTitre);
  doc.text('M. Mbaye Babacar GUEYE', 111, y2 + 15.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...grisTexte);
  doc.text('Fondateur, Directeur Général & CEO', 111, y2 + 19.5);
  doc.text('Lou Ame Tay SASU / Médias Graphisme Sénégal', 111, y2 + 23.5);

  // Tampon & Cachet Officiel Scellé
  doc.setFillColor(254, 243, 199); // Ambré clair #FEF3C7
  doc.roundedRect(111, y2 + 26, 80, 28, 1.5, 1.5, 'F');
  doc.setDrawColor(201, 162, 39);
  doc.setLineWidth(1);
  doc.roundedRect(111, y2 + 26, 80, 28, 1.5, 1.5, 'D');

  doc.setTextColor(...bleuMarine);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('DIRECTION GÉNÉRALE — LOU AME TAY SASU', 118, y2 + 32);

  doc.setFontSize(6.5);
  doc.setTextColor(180, 83, 9);
  doc.text('MÉDIAS GRAPHISME SÉNÉGAL / MDA ARTS WORK', 116, y2 + 37);

  doc.setFontSize(6);
  doc.setTextColor(...grisTexte);
  doc.text('Thiès (Grand Standing) & Dakar (VDN Liberté 6 Extension)', 114, y2 + 42);
  doc.text('Coordination Administrative : BNDE / Wave (+221 77 458 74 74)', 113, y2 + 46);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(22, 101, 52);
  doc.text('✓ CACHET D\'ENTREPRISE SCELLÉ & SIGNÉ NUMÉRIQUEMENT', 113, y2 + 51);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(...grisTexte);
  doc.text('Plateforme : https://louametay.online — contact@louametay.online', 111, y2 + 58);
  doc.text(`Acompte perçu : ${montantAcompte} | Activation immédiate`, 111, y2 + 62);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(2, 132, 199);
  doc.text('SCELLÉ ÉLECTRONIQUE CONFORME DROIT SÉNÉGALAIS', 111, y2 + 67);

  // Pied de Page 2
  doc.setFontSize(6.8);
  doc.setTextColor(148, 163, 184);
  doc.line(15, 284, 195, 284);
  doc.text(`Contrat Lou Ame Tay SaaS — Réf. ${numeroContrat} — Page 2/2 — Signature Électronique Certifiée`, 15, 288);
  doc.text('Tribunal de Commerce Hors Classe de Dakar (Sénégal)', 130, 288);

  // Téléchargement automatique du fichier PDF
  const nomFichier = `Contrat_LouAmeTay_${String(restaurantNom).replace(/[^a-zA-Z0-9]/g, '_')}_${numeroContrat}.pdf`;
  doc.save(nomFichier);

  return doc;
}
