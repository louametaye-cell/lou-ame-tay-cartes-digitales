/**
 * ==============================================================================
 * FICHIER : js/aissatou-memory.js
 * ARCHITECTURE DE LA MÉMOIRE CONTEXTUELLE DE L'AGENT AISSATOU
 * ==============================================================================
 * Gère la mémoire à long terme :
 * - Préférences des gérants de restaurant (ex: "Madiba préfère le matin")
 * - Historique des objections et points d'attention
 * - Directives de travail spécifiques par conseiller
 * - Synchronisation Supabase + Fallback localStorage
 * ==============================================================================
 */

import { supabase, estSupabaseConfigure } from './supabase-client.js';

const CLE_STORAGE_MEMOIRE = 'LOUAMETAY_AISSATOU_MEMOIRE_LOCAL';

/**
 * Charge la mémoire locale mise en cache
 */
function obtenirMemoireLocale() {
  try {
    const brute = localStorage.getItem(CLE_STORAGE_MEMOIRE);
    return brute ? JSON.parse(brute) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Sauvegarde en cache local
 */
function sauvegarderMemoireLocale(memoire) {
  try {
    localStorage.setItem(CLE_STORAGE_MEMOIRE, JSON.stringify(memoire));
  } catch (e) {
    console.warn('Erreur sauvegarde mémoire locale:', e);
  }
}

/**
 * Mémorise une information contextuelle (préférence, consigne, observation)
 * @param {Object} param0 - { commercialId, commercialNom, sujet, contenu, typeMemoire, importance }
 */
export async function memoriserContexteAissatou({
  commercialId = null,
  commercialNom = 'Conseiller',
  sujet,
  contenu,
  typeMemoire = 'preference_client',
  importance = 1
}) {
  if (!sujet || !contenu) return null;

  const entree = {
    id: 'mem-' + Date.now(),
    commercial_id: commercialId,
    sujet: String(sujet).trim(),
    contenu: String(contenu).trim(),
    type_memoire: typeMemoire,
    importance: Math.min(Math.max(importance, 1), 5),
    created_at: new Date().toISOString()
  };

  // 1. Sauvegarde locale immédiate
  const local = obtenirMemoireLocale();
  local.unshift(entree);
  sauvegarderMemoireLocale(local);

  // 2. Sauvegarde dans Supabase si configuré
  if (estSupabaseConfigure() && supabase) {
    try {
      // Tentative d'insertion dans aissatou_memoire
      const { data, error } = await supabase
        .from('aissatou_memoire')
        .insert([{
          commercial_id: commercialId,
          type_memoire: typeMemoire,
          sujet: entree.sujet,
          contenu: entree.contenu,
          importance: entree.importance
        }])
        .select();

      if (!error && data && data[0]) {
        return data[0];
      }

      // Repli sur journal_activites si table dédiée pas encore créée
      await supabase.from('journal_activites').insert([{
        type_action: 'AISSATOU_MEMOIRE',
        commercial_id: commercialId,
        commercial_nom: commercialNom,
        description: `Mémoire Aissatou : ${entree.sujet} (${typeMemoire})`,
        details: JSON.stringify(entree),
        statut: 'SUCCES'
      }]);

    } catch (errDb) {
      console.warn('Fallback mémoire Supabase vers local:', errDb);
    }
  }

  return entree;
}

/**
 * Recherche les informations en mémoire associées à un sujet ou restaurant
 * @param {string} requete - Ex: "Madiba Resto" ou "disponibilité"
 * @param {string} commercialId - ID optionnel du commercial
 */
export async function rechercherMemoireAissatou(requete = '', commercialId = null) {
  const reqLower = String(requete || '').toLowerCase().trim();
  const resultats = [];

  // 1. Recherche dans le cache local
  const local = obtenirMemoireLocale();
  for (const m of local) {
    if (commercialId && m.commercial_id && m.commercial_id !== commercialId) continue;
    if (!reqLower || m.sujet.toLowerCase().includes(reqLower) || m.contenu.toLowerCase().includes(reqLower)) {
      resultats.push(m);
    }
  }

  // 2. Recherche distante Supabase si connectée
  if (estSupabaseConfigure() && supabase) {
    try {
      const q = supabase
        .from('aissatou_memoire')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (commercialId) {
        q.eq('commercial_id', commercialId);
      }

      const { data, error } = await q;
      if (!error && Array.isArray(data)) {
        for (const dist of data) {
          if (!resultats.some(r => r.id === dist.id)) {
            if (!reqLower || dist.sujet.toLowerCase().includes(reqLower) || dist.contenu.toLowerCase().includes(reqLower)) {
              resultats.push(dist);
            }
          }
        }
      }
    } catch (e) {
      // Ignorer l'erreur distante, le cache local a répondu
    }
  }

  return resultats;
}

/**
 * Construit un bloc textuel contextuel à injecter dans le prompt de Gemini
 */
export async function extraireContexteMemoirePourPrompt(sujet, commercialId = null) {
  const elements = await rechercherMemoireAissatou(sujet, commercialId);
  if (!elements || elements.length === 0) return '';

  return `
MÉMOIRE CONTEXTUELLE RETENUE POUR CET ÉTABLISSEMENT :
${elements.map(e => `• [${e.sujet}] ${e.contenu} (${e.type_memoire})`).join('\n')}
  `.trim();
}
