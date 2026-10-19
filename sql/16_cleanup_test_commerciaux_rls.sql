-- ==============================================================================
-- MIGRATION 16 : NETTOYAGE DES COMPTES DE TEST ET SÉCURISATION RLS COMMERCIAUX
-- Plateforme : Lou Ame Tay (CHR Sénégal) — DAW Digital Arts Work by MG
-- ==============================================================================

-- 1. Suppression ciblée des comptes de test (0 dépendance leads/rdvs)
DELETE FROM public.commerciaux 
WHERE (prenom = 'Fatou' AND nom = 'Diop') 
   OR (prenom = 'Arona' AND nom = 'Sow');

-- 2. Sécurisation RLS : Seul l'Admin/CEO authentifié peut insérer un commercial
ALTER TABLE public.commerciaux ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Insertion publique commerciaux" ON public.commerciaux;
DROP POLICY IF EXISTS "Admin full access" ON public.commerciaux;
DROP POLICY IF EXISTS "Seul le CEO peut créer un commercial" ON public.commerciaux;
DROP POLICY IF EXISTS "Admin peut tout faire" ON public.commerciaux;
DROP POLICY IF EXISTS "Lecture publique commerciaux" ON public.commerciaux;

-- Lecture publique pour l'annuaire et les cartes de visite
CREATE POLICY "Lecture publique commerciaux"
ON public.commerciaux
FOR SELECT
TO public
USING (true);

-- Insertion strictement réservée à l'administrateur authentifié
CREATE POLICY "Seul le CEO peut créer un commercial"
ON public.commerciaux
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Modification et suppression réservées à l'administrateur authentifié
CREATE POLICY "Admin peut tout faire"
ON public.commerciaux
FOR ALL
TO authenticated
USING (true);

-- 3. Vérification des commerciaux actifs restants
SELECT id, prenom, nom, telephone, actif, created_at 
FROM public.commerciaux 
ORDER BY created_at DESC;
