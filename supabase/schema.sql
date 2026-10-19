-- ==============================================================================
-- SCHEMA SUPABASE : EXTENSION GESTION DES REPORTS DE RENDEZ-VOUS & PREUVES
-- Projet : Lou Ame Tay (DAW Digital Arts Work — by MG)
-- ==============================================================================

-- 1. Ajouter les colonnes de gestion des reports et statuts à la table public.rendez_vous
ALTER TABLE public.rendez_vous
  ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'confirme',
  ADD COLUMN IF NOT EXISTS motif_report TEXT,
  ADD COLUMN IF NOT EXISTS preuve_report_url TEXT,
  ADD COLUMN IF NOT EXISTS rdv_parent_id UUID REFERENCES public.rendez_vous(id) ON DELETE SET NULL;

-- 2. Mettre à jour la contrainte CHECK sur le statut pour accepter 'reporte' et 'planifie'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rendez_vous_statut_check'
  ) THEN
    ALTER TABLE public.rendez_vous DROP CONSTRAINT rendez_vous_statut_check;
  END IF;

  ALTER TABLE public.rendez_vous 
    ADD CONSTRAINT rendez_vous_statut_check 
    CHECK (statut IN ('confirme', 'planifie', 'annule', 'effectue', 'reporte'));
END $$;

-- 3. Indexation pour les performances de tri et de jointure parent/enfant
CREATE INDEX IF NOT EXISTS idx_rdv_statut ON public.rendez_vous(statut);
CREATE INDEX IF NOT EXISTS idx_rdv_parent_id ON public.rendez_vous(rdv_parent_id);
