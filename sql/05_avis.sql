-- ============================================================================
-- 05_avis.sql — Lou Ame Tay v2.0
-- Système d'Avis & Notations Clients (0-10) et Localisation des Conseillers
-- ============================================================================

-- 1. Table des avis clients
CREATE TABLE IF NOT EXISTS public.avis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  commercial_id UUID NOT NULL REFERENCES public.commerciaux(id) ON DELETE CASCADE,
  note INTEGER NOT NULL CHECK (note >= 0 AND note <= 10),
  commentaire TEXT,
  nom_visiteur TEXT,
  telephone_visiteur TEXT,
  ville_visiteur TEXT,
  restaurant_visiteur TEXT,
  ip_hash TEXT,                    -- hash IP pour éviter le spam
  user_agent TEXT,
  statut TEXT DEFAULT 'publie' CHECK (statut IN ('publie', 'masque', 'en_attente')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances de recherche et de tri
CREATE INDEX IF NOT EXISTS idx_avis_commercial ON public.avis(commercial_id);
CREATE INDEX IF NOT EXISTS idx_avis_statut ON public.avis(statut);
CREATE INDEX IF NOT EXISTS idx_avis_created ON public.avis(created_at DESC);

-- 2. Vue pour la moyenne des notes par commercial
CREATE OR REPLACE VIEW public.commerciaux_notes AS
SELECT 
  commercial_id,
  ROUND(AVG(note)::numeric, 1) AS note_moyenne,
  COUNT(*) AS nb_avis,
  ROUND(AVG(note) FILTER (WHERE created_at > NOW() - INTERVAL '30 days')::numeric, 1) AS note_moyenne_30j
FROM public.avis
WHERE statut = 'publie'
GROUP BY commercial_id;

-- 3. Ajout des colonnes de localisation à la table commerciaux
ALTER TABLE public.commerciaux 
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS adresse TEXT,
  ADD COLUMN IF NOT EXISTS maps_url TEXT;

-- 4. Initialisation des coordonnées pour les 4 fondateurs (Axe Dakar - Thiès - Mbour)
UPDATE public.commerciaux
SET 
  adresse = 'Dakar, Plateau — Point E, Immeuble Horizon CHR',
  latitude = 14.6928,
  longitude = -17.4467,
  maps_url = 'https://www.google.com/maps/search/?api=1&query=Dakar+Point+E'
WHERE prenom = 'Mamadou' AND nom = 'Diallo';

UPDATE public.commerciaux
SET 
  adresse = 'Thiès, Quartier Dixième — Cité Malick Sy',
  latitude = 14.7903,
  longitude = -16.9260,
  maps_url = 'https://www.google.com/maps/search/?api=1&query=Thies+Senegal'
WHERE prenom = 'Cheikh' AND nom = 'Ndiaye';

UPDATE public.commerciaux
SET 
  adresse = 'Saly Portudal — Mbour, Zone Touristique & CHR',
  latitude = 14.4437,
  longitude = -17.0270,
  maps_url = 'https://www.google.com/maps/search/?api=1&query=Saly+Portudal'
WHERE prenom = 'Fatou' AND nom = 'Sow';

UPDATE public.commerciaux
SET 
  adresse = 'Dakar, Almadies — Zone Hôtelière & Restauration',
  latitude = 14.7450,
  longitude = -17.5186,
  maps_url = 'https://www.google.com/maps/search/?api=1&query=Almadies+Dakar'
WHERE prenom = 'Moussa' AND nom = 'Ba';
