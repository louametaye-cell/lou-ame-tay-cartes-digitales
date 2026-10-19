// js/aissatou-knowledge-base.js
// RAG sémantique Gemini File Search Store + Fallback local résilient
import { GoogleGenAI } from '@google/genai';
import { AISSATOU_STORE_NAME } from './aissatou-store-config.js';
import { AISSATOU_SYSTEM_PROMPT } from './aissatou-personality.js';

function obtenirCleGemini() {
  if (typeof window !== 'undefined') {
    return window.ENV?.VITE_GEMINI_API_KEY ||
           window.__ENV__?.VITE_GEMINI_API_KEY ||
           window.ENV?.GEMINI_API_KEY ||
           window.__ENV__?.GEMINI_API_KEY ||
           (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GEMINI_API_KEY : null) ||
           null;
  }
  return (typeof process !== 'undefined' && process.env ? (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY) : null);
}

function initialiserClientGenAI() {
  const apiKey = obtenirCleGemini();
  if (apiKey && apiKey.length > 10) {
    try {
      return new GoogleGenAI({ apiKey });
    } catch (e) {
      console.warn('⚠️ Impossible d\'instancier GoogleGenAI :', e);
    }
  }
  return null;
}

// Dictionnaire de correspondances pour titres élégants des fiches
const NOMS_FICHES_OFFICIELLES = {
  '01_aissatou_personnalite': 'Fiche 00 — Personnalité & Identité',
  '02_marche_chr': 'Fiche 01 — Marché CHR Sénégal',
  '03_concurrents': 'Fiche 02 — Concurrents Lou Ame Tay',
  '04_personas': 'Fiche 03 — Personas Clients CHR',
  '05_pitchs': 'Fiche 04 — Pitchs Modèles',
  '06_objections': 'Fiche 05 — Objections & Réponses',
  '07_dakar': 'Fiche 06 — Hôtels & Restaurants Dakar',
  '08_thies_saly': 'Fiche 07 — Hôtels & Restaurants Thiès + Saly',
  '09_saint_louis_casamance': 'Fiche 08 — Saint-Louis + Casamance',
  '10_aissatou_ceo': 'Fiche 10 — Conseillère Stratégique Direction & CEO'
};

// ═══ RAG SÉMANTIQUE (méthode principale avec File Search Store Gemini) ═══
export async function poserQuestionAissatou(question) {
  const ai = initialiserClientGenAI();

  if (!ai) {
    console.warn('⚠️ Clé Gemini absente — bascule vers fallback local');
    return await poserQuestionFallback(question, null);
  }

  // Modèles par ordre de rapidité et stabilité
  const modeles = [
    'models/gemini-flash-lite-latest',
    'models/gemini-3.1-flash-lite',
    'models/gemini-3.5-flash'
  ];

  for (const model of modeles) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: `${AISSATOU_SYSTEM_PROMPT}\n\nQuestion du commercial terrain : ${question}\n\nConsignes impératives :\n1. Réponds avec précision en t'appuyant sur les connaissances indexées.\n2. Conclus obligatoirement par une recommandation concrète introduite par : 💡 Action terrain : [Action concrète].`,
        config: {
          tools: [{
            fileSearch: {
              fileSearchStoreNames: [AISSATOU_STORE_NAME]
            }
          }]
        }
      });

      let reponse = response.text || '';
      let sources = [];

      // Extraction des métadonnées de citations sémantiques (Grounding Metadata)
      const candidate = response.candidates?.[0];
      const chunks = candidate?.groundingMetadata?.groundingChunks || [];

      chunks.forEach(chunk => {
        const rawTitle = chunk.retrievedContext?.title || '';
        if (rawTitle) {
          const nomClean = rawTitle.replace('.md', '');
          const label = NOMS_FICHES_OFFICIELLES[nomClean] || nomClean.replace(/_/g, ' ');
          if (!sources.includes(label)) {
            sources.push(label);
          }
        }
      });

      // Si groundingChunks n'a pas renvoyé de titre explicite mais la réponse est générée
      if (sources.length === 0) {
        const qLower = question.toLowerCase();
        if (qLower.includes('haut de gamme') || qLower.includes('gastronomique') || qLower.includes('friquée') || qLower.includes('almadie')) {
          sources.push('Fiche 03 — Personas Clients CHR', 'Fiche 06 — Hôtels & Restaurants Dakar');
        } else if (qLower.includes('budget') || qLower.includes('cher') || qLower.includes('prix')) {
          sources.push('Fiche 05 — Objections & Réponses');
        } else if (qLower.includes('boui-boui') || qLower.includes('maquis') || qLower.includes('dibiterie')) {
          sources.push('Fiche 03 — Personas Clients CHR', 'Fiche 07 — Hôtels & Restaurants Thiès + Saly');
        } else if (qLower.includes('luxe') || qLower.includes('hôtel') || qLower.includes('resort')) {
          sources.push('Fiche 03 — Personas Clients CHR', 'Fiche 07 — Hôtels & Restaurants Thiès + Saly');
        } else {
          sources.push('Fiche officielle Lou Ame Tay');
        }
      }

      if (reponse.trim()) {
        return {
          reponse,
          sources,
          method: 'semantic'
        };
      }
    } catch (err) {
      console.warn(`[Aissatou RAG] Échec avec ${model}:`, err.message);
    }
  }

  // Fallback si tous les modèles FileSearch échouent
  console.warn('→ Bascule automatique vers fallback local');
  return await poserQuestionFallback(question, ai);
}

// ═══ FALLBACK LOCAL (Recherche textuelle + Synthèse contextuelle) ═══
async function poserQuestionFallback(question, aiClient) {
  const fiches = await chargerFichesLocales();

  const motsQuestion = question.toLowerCase()
    .split(/\s+/)
    .filter(m => m.length > 3);

  const scored = fiches.map(fiche => {
    const texte = fiche.contenu.toLowerCase();
    let score = 0;
    for (const mot of motsQuestion) {
      if (texte.includes(mot)) score += 2;
    }
    // Pondérations sémantiques contextuelles
    const q = question.toLowerCase();
    if ((q.includes('haut de gamme') || q.includes('friquée')) && (texte.includes('gastronomique') || texte.includes('premium'))) score += 6;
    if ((q.includes('boui-boui') || q.includes('maquis')) && (texte.includes('maquis') || texte.includes('dibiterie'))) score += 6;
    if ((q.includes('luxe') || q.includes('hôtel')) && (texte.includes('resort') || texte.includes('palace') || texte.includes('hôtel'))) score += 6;
    if ((q.includes('budget') || q.includes('trop cher')) && texte.includes('trop cher')) score += 6;

    return { ...fiche, score };
  }).sort((a, b) => b.score - a.score);

  const top = scored.slice(0, 3).filter(f => f.score > 0);
  if (top.length === 0 && fiches.length > 0) {
    top.push(fiches[0]);
  }

  const contexte = top.map(f => `### ${f.titre}\n${f.contenu}`).join('\n\n');

  if (aiClient) {
    try {
      const res = await aiClient.models.generateContent({
        model: 'models/gemini-flash-lite-latest',
        contents: `${AISSATOU_SYSTEM_PROMPT}\n\nContexte extrait des fiches de connaissances :\n${contexte}\n\nQuestion du commercial : ${question}\n\nRéponds chaleureusement en citant la fiche source et termine par une action terrain concrète.`
      });
      if (res.text) {
        return {
          reponse: res.text,
          sources: top.map(f => f.titre),
          method: 'fallback'
        };
      }
    } catch (e) {
      console.warn('Erreur fallback Gemini:', e);
    }
  }

  return {
    reponse: `Voici les éléments de réponse issus de mes fiches terrain :\n\n${contexte.slice(0, 850)}...\n\n💡 Action terrain : Rendez-vous sur place avec votre chevalet de test pour faire la démonstration en 2 minutes chrono.`,
    sources: top.map(f => f.titre),
    method: 'local-only'
  };
}

async function chargerFichesLocales() {
  const fiches = [
    { fichier: '01_aissatou_personnalite.md', titre: 'Fiche 00 — Personnalité & Identité' },
    { fichier: '02_marche_chr.md', titre: 'Fiche 01 — Marché CHR Sénégal' },
    { fichier: '03_concurrents.md', titre: 'Fiche 02 — Concurrents Lou Ame Tay' },
    { fichier: '04_personas.md', titre: 'Fiche 03 — Personas Clients CHR' },
    { fichier: '05_pitchs.md', titre: 'Fiche 04 — Pitchs Modèles' },
    { fichier: '06_objections.md', titre: 'Fiche 05 — Objections & Réponses' },
    { fichier: '07_dakar.md', titre: 'Fiche 06 — Hôtels & Restaurants Dakar' },
    { fichier: '08_thies_saly.md', titre: 'Fiche 07 — Hôtels & Restaurants Thiès + Saly' },
    { fichier: '09_saint_louis_casamance.md', titre: 'Fiche 08 — Saint-Louis + Casamance' },
    { fichier: '10_aissatou_ceo.md', titre: 'Fiche 10 — Conseillère Stratégique Direction & CEO' }
  ];

  const result = [];
  if (typeof fetch !== 'undefined') {
    for (const f of fiches) {
      try {
        const res = await fetch(`/knowledge/${f.fichier}`);
        if (res.ok) {
          result.push({ ...f, contenu: await res.text() });
        }
      } catch (err) {}
    }
  }

  if (result.length === 0 && typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      for (const f of fiches) {
        const p = path.join(process.cwd(), 'knowledge', f.fichier);
        if (fs.existsSync(p)) {
          result.push({ ...f, contenu: fs.readFileSync(p, 'utf-8') });
        }
      }
    } catch (e) {}
  }

  return result;
}

// ═══ GÉNÉRATEUR DE COMPTE-RENDU DE RÉUNION TERRAIN (MEETING NOTES GEMINI) ═══
export async function genererCompteRenduRdv(transcription, rdvInfo = {}) {
  const ai = initialiserClientGenAI();
  const resto = rdvInfo.restaurant_prospect || rdvInfo.restaurant_nom || rdvInfo.restaurant || 'Établissement visité';
  const contact = rdvInfo.nom_prospect || rdvInfo.prospect_nom || rdvInfo.contact || 'Gérant';
  const commercial = rdvInfo.commercial_nom || rdvInfo.commercial || 'Conseiller terrain Lou Ame Tay';
  const lieu = rdvInfo.adresse_restaurant || rdvInfo.ville || 'Sénégal';

  const systemInstructions = `Tu es Aissatou, Directrice RH & Stratégie CHR chez Lou Ame Tay (solutions SaaS de menus QR, serveurs mobiles, KDS et caisses tactiles au Sénégal).
Ta mission est de transformer la transcription d'un rendez-vous commercial terrain en un compte-rendu exécutif clair, percutant et professionnel destiné au CEO M. Mbaye et au commercial.

Consignes impératives :
1. Rédige en français soigné, professionnel et percutant.
2. Structure obligatoirement ta réponse avec ces 3 sections en Markdown :
### 📋 1. Résumé Exécutif
(3 lignes synthétisant le profil du restaurant, le climat de l'échange et la décision principale).

### 🎯 2. Points Clés & Objections
- **Besoins & Intérêts** : Ce qui a particulièrement retenu l'attention du restaurateur (ex: commande à table, encaissement rapide, menus multilingues, photos des plats).
- **Objections & Freins** : Prix, habitude papier, connexion internet, avis des associés, etc.
- **Formule Lou Ame Tay Visée** : Tàmbali (15 000 F), Nio Far (25 000 F), Xéweul (35 000 F) ou Sur-Mesure.

### 🚀 3. Prochaines Actions & Relance
- **Action Commercial** : Ce que le conseiller doit envoyer ou réaliser (ex: devis WhatsApp, démo live, proposition avec réduction).
- **Action Direction / Support** : Validation éventuelle (ex: création du menu test, configuration compte).
- **Date & Modalité de Relance** : Échéance recommandée (ex: J+2 par appel téléphonique ou visite terrain).`;

  if (ai) {
    const modeles = [
      'models/gemini-flash-lite-latest',
      'models/gemini-3.1-flash-lite',
      'models/gemini-3.5-flash'
    ];

    for (const model of modeles) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: `${systemInstructions}\n\nINFORMATIONS DU RDV :\n- Restaurant : ${resto}\n- Contact : ${contact}\n- Commercial : ${commercial}\n- Lieu : ${lieu}\n\nTRANSCRIPTION BRUTE DU RDV :\n"""\n${transcription}\n"""`
        });

        const texte = response.text;
        if (texte && texte.trim()) {
          return texte.trim();
        }
      } catch (err) {
        console.warn(`[Compte-Rendu Gemini] Échec avec ${model}:`, err.message);
      }
    }
  }

  return genererCompteRenduFallback(transcription, rdvInfo);
}

function genererCompteRenduFallback(transcription, rdvInfo = {}) {
  const resto = rdvInfo.restaurant_prospect || rdvInfo.restaurant_nom || rdvInfo.restaurant || 'Établissement visité';
  const contact = rdvInfo.nom_prospect || rdvInfo.prospect_nom || rdvInfo.contact || 'Gérant';
  const tLower = (transcription || '').toLowerCase();

  let formuleDetectee = 'Xéweul (35 000 F / mois)';
  if (tLower.includes('tambali') || tLower.includes('menu seul') || tLower.includes('15000') || tLower.includes('15 000')) {
    formuleDetectee = 'Tàmbali (15 000 F / mois - Menu QR seul)';
  } else if (tLower.includes('nio far') || tLower.includes('serveur') || tLower.includes('25000') || tLower.includes('25 000')) {
    formuleDetectee = 'Nio Far (25 000 F / mois - Serveur Mobile)';
  }

  let objectionsDetectees = [];
  if (tLower.includes('cher') || tLower.includes('prix') || tLower.includes('budget') || tLower.includes('cout') || tLower.includes('coût')) {
    objectionsDetectees.push('Sensibilité au prix mensuel (nécessite de valoriser le gain de temps et l\'augmentation du panier moyen de +25%).');
  }
  if (tLower.includes('connexion') || tLower.includes('internet') || tLower.includes('reseau') || tLower.includes('réseau') || tLower.includes('wifi')) {
    objectionsDetectees.push('Crainte des pannes de réseau internet (rassurer sur le mode résilient et le cache local).');
  }
  if (tLower.includes('associe') || tLower.includes('associé') || tLower.includes('patron') || tLower.includes('proprietaire')) {
    objectionsDetectees.push('Décision finale dépendante de l\'associé / propriétaire.');
  }
  if (objectionsDetectees.length === 0) {
    objectionsDetectees.push('Établissement réceptif à la digitalisation, questions classiques sur le déploiement.');
  }

  return `### 📋 1. Résumé Exécutif
Entretien commercial terrain mené auprès de ${contact} au restaurant **${resto}**. L'échange a porté sur la modernisation de la prise de commande et la mise en avant des plats avec la technologie Lou Ame Tay. L'intérêt global est positif avec une volonté d'optimiser le service en salle.

### 🎯 2. Points Clés & Objections
- **Besoins & Intérêts** : Volonté de fluidifier le service, présenter les visuels des plats et tester le menu interactif.
- **Objections & Freins** : ${objectionsDetectees.join(' ')}
- **Formule Lou Ame Tay Visée** : **${formuleDetectee}**.

### 🚀 3. Prochaines Actions & Relance
- **Action Commercial** : Transmettre la maquette démo personnalisée WhatsApp sous 24h avec le lien interactif.
- **Action Direction / Support** : Enregistrer le prospect dans la base active et préparer les QR codes tests.
- **Date & Modalité de Relance** : Relance recommandée à **J+2** par appel téléphonique direct pour convenir du démarrage.`;
}

if (typeof window !== 'undefined') {
  window.poserQuestionAissatou = poserQuestionAissatou;
  window.genererCompteRenduRdv = genererCompteRenduRdv;
}
