-- ==============================================================================
-- 15. TABLE MESSAGES INTERNES & RAPPORTS DE RÉUNION DIRECTION
-- ==============================================================================

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

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_messages_internes_comm ON public.messages_internes(commercial_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_internes_rdv ON public.messages_internes(rdv_id);

-- Politiques RLS
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
END $$;
