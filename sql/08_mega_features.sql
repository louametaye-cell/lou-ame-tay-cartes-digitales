-- ==============================================================================
-- 08_MEGA_FEATURES.SQL — 15 FONCTIONNALITÉS WOW & NETWORKING B2B POUR LOU AME TAY
-- ==============================================================================

-- ═══════ SPRINT A — WOW VISUEL ═══════

-- A2 : Statut de disponibilité en direct
ALTER TABLE public.commerciaux 
  ADD COLUMN IF NOT EXISTS statut_disponible TEXT DEFAULT 'disponible' 
    CHECK (statut_disponible IN ('disponible', 'occupe', 'indisponible')),
  ADD COLUMN IF NOT EXISTS statut_message TEXT,
  ADD COLUMN IF NOT EXISTS statut_jusqua TIMESTAMP WITH TIME ZONE;

-- A3 : Vue statistiques pour compteur de vues dynamique
CREATE OR REPLACE VIEW public.commerciaux_stats AS
SELECT 
  c.id AS commercial_id,
  COUNT(DISTINCT s.id) FILTER (WHERE s.scanned_at > NOW() - INTERVAL '30 days') AS vues_mois,
  COUNT(DISTINCT s.id) FILTER (WHERE s.scanned_at > CURRENT_DATE) AS vues_jour,
  COUNT(DISTINCT s.id) AS vues_total
FROM public.commerciaux c
LEFT JOIN public.scans s ON s.commercial_id = c.id
GROUP BY c.id;

-- ═══════ SPRINT B — NETWORKING ═══════

-- B1 : Échange de cartes (Lead retour instantané)
CREATE TABLE IF NOT EXISTS public.echanges_cartes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  commercial_id UUID NOT NULL REFERENCES public.commerciaux(id) ON DELETE CASCADE,
  nom_visiteur TEXT NOT NULL,
  telephone_visiteur TEXT NOT NULL,
  email_visiteur TEXT,
  entreprise_visiteur TEXT,
  message TEXT,
  statut TEXT DEFAULT 'nouveau' CHECK (statut IN ('nouveau', 'contacte', 'converti', 'ignore')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_echanges_commercial ON public.echanges_cartes(commercial_id);

-- B2 : Prise de RDV en ligne
CREATE TABLE IF NOT EXISTS public.rendez_vous (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  commercial_id UUID NOT NULL REFERENCES public.commerciaux(id) ON DELETE CASCADE,
  nom_prospect TEXT NOT NULL,
  telephone_prospect TEXT NOT NULL,
  email_prospect TEXT,
  restaurant_prospect TEXT,
  date_rdv TIMESTAMP WITH TIME ZONE NOT NULL,
  duree_minutes INTEGER DEFAULT 30,
  type_rdv TEXT DEFAULT 'demo' CHECK (type_rdv IN ('demo', 'audit', 'formation', 'installation')),
  notes TEXT,
  statut TEXT DEFAULT 'confirme' CHECK (statut IN ('confirme', 'annule', 'effectue', 'reporte')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rdv_commercial ON public.rendez_vous(commercial_id);
CREATE INDEX IF NOT EXISTS idx_rdv_date ON public.rendez_vous(date_rdv);

-- Disponibilités du commercial
ALTER TABLE public.commerciaux 
  ADD COLUMN IF NOT EXISTS disponibilites JSONB DEFAULT '{
    "lundi": ["09:00","12:00","14:00","18:00"],
    "mardi": ["09:00","12:00","14:00","18:00"],
    "mercredi": ["09:00","12:00","14:00","18:00"],
    "jeudi": ["09:00","12:00","14:00","18:00"],
    "vendredi": ["09:00","12:00","14:00","18:00"],
    "samedi": ["10:00","13:00"],
    "dimanche": []
  }'::jsonb;

-- E1 : Parrainage & Recommandation
ALTER TABLE public.scans 
  ADD COLUMN IF NOT EXISTS referrer_id UUID REFERENCES public.commerciaux(id);

CREATE TABLE IF NOT EXISTS public.parrainages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parrain_id UUID NOT NULL REFERENCES public.commerciaux(id),
  filleul_id UUID REFERENCES public.commerciaux(id),
  visiteur_nom TEXT,
  visiteur_telephone TEXT,
  source TEXT,
  converti BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ═══════ SPRINT C — BUSINESS ═══════

-- C1 : Logos restaurants clients (Preuve sociale)
CREATE TABLE IF NOT EXISTS public.clients_logos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom_restaurant TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  site_web TEXT,
  menu_qr_url TEXT,
  ordre INTEGER DEFAULT 0,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- C2 : Badges & certifications d'expertise
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  commercial_id UUID NOT NULL REFERENCES public.commerciaux(id) ON DELETE CASCADE,
  icone TEXT NOT NULL,
  libelle TEXT NOT NULL,
  couleur TEXT DEFAULT '#C9A227',
  ordre INTEGER DEFAULT 0,
  actif BOOLEAN DEFAULT true
);

-- C3 : Témoignages clients vérifiés
CREATE TABLE IF NOT EXISTS public.temoignages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  commercial_id UUID REFERENCES public.commerciaux(id),
  nom_client TEXT NOT NULL,
  restaurant_client TEXT,
  note INTEGER CHECK (note BETWEEN 0 AND 10),
  texte TEXT,
  video_youtube_id TEXT,
  photo_url TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ═══════ RLS POUR TOUTES LES NOUVELLES TABLES ═══════

ALTER TABLE public.echanges_cartes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rendez_vous ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parrainages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients_logos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temoignages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- INSERT public (formulaires de scan & prospect)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'echanges_cartes' AND policyname = 'Insert echanges') THEN
    CREATE POLICY "Insert echanges" ON public.echanges_cartes FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rendez_vous' AND policyname = 'Insert rdv') THEN
    CREATE POLICY "Insert rdv" ON public.rendez_vous FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'parrainages' AND policyname = 'Insert parrainages') THEN
    CREATE POLICY "Insert parrainages" ON public.parrainages FOR INSERT WITH CHECK (true);
  END IF;

  -- SELECT public (lecture ouverte pour composants publics)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'echanges_cartes' AND policyname = 'Select echanges') THEN
    CREATE POLICY "Select echanges" ON public.echanges_cartes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rendez_vous' AND policyname = 'Select rdv') THEN
    CREATE POLICY "Select rdv" ON public.rendez_vous FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'parrainages' AND policyname = 'Select parrainages') THEN
    CREATE POLICY "Select parrainages" ON public.parrainages FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients_logos' AND policyname = 'Select clients_logos') THEN
    CREATE POLICY "Select clients_logos" ON public.clients_logos FOR SELECT USING (actif = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'badges' AND policyname = 'Select badges') THEN
    CREATE POLICY "Select badges" ON public.badges FOR SELECT USING (actif = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'temoignages' AND policyname = 'Select temoignages') THEN
    CREATE POLICY "Select temoignages" ON public.temoignages FOR SELECT USING (actif = true);
  END IF;

  -- Admin full access
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'echanges_cartes' AND policyname = 'Admin echanges') THEN
    CREATE POLICY "Admin echanges" ON public.echanges_cartes FOR ALL USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rendez_vous' AND policyname = 'Admin rdv') THEN
    CREATE POLICY "Admin rdv" ON public.rendez_vous FOR ALL USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'parrainages' AND policyname = 'Admin parrainages') THEN
    CREATE POLICY "Admin parrainages" ON public.parrainages FOR ALL USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clients_logos' AND policyname = 'Admin clients_logos') THEN
    CREATE POLICY "Admin clients_logos" ON public.clients_logos FOR ALL USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'badges' AND policyname = 'Admin badges') THEN
    CREATE POLICY "Admin badges" ON public.badges FOR ALL USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'temoignages' AND policyname = 'Admin temoignages') THEN
    CREATE POLICY "Admin temoignages" ON public.temoignages FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- ═══════ SEED INITIAL : LOGOS RESTAURANTS & BADGES ═══════

INSERT INTO public.clients_logos (nom_restaurant, logo_url, site_web, ordre, actif)
VALUES
  ('Le Teranga Dakar', 'images/logo.svg', 'https://leteranga-dakar.com', 1, true),
  ('L''Alkimia Almadies', 'images/logo.svg', 'https://alkimia.sn', 2, true),
  ('Le Jardin Thaï Thiès', 'images/logo.svg', 'https://jardinthai-thies.sn', 3, true),
  ('Le Cabanon Saly', 'images/logo.svg', 'https://lecabanon-saly.com', 4, true)
ON CONFLICT DO NOTHING;

-- Badges d'expertise pour les conseillers
INSERT INTO public.badges (commercial_id, icone, libelle, couleur, ordre, actif)
SELECT id, '🏆', 'Expert Certifié KDS & Salle', '#C9A227', 1, true
FROM public.commerciaux WHERE prenom = 'Mamadou'
ON CONFLICT DO NOTHING;

INSERT INTO public.badges (commercial_id, icone, libelle, couleur, ordre, actif)
SELECT id, '⚡', 'Intervention Rapide < 2h', '#0B1F3A', 2, true
FROM public.commerciaux WHERE prenom = 'Mamadou'
ON CONFLICT DO NOTHING;

INSERT INTO public.badges (commercial_id, icone, libelle, couleur, ordre, actif)
SELECT id, '⭐', 'Top Conseiller Restauration 2026', '#166534', 3, true
FROM public.commerciaux WHERE prenom = 'Mamadou'
ON CONFLICT DO NOTHING;

-- Témoignages initiaux
INSERT INTO public.temoignages (commercial_id, nom_client, restaurant_client, note, texte, actif)
SELECT id, 'Ousmane Diop', 'Directeur — Le Teranga Dakar', 10, 'L''installation des écrans KDS et du menu QR code a divisé par deux notre temps d''attente au service de midi. Un vrai bond en avant !', true
FROM public.commerciaux WHERE prenom = 'Mamadou'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.temoignages (commercial_id, nom_client, restaurant_client, note, texte, actif)
SELECT id, 'Aminata Fall', 'Gérante — Café du Fleuve', 9, 'Nos serveurs adorent l''autonomie de commande. Le panier moyen a progressé de 22% dès le premier mois.', true
FROM public.commerciaux WHERE prenom = 'Mamadou'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Notifier PostgREST pour recharger le schéma
NOTIFY pgrst, 'reload schema';
