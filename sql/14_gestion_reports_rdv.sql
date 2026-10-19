-- ==============================================================================
-- 14_GESTION_REPORTS_RDV.SQL
-- EXTENSION DE LA TABLE RENDEZ_VOUS : GESTION DES REPORTS AVEC JUSTIFICATIFS
-- ==============================================================================

ALTER TABLE public.rendez_vous
  ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'confirme',
  ADD COLUMN IF NOT EXISTS motif_report TEXT,
  ADD COLUMN IF NOT EXISTS preuve_report_url TEXT,
  ADD COLUMN IF NOT EXISTS rdv_parent_id UUID REFERENCES public.rendez_vous(id) ON DELETE SET NULL;

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

CREATE INDEX IF NOT EXISTS idx_rdv_statut ON public.rendez_vous(statut);
CREATE INDEX IF NOT EXISTS idx_rdv_parent_id ON public.rendez_vous(rdv_parent_id);
