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
const ENV = (typeof window !== 'undefined' && (window.__ENV__ || window.ENV)) || {};

// Identifiants par défaut (injectés par env.js pour LWS ou variables d'environnement Vite)
const DEFAULT_SUPABASE_URL = ENV?.VITE_SUPABASE_URL || 'https://ugmdpjncplnlizhpongo.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = ENV?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbWRwam5jcGxubGl6aHBvbmdvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDU0OTE1NSwiZXhwIjoyMTA2MTI1MTU1fQ.aHT61DcJO5T92GlwQMgpkk6eYOAFc4-MvszrL7Ib4_4';

// Récupération dynamique : window.__ENV__ (LWS), variables Vite (.env), localStorage, ou défaut
export const SUPABASE_URL = 
  (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__.VITE_SUPABASE_URL) ||
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) ||
  localStorage.getItem('LOUAMETAY_SUPABASE_URL') ||
  DEFAULT_SUPABASE_URL;

export const SUPABASE_ANON_KEY = 
  (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__.VITE_SUPABASE_ANON_KEY) ||
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
