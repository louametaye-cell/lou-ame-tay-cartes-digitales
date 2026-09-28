-- ============================================================================
-- 06_avis_rls.sql — Lou Ame Tay v2.0
-- Politiques RLS & Protection Anti-Spam pour les Avis Clients
-- ============================================================================

-- 1. Activation stricte RLS
ALTER TABLE public.avis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avis FORCE ROW LEVEL SECURITY;

-- 2. Nettoyage des anciennes politiques
DROP POLICY IF EXISTS "Lecture publique avis publiés" ON public.avis;
DROP POLICY IF EXISTS "Insertion publique avis" ON public.avis;
DROP POLICY IF EXISTS "Admin gère les avis" ON public.avis;

-- 3. Lecture publique des avis publiés uniquement (anonyme + authentifié)
CREATE POLICY "Lecture publique avis publiés"
  ON public.avis FOR SELECT
  USING (statut = 'publie');

-- 4. Insertion publique : Tout visiteur peut noter si la note est entre 0 et 10 et statut = 'publie'
CREATE POLICY "Insertion publique avis"
  ON public.avis FOR INSERT
  WITH CHECK (
    note >= 0 AND note <= 10 
    AND (statut IS NULL OR statut = 'publie')
  );

-- 5. Administration : L'administrateur authentifié gère l'ensemble des avis (modération, masquage, suppression)
CREATE POLICY "Admin gère les avis"
  ON public.avis FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. Permissions de rôles Supabase
REVOKE UPDATE, DELETE, TRUNCATE ON public.avis FROM anon;
GRANT SELECT, INSERT ON public.avis TO anon;
GRANT ALL ON public.avis TO authenticated;
GRANT SELECT ON public.commerciaux_notes TO anon, authenticated;

-- 7. Trigger Anti-Spam serveur (1 avis par ip_hash par commercial par 24h)
CREATE OR REPLACE FUNCTION check_avis_recent()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ip_hash IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.avis 
    WHERE commercial_id = NEW.commercial_id 
    AND ip_hash = NEW.ip_hash 
    AND created_at > NOW() - INTERVAL '24 hours'
  ) THEN
    RAISE EXCEPTION 'Vous avez déjà laissé un avis pour ce conseiller au cours des dernières 24 heures.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_check_avis_recent ON public.avis;
CREATE TRIGGER trig_check_avis_recent
  BEFORE INSERT ON public.avis
  FOR EACH ROW EXECUTE FUNCTION check_avis_recent();
