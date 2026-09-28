/**
 * ==========================================================================
 * FICHIER : js/supabase-client.js
 * CLIENT SUPABASE POUR LOU AME TAY — ESPACE PRODUCTION & LOCALHOST
 * ==========================================================================
 * Initialise et exporte l'instance client Supabase.
 * Supporte :
 * 1. Les variables d'environnement Vite (.env : VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
 * 2. Le localStorage du navigateur (pour tests immédiats ou injection via l'interface)
 * 3. Valeurs par défaut avec détection automatique du statut configuré
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Identifiants par défaut (remplacez par vos identifiants réels de projet Supabase)
const DEFAULT_SUPABASE_URL = 'https://votre-projet.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// Récupération dynamique : variables Vite (.env), localStorage, ou défaut
export const SUPABASE_URL = 
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) ||
  localStorage.getItem('LOUAMETAY_SUPABASE_URL') ||
  DEFAULT_SUPABASE_URL;

export const SUPABASE_ANON_KEY = 
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) ||
  localStorage.getItem('LOUAMETAY_SUPABASE_ANON_KEY') ||
  DEFAULT_SUPABASE_ANON_KEY;

/**
 * Instance Supabase unique partagée sur l'ensemble de l'application
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

/**
 * Vérifie si les identifiants Supabase configurés sont valides et différents des placeholders
 * @returns {boolean}
 */
export function estSupabaseConfigure() {
  return (
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('votre-projet') &&
    !SUPABASE_URL.includes('VOTRE_PROJET') &&
    !SUPABASE_ANON_KEY.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...') &&
    !SUPABASE_ANON_KEY.includes('VOTRE_CLE_ANON')
  );
}

/**
 * Enregistre les clés Supabase dans le stockage local et recharge la page
 * @param {string} url - URL du projet Supabase
 * @param {string} anonKey - Clé publique Anon
 */
export function enregistrerConfigurationSupabase(url, anonKey) {
  if (url && anonKey) {
    localStorage.setItem('LOUAMETAY_SUPABASE_URL', url.trim());
    localStorage.setItem('LOUAMETAY_SUPABASE_ANON_KEY', anonKey.trim());
    window.location.reload();
  }
}
