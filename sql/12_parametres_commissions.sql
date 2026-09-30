-- ==============================================================================
-- 12_PARAMETRES_COMMISSIONS.SQL
-- CONFIGURATION GLOBALE DU TAUX DE COMMISSION MODIFIABLE & PERSISTANT
-- ==============================================================================

-- 1. TABLE DES PARAMÈTRES SYSTÈME GLOBAUX
CREATE TABLE IF NOT EXISTS public.parametres_systeme (
  cle TEXT PRIMARY KEY,
  valeur JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_parametres_cle ON public.parametres_systeme(cle);

-- 2. AJOUT DU TAUX DE COMMISSION DÉDIÉ SUR LA TABLE COMMERCIAUX (OPTIONNEL PAR AGENT)
ALTER TABLE public.commerciaux
  ADD COLUMN IF NOT EXISTS commission_taux NUMERIC(5, 2) DEFAULT 10.00;

-- 3. POLITIQUE RLS (ROW LEVEL SECURITY)
ALTER TABLE public.parametres_systeme ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'parametres_systeme' AND policyname = 'Lecture parametres publique') THEN
    CREATE POLICY "Lecture parametres publique" ON public.parametres_systeme FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'parametres_systeme' AND policyname = 'Admin gestion parametres') THEN
    CREATE POLICY "Admin gestion parametres" ON public.parametres_systeme FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 4. INSERTION DU TAUX STANDARD PAR DÉFAUT (10%)
INSERT INTO public.parametres_systeme (cle, valeur, description)
VALUES 
  ('taux_commission_defaut', '{"taux": 10.0, "devise": "FCFA", "modifie_par": "Direction Lou Ame Tay"}'::jsonb, 'Taux de commission standard appliqué à tous les commerciaux sur chaque contrat signé')
ON CONFLICT (cle) DO UPDATE 
SET valeur = EXCLUDED.valeur, updated_at = NOW();

-- Notification de mise à jour du cache de schéma PostgREST
NOTIFY pgrst, 'reload schema';
