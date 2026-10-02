-- ==============================================================================
-- FICHIER : supabase/rls_hardening_louametay.sql
-- DURCISSEMENT CYBERSÉCURITÉ & ROW LEVEL SECURITY (RLS) — LOU AME TAY
-- ==============================================================================
-- Conforme : Normes OWASP Top 10 (2025/2026) & Loi CDP Sénégal n° 2008-12
-- Garantit l'étanchéité absolue entre commerciaux, restaurants et administrateurs.
-- ==============================================================================

-- 1. ACTIVATION OBLIGATOIRE DU RLS SUR TOUTES LES TABLES CLÉS
ALTER TABLE IF EXISTS commerciaux ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rendez_vous ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notes_frais ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contrats_commerciaux ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS journal_activites ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS restaurants ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 2. FONCTIONS DE SÉCURITÉ AUXILIAIRES (RÔLES ET ÉTANCHÉITÉ)
-- ==============================================================================

-- Vérifie si l'utilisateur actuel possède un rôle d'administration
CREATE OR REPLACE FUNCTION est_administrateur()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    coalesce(current_setting('request.jwt.claim.role', true), '') IN ('service_role', 'supabase_admin')
    OR EXISTS (
      SELECT 1 FROM commerciaux
      WHERE id::text = auth.uid()::text
      AND role IN ('ADMIN', 'SUPER_ADMIN', 'DAF')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 3. POLITIQUES RLS : TABLE COMMERCIAUX (ISOLATION RH & KYC)
-- ==============================================================================
DROP POLICY IF EXISTS "Commercial peut lire son profil" ON commerciaux;
CREATE POLICY "Commercial peut lire son profil" ON commerciaux
  FOR SELECT
  USING (
    auth.uid()::text = id::text 
    OR est_administrateur()
  );

DROP POLICY IF EXISTS "Commercial peut mettre a jour son onboarding" ON commerciaux;
CREATE POLICY "Commercial peut mettre a jour son onboarding" ON commerciaux
  FOR UPDATE
  USING (auth.uid()::text = id::text OR est_administrateur())
  WITH CHECK (
    -- Empêche un commercial de s'auto-attribuer le rôle ADMIN ou DAF
    (role IS NOT DISTINCT FROM (SELECT role FROM commerciaux WHERE id::text = auth.uid()::text))
    OR est_administrateur()
  );

-- ==============================================================================
-- 4. POLITIQUES RLS : LEADS & PROSPECTS (ZÉRO FUITE CONCURRENTIELLE)
-- ==============================================================================
DROP POLICY IF EXISTS "Commercial voit uniquement ses prospects" ON prospects;
CREATE POLICY "Commercial voit uniquement ses prospects" ON prospects
  FOR SELECT
  USING (
    commercial_id::text = auth.uid()::text 
    OR est_administrateur()
  );

DROP POLICY IF EXISTS "Commercial insere ses prospects" ON prospects;
CREATE POLICY "Commercial insere ses prospects" ON prospects
  FOR INSERT
  WITH CHECK (
    commercial_id::text = auth.uid()::text 
    OR est_administrateur()
  );

DROP POLICY IF EXISTS "Commercial modifie ses prospects" ON prospects;
CREATE POLICY "Commercial modifie ses prospects" ON prospects
  FOR UPDATE
  USING (commercial_id::text = auth.uid()::text OR est_administrateur());

-- ==============================================================================
-- 5. POLITIQUES RLS : COMMISSIONS & PAIEMENTS (DOUBLE VERROU FINANCIER)
-- ==============================================================================
DROP POLICY IF EXISTS "Commercial voit ses commissions" ON commissions;
CREATE POLICY "Commercial voit ses commissions" ON commissions
  FOR SELECT
  USING (
    commercial_id::text = auth.uid()::text 
    OR est_administrateur()
  );

-- STRICT : Seule la direction ou la DAF peut valider ou décaisser des commissions
DROP POLICY IF EXISTS "Seul DAF valide commissions" ON commissions;
CREATE POLICY "Seul DAF valide commissions" ON commissions
  FOR UPDATE
  USING (est_administrateur())
  WITH CHECK (est_administrateur());

-- ==============================================================================
-- 6. POLITIQUES RLS : POINTAGES GPS & CHRONO AGENT
-- ==============================================================================
DROP POLICY IF EXISTS "Commercial voit ses RDV et pointages" ON rendez_vous;
CREATE POLICY "Commercial voit ses RDV et pointages" ON rendez_vous
  FOR SELECT
  USING (
    commercial_id::text = auth.uid()::text 
    OR est_administrateur()
  );

DROP POLICY IF EXISTS "Commercial enregistre pointage GPS" ON rendez_vous;
CREATE POLICY "Commercial enregistre pointage GPS" ON rendez_vous
  FOR UPDATE
  USING (commercial_id::text = auth.uid()::text OR est_administrateur());

-- ==============================================================================
-- 7. AUDIT TRAIL : JOURNAL DES ACTIVITÉS INALTÉRABLE (APPEND-ONLY)
-- ==============================================================================
DROP POLICY IF EXISTS "Audit append only" ON journal_activites;
CREATE POLICY "Audit append only" ON journal_activites
  FOR INSERT
  WITH CHECK (true); -- Tout événement peut être consigné

DROP POLICY IF EXISTS "Audit lecture reservee admin" ON journal_activites;
CREATE POLICY "Audit lecture reservee admin" ON journal_activites
  FOR SELECT
  USING (est_administrateur());

-- Interdiction formelle de modifier ou supprimer une ligne d'audit
DROP POLICY IF EXISTS "Audit zero update" ON journal_activites;
CREATE POLICY "Audit zero update" ON journal_activites FOR UPDATE USING (false);
DROP POLICY IF EXISTS "Audit zero delete" ON journal_activites FOR DELETE USING (false);
