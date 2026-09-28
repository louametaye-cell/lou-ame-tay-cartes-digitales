-- ==============================================================================
-- LOU AME TAY — FICHIER 3 : CONFIGURATION DU STORAGE (03_storage.sql)
-- ==============================================================================
-- Crée le bucket 'photos' pour héberger les portraits haute définition

-- 1. Création du bucket 'photos' en accès public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos',
  'photos',
  true,
  5242880, -- 5 MB max par photo
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

-- ------------------------------------------------------------------------------
-- 2. POLITIQUES DE SECURITE STORAGE (storage.objects)
-- ------------------------------------------------------------------------------

-- Lecture publique autorisée pour tous (affichage des avatars sur les cartes)
DROP POLICY IF EXISTS "Photos lecture publique" ON storage.objects;
CREATE POLICY "Photos lecture publique"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'photos');

-- Upload restreint aux administrateurs authentifiés
DROP POLICY IF EXISTS "Photos upload administrateurs" ON storage.objects;
CREATE POLICY "Photos upload administrateurs"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'photos');

-- Modification restreinte aux administrateurs authentifiés
DROP POLICY IF EXISTS "Photos mise a jour administrateurs" ON storage.objects;
CREATE POLICY "Photos mise a jour administrateurs"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'photos');

-- Suppression restreinte aux administrateurs authentifiés
DROP POLICY IF EXISTS "Photos suppression administrateurs" ON storage.objects;
CREATE POLICY "Photos suppression administrateurs"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'photos');
