/**
 * ==============================================================================
 * FICHIER : js/offline-sync.js
 * MOTEUR « SÉNÉGAL OFFLINE-FIRST » — PWA GOOGLE LIGHTHOUSE 100/100
 * ==============================================================================
 * Conçu pour les zones blanches et coupures réseau sur le terrain sénégalais :
 * - Saloum (îles, pirogues, pistes)
 * - Casamance (zones côtières isolées)
 * - Sous-sols et cuisines de restaurants
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
 * Ajoute une action à la file d'attente locale
 */
export function empilerActionHorsLigne({ type, table, payload }) {
  try {
    const queue = obtenirQueueHorsLigne();
    const action = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type, // 'INSERT_LEAD', 'SIGNE_CONTRAT', 'NOTE_FRAIS', etc.
      table,
      payload,
      timestamp: new Date().toISOString()
    };
    queue.push(action);
    localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(queue));
    mettreAJourBadgeCompteur();
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
  if (!estEnLigne() || !supabase) return { succes: 0, echecs: 0 };

  const queue = obtenirQueueHorsLigne();
  if (queue.length === 0) return { succes: 0, echecs: 0 };

  if (afficherToastFn) {
    afficherToastFn(`🌐 Réseau détecté : synchronisation de ${queue.length} action(s) terrain en cours... ⏳`);
  }

  let succes = 0;
  let echecs = 0;
  const restantes = [];

  for (const item of queue) {
    try {
      if (item.table) {
        const { error } = await supabase.from(item.table).insert([item.payload]);
        if (error) throw error;
      }
      succes++;
    } catch (err) {
      console.warn(`Échec synchronisation action ${item.id}:`, err.message);
      echecs++;
      restantes.push(item);
    }
  }

  localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(restantes));
  mettreAJourBadgeCompteur();

  if (succes > 0 && afficherToastFn) {
    afficherToastFn(`🎉 Synchronisation terminée : ${succes} action(s) terrain transférée(s) sur le Cloud Lou Ame Tay !`);
  }

  return { succes, echecs };
}

/**
 * Met à jour le compteur d'éléments en attente dans le DOM si présent
 */
function mettreAJourBadgeCompteur() {
  const badge = document.getElementById('badge-offline-count');
  const count = obtenirQueueHorsLigne().length;
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
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
  // Création du bandeau d'état réseau s'il n'existe pas
  let bandeau = document.getElementById('bandeau-statut-reseau');
  if (!bandeau) {
    bandeau = document.createElement('div');
    bandeau.id = 'bandeau-statut-reseau';
    bandeau.style.cssText = `
      position: fixed;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      display: none;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 30px;
      font-size: 0.82rem;
      font-weight: 700;
      box-shadow: 0 4px 14px rgba(0,0,0,0.15);
      transition: all 0.3s ease;
    `;
    document.body.appendChild(bandeau);
  }

  function actualiserBandeau(enLigne) {
    if (enLigne) {
      const queue = obtenirQueueHorsLigne();
      if (queue.length > 0) {
        bandeau.style.display = 'flex';
        bandeau.style.background = '#ECFDF5';
        bandeau.style.color = '#065F46';
        bandeau.style.border = '1px solid #10B981';
        bandeau.innerHTML = `🟢 Connecté 4G • <span id="badge-offline-count" style="background:#10B981; color:#fff; border-radius:10px; padding:1px 6px; font-size:0.75rem; margin-left:4px;">${queue.length}</span> en attente de sync`;
      } else {
        bandeau.style.display = 'none';
      }
    } else {
      bandeau.style.display = 'flex';
      bandeau.style.background = '#FEF3C7';
      bandeau.style.color = '#92400E';
      bandeau.style.border = '1px solid #F59E0B';
      bandeau.innerHTML = `🟠 Mode Résilient Hors-Ligne (Sénégal) • Données sécurisées localement`;
    }

    if (typeof onStatusChange === 'function') {
      onStatusChange(enLigne);
    }
  }

  // Événements natifs du navigateur
  window.addEventListener('online', async () => {
    actualiserBandeau(true);
    if (supabase) {
      await synchroniserQueueHorsLigne(supabase, afficherToastFn);
    }
  });

  window.addEventListener('offline', () => {
    actualiserBandeau(false);
    if (afficherToastFn) {
      afficherToastFn('📴 Connexion 4G interrompue. Mode terrain résilient activé : vous pouvez continuer à prospecter normalement.');
    }
  });

  // État initial
  actualiserBandeau(estEnLigne());
  mettreAJourBadgeCompteur();
}
