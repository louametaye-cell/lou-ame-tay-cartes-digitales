-- ==============================================================================
-- 09_YOUTUBE_OFFICIAL.SQL — INTÉGRATION DE LA CHAÎNE YOUTUBE OFFICIELLE LOU AME TAY
-- Chaîne officielle : https://youtube.com/@louametaye?si=wdfwRr2F-x0ho5PY
-- Channel ID        : UCmaFo8BlqLgMj87mqbG3jkw
-- ==============================================================================

-- 1. Ajout de la colonne youtube sur la table commerciaux si absente
ALTER TABLE public.commerciaux 
  ADD COLUMN IF NOT EXISTS youtube TEXT DEFAULT 'https://youtube.com/@louametaye?si=wdfwRr2F-x0ho5PY';

-- 2. Mise à jour de l'URL de la chaîne YouTube officielle pour tous les commerciaux
UPDATE public.commerciaux
SET youtube = 'https://youtube.com/@louametaye?si=wdfwRr2F-x0ho5PY';

-- 3. Configuration des vraies vidéos YouTube Lou Ame Tay
-- Vidéo principale : "Lou Ame Tay ? – Digitalisez Votre Restaurant en 3 Clics" (hZq2u-yPnAE)
UPDATE public.commerciaux
SET 
  video_youtube_id = 'hZq2u-yPnAE',
  video_titre = 'Lou Ame Tay ? – Digitalisez Votre Restaurant en 3 Clics',
  video_description = 'Découvrez en vidéo la solution N°1 au Sénégal : Menu digital QR code sans application, écran cuisine KDS en temps réel et paiement direct Wave & Orange Money.'
WHERE prenom = 'Mamadou' OR prenom = 'Cheikh';

-- Vidéo 2 : "Lou Ame Tay? Scan. Order. Enjoy." (Iy1MdWuW4A0)
UPDATE public.commerciaux
SET 
  video_youtube_id = 'Iy1MdWuW4A0',
  video_titre = 'Lou Ame Tay? Scan. Order. Enjoy.',
  video_description = 'La commande à table instantanée : gagnez 8 minutes par service et augmentez votre panier moyen de 25%.'
WHERE prenom = 'Fatou';

-- Vidéo 3 : Version internationale (1M-yv5NiLp8)
UPDATE public.commerciaux
SET 
  video_youtube_id = '1M-yv5NiLp8',
  video_titre = 'Lou Ame Tay? – Digitize Your Restaurant in 3 Clicks',
  video_description = 'The leading restaurant SaaS in Senegal for hotels, beach resorts and modern dining.'
WHERE prenom = 'Moussa';

-- Vidéo 4 : Immersion Saly (Q12DiZtNoVk)
UPDATE public.commerciaux
SET 
  video_youtube_id = 'Q12DiZtNoVk',
  video_titre = 'Lou Ame Tay en Salle — Saly & Petite Côte',
  video_description = 'Déploiement en salle et expérience client sur la Petite Côte sénégalaise.'
WHERE prenom = 'Babacar';

-- Si aucun prénom ne correspond, assigner la vidéo principale par défaut
UPDATE public.commerciaux
SET 
  video_youtube_id = 'hZq2u-yPnAE',
  video_titre = 'Lou Ame Tay ? – Digitalisez Votre Restaurant en 3 Clics',
  video_description = 'Démonstration officielle de la commande QR et de l''écran cuisine KDS pour la restauration au Sénégal.'
WHERE video_youtube_id IS NULL OR video_youtube_id = 'dQw4w9WgXcQ';

-- 4. Mise à jour des témoignages vidéo
UPDATE public.temoignages
SET video_youtube_id = 'hZq2u-yPnAE'
WHERE video_youtube_id IS NOT NULL OR video_youtube_id = 'dQw4w9WgXcQ';

-- Recharger le schéma PostgREST
NOTIFY pgrst, 'reload schema';
