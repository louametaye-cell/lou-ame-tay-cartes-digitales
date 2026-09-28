/**
 * ==============================================================================
 * FICHIER : js/env.js
 * CONFIGURATION DE PRODUCTION LWS (louametay.online) — LOU AME TAY v2.0
 * ==============================================================================
 * Ce fichier est chargé en production sur l'hébergement LWS (Apache / mutualisé).
 * Il injecte les identifiants Supabase dans l'environnement global du navigateur.
 * En cas de changement de clés, modifiez directement ce fichier sans devoir recompiler.
 */

export const ENV = {
  VITE_SUPABASE_URL: "https://ugmdpjncplnlizhpongo.supabase.co",
  VITE_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnbWRwam5jcGxubGl6aHBvbmdvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDU0OTE1NSwiZXhwIjoyMTA2MTI1MTU1fQ.aHT61DcJO5T92GlwQMgpkk6eYOAFc4-MvszrL7Ib4_4",
  APP_URL: "https://louametay.online",
  SUPPORT_PHONE: "+221 76 231 20 03",
  SUPPORT_WHATSAPP: "221762312003"
};

if (typeof window !== 'undefined') {
  window.__ENV__ = ENV;
}
