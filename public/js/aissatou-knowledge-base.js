/**
 * ==============================================================================
 * FICHIER : js/aissatou-knowledge-base.js
 * MOTEUR RAG & BASE DE CONNAISSANCES DE L'ASSISTANTE IA AISSATOU
 * Lou Ame Tay SASU — DAW Digital Arts Work by MG
 * ==============================================================================
 * Connecte Aissatou à sa base de connaissances officielle (9 fiches Markdown) :
 * 1. Mode RAG Client / Hybride : Recherche sémantique par mots-clés pondérés,
 *    avec fallback 100% hors-ligne (Offline-First garanti pour le terrain).
 * 2. Connecteur Gemini API (modèles gemini-1.5-flash / gemini-2.5-flash) si clé
 *    définie, injectant le contexte RAG ciblé dans le prompt système.
 * 3. Réponse standardisée avec citations de fiches : "📚 Source : Fiche XX — ..."
 *    et recommandation opérationnelle : "💡 Action terrain : ...".
 */

import { AISSATOU_IDENTITY, AISSATOU_SYSTEM_PROMPT } from './aissatou-personality.js';

// Index officiel des 9 fiches de connaissances
export const AISSATOU_KNOWLEDGE_DOCS = [
  {
    id: '01',
    code: 'Fiche 01',
    titre: 'Marché CHR Sénégal',
    fichier: '02_marche_chr.md',
    tags: ['marché', 'chiffres', 'statistiques', 'dakar', 'thiès', 'saly', 'restaurants', 'hôtels', '4500', '7 sur 10', 'qr code', 'chiffre'],
    resume: '4 500 restaurants au Sénégal, 1 586 établissements touristiques. 57% à Dakar, 15% Thiès, 12% Saly/Mbour. 89% pénétration mobile, 7/10 utilisent un menu QR à Dakar.',
    pointsCles: [
      '4 500 restaurants au Sénégal dont 57% situés à Dakar et 15% à Thiès.',
      '7 restaurants sur 10 à Dakar ont déjà adopté un menu QR.',
      'Paiement mobile Wave et Orange Money incontournable.',
      'Axe Thiès-Dakar-Mbour concentre plus de 80% du marché CHR national.'
    ]
  },
  {
    id: '02',
    code: 'Fiche 02',
    titre: 'Concurrents Lou Ame Tay',
    fichier: '03_concurrents.md',
    tags: ['concurrent', 'concurrence', 'mafalia', 'scanifood', 'spoon africa', 'taarih', 'flipdish', 'avantage', 'différence', 'comparatif'],
    resume: 'Cartographie concurrentielle : Mafalia (achats grossistes, pas de salle ni KDS), ScaniFood (QR statique sans KDS ni paiement), Spoon Africa (app à télécharger), Flipdish (cher, sans support local ni Wave natif).',
    pointsCles: [
      'Mafalia : centré achats grossistes/approvisionnement, ne gère pas la salle ni la commande à table ni l\'écran KDS.',
      'ScaniFood : menu QR statique sans KDS interactif ni paiement intégré Wave/OM.',
      'Spoon Africa : requiert le téléchargement d\'une application mobile.',
      'Lou Ame Tay : seul tout-en-un avec KDS cuisine, paiement Wave/OM instantané et support local 7j/7 basé à Thiès.'
    ]
  },
  {
    id: '03',
    code: 'Fiche 03',
    titre: 'Personas Clients CHR',
    fichier: '04_personas.md',
    tags: ['persona', 'profil', 'gastronomique', 'premium', 'maquis', 'dibiterie', 'fast-food', 'hôtel', 'resort', 'panier moyen', 'clientèle'],
    resume: '4 profils cibles : 1. Restaurateur Premium (Almadies, CA 30-80M, Formule Xéweul 35k), 2. Maquis & Dibiterie (CA 8-20M, Nio Far 25k ou Tàmbali 15k, formation wolof), 3. Fast-Food/Glacier (retrait guichet, Wave rapide, Nio Far), 4. Hôtels & Resorts (multi-sites, Sur Mesure).',
    pointsCles: [
      'Premium Almadies/Plateau : standing, chevalets dorés, multilingue (Xéweul 35 000 FCFA).',
      'Maquis & Dibiterie : pas d\'informatique complexe, formation wolof en 45 min (Nio Far 25 000 FCFA ou Tàmbali 15 000 FCFA).',
      'Fast-Food urbain : écran appel retrait, rapidité de commande Wave/OM en 10 secondes.',
      'Hôtels resorts : gestion multi-zones (plage, terrasse, room-service).'
    ]
  },
  {
    id: '04',
    code: 'Fiche 04',
    titre: 'Pitchs Modèles',
    fichier: '05_pitchs.md',
    tags: ['pitch', 'accroche', '30 secondes', '2 minutes', '15 minutes', 'discours', 'closing', 'démonstration', 'démo'],
    resume: 'Pitch 30s porte-à-porte (7/10 restaurants équipés, démo 2 min), Pitch 2 min gérant occupé (-80% erreurs, +25% ticket moyen Le Teranga/Fatou), Pitch 15 min structuré en 5 étapes.',
    pointsCles: [
      'Pitch 30s : "7 restaurants sur 10 à Dakar utilisent un menu QR. Lou Ame Tay fait chuter vos erreurs de 80%."',
      'Pitch 2 min : chiffrage concret (Le Teranga à Dakar +25% ticket moyen, Chez Fatou à Thiès -80% erreurs).',
      'Pitch 15 min : Découverte (2 min) -> Démo Live QR/KDS (6 min) -> Preuves (2 min) -> Tarifs (2 min) -> Closing essai 7j (3 min).'
    ]
  },
  {
    id: '05',
    code: 'Fiche 05',
    titre: 'Objections & Réponses',
    fichier: '06_objections.md',
    tags: ['objection', 'cher', 'prix', 'coût', 'pas le temps', 'informatique', 'compliqué', 'associés', 'connexion', 'panne', 'coupure', 'serveurs', 'remplacer', 'qui'],
    resume: '10 parades chirurgicales : C\'est trop cher (500 F/jour, 1 plat supplémentaire rentabilise), Pas le temps (équipe LAT fait tout en 45 min), Pas d\'informatique (codes couleurs vert/orange/rouge), Connexion coupée (PWA Offline-First), Serveurs ont peur (serveurs valorisés et pourboires accrus).',
    pointsCles: [
      'C\'est trop cher : 15 000 F/mois = 500 F/jour, rentabilisé par un seul café ou plat additionnel par jour grâce aux photos HD (+18% à 25% panier moyen).',
      'Connexion coupée : plateforme PWA Offline-First, fonctionne sans interruption même si la 4G vacille.',
      'Salariés réfractaires : écran KDS intuitif vert/orange/rouge sans texte lourd, formation terrain en Wolof en 30-45 min.',
      'Déjà une caisse : Lou Ame Tay décharge la caisse en salle au lieu de la remplacer.'
    ]
  },
  {
    id: '06',
    code: 'Fiche 06',
    titre: 'Hôtels & Restaurants Dakar',
    fichier: '07_dakar.md',
    tags: ['dakar', 'plateau', 'almadies', 'ngor', 'point e', 'mermoz', 'vdn', 'le teranga', 'chez fatou', 'lagon 1', 'café de rome', 'radisson', 'terrou-bi'],
    resume: 'Zones prioritaires : Plateau (57 restau), Almadies/Ngor (54 restau), Point E/Mermoz, Yoff/VDN. Hôtels majeurs (Radisson Blu, King Fahd, Terrou-Bi, Pullman). Clients références : Le Teranga, Chez Fatou Almadies, Le Lagon 1.',
    pointsCles: [
      'Almadies / Ngor / Virage : 54 adresses à fort panier moyen (Le Lagon 1, Chez Fatou Almadies, Le Patio, La Cambuse).',
      'Dakar Plateau : 57 adresses d\'affaires (Le Teranga, Café de Rome, La Marée, Chez Loutcha).',
      'Top prospects à convertir : Café de Rome, Radisson Blu, Pullman, Novotel, Le Patio.'
    ]
  },
  {
    id: '07',
    code: 'Fiche 07',
    titre: 'Hôtels & Restaurants Thiès + Saly',
    fichier: '08_thies_saly.md',
    tags: ['thiès', 'saly', 'mbour', 'petite côte', 'somone', 'big faim', 'brioche dorée', 'chez fatou thiès', 'le lagon 1 saly', 'lamantin', 'royam', 'prospects thiès'],
    resume: 'Thiès centre & Avenue de Caen (Big Faim, Brioche Dorée, Djolof Chicken, Chez Fatou Thiès), Quartier Dixième siège LAT. Saly touristique (Hôtel Neptune, Lamantin Beach, Royam, Le Lagon 1 Saly). Top 15 prospects prioritaires.',
    pointsCles: [
      'Top prospects Thiès : Big Faim, Brioche Dorée, Djolof Chicken, Restaurant Le Ndiambour, Restaurant Le Baobab, La Fourchette Thiès.',
      'Siège Lou Ame Tay à Thiès (Quartier Dixième / Fayou) : réactivité physique en moins de 30 minutes.',
      'Saly / Mbour / Somone : concentration d\'hôtels 4* et 5* (Lamantin Beach, Royam, Neptune, Riu Baobab).'
    ]
  },
  {
    id: '08',
    code: 'Fiche 08',
    titre: 'Hôtels & Restaurants Saint-Louis + Casamance',
    fichier: '09_saint_louis_casamance.md',
    tags: ['saint-louis', 'ndar', 'casamance', 'ziguinchor', 'cap skirring', 'écolodge', 'tourisme', 'la pirogue', 'hôtel de la paix', 'aldiana'],
    resume: 'Saint-Louis UNESCO (Hôtel de la Paix client actif, La Pirogue, Hôtel Cap Saint-Louis). Casamance & Cap Skirring (Hôtel Club Aldiana, La Paillote, Écolodge Le Palmier). Enjeu : résilience hors-ligne et écotourisme RSE.',
    pointsCles: [
      'Saint-Louis : Hôtel de la Paix (client actif), La Pirogue, Hôtel La Résidence, Hôtel Cap Saint-Louis.',
      'Casamance : Ziguinchor & Cap Skirring (Aldiana, La Paillote, Le Karabane).',
      'Argument massue : mode hors-ligne résilient indispensable en zone de réseau intermittent.'
    ]
  },
  {
    id: '00',
    code: 'Identité',
    titre: 'Aissatou — Personnalité & Identité',
    fichier: '01_aissatou_personnalite.md',
    tags: ['aissatou', 'rh', 'directrice', 'formation', 'diplôme', 'compétences', 'wolof', 'qui es-tu', 'rôle', 'mission'],
    resume: 'Aissatou, Directrice RH & Stratégie CHR. Master 2 RH, Licence CHR, Certificats Growth Marketing & Fiscalité sénégalaise. Trilingue Français, Wolof, Anglais.',
    pointsCles: [
      'Directrice RH, Développement & Stratégie CHR chez Lou Ame Tay.',
      'Formations : Master 2 RH, Licence Hôtellerie-Restauration, Fiscalité & Marketing digital.',
      'Mission : accompagner les commerciaux terrain avec rigueur, Téranga et efficacité.'
    ]
  }
];

/**
 * Recherche locale et pondérée dans la base de connaissances
 */
export function rechercherDansBaseConnaissances(question) {
  const query = (question || '').toLowerCase().trim();
  const mots = query.split(/\s+/).filter(m => m.length > 2);

  const scores = AISSATOU_KNOWLEDGE_DOCS.map(doc => {
    let score = 0;
    // Correspondance exacte tags
    doc.tags.forEach(t => {
      if (query.includes(t)) score += 10;
    });
    // Correspondance mots
    mots.forEach(mot => {
      if (doc.titre.toLowerCase().includes(mot)) score += 8;
      if (doc.resume.toLowerCase().includes(mot)) score += 4;
      doc.pointsCles.forEach(pt => {
        if (pt.toLowerCase().includes(mot)) score += 3;
      });
    });
    return { doc, score };
  });

  scores.sort((a, b) => b.score - a.score);
  return scores.filter(s => s.score > 0).map(s => s.doc);
}

/**
 * Réponses types expertes calibrées sur les 5 cas d'usage majeurs
 */
function genererReponseExpertePrecalibree(question) {
  const q = question.toLowerCase();

  // 1. "3 arguments pour un restaurant gastronomique aux Almadies"
  if ((q.includes('almadie') || q.includes('gastronomique') || q.includes('lounge')) && (q.includes('argument') || q.includes('pitch') || q.includes('convaincre'))) {
    return {
      texte: `Bonjour ! Pour un établissement gastronomique ou un lounge chic des Almadies (type Le Patio, Le Lagon 1 ou Chez Fatou), la clé est d'adopter un positionnement prestige qui protège l'image de marque :\n\n` +
        `1. **Standing & Esthétique irréprochable** : Nos chevalets de table en finition dorée ou bois gravé subliment les tables sans jamais dégrader le cadre feutré. Les menus photos HD valorisent les spécialités et les accords mets-vins.\n\n` +
        `2. **Expérience multilingue fluide (FR / EN / WO)** : Avec la clientèle diplomatique, expatriée et touristique des Almadies, le menu s'affiche automatiquement dans la langue du convive, libérant vos maîtres d'hôtel pour le conseil et la vente suggestive.\n\n` +
        `3. **Rotation et confort en heure de pointe** : En soirée animée ou le week-end, la commande et l'encaissement direct (Wave / CB) évitent aux convives d'attendre 20 minutes pour l'addition, tout en augmentant la rotation des tables de 25% sans stress.\n\n` +
        `Recommandez directement la **Formule Xéweul (35 000 FCFA/mois)** qui inclut l'intégralité des fonctionnalités premium.`,
      sources: ['Fiche 03 — Personas Clients CHR', 'Fiche 06 — Hôtels & Restaurants Dakar'],
      action: `Proposez au gérant une démonstration de 5 minutes sur son propre smartphone avec son plat signature avant son service du soir.`
    };
  }

  // 2. "Comment répondre à 'c'est trop cher' ?"
  if (q.includes('trop cher') || q.includes('cher') || q.includes('prix trop') || q.includes('coûteux')) {
    return {
      texte: `Je comprends tout à fait cette objection fréquente sur le terrain. Voici la parade exacte à formuler avec assurance et sourire :\n\n` +
        `« Je comprends tout à fait votre vigilance sur vos charges d'exploitation, M. le Gérant. Regardons ensemble les chiffres réels : notre formule Tàmbali démarre à 15 000 FCFA par mois, soit exactement **500 FCFA par jour** — c'est-à-dire moins que le prix d'un seul café ou d'une boisson vendue dans votre salle.\n\n` +
        `Grâce aux photos haute définition de vos plats et desserts, nos restaurants partenaires constatent une augmentation moyenne de **18% à 25% sur leur panier moyen**. Autrement dit, un seul plat ou dessert supplémentaire vendu par jour paye l'intégralité du système pour le mois entier, et tout le reste constitue un bénéfice net pour vous. »`,
      sources: ['Fiche 05 — Objections & Réponses', 'Fiche 04 — Personas Clients CHR'],
      action: `Enchaînez immédiatement sur l'offre d'essai terrain de 7 jours sans engagement : « Laissez-moi vous installer l'outil pendant 7 jours gratuitement pour que vous jugiez vous-même du résultat. »`
    };
  }

  // 3. "Quels sont les meilleurs prospects à Thiès ?"
  if (q.includes('thiès') && (q.includes('prospect') || q.includes('liste') || q.includes('cible') || q.includes('qui visiter'))) {
    return {
      texte: `À Thiès, nous bénéficions d'un avantage décisif : le siège historique de Lou Ame Tay est situé au quartier Dixième, garantissant un support physique sous 30 minutes. Voici les prospects prioritaires à cibler en priorité :\n\n` +
        `**Centre-ville & Avenue de Caen (Priorité Haute) :**\n` +
        `1. **Big Faim** — Fast-food urbain de référence à très forte affluence (besoin : écran retrait guichet et encaissement Wave rapide).\n` +
        `2. **Brioche Dorée Thiès** — Brasserie & salon de thé (besoin : carte digitale élégante et petit-déjeuner express).\n` +
        `3. **Djolof Chicken** — Restauration rapide avec files d'attente à désengorger.\n` +
        `4. **Restaurant Le Ndiambour** — Cuisine sénégalaise réputée, forte affluence le midi.\n\n` +
        `**Quartier Dixième & Cité Lamy :**\n` +
        `5. **Restaurant Le Baobab** et **Restaurant Le Dixième** (grillades & maquis).\n` +
        `6. **Restaurant La Fourchette Thiès**.\n\n` +
        `*Preuve locale à citer systématiquement* : Le restaurant **Chez Fatou Thiès**, client fidèle qui a divisé ses erreurs de commande par 5 grâce à notre système.`,
      sources: ['Fiche 07 — Hôtels & Restaurants Thiès + Saly', 'Fiche 01 — Marché CHR Sénégal'],
      action: `Commencez par l'Avenue de Caen le matin entre 10h et 11h30 avant le rush du déjeuner avec vos chevalets de démonstration.`
    };
  }

  // 4. "Explique la formule Xéweul en wolof"
  if ((q.includes('wolof') || q.includes('xéweul') || q.includes('xeweul')) && (q.includes('explique') || q.includes('wolof') || q.includes('formule'))) {
    return {
      texte: `Waaw, lii mooy li nga wara wax ak boroom resto bi ci Wolof bu leer té rafet :\n\n` +
        `« Asalaamaleykum Boroom Taabul ji ! Formule **Xéweul** (35 000 FCFA weer wu nekk) mooy formule bi gën a mat ci Lou Ame Tay.\n\n` +
        `Lu ci nekk ?\n` +
        `1. **Menu QR Code bu rafet** : Sa kilifa yi dañuy flash ak sén téléphone, gis nataal yu rafet yi ak njëg yi ci Français, Wolof ak Anglais.\n` +
        `2. **Ecran Tablette ci Cuisin bi (KDS)** : Kilifa gu komandé rek, kuisin bi dafay dégg "Bip" ci kàddu gu leer, xam li ñuy toog te dëppal ko ci jamono, kenn du juum.\n` +
        `3. **Fay ci Wave ak Orange Money direct** : Kenn du taxaw di xaar monnaie, ku nekk mën na fay ci 10 secondes.\n` +
        `4. **Equipe Lou Ame Tay dañuy ñëw ba ci sa biir resto** : Teel la defaral lepp, jàngal sa liggéeykat yi ba kenn du ci am jafe-jafe. »\n\n` +
        `Ci kàddu gu gàtt : Xéweul dafay yokk sa bénéfice te wàññi sonn bi ci sa salle bi !`,
      sources: ['Fiche 04 — Personas Clients CHR', 'Fiche 00 — Aissatou Personnalité & Identité'],
      action: `Dafa baax nga won ko démonstration bi ci sa téléphone booba mu gis ni mu gaawe !`
    };
  }

  // 5. "Quelles sont les différences avec Mafalia ?"
  if (q.includes('mafalia') || q.includes('différence avec mafalia') || q.includes('par rapport à mafalia')) {
    return {
      texte: `C'est une excellente question car plusieurs restaurateurs confondent approvisionnement et expérience en salle. Voici la différenciation exacte :\n\n` +
        `**Mafalia** est une plateforme concentrée sur la **chaîne d'approvisionnement B2B** (achats grossistes, centrales d'achats alimentaires auprès des fournisseurs). Ils aident le restaurant à acheter ses matières premières.\n\n` +
        `À l'inverse, **Lou Ame Tay** est le système d'exploitation **au cœur de l'expérience client et de la salle** :\n` +
        `- Menu QR interactif en photos HD consulté par les convives à table.\n` +
        `- Transmission instantanée vers l'écran cuisine KDS pour les cuisiniers.\n` +
        `- Encaissement direct Wave & Orange Money à table.\n` +
        `- Écran d'appel retrait guichet et cartes de visite digitales.\n\n` +
        `**Positionnement tactique face au prospect** : Ne dénigrez jamais Mafalia. Dites au gérant : *« Mafalia vous aide à faire entrer vos denrées en cuisine ; Lou Ame Tay s'occupe de régaler vos clients, fluidifier vos serveurs et encaisser vos recettes. Nos deux outils sont totalement complémentaires et peuvent cohabiter en parfaite harmonie. »*`,
      sources: ['Fiche 02 — Concurrents Lou Ame Tay'],
      action: `Rassurez immédiatement le prospect qu'il n'aura aucun conflit logiciel et qu'il peut conserver son fournisseur actuel.`
    };
  }

  return null;
}

/**
 * Fonction maîtresse : Interroge Aissatou avec contexte RAG enrichi
 */
export async function poserQuestionAissatou(question, options = {}) {
  const qNettoyee = (question || '').trim();
  if (!qNettoyee) {
    return {
      reponse: "Bonjour ! Je suis Aissatou, votre directrice RH et stratégie CHR. Posez-moi votre question terrain ou sélectionnez une thématique (objections, pitchs, concurrence, cibles géographiques).",
      sources: ['Fiche 00 — Aissatou Personnalité & Identité'],
      action: "Indiquez le nom ou le profil du restaurant que vous allez prospecter aujourd'hui."
    };
  }

  // 1. Vérification réponse précalibrée experte
  const repPrecalibree = genererReponseExpertePrecalibree(qNettoyee);
  if (repPrecalibree) {
    return {
      reponse: repPrecalibree.texte,
      sources: repPrecalibree.sources,
      action: repPrecalibree.action
    };
  }

  // 2. Recherche documentaire RAG dans les fiches
  const docsPertinents = rechercherDansBaseConnaissances(qNettoyee);
  const docPrincipal = docsPertinents[0] || AISSATOU_KNOWLEDGE_DOCS[0];
  const sourcesTrouvees = docsPertinents.slice(0, 2).map(d => `${d.code} — ${d.titre}`);

  // 3. Si clé Gemini présente dans l'environnement global (window.__ENV__ ou window.ENV)
  const geminiApiKey = (typeof window !== 'undefined' && (window.__ENV__?.GEMINI_API_KEY || window.ENV?.GEMINI_API_KEY)) || null;

  if (geminiApiKey && typeof fetch !== 'undefined') {
    try {
      const contexteRAG = docsPertinents.slice(0, 3).map(d => `--- ${d.code} : ${d.titre} ---\n${d.resume}\nPoints clés:\n${d.pointsCles.join('\n')}`).join('\n\n');

      const body = {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${AISSATOU_SYSTEM_PROMPT}\n\n[CONTEXTE DE LA BASE DE CONNAISSANCES RAG]\n${contexteRAG}\n\n[QUESTION DU COMMERCIAL TERRAIN]\n${qNettoyee}\n\nRédige une réponse structurée en respectant strictement les règles (sources exactes et action terrain finale).`
              }
            ]
          }
        ]
      };

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const json = await res.json();
        const texteGenere = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (texteGenere) {
          return {
            reponse: texteGenere,
            sources: sourcesTrouvees.length > 0 ? sourcesTrouvees : ['Fiche 01 — Marché CHR Sénégal'],
            action: "Proposez une démonstration interactive de 2 minutes sur le smartphone du gérant."
          };
        }
      }
    } catch (e) {
      console.warn('[Aissatou RAG] Appel Gemini en ligne indisponible, bascule sur synthèse locale RAG :', e);
    }
  }

  // 4. Synthèse RAG locale intelligente (Garantie Offline-First 100%)
  const reponseSynthese = `Bonjour ! En tant que Directrice RH & Stratégie CHR, voici les éléments clés issus de notre référentiel Lou Ame Tay pour vous guider :\n\n` +
    `📌 **Analyse & Points clés :**\n` +
    docPrincipal.pointsCles.map(pt => `• ${pt}`).join('\n') + `\n\n` +
    `💡 **Conseil opérationnel :**\n` +
    `${docPrincipal.resume}\n\n` +
    `Rappelez-vous toujours : la force de Lou Ame Tay face à n'importe quelle solution réside dans notre ancrage 100% sénégalais, notre support physique ultra-rapide et notre fonctionnement hors-ligne garanti.`;

  return {
    reponse: reponseSynthese,
    sources: sourcesTrouvees.length > 0 ? sourcesTrouvees : [`${docPrincipal.code} — ${docPrincipal.titre}`],
    action: `Allez voir le gérant avec un chevalet QR de test en main pour concrétiser l'échange.`
  };
}
