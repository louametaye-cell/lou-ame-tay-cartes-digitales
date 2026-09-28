-- ==============================================================================
-- LOU AME TAY — FICHIER 2 : POLITIQUES ROW LEVEL SECURITY (02_rls.sql)
-- ==============================================================================
-- Active la sécurité granulaire sur chaque table pour protéger les données sensibles

-- 1. Activation RLS renforcée (Force RLS même pour les rôles d'administration et de maintenance)
ALTER TABLE public.commerciaux ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.commerciaux FORCE ROW LEVEL SECURITY;
ALTER TABLE public.leads FORCE ROW LEVEL SECURITY;
ALTER TABLE public.scans FORCE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_daily FORCE ROW LEVEL SECURITY;

-- 1.1 Restrictions de privilèges SQL directes pour le rôle public/anonyme (Defense-in-depth)
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.commerciaux FROM anon;
REVOKE UPDATE, DELETE, TRUNCATE ON public.leads FROM anon;
REVOKE UPDATE, DELETE, TRUNCATE ON public.scans FROM anon;
REVOKE ALL ON public.analytics_daily FROM anon;


-- ------------------------------------------------------------------------------
-- 2. POLITIQUES : commerciaux
-- ------------------------------------------------------------------------------
-- Lecture publique autorisée uniquement si la carte est active
DROP POLICY IF EXISTS "Lecture publique actifs" ON public.commerciaux;
CREATE POLICY "Lecture publique actifs"
  ON public.commerciaux
  FOR SELECT
  USING (actif = true OR auth.role() = 'authenticated');

-- Gestion totale (INSERT, UPDATE, DELETE) pour les administrateurs connectés
DROP POLICY IF EXISTS "Admin full access commerciaux" ON public.commerciaux;
CREATE POLICY "Admin full access commerciaux"
  ON public.commerciaux
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 3. POLITIQUES : leads
-- ------------------------------------------------------------------------------
-- Tout visiteur peut soumettre une demande de devis/démo depuis la carte
DROP POLICY IF EXISTS "Insertion publique des leads" ON public.leads;
CREATE POLICY "Insertion publique des leads"
  ON public.leads
  FOR INSERT
  WITH CHECK (true);

-- Seuls les administrateurs authentifiés peuvent consulter et modifier les leads
DROP POLICY IF EXISTS "Admin gestion des leads" ON public.leads;
CREATE POLICY "Admin gestion des leads"
  ON public.leads
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 4. POLITIQUES : scans
-- ------------------------------------------------------------------------------
-- Enregistrement anonyme d'un scan QR par le navigateur du prospect
DROP POLICY IF EXISTS "Insertion publique des scans" ON public.scans;
CREATE POLICY "Insertion publique des scans"
  ON public.scans
  FOR INSERT
  WITH CHECK (true);

-- Seuls les administrateurs connectés peuvent analyser les logs de scan
DROP POLICY IF EXISTS "Admin consultation des scans" ON public.scans;
CREATE POLICY "Admin consultation des scans"
  ON public.scans
  FOR SELECT
  TO authenticated
  USING (true);

-- ------------------------------------------------------------------------------
-- 5. POLITIQUES : analytics_daily
-- ------------------------------------------------------------------------------
-- Consultation et mise à jour réservées aux administrateurs
DROP POLICY IF EXISTS "Admin acces analytics" ON public.analytics_daily;
CREATE POLICY "Admin acces analytics"
  ON public.analytics_daily
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
