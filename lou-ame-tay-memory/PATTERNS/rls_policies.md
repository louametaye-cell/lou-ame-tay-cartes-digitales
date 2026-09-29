# PATTERN : Politiques Row Level Security (RLS) PostgreSQL & Supabase

> **Langage** : SQL (PostgreSQL 14+)  
> **Catégorie** : Sécurité base de données & Rôles BaaS  

---

## 🎯 Objectif
Fournir un jeu complet de règles RLS testées et inviolables pour une application combinant un frontend public (visiteurs anonymes scannant des cartes) et un back-office d'administration sécurisé (utilisateurs connectés).

---

## 💻 Code SQL Prêt à Déployer

```sql
-- ==============================================================================
-- 1. ACTIVATION DE LA PROTECTION SUR TOUTES LES TABLES
-- ==============================================================================
ALTER TABLE public.commerciaux ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temoignages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rendez_vous ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 2. PATTERN A : TABLE PUBLIQUE AVEC FILTRE DE VISIBILITÉ (Ex: Commerciaux)
-- Le grand public (anon) ne voit que les éléments déclarés actifs.
-- Les administrateurs (authenticated) ont un accès total (CRUD complet).
-- ==============================================================================

-- Lecture publique restreinte aux cartes actives
CREATE POLICY "RLS_Commerciaux_Public_Select"
  ON public.commerciaux FOR SELECT
  TO anon
  USING (actif = true);

-- Contrôle total pour les administrateurs connectés
CREATE POLICY "RLS_Commerciaux_Admin_All"
  ON public.commerciaux FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
-- 3. PATTERN B : TABLE EN ENTONNOIR / CAPTURE DE LEADS (Ex: Leads & Devis)
-- Le grand public (anon) PEUT insérer mais NE PEUT PAS lire.
-- Les administrateurs (authenticated) ont la lecture et l'édition complètes.
-- ==============================================================================

-- Insertion publique sans lecture (Protection anti-aspiration de leads)
CREATE POLICY "RLS_Leads_Public_Insert"
  ON public.leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Lecture et gestion réservées aux admins
CREATE POLICY "RLS_Leads_Admin_All"
  ON public.leads FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
-- 4. PATTERN C : LOGS & TÉLÉMÉTRIE EN ÉCRITURE SEULE (Ex: Scans de cartes)
-- Insertion anonyme autorisée pour le tracking automatique.
-- Aucune modification ou suppression autorisée par le client.
-- ==============================================================================

CREATE POLICY "RLS_Scans_Public_Insert"
  ON public.scans FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "RLS_Scans_Admin_Select"
  ON public.scans FOR SELECT
  TO authenticated
  USING (true);

-- ==============================================================================
-- 5. PATTERN D : MODÉRATION DE CONTENU (Ex: Témoignages & Avis)
-- Le public insère un avis avec statut par défaut actif = false.
-- Le public lit uniquement les avis approuvés (actif = true).
-- L'admin approuve, modifie ou supprime.
-- ==============================================================================

CREATE POLICY "RLS_Temoignages_Public_Select"
  ON public.temoignages FOR SELECT
  TO anon, authenticated
  USING (actif = true);

CREATE POLICY "RLS_Temoignages_Public_Insert"
  ON public.temoignages FOR INSERT
  TO anon, authenticated
  WITH CHECK (actif = false); -- Force l'état non-publié à l'insertion publique

CREATE POLICY "RLS_Temoignages_Admin_All"
  ON public.temoignages FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

---

## 🔍 Validation de l'Équanchéité (Tests SQL)
```sql
-- Test 1 : Vérifier ce qu'un visiteur anonyme peut voir dans leads (doit renvoyer 0 ligne)
SET ROLE anon;
SELECT * FROM public.leads; 
RESET ROLE;

-- Test 2 : Vérifier qu'un visiteur anonyme ne peut pas lire les commerciaux inactifs
SET ROLE anon;
SELECT count(*) FROM public.commerciaux WHERE actif = false; -- Doit renvoyer 0
RESET ROLE;
```
