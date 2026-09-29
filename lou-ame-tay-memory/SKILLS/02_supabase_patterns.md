# SKILL : Supabase Patterns (Auth, RLS, Storage, Realtime & Edge Functions)

> **Version** : 2.0.0  
> **Date de création** : 2026-09-29  
> **Auteur** : Antigravity & Équipe Lou Ame Tay  
> **Tags** : `supabase`, `database`, `postgresql`, `auth`, `storage`, `realtime`

---

## 🎯 Quand utiliser cette compétence
Utilisez cette compétence dès lors que vous concevez un backend serverless basé sur Supabase :
- Pour modéliser les tables relationnelles PostgreSQL avec contraintes fortes (UUID v4, intégrité référentielle, types énumérés).
- Pour configurer l'authentification (email/mot de passe ou magic link) et sécuriser l'accès aux données avec les politiques Row Level Security (RLS).
- Pour gérer le stockage de médias (photos de profil, carrousels, logos partenaires) dans les buckets Supabase Storage avec des URLs publiques sécurisées.
- Pour écouter les modifications de base de données en direct via WebSockets Supabase Realtime (mise à jour d'un statut, nouveau lead).

---

## 📋 Prérequis
1. Projet Supabase initialisé.
2. Schéma SQL avec tables clés : `commerciaux`, `leads`, `scans`, `temoignages`, `clients_logos`, `echanges_cartes`.
3. Bucket Storage créé (ex: `photos`) avec politique de lecture publique active.
4. Client JS `@supabase/supabase-js` v2 chargé en ESM.

---

## 🛠️ Étapes d'implémentation

### Étape 1 : Création du schéma relationnel PostgreSQL robuste
Chaque entité doit être identifiée par un UUID v4 standard, avec horodatages automatiques `created_at` et `updated_at`.

### Étape 2 : Activation systématique du Row Level Security (RLS)
Ne jamais laisser une table sans RLS activé. Chaque table doit comporter des règles explicites pour les rôles `anon` (visiteurs non connectés) et `authenticated` (administrateurs).

### Étape 3 : Gestion du Storage et compression amont
Avant d'envoyer une photo prise par smartphone (souvent 8 à 15 Mo) vers le bucket Supabase `photos`, il est impératif d'effectuer une compression côté navigateur pour limiter l'utilisation du quota et optimiser l'affichage mobile.

---

## 💻 Code / Configuration

### 1. DDL SQL complet des tables maîtresses
```sql
-- Extension pour la génération d'UUIDs cryptographiques
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des conseillers commerciaux
CREATE TABLE IF NOT EXISTS public.commerciaux (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prenom VARCHAR(100) NOT NULL,
  nom VARCHAR(100) NOT NULL,
  poste VARCHAR(150) NOT NULL,
  categorie VARCHAR(50) DEFAULT 'Vente',
  telephone VARCHAR(30) NOT NULL,
  whatsapp VARCHAR(30) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  photo_url TEXT,
  bio TEXT,
  zone VARCHAR(150),
  disponibilite VARCHAR(150),
  adresse TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  maps_url TEXT,
  video_youtube_id VARCHAR(50),
  video_titre TEXT,
  video_description TEXT,
  carrousel_images JSONB DEFAULT '[]'::jsonb,
  linkedin TEXT,
  facebook TEXT,
  instagram TEXT,
  tiktok TEXT,
  youtube TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des leads & demandes de devis
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commercial_id UUID REFERENCES public.commerciaux(id) ON DELETE SET NULL,
  nom_contact VARCHAR(100) NOT NULL,
  nom_restaurant VARCHAR(150) NOT NULL,
  telephone VARCHAR(30) NOT NULL,
  email VARCHAR(150),
  ville VARCHAR(100) DEFAULT 'Dakar',
  formule_souhaitee VARCHAR(50) DEFAULT 'xeweul',
  score_priorite INT DEFAULT 50,
  statut VARCHAR(30) DEFAULT 'nouveau',
  source VARCHAR(50) DEFAULT 'carte_visite',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Politiques RLS hermétiques
```sql
-- Activer RLS
ALTER TABLE public.commerciaux ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Commerciaux : lecture publique pour les cartes actives
CREATE POLICY "Lecture publique des commerciaux actifs"
  ON public.commerciaux FOR SELECT
  TO anon, authenticated
  USING (actif = true);

-- Commerciaux : gestion totale réservée aux administrateurs connectés
CREATE POLICY "Gestion admin complète commerciaux"
  ON public.commerciaux FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Leads : insertion publique autorisée (capture de contacts sur le terrain)
CREATE POLICY "Insertion publique des leads"
  ON public.leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Leads : lecture et mise à jour réservées aux admins connectés
CREATE POLICY "Gestion admin des leads"
  ON public.leads FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

### 3. Téléversement d'image avec upload Supabase Storage
```javascript
export async function televerserPhotoCommercial(file, commercialId) {
  const ext = file.name ? file.name.split('.').pop() : 'jpg';
  const cleanId = String(commercialId || 'nouveau').replace(/[^a-zA-Z0-9_-]/g, '');
  const chemin = `commerciaux/${cleanId}_${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from('photos')
    .upload(chemin, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || 'image/jpeg'
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('photos')
    .getPublicUrl(chemin);

  return urlData.publicUrl;
}
```

---

## ⚠️ Pièges à éviter
1. **Passer un ID entier numérique sur une colonne UUID** : Si vous exécutez `.eq('id', '1')` sur une colonne de type `uuid`, PostgreSQL renvoie une erreur 400 (`invalid input syntax for type uuid: "1"`). Utilisez systématiquement des UUIDs valides (ex: `11111111-1111-1111-1111-111111111111`) ou implémentez un mapping sécurisé.
2. **Oublier la politique d'insertion pour `anon` sur les formulaires** : Les formulaires de contact, de demande de démo ou de rendez-vous échoueront silencieusement si la politique `FOR INSERT TO anon WITH CHECK (true)` n'a pas été exécutée sur `leads` ou `rendez_vous`.
3. **Bucket Storage privé pour des photos publiques** : Si le bucket `photos` n'est pas configuré avec `Public: true`, les photos des commerciaux ne s'afficheront pas pour les visiteurs sans jeton signé.

---

## ✅ Checklist de validation
- [ ] RLS activé sur toutes les tables (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
- [ ] Les requêtes anonymes (`anon`) peuvent lire les commerciaux actifs et insérer des leads.
- [ ] Les opérations de suppression et modification nécessitent une session authentifiée (`authenticated`).
- [ ] Le bucket `photos` délivre des URLs publiques valides sans expiration.
- [ ] Le client JS gère les erreurs de connexion et propose un fallback dégradé.

---

## 🔗 Ressources liées
- [`01_architecture_saas.md`](file:///C:/Users/DELL/Desktop/CRM%20LOUAMETAY.COM/lou-ame-tay-—-cartes-de-visite-digitales/lou-ame-tay-memory/SKILLS/01_architecture_saas.md)
- [`10_securite_rls.md`](file:///C:/Users/DELL/Desktop/CRM%20LOUAMETAY.COM/lou-ame-tay-—-cartes-de-visite-digitales/lou-ame-tay-memory/SKILLS/10_securite_rls.md)
- [`PATTERNS/rls_policies.md`](file:///C:/Users/DELL/Desktop/CRM%20LOUAMETAY.COM/lou-ame-tay-—-cartes-de-visite-digitales/lou-ame-tay-memory/PATTERNS/rls_policies.md)

---

## 📊 Exemple concret (projet Lou Ame Tay)
Sur Lou Ame Tay, la table `commerciaux` stocke les profils détaillés de toute l'équipe terrain (Dakar, Thiès, Saly). La table `leads` recueille en temps réel les restaurateurs sénégalais intéressés par les formules Tàmbali, Nio Far ou Xéweul. Le stockage Supabase héberge l'ensemble des photos de profil haute résolution et les images des déploiements réels des écrans cuisine KDS.
