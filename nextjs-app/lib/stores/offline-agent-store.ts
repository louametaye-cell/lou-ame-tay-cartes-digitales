/**
 * ==============================================================================
 * FICHIER : nextjs-app/lib/stores/offline-agent-store.ts
 * STORE OFFLINE-FIRST ZUSTAND SÉNÉGAL (NEXT.JS 14 / TYPESCRIPT)
 * ==============================================================================
 */

export type TypeActionOffline =
  | 'INSERT_LEAD'
  | 'CREATE_QUOTE'
  | 'CHECKIN_AGENT'
  | 'DEROGATION_POINTAGE'
  | 'NOTE_FRAIS'
  | 'KYC_SUBMIT';

export interface ActionHorsLigne {
  id: string;
  type: TypeActionOffline;
  table: string;
  payload: Record<string, any>;
  description?: string;
  agentMatricule: string;
  timestamp: string;
  essais: number;
  synced: boolean;
}

export interface OfflineAgentState {
  enLigne: boolean;
  actionsQueue: ActionHorsLigne[];
  derniereSynchro: string | null;
  enCoursDeSynchro: boolean;
  
  // Actions
  setEnLigne: (status: boolean) => void;
  empilerAction: (action: Omit<ActionHorsLigne, 'id' | 'timestamp' | 'essais' | 'synced'>) => ActionHorsLigne;
  supprimerAction: (id: string) => void;
  viderQueue: () => void;
  setEnCoursDeSynchro: (loading: boolean) => void;
  enregistrerSuccesSynchro: (actionIds: string[]) => void;
}

const STORAGE_KEY = 'lat_next_offline_store';

/**
 * Gestionnaire de stockage local simple pour Next.js (côté client)
 */
export class OfflineAgentStore {
  private static instance: OfflineAgentStore;
  private queue: ActionHorsLigne[] = [];
  private listeners: Array<() => void> = [];

  private constructor() {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) this.queue = JSON.parse(raw);
      } catch (e) {
        console.warn('Erreur lecture queue local:', e);
      }
    }
  }

  public static getInstance(): OfflineAgentStore {
    if (!OfflineAgentStore.instance) {
      OfflineAgentStore.instance = new OfflineAgentStore();
    }
    return OfflineAgentStore.instance;
  }

  public getQueue(): ActionHorsLigne[] {
    return [...this.queue];
  }

  public empiler(action: Omit<ActionHorsLigne, 'id' | 'timestamp' | 'essais' | 'synced'>): ActionHorsLigne {
    const nouvelleAction: ActionHorsLigne = {
      ...action,
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      essais: 0,
      synced: false
    };

    this.queue.push(nouvelleAction);
    this.sauvegarder();
    return nouvelleAction;
  }

  public retirer(id: string): void {
    this.queue = this.queue.filter((a) => a.id !== id);
    this.sauvegarder();
  }

  public marquerSucces(ids: string[]): void {
    this.queue = this.queue.filter((a) => !ids.includes(a.id));
    this.sauvegarder();
  }

  private sauvegarder(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
        this.notify();
      } catch (e) {
        console.error('Erreur sauvegarde storage offline:', e);
      }
    }
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }
}
