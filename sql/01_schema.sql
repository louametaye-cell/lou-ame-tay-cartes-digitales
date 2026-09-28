-- ==============================================================================
-- LOU AME TAY — FICHIER 1 : SCHEMA DE BASE DE DONNEES (01_schema.sql)
-- ==============================================================================
-- Extensions requises pour UUID et cryptographie
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Fonction trigger pour la mise à jour automatique du champ updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 1. TABLE : commerciaux
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.commerciaux (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  poste TEXT,
  telephone TEXT,
  email TEXT,
  whatsapp TEXT,
  bio TEXT,
  photo_url TEXT,
  zone TEXT,
  categorie TEXT CHECK (categorie IN ('Direction', 'Vente', 'Support', 'Technique')),
  actif BOOLEAN DEFAULT true,
  multi_cartes JSONB DEFAULT '[]'::jsonb,
  linkedin TEXT,
  facebook TEXT,
  instagram TEXT,
  tiktok TEXT,
  langue_preferee TEXT DEFAULT 'fr',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger updated_at sur commerciaux
DROP TRIGGER IF EXISTS trigger_commerciaux_updated_at ON public.commerciaux;
CREATE TRIGGER trigger_commerciaux_updated_at
  BEFORE UPDATE ON public.commerciaux
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 2. TABLE : leads (Prospects capturés depuis les cartes de visite)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commercial_id UUID REFERENCES public.commerciaux(id) ON DELETE SET NULL,
  restaurant_nom TEXT NOT NULL,
  prospect_nom TEXT NOT NULL,
  telephone TEXT NOT NULL,
  ville TEXT,
  formule TEXT CHECK (formule IN ('Tàmbali', 'Nio Far', 'Xéweul', 'Sur Mesure')),
  message TEXT,
  statut TEXT DEFAULT 'nouveau' CHECK (statut IN ('nouveau', 'contacté', 'converti', 'perdu')),
  score INTEGER DEFAULT 0,
  source TEXT DEFAULT 'carte_qr',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_commercial_id ON public.leads(commercial_id);
CREATE INDEX IF NOT EXISTS idx_leads_statut ON public.leads(statut);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

-- ------------------------------------------------------------------------------
-- 3. TABLE : scans (Traçabilité des scans QR codes avec géolocalisation)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commercial_id UUID REFERENCES public.commerciaux(id) ON DELETE CASCADE,
  pays TEXT DEFAULT 'Sénégal',
  ville TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  user_agent TEXT,
  referrer TEXT,
  scanned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scans_commercial_id ON public.scans(commercial_id);
CREATE INDEX IF NOT EXISTS idx_scans_scanned_at ON public.scans(scanned_at DESC);

-- ------------------------------------------------------------------------------
-- 4. TABLE : analytics_daily (Statistiques agrégées par jour et par commercial)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  commercial_id UUID REFERENCES public.commerciaux(id) ON DELETE CASCADE,
  nb_scans INTEGER DEFAULT 0,
  nb_leads INTEGER DEFAULT 0,
  nb_appels INTEGER DEFAULT 0,
  nb_whatsapp INTEGER DEFAULT 0,
  nb_partages INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_commercial_date UNIQUE (commercial_id, date)
);

CREATE INDEX IF NOT EXISTS idx_analytics_commercial_id ON public.analytics_daily(commercial_id);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON public.analytics_daily(date DESC);
