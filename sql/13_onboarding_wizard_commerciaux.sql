-- ==============================================================================
-- 13_ONBOARDING_WIZARD_COMMERCIAUX.SQL
-- WIZARD D'ONBOARDING EN 3 ÉTAPES & SÉCURITÉ RH / KYC / CONTRAT LAT-COM-2026
-- ==============================================================================

-- 1. EXTENSION DE LA TABLE COMMERCIAUX AVEC LES CHAMPS DU WIZARD 3 ÉTAPES
ALTER TABLE public.commerciaux 
  ADD COLUMN IF NOT EXISTS secondary_email TEXT,
  ADD COLUMN IF NOT EXISTS secondary_phone TEXT,
  ADD COLUMN IF NOT EXISTS payout_operator TEXT CHECK (payout_operator IN ('WAVE', 'ORANGE_MONEY', 'Wave', 'Orange Money')),
  ADD COLUMN IF NOT EXISTS payout_phone TEXT,
  ADD COLUMN IF NOT EXISTS payout_account_name TEXT,
  ADD COLUMN IF NOT EXISTS cni_number TEXT,
  ADD COLUMN IF NOT EXISTS cni_front_url TEXT,
  ADD COLUMN IF NOT EXISTS cni_back_url TEXT,
  ADD COLUMN IF NOT EXISTS emergency_name TEXT,
  ADD COLUMN IF NOT EXISTS emergency_relation TEXT,
  ADD COLUMN IF NOT EXISTS emergency_phone TEXT,
  ADD COLUMN IF NOT EXISTS transport_mode TEXT CHECK (transport_mode IN ('MOTO_SCOOTER', 'VEHICULE_PERSO', 'TRANSPORT_COMMUN')),
  ADD COLUMN IF NOT EXISTS assigned_territory TEXT,
  ADD COLUMN IF NOT EXISTS job_title TEXT DEFAULT 'Conseiller Digital CHR',
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_direct_url TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS has_signed_contract BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS contract_status TEXT DEFAULT 'PENDING' CHECK (contract_status IN ('PENDING', 'SIGNED', 'REVOKED', 'SIGNE')),
  ADD COLUMN IF NOT EXISTS contract_reference TEXT,
  ADD COLUMN IF NOT EXISTS contract_signed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS contract_signature_url TEXT,
  ADD COLUMN IF NOT EXISTS contract_sign_ip TEXT;

-- 2. BUCKET STORAGE SUPABASE POUR LES JUSTIFICATIFS KYC (CNI RECTO/VERSO)
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc', 'kyc', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Storage pour le bucket KYC
CREATE POLICY IF NOT EXISTS "Accès public lecture kyc"
ON storage.objects FOR SELECT
USING (bucket_id = 'kyc');

CREATE POLICY IF NOT EXISTS "Téléversement authentifié ou anonyme kyc"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'kyc');
