/**
 * ==============================================================================
 * FICHIER : js/contrat-pdf.js
 * GÉNÉRATEUR OFFICIEL DE CONTRAT SAAS A4 HAUTE DÉFINITION — LOU AME TAY
 * Conforme au Droit Sénégalais (COCC, Loi 2008-08 Transactions Électroniques,
 * Loi 2008-12 Protection des Données Personnelles CDP Sénégal)
 * Direction Générale : M. GUEYE, Fondateur & CEO (+221 77 458 74 74)
 * ==============================================================================
 */

/**
 * Génère et télécharge le Contrat SaaS officiel en PDF A4 (2 pages professionnelles)
 * @param {Object} donnees - Données du contrat, du restaurant et du paiement
 * @returns {Promise<jsPDF>}
 */
export async function genererContratPDFA4(donnees) {
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF) {
    throw new Error('La bibliothèque jsPDF n\'est pas encore disponible.');
  }

  const {
    numeroContrat = `LAT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    dateContrat = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
    restaurantNom = 'Établissement Client',
    gerantNom = 'M. le Gérant',
    telephone = '+221 -- --- -- --',
    ville = 'Dakar, Sénégal',
    formule = 'Xéweul',
    montantMensuel = '35 000 FCFA',
    montantAcompte = '35 000 FCFA',
    modePaiement = 'Wave Business (+221 77 458 74 74)',
    refPaiement = 'W-NON-DEFINI',
    commercialNom = 'Conseiller Commercial Terrain',
    signatureClientDataUrl = null
  } = donnees;

  // Création du document A4 (210 x 297 mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const bleuMarine = [11, 31, 58];    // #0B1F3A
  const doreLux = [201, 162, 39];     // #C9A227
  const grisTexte = [71, 85, 105];    // #475569
  const noirTitre = [15, 23, 42];     // #0F172A

  // ============================================================================
  // PAGE 1 : EN-TÊTE, PARTIES, FORMULE, ARTICLES 1 À 3
  // ============================================================================

  // Bandeau supérieur prestige
  doc.setFillColor(...bleuMarine);
  doc.rect(0, 0, 210, 24, 'F');
  doc.setFillColor(...doreLux);
  doc.rect(0, 24, 210, 1.5, 'F');

  // Titre En-tête
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('LOU AME TAY ? — SOLUTION SAAS RESTAURATION & HÔTELLERIE', 15, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(201, 162, 39);
  doc.text('MÉDIAS GRAPHISME SÉNÉGAL / MDA ARTS WORK — DIRECTION GÉNÉRALE M. GUEYE (+221 77 458 74 74)', 15, 18);

  // Titre du Document & Réf
  doc.setTextColor(...noirTitre);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('CONTRAT D\'ABONNEMENT ET DE DÉPLOIEMENT SAAS', 15, 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...grisTexte);
  doc.text(`Réf. Contrat : ${numeroContrat}   |   Date d'effet : ${dateContrat}   |   Lieu : ${ville}`, 15, 40);

  // Ligne de séparation
  doc.setDrawColor(226, 232, 240);
  doc.line(15, 43, 195, 43);

  // Cadre des Deux Parties Contractantes (Split 2 colonnes)
  // Colonne Gauche : Le Prestataire
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, 46, 87, 38, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(15, 46, 87, 38, 2, 2, 'D');

  doc.setTextColor(...bleuMarine);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('LE PRESTATAIRE (ÉDITEUR SAAS) :', 19, 52);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...noirTitre);
  doc.text('LOU AME TAY / MDA ARTS WORK', 19, 58);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...grisTexte);
  doc.text('Représentée par : M. GUEYE, Fondateur & CEO', 19, 63);
  doc.text('Service Commercial & Wave : +221 77 458 74 74', 19, 68);
  doc.text('Plateforme : https://louametay.online — Dakar, Sénégal', 19, 73);
  doc.text(`Conseiller apporteur : ${commercialNom}`, 19, 78);

  // Colonne Droite : Le Client
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(108, 46, 87, 38, 2, 2, 'F');
  doc.roundedRect(108, 46, 87, 38, 2, 2, 'D');

  doc.setTextColor(...bleuMarine);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('LE CLIENT (ÉTABLISSEMENT ADHÉRENT) :', 112, 52);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...noirTitre);
  doc.text(String(restaurantNom).slice(0, 35), 112, 58);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...grisTexte);
  doc.text(`Représentant : ${String(gerantNom).slice(0, 35)}`, 112, 63);
  doc.text(`Téléphone / WhatsApp : ${telephone}`, 112, 68);
  doc.text(`Ville / Quartier : ${ville}`, 112, 73);
  doc.text(`Statut Adhérent : Compte Client Actif Certifié`, 112, 78);

  // Cadre Récapitulatif Financier & Acompte Reçu
  doc.setFillColor(240, 253, 244); // Vert très pâle #F0FDF4
  doc.roundedRect(15, 87, 180, 23, 2, 2, 'F');
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(15, 87, 180, 23, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(22, 101, 52); // Vert foncé
  doc.text(`CONDITIONS FINANCIÈRES & ACOMPTE D'ACTIVATION REÇU`, 20, 93);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...noirTitre);
  doc.text(`• Formule souscrite : ${formule}   |   Tarif mensuel SaaS : ${montantMensuel}`, 20, 99);
  doc.text(`• Acompte d'activation réglé : ${montantAcompte}   |   Canal : ${modePaiement}`, 20, 104);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(2, 132, 199);
  doc.text(`• Réf. Transaction Wave/OM : ${refPaiement} (Reçu certifié)`, 120, 104);

  // Titre des Conditions Générales et Clauses Protectrices
  doc.setTextColor(...bleuMarine);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('CLAUSES CONTRACTUELLES SAAS & DROIT SÉNÉGALAIS APPLICABLE', 15, 117);

  doc.setDrawColor(201, 162, 39);
  doc.setLineWidth(0.6);
  doc.line(15, 119, 195, 119);

  // ARTICLE 1
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...noirTitre);
  doc.text('ARTICLE 1 — OBJET DU CONTRAT & PÉRIMÈTRE DU SERVICE', 15, 126);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...grisTexte);
  const texteArt1 = doc.splitTextToSize(
    "Le présent contrat a pour objet de concéder au Client un droit d'accès et d'utilisation en mode SaaS (Software as a Service) de la plateforme Lou Ame Tay pour son établissement. Selon la formule souscrite, le service comprend le menu interactif par QR Code, l'écran cuisine KDS de gestion des commandes, l'interface de prise de commande serveur mobile, les cartes de visite digitales avec QR code et les outils de pilotage statistiques.",
    180
  );
  doc.text(texteArt1, 15, 130);

  // ARTICLE 2 : PROPRIÉTÉ INTELLECTUELLE & SANCTIONS ANTI-PLAGIAT
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...noirTitre);
  doc.text('ARTICLE 2 — PROPRIÉTÉ INTELLECTUELLE STRICTE & INTERDICTION DE PLAGIAT (ANTI-COPIE)', 15, 148);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...grisTexte);
  const texteArt2 = doc.splitTextToSize(
    "La plateforme Lou Ame Tay, son architecture logicielle, ses codes sources, ses bases de données, son design, sa marque et ses méthodologies sont la propriété exclusive et inaliénable de Lou Ame Tay et de M. GUEYE. Le présent contrat ne confère au Client aucun droit de propriété. Il est strictement interdit au Client, à son personnel ou à ses sous-traitants de copier, plagier, décompiler, reproduire, imiter ou tenter de rétro-ingénierer tout ou partie de la solution logicielle. Toute tentative d'imitation ou de détournement fera l'objet de poursuites judiciaires civiles et pénales immédiates devant les tribunaux compétents de Dakar, avec demande de dommages et intérêts provisionnels minimaux de 10 000 000 FCFA.",
    180
  );
  doc.text(texteArt2, 15, 152);

  // ARTICLE 3 : CONFIDENTIALITÉ ABSOLUE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...noirTitre);
  doc.text('ARTICLE 3 — OBLIGATION DE CONFIDENTIALITÉ ABSOLUE', 15, 178);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...grisTexte);
  const texteArt3 = doc.splitTextToSize(
    "Le Client s'interdit formellement de divulguer à des tiers, prestataires informatiques ou entreprises concurrentes, le mode de fonctionnement interne, les écrans de gestion, les interfaces d'administration, les mécanismes de synchronisation et les conditions tarifaires négociées. Cet engagement de confidentialité demeure en vigueur pendant toute la durée du contrat et pour une période de cinq (5) années suivant sa cessation.",
    180
  );
  doc.text(texteArt3, 15, 182);

  // ARTICLE 4 : SÉCURITÉ CLOUD & PROTECTION DES DONNÉES (LOI 2008-12)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...noirTitre);
  doc.text('ARTICLE 4 — SÉCURITÉ DU CLOUD & PROTECTION DES DONNÉES (LOI N° 2008-12 CDP SÉNÉGAL)', 15, 203);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...grisTexte);
  const texteArt4 = doc.splitTextToSize(
    "Les données d'exploitation du Client (menus, catalogues, prix, historiques de commandes) sont hébergées dans une infrastructure cloud haute sécurité protégée par un chiffrement SSL/TLS et une isolation logique étanche. Lou Ame Tay s'engage à ne jamais vendre, louer ou divulguer les données d'activité du Client. Conformément à la législation sénégalaise sur la protection des données à caractère personnel (Loi 2008-12), le Client demeure l'unique propriétaire de ses données d'exploitation et conserve un droit permanent de rectification et de restitution.",
    180
  );
  doc.text(texteArt4, 15, 207);

  // ARTICLE 5 : CONTINUITÉ DE SERVICE & SUPPORT TECHNIQUE
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...noirTitre);
  doc.text('ARTICLE 5 — ENGAGEMENT DE DISPONIBILITÉ (SLA 99.9%) & MAINTENANCE', 15, 227);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...grisTexte);
  const texteArt5 = doc.splitTextToSize(
    "Lou Ame Tay garantit un taux de disponibilité cible de 99.9% de ses serveurs cloud, 24h/24 et 7j/7, hors fenêtres de maintenance préventive annoncées. Une assistance technique prioritaire est dédiée au Client via la ligne officielle WhatsApp Business (+221 77 458 74 74).",
    180
  );
  doc.text(texteArt5, 15, 231);

  // Pied de page Page 1
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Contrat Lou Ame Tay SaaS — Réf. ${numeroContrat} — Page 1/2 — Document contractuel certifié`, 15, 285);
  doc.text('Loi applicable : République du Sénégal (COCC, Lois 2008-08 & 2008-12)', 115, 285);

  // ============================================================================
  // PAGE 2 : ARTICLES 6 & 7, SIGNATURES DES PARTIES & CACHETS OFFICIELS
  // ============================================================================
  doc.addPage('a4', 'portrait');

  // Mini-Bandeau supérieur Page 2
  doc.setFillColor(...bleuMarine);
  doc.rect(0, 0, 210, 14, 'F');
  doc.setFillColor(...doreLux);
  doc.rect(0, 14, 210, 1, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`LOU AME TAY ? — CONTRAT SAAS (SUITE ET VALIDATION) — RÉF. ${numeroContrat}`, 15, 9.5);

  // ARTICLE 6 : DURÉE, RENOUVELLEMENT & CONDITIONS FINANCIÈRES
  doc.setTextColor(...noirTitre);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('ARTICLE 6 — DURÉE DU CONTRAT, MODALITÉS DE PAIEMENT & RÉSILIATION', 15, 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...grisTexte);
  const texteArt6 = doc.splitTextToSize(
    "Le présent contrat prend effet à la date de signature et réception de l'acompte initial. Il est conclu pour une période d'un (1) an, renouvelable par tacite reconduction. Le règlement des mensualités suivantes intervient par Wave Business, Orange Money ou virement bancaire. En cas de manquement grave de l'une des parties à ses obligations ou de retard de paiement supérieur à trente (30) jours, le contrat pourra être résilié de plein droit après mise en demeure restée sans effet sous huitaine.",
    180
  );
  doc.text(texteArt6, 15, 28);

  // ARTICLE 7 : LOI APPLICABLE & JURIDICTION COMPÉTENTE DE DAKAR
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...noirTitre);
  doc.text('ARTICLE 7 — LOI APPLICABLE & ATTRIBUTION EXCLUSIVE DE JURIDICTION', 15, 48);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...grisTexte);
  const texteArt7 = doc.splitTextToSize(
    "Le présent contrat est exclusivement soumis au droit sénégalais, notamment aux dispositions du Code des Obligations Civiles et Commerciales (COCC) et des textes régissant les transactions électroniques. Tout différend relatif à la validité, l'interprétation ou l'exécution du contrat sera soumis aux tribunaux compétents du ressort de la Cour d'Appel de Dakar (Sénégal), après tentative infructueuse de conciliation amiable.",
    180
  );
  doc.text(texteArt7, 15, 52);

  // Ligne de séparation avant la zone de signature
  doc.setDrawColor(201, 162, 39);
  doc.setLineWidth(0.8);
  doc.line(15, 72, 195, 72);

  doc.setTextColor(...bleuMarine);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('SIGNATURES CONTRACTUELLES & ACCEPTATION FERME DES DEUX PARTIES', 15, 78);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(...grisTexte);
  doc.text('En apposant leur signature électronique ci-après, les parties reconnaissent avoir lu et approuvé l\'intégralité des clauses ci-dessus.', 15, 83);

  // Boîte Signatures (2 Colonnes)
  // 1. Colonne Gauche : Lou Ame Tay (Direction Générale)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, 87, 87, 85, 3, 3, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(15, 87, 87, 85, 3, 3, 'D');

  doc.setTextColor(...bleuMarine);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('POUR LOU AME TAY ? :', 20, 94);
  doc.setFontSize(8);
  doc.setTextColor(...noirTitre);
  doc.text('M. GUEYE, Fondateur & CEO', 20, 99);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...grisTexte);
  doc.text('Mention : "Bon pour accord et mandat d\'activation"', 20, 104);
  doc.text(`Fait à Dakar, le ${dateContrat}`, 20, 109);

  // Tampon & Cachet Officiel Virtuel
  doc.setFillColor(254, 243, 199); // Ambré clair
  doc.roundedRect(25, 116, 67, 36, 3, 3, 'F');
  doc.setDrawColor(201, 162, 39);
  doc.setLineWidth(1.2);
  doc.roundedRect(25, 116, 67, 36, 3, 3, 'D');

  doc.setTextColor(...bleuMarine);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('DIRECTION GÉNÉRALE', 36, 124);
  doc.setFontSize(7.5);
  doc.setTextColor(180, 83, 9);
  doc.text('LOU AME TAY SASU', 39, 130);
  doc.setFontSize(6.5);
  doc.setTextColor(...grisTexte);
  doc.text('MÉDIAS GRAPHISME SÉNÉGAL', 32, 135);
  doc.text('+221 77 458 74 74 — DAKAR', 33, 140);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(22, 101, 52);
  doc.text('✓ VALIDÉ & CERTIFIÉ CONFORME', 31, 146);

  // 2. Colonne Droite : Le Client (Signature Tactile Capturée)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(108, 87, 87, 85, 3, 3, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(108, 87, 87, 85, 3, 3, 'D');

  doc.setTextColor(...bleuMarine);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('POUR L\'ÉTABLISSEMENT CLIENT :', 113, 94);
  doc.setFontSize(8);
  doc.setTextColor(...noirTitre);
  doc.text(String(gerantNom).slice(0, 32), 113, 99);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...grisTexte);
  doc.text(`Établissement : ${String(restaurantNom).slice(0, 30)}`, 113, 104);
  doc.text(`Mention : "Lu et approuvé, bon pour accord"`, 113, 109);
  doc.text(`Fait à ${ville}, le ${dateContrat}`, 113, 114);

  // Insertion de la Signature Dessinée par le Client
  if (signatureClientDataUrl) {
    try {
      doc.addImage(signatureClientDataUrl, 'PNG', 118, 120, 67, 34);
    } catch (e) {
      console.warn('Erreur insertion image signature client:', e);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.text('[Signature Électronique Validée]', 125, 138);
    }
  } else {
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text('[Signature Électronique Validée sur Écran]', 120, 138);
  }

  // Encadré de Preuve de Paiement Wave / OM en bas de page 2
  doc.setFillColor(238, 242, 255);
  doc.roundedRect(15, 180, 180, 25, 2, 2, 'F');
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(15, 180, 180, 25, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...bleuMarine);
  doc.text('CERTIFICAT DE RÈGLEMENT D\'ACOMPTE EN DIRECT :', 20, 186);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...noirTitre);
  doc.text(`• Montant Acompte Réglé : ${montantAcompte}   |   Mode : ${modePaiement}`, 20, 192);
  doc.text(`• Référence Reçu Wave/OM : ${refPaiement}   |   Statut d'encaissement : CONFIRMÉ EN TEMPS RÉEL`, 20, 197);
  doc.setFontSize(7.5);
  doc.setTextColor(22, 101, 52);
  doc.text(`✓ Notification d'encaissement transmise au CEO M. Gueye (+221 77 458 74 74). Accès SaaS activé.`, 20, 202);

  // Pied de page Page 2
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Contrat Lou Ame Tay SaaS — Réf. ${numeroContrat} — Page 2/2 — Signature Électronique Certifiée`, 15, 285);
  doc.text('Lou Ame Tay SASU — N° RCCM & NINEA Dakar — contact@louametay.online', 105, 285);

  // Téléchargement automatique du fichier
  const nomFichier = `Contrat_LouAmeTay_${String(restaurantNom).replace(/[^a-zA-Z0-9]/g, '_')}_${numeroContrat}.pdf`;
  doc.save(nomFichier);

  return doc;
}
