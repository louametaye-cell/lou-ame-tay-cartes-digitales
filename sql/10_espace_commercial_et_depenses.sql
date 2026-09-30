-- ==============================================================================
-- 10_ESPACE_COMMERCIAL_ET_DEPENSES.SQL
-- ESPACE PERSONNEL CONSEILLER, GESTION DES NOTES DE FRAIS & COMMISSIONS 10%
-- ==============================================================================

-- 1. EXTENSION DE LA TABLE COMMERCIAUX : CODE PIN ET POINTS DE PERFORMANCE
ALTER TABLE public.commerciaux 
  ADD COLUMN IF NOT EXISTS pin_code TEXT DEFAULT '1234',
  ADD COLUMN IF NOT EXISTS points_score INTEGER DEFAULT 0;

-- 2. TABLE DES ANNONCES & NOTES DE SERVICE DE LA DIRECTION
CREATE TABLE IF NOT EXISTS public.annonces_equipe (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titre TEXT NOT NULL,
  contenu TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'reunion', 'bonus', 'urgent')),
  date_evenement TIMESTAMP WITH TIME ZONE,
  auteur TEXT DEFAULT 'Direction Lou Ame Tay',
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_annonces_actif ON public.annonces_equipe(actif, created_at DESC);

-- 3. TABLE DES COMMISSIONS SUR CONTRATS SIGNÉS (RÈGLE DES 10%)
CREATE TABLE IF NOT EXISTS public.commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  commercial_id UUID NOT NULL REFERENCES public.commerciaux(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  restaurant_nom TEXT NOT NULL,
  formule TEXT NOT NULL, -- 'Tàmbali', 'Nio Far', 'Xéweul', 'Sur Mesure', 'Installation'
  montant_contrat NUMERIC(12, 2) NOT NULL DEFAULT 0,
  pourcentage NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
  montant_commission NUMERIC(12, 2) NOT NULL DEFAULT 0,
  statut TEXT NOT NULL DEFAULT 'EN_ATTENTE' CHECK (statut IN ('EN_ATTENTE', 'VALIDE', 'PAYE', 'ANNULE')),
  date_signature DATE DEFAULT CURRENT_DATE,
  date_paiement TIMESTAMP WITH TIME ZONE,
  moyen_paiement TEXT CHECK (moyen_paiement IN ('Wave', 'Orange Money', 'Especes', 'Virement')),
  reference_paiement TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commissions_commercial ON public.commissions(commercial_id);
CREATE INDEX IF NOT EXISTS idx_commissions_statut ON public.commissions(statut);

-- 4. TABLE DES NOTES DE FRAIS & DÉPENSES TERRAIN (AVEC JUSTIFICATIF OBLIGATOIRE)
CREATE TABLE IF NOT EXISTS public.notes_frais (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  commercial_id UUID NOT NULL REFERENCES public.commerciaux(id) ON DELETE CASCADE,
  titre_motif TEXT NOT NULL,
  categorie TEXT NOT NULL CHECK (categorie IN ('Transport', 'Repas', 'Carburant', 'Hebergement', 'Fournitures', 'Autre')),
  montant NUMERIC(12, 2) NOT NULL CHECK (montant > 0),
  date_depense DATE NOT NULL DEFAULT CURRENT_DATE,
  justificatif_url TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'EN_ATTENTE' CHECK (statut IN ('EN_ATTENTE', 'APPROUVE', 'REMBOURSE', 'REFUSE')),
  commentaire_commercial TEXT,
  motif_refus TEXT,
  valide_par TEXT,
  date_validation TIMESTAMP WITH TIME ZONE,
  date_remboursement TIMESTAMP WITH TIME ZONE,
  moyen_remboursement TEXT CHECK (moyen_remboursement IN ('Wave', 'Orange Money', 'Especes', 'Virement')),
  reference_remboursement TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_frais_commercial ON public.notes_frais(commercial_id);
CREATE INDEX IF NOT EXISTS idx_frais_statut ON public.notes_frais(statut);
CREATE INDEX IF NOT EXISTS idx_frais_date ON public.notes_frais(date_depense DESC);

-- 5. SÉCURITÉ ROW LEVEL SECURITY (RLS)
ALTER TABLE public.annonces_equipe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes_frais ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- Annonces équipe : lecture par tous (anonyme et authentifié)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'annonces_equipe' AND policyname = 'Lecture annonces') THEN
    CREATE POLICY "Lecture annonces" ON public.annonces_equipe FOR SELECT USING (actif = true);
  END IF;
  -- Annonces équipe : gestion par admin
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'annonces_equipe' AND policyname = 'Admin annonces') THEN
    CREATE POLICY "Admin annonces" ON public.annonces_equipe FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Commissions : lecture et insertion
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'commissions' AND policyname = 'Lecture commissions') THEN
    CREATE POLICY "Lecture commissions" ON public.commissions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'commissions' AND policyname = 'Admin commissions') THEN
    CREATE POLICY "Admin commissions" ON public.commissions FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Notes de frais : lecture, insertion et modification
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notes_frais' AND policyname = 'Lecture notes frais') THEN
    CREATE POLICY "Lecture notes frais" ON public.notes_frais FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notes_frais' AND policyname = 'Creation notes frais') THEN
    CREATE POLICY "Creation notes frais" ON public.notes_frais FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notes_frais' AND policyname = 'Admin notes frais') THEN
    CREATE POLICY "Admin notes frais" ON public.notes_frais FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 6. DONNÉE D'EXEMPLE : PREMIÈRE ANNONCE DE BIENVENUE
INSERT INTO public.annonces_equipe (titre, contenu, type, date_evenement, auteur)
VALUES 
  ('Bienvenue sur votre Espace Conseiller Lou Ame Tay', 'Votre espace personnel est désormais actif : suivez vos scans de carte, enregistrez vos prospects, visualisez vos commissions à 10% sur les contrats et déclarez vos frais de transport avec photo du reçu.', 'info', NOW(), 'Direction Commerciale')
ON CONFLICT DO NOTHING;

NOTIFY pgrst, 'reload schema';
