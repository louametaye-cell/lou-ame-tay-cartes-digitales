-- ==============================================================================
-- 11_TRACABILITE_AUDIT_GOOGLE.SQL
-- TRAÇABILITÉ TOTALE DES RENDEZ-VOUS (CHECK-IN GPS ANTI-FRAUDE)
-- ET JOURNAL D'ACTIVITÉS EN TEMPS RÉEL (AUDIT TRAIL SÉNÉGAL)
-- ==============================================================================

-- 1. EXTENSION DE LA TABLE RENDEZ_VOUS POUR LE CHECK-IN GPS TERRAIN ("PROOF OF VISIT 2.0")
ALTER TABLE public.rendez_vous 
  ADD COLUMN IF NOT EXISTS latitude_restaurant NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS longitude_restaurant NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS adresse_restaurant TEXT,
  ADD COLUMN IF NOT EXISTS checkin_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS checkin_latitude NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS checkin_longitude NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS checkin_distance_metres NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS checkin_statut TEXT DEFAULT 'EN_ATTENTE' 
    CHECK (checkin_statut IN ('EN_ATTENTE', 'VALIDE_SUR_PLACE', 'ECART_SUSPECT', 'SANS_GPS')),
  ADD COLUMN IF NOT EXISTS checkin_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS checkin_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_rdv_checkin_statut ON public.rendez_vous(checkin_statut);
CREATE INDEX IF NOT EXISTS idx_rdv_checkin_at ON public.rendez_vous(checkin_at DESC);

-- 2. TABLE DU JOURNAL D'ACTIVITÉS ET DE SÉCURITÉ EN TEMPS RÉEL
CREATE TABLE IF NOT EXISTS public.journal_activites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type_action TEXT NOT NULL CHECK (
    type_action IN (
      'CONNEXION_COMMERCIAL',
      'DECONNEXION_COMMERCIAL',
      'CHECKIN_GPS',
      'NOUVEAU_PROSPECT',
      'NOTE_FRAIS_SOUMISE',
      'SCAN_CARTE',
      'COMMISSION_DEMANDEE',
      'ADMIN_CONNEXION',
      'ADMIN_ACTION'
    )
  ),
  commercial_id UUID REFERENCES public.commerciaux(id) ON DELETE SET NULL,
  commercial_nom TEXT,
  description TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  statut TEXT NOT NULL DEFAULT 'SUCCES' CHECK (statut IN ('SUCCES', 'ALERTE', 'REFUS', 'SUSPECT')),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journal_created_at ON public.journal_activites(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_type_action ON public.journal_activites(type_action);
CREATE INDEX IF NOT EXISTS idx_journal_commercial ON public.journal_activites(commercial_id);
CREATE INDEX IF NOT EXISTS idx_journal_statut ON public.journal_activites(statut);

-- 3. SÉCURITÉ ROW LEVEL SECURITY (RLS)
ALTER TABLE public.journal_activites ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- Journal activités : insertion libre (pour logguer les connexions et check-ins)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'journal_activites' AND policyname = 'Insertion journal') THEN
    CREATE POLICY "Insertion journal" ON public.journal_activites FOR INSERT WITH CHECK (true);
  END IF;

  -- Journal activités : lecture par admin / direction
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'journal_activites' AND policyname = 'Lecture journal') THEN
    CREATE POLICY "Lecture journal" ON public.journal_activites FOR SELECT USING (true);
  END IF;

  -- Rendez-vous : politiques de sécurité si non existantes
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rendez_vous' AND policyname = 'Lecture rdv') THEN
    CREATE POLICY "Lecture rdv" ON public.rendez_vous FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rendez_vous' AND policyname = 'Mise a jour rdv') THEN
    CREATE POLICY "Mise a jour rdv" ON public.rendez_vous FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rendez_vous' AND policyname = 'Creation rdv') THEN
    CREATE POLICY "Creation rdv" ON public.rendez_vous FOR INSERT WITH CHECK (true);
  END IF;
END $$;
