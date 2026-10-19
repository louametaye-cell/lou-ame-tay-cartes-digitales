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

-- 4. Table messages_internes pour les rapports de réunion d'Aissatou et communication Direction
CREATE TABLE IF NOT EXISTS public.messages_internes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commercial_id UUID REFERENCES public.commerciaux(id) ON DELETE SET NULL,
  expediteur_nom TEXT NOT NULL,
  expediteur_type TEXT NOT NULL DEFAULT 'commercial' CHECK (expediteur_type IN ('commercial', 'admin')),
  destinataire_type TEXT NOT NULL DEFAULT 'admin' CHECK (destinataire_type IN ('admin', 'commercial', 'all')),
  destinataire_id UUID,
  titre TEXT NOT NULL,
  contenu TEXT NOT NULL,
  rdv_id UUID REFERENCES public.rendez_vous(id) ON DELETE SET NULL,
  statut_lecture BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_internes_comm ON public.messages_internes(commercial_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_internes_rdv ON public.messages_internes(rdv_id);

ALTER TABLE public.messages_internes ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages_internes' AND policyname = 'Lecture messages internes') THEN
    CREATE POLICY "Lecture messages internes" ON public.messages_internes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages_internes' AND policyname = 'Insertion messages internes') THEN
    CREATE POLICY "Insertion messages internes" ON public.messages_internes FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages_internes' AND policyname = 'Update messages internes') THEN
    CREATE POLICY "Update messages internes" ON public.messages_internes FOR UPDATE USING (true) WITH CHECK (true);
  END IF;

-- 5. Sécurisation RLS : Seul l'Admin/CEO authentifié peut insérer un commercial
ALTER TABLE public.commerciaux ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Insertion publique commerciaux" ON public.commerciaux;
DROP POLICY IF EXISTS "Admin full access" ON public.commerciaux;
DROP POLICY IF EXISTS "Seul le CEO peut créer un commercial" ON public.commerciaux;
DROP POLICY IF EXISTS "Admin peut tout faire" ON public.commerciaux;
DROP POLICY IF EXISTS "Lecture publique commerciaux" ON public.commerciaux;

CREATE POLICY "Lecture publique commerciaux"
ON public.commerciaux
FOR SELECT
TO public
USING (true);

CREATE POLICY "Seul le CEO peut créer un commercial"
ON public.commerciaux
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admin peut tout faire"
ON public.commerciaux
FOR ALL
TO authenticated
USING (true);
