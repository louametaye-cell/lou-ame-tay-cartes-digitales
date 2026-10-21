-- ==============================================================================
-- 17. SPRINT MAJEUR V32 : ARCHITECTURE IA AISSATOU V2
-- Table Mémoire Long Terme & Journal des Actions Human-in-the-Loop
-- ==============================================================================

-- 1. Table de mémoire à long terme (Préférences clients, objections, notes terrain)
CREATE TABLE IF NOT EXISTS public.aissatou_memoire (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commercial_id UUID REFERENCES public.commerciaux(id) ON DELETE CASCADE,
  prospect_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  type_memoire TEXT NOT NULL CHECK (type_memoire IN (
    'preference_client',    -- Ex: Gérant joignable le matin avant 11h
    'objection_historique',  -- Ex: Réticent sur le coût du matériel
    'contexte_terrain',     -- Ex: Ruelle bloquée par travaux BRT
    'directive_ceo',        -- Ex: Consigne prioritaire émise par M. Mbaye
    'note_particuliere'
  )),
  sujet TEXT NOT NULL,       -- Ex: "MADIBA RESTO" ou "Hotel Lat Dior"
  contenu TEXT NOT NULL,     -- Ex: "M. Guissé préfère un passage le matin avant le service"
  source TEXT DEFAULT 'vocal_aissatou', -- 'vocal_aissatou', 'chat', 'compte_rendu'
  importance INT DEFAULT 1 CHECK (importance BETWEEN 1 AND 5),
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche contextuelle instantanée
CREATE INDEX IF NOT EXISTS idx_aissatou_memoire_comm ON public.aissatou_memoire(commercial_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aissatou_memoire_sujet ON public.aissatou_memoire(LOWER(sujet));
CREATE INDEX IF NOT EXISTS idx_aissatou_memoire_type ON public.aissatou_memoire(type_memoire);

-- Politiques RLS
ALTER TABLE public.aissatou_memoire ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'aissatou_memoire' AND policyname = 'Lecture memoire aissatou') THEN
    CREATE POLICY "Lecture memoire aissatou" ON public.aissatou_memoire FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'aissatou_memoire' AND policyname = 'Insertion memoire aissatou') THEN
    CREATE POLICY "Insertion memoire aissatou" ON public.aissatou_memoire FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'aissatou_memoire' AND policyname = 'Update memoire aissatou') THEN
    CREATE POLICY "Update memoire aissatou" ON public.aissatou_memoire FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 2. Table de traçabilité des actions Human-in-the-Loop
CREATE TABLE IF NOT EXISTS public.aissatou_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  utilisateur_id UUID,
  utilisateur_nom TEXT NOT NULL,
  role TEXT NOT NULL,
  fonction_demandee TEXT NOT NULL,   -- 'creer_prospect', 'planifier_rdv', 'envoyer_annonce'
  parametres JSONB NOT NULL,
  statut TEXT NOT NULL DEFAULT 'EN_ATTENTE_CONFIRMATION' CHECK (
    statut IN ('EN_ATTENTE_CONFIRMATION', 'CONFIRME_EXECUTE', 'ANNULE_UTILISATEUR', 'ERREUR_EXECUTION')
  ),
  reponse_systeme TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  executed_at TIMESTAMPTZ
);

ALTER TABLE public.aissatou_actions_log ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'aissatou_actions_log' AND policyname = 'Lecture actions log') THEN
    CREATE POLICY "Lecture actions log" ON public.aissatou_actions_log FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'aissatou_actions_log' AND policyname = 'Insertion actions log') THEN
    CREATE POLICY "Insertion actions log" ON public.aissatou_actions_log FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'aissatou_actions_log' AND policyname = 'Update actions log') THEN
    CREATE POLICY "Update actions log" ON public.aissatou_actions_log FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;
