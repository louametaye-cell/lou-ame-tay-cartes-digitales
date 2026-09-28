-- ==============================================================================
-- 07_MEDIA.SQL — VIDÉO YOUTUBE ET CARROUSEL D'IMAGES POUR LES CARTES LOU AME TAY
-- ==============================================================================

-- 1. Ajout des colonnes vidéo et carrousel sur la table commerciaux
ALTER TABLE public.commerciaux 
  ADD COLUMN IF NOT EXISTS video_youtube_id TEXT,       -- ex: "dQw4w9WgXcQ"
  ADD COLUMN IF NOT EXISTS video_titre TEXT,            -- ex: "Démo Lou Ame Tay — Menu QR & Commande"
  ADD COLUMN IF NOT EXISTS video_description TEXT,      -- description courte de la vidéo
  ADD COLUMN IF NOT EXISTS carrousel_images JSONB DEFAULT '[]'::jsonb; -- [{"url": "...", "titre": "...", "legende": "..."}]

-- 2. Table alternative multi-vidéos (pour archivage ou futures versions)
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  commercial_id UUID NOT NULL REFERENCES public.commerciaux(id) ON DELETE CASCADE,
  youtube_id TEXT NOT NULL,
  titre TEXT NOT NULL,
  description TEXT,
  ordre INTEGER DEFAULT 0,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_videos_commercial ON public.videos(commercial_id);

-- 3. Sécurité RLS sur la table videos
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos FORCE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'videos' AND policyname = 'Lecture publique vidéos actives'
  ) THEN
    CREATE POLICY "Lecture publique vidéos actives"
      ON public.videos FOR SELECT
      USING (actif = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'videos' AND policyname = 'Admin gère les vidéos'
  ) THEN
    CREATE POLICY "Admin gère les vidéos"
      ON public.videos FOR ALL
      USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- 4. Initialisation des données de démonstration pour les commerciaux fondateurs
-- Vidéo de démo et carrousel de réalisations terrain
UPDATE public.commerciaux
SET 
  video_youtube_id = 'dQw4w9WgXcQ',
  video_titre = 'Démo Lou Ame Tay — Menu QR & Commande à table',
  video_description = 'Découvrez en 2 minutes comment notre solution digitalise la prise de commande et booste le chiffre d''affaires de votre restaurant.',
  carrousel_images = '[
    {"url": "images/deploiement1.jpg", "titre": "Écran Cuisine (KDS) en action", "legende": "Gestion temps réel des commandes en brigade"},
    {"url": "images/deploiement2.jpg", "titre": "Supports QR Chevalets Premium", "legende": "Commande autonome à table par smartphone"},
    {"url": "images/deploiement3.jpg", "titre": "Déploiement & Formation en salle", "legende": "Prise en main immédiate par l''équipe de serveurs"}
  ]'::jsonb
WHERE (prenom = 'Mamadou' AND nom = 'Diallo') OR id IS NOT NULL;

-- Notifier PostgREST pour actualiser son cache de schéma
NOTIFY pgrst, 'reload schema';
