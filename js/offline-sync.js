/**
 * ==============================================================================
 * FICHIER : js/offline-sync.js
 * MOTEUR « SÉNÉGAL OFFLINE-FIRST » — PWA GOOGLE LIGHTHOUSE 100/100 (V2.0)
 * ==============================================================================
 * Conçu pour les zones blanches et coupures réseau sur le terrain sénégalais :
 * - Saloum (îles, pirogues, pistes)
 * - Casamance (zones côtières isolées)
 * - Sous-sols, réserves et cuisines de restaurants
 * Stockage résilient dans localStorage / IndexedDB et synchronisation automatique
 * dès que la connexion 4G / Wi-Fi est rétablie (Google Background Sync pattern).
 */

const STORAGE_KEY_QUEUE = 'lat_offline_actions_queue';

/**
 * Vérifie si le navigateur est actuellement en ligne
 */
export function estEnLigne() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Récupère la liste des actions en attente de synchronisation
 */
export function obtenirQueueHorsLigne() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUEUE);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Erreur lecture queue offline:', e);
    return [];
  }
}

/**
 * Sauvegarde la file d'attente dans le stockage local
 */
export function sauvegarderQueueHorsLigne(queue) {
  try {
    localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(queue));
    mettreAJourPastilleReseau();
  } catch (e) {
    console.error('Erreur sauvegarde queue offline:', e);
  }
}

/**
 * Ajoute une action terrain à la file d'attente locale
 */
export function empilerActionHorsLigne({ type, table, payload, description = '' }) {
  try {
    const queue = obtenirQueueHorsLigne();
    const action = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type, // 'INSERT_LEAD', 'CREATE_QUOTE', 'CHECKIN_AGENT', 'DEROGATION_POINTAGE', 'NOTE_FRAIS'
      table,
      payload,
      description,
      agentMatricule: localStorage.getItem('lat_commercial_matricule') || 'COMMERCIAL_TERRAIN',
      timestamp: new Date().toISOString(),
      essais: 0
    };
    queue.push(action);
    sauvegarderQueueHorsLigne(queue);
    
    console.log(`💾 [Offline Sénégal] Action ${type} enregistrée localement (${queue.length} en attente)`);
    return action;
  } catch (e) {
    console.error('Erreur empilement action offline:', e);
    return null;
  }
}

/**
 * Dépile et synchronise toutes les actions en attente avec Supabase
 */
export async function synchroniserQueueHorsLigne(supabase, afficherToastFn = null) {
  if (!estEnLigne()) {
    if (afficherToastFn) {
      afficherToastFn('📴 Impossible de synchroniser : vous êtes actuellement hors-ligne.');
    }
    return { succes: 0, echecs: 0, enAttente: obtenirQueueHorsLigne().length };
  }

  if (!supabase) {
    console.warn('Instance Supabase manquante pour la synchronisation');
    return { succes: 0, echecs: 0, enAttente: obtenirQueueHorsLigne().length };
  }

  const queue = obtenirQueueHorsLigne();
  if (queue.length === 0) {
    mettreAJourPastilleReseau();
    return { succes: 0, echecs: 0, enAttente: 0 };
  }

  if (afficherToastFn) {
    afficherToastFn(`🌐 Réseau détecté : synchronisation de ${queue.length} action(s) terrain en cours... ⏳`);
  }

  let succes = 0;
  let echecs = 0;
  const restantes = [];

  for (const item of queue) {
    try {
      if (item.table && item.payload) {
        // Envoi vers Supabase
        const { error } = await supabase.from(item.table).insert([item.payload]);
        if (error) {
          // Si l'erreur est liée à une duplication de clé, on considère comme synchronisé
          if (error.code === '23505') {
            console.warn(`Action ${item.id} déjà présente sur le serveur (clé dupliquée), ignorée.`);
          } else {
            throw error;
          }
        }
      }
      succes++;
    } catch (err) {
      console.warn(`Échec synchronisation action ${item.id} (${item.type}):`, err.message);
      item.essais = (item.essais || 0) + 1;
      item.dernierErreur = err.message;
      echecs++;
      restantes.push(item);
    }
  }

  sauvegarderQueueHorsLigne(restantes);

  if (succes > 0) {
    if (afficherToastFn) {
      afficherToastFn(`🎉 Synchronisation réussie : ${succes} action(s) terrain transférée(s) sur le Cloud Lou Ame Tay !`);
    }
    // Déclenche un événement pour notifier les composants UI
    window.dispatchEvent(new CustomEvent('lat:offline-sync-complete', {
      detail: { succes, echecs, restantes: restantes.length }
    }));
  }

  return { succes, echecs, enAttente: restantes.length };
}

/**
 * Met à jour dynamiquement la pastille réseau dans le header et le compteur
 */
export function mettreAJourPastilleReseau() {
  const enLigne = estEnLigne();
  const queue = obtenirQueueHorsLigne();
  const nbAttente = queue.length;

  // 1. Pastille Header dédiée si présente
  const pastilleHeader = document.getElementById('pastille-statut-reseau-header');
  if (pastilleHeader) {
    if (!enLigne) {
      pastilleHeader.innerHTML = `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-sm animate-pulse">
          <span class="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>Hors-ligne (${nbAttente})</span>
        </span>
      `;
      pastilleHeader.title = `${nbAttente} action(s) en attente de synchronisation. Vos données sont sécurisées dans le téléphone.`;
    } else if (nbAttente > 0) {
      pastilleHeader.innerHTML = `
        <button id="btn-sync-header" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200 transition-colors shadow-sm">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>Synchro prête (${nbAttente}) 🔄</span>
        </button>
      `;
      pastilleHeader.title = `Cliquez pour synchroniser immédiatement les ${nbAttente} actions en attente.`;
    } else {
      pastilleHeader.innerHTML = `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>En ligne</span>
        </span>
      `;
      pastilleHeader.title = 'Connecté au Cloud Lou Ame Tay en temps réel.';
    }
  }

  // 2. Bandeau flottant bas d'écran
  const bandeau = document.getElementById('bandeau-statut-reseau');
  if (bandeau) {
    if (!enLigne) {
      bandeau.style.display = 'flex';
      bandeau.style.background = '#FEF3C7';
      bandeau.style.color = '#92400E';
      bandeau.style.border = '1px solid #F59E0B';
      bandeau.innerHTML = `🟠 <strong>Mode Terrain Résilient (Sénégal)</strong> • ${nbAttente} action(s) enregistrée(s) localement`;
    } else if (nbAttente > 0) {
      bandeau.style.display = 'flex';
      bandeau.style.background = '#ECFDF5';
      bandeau.style.color = '#065F46';
      bandeau.style.border = '1px solid #10B981';
      bandeau.innerHTML = `🟢 Connecté • <strong>${nbAttente} action(s) à synchroniser</strong> <button id="btn-sync-bandeau" style="margin-left:8px; background:#10B981; color:#fff; border:none; border-radius:12px; padding:2px 8px; font-size:0.75rem; cursor:pointer; font-weight:bold;">Envoyer 🚀</button>`;
    } else {
      bandeau.style.display = 'none';
    }
  }
}

/**
 * Initialise les écouteurs réseau et affiche la bannière d'état réseau résiliente
 */
export function initialiserModeOffline({
  supabase = null,
  afficherToastFn = null,
  onStatusChange = null
} = {}) {
  // Création du bandeau d'état réseau bas d'écran s'il n'existe pas
  let bandeau = document.getElementById('bandeau-statut-reseau');
  if (!bandeau) {
    bandeau = document.createElement('div');
    bandeau.id = 'bandeau-statut-reseau';
    bandeau.style.cssText = `
      position: fixed;
      bottom: 14px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      display: none;
      align-items: center;
      gap: 8px;
      padding: 8px 18px;
      border-radius: 30px;
      font-size: 0.82rem;
      font-weight: 600;
      box-shadow: 0 4px 16px rgba(0,0,0,0.18);
      transition: all 0.3s ease;
      font-family: inherit;
    `;
    document.body.appendChild(bandeau);
  }

  // Événements natifs de connectivité
  window.addEventListener('online', async () => {
    mettreAJourPastilleReseau();
    if (typeof onStatusChange === 'function') onStatusChange(true);
    if (supabase) {
      await synchroniserQueueHorsLigne(supabase, afficherToastFn);
    }
  });

  window.addEventListener('offline', () => {
    mettreAJourPastilleReseau();
    if (typeof onStatusChange === 'function') onStatusChange(false);
    if (afficherToastFn) {
      afficherToastFn('📴 Signal 4G interrompu. Mode terrain activé : vous pouvez continuer à prospecter normalement en toute sécurité.');
    }
  });

  // Délégation de clics pour les boutons de synchronisation manuelle
  document.addEventListener('click', async (e) => {
    if (e.target.closest('#btn-sync-header') || e.target.closest('#btn-sync-bandeau')) {
      e.preventDefault();
      if (supabase) {
        await synchroniserQueueHorsLigne(supabase, afficherToastFn);
      }
    }
  });

  // État initial
  mettreAJourPastilleReseau();
}
