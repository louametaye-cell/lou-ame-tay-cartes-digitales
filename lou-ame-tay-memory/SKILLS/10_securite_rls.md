# SKILL : Sécurité Row Level Security (RLS) & Durcissement Base de Données

> **Version** : 2.0.0  
> **Date de création** : 2026-09-29  
> **Auteur** : Antigravity & Équipe Lou Ame Tay  
> **Tags** : `security`, `rls`, `postgresql`, `supabase`, `least-privilege`, `owasp`

---

## 🎯 Quand utiliser cette compétence
Utilisez cette compétence dès lors que votre frontend communique directement avec une base de données PostgreSQL / Supabase sans intermédiaire applicatif lourd :
- Pour garantir le principe du moindre privilège (Principle of Least Privilege) au niveau du moteur SQL.
- Pour empêcher les visiteurs anonymes d'accéder aux données confidentielles (leads, chiffres de vente, coordonnées privées des administrateurs, notes internes).
- Pour protéger les tables contre les modifications et suppressions malveillantes via l'API REST PostgREST.
- Pour sécuriser les buckets de stockage de fichiers (interdiction de remplacer ou supprimer la photo d'un tiers).

---

## 📋 Prérequis
1. Accès SQL avec privilèges d'administration (`postgres` / `service_role`).
2. Compréhension des rôles intégrés de Supabase : `anon` (visiteurs sans JWT), `authenticated` (utilisateurs avec JWT validé), `service_role` (scripts serveur internes).
3. Connaissance des clauses de sécurité PostgreSQL : `USING` (filtrage en lecture/suppression) et `WITH CHECK` (validation en insertion/mise à jour).

---

## 🛠️ Étapes d'implémentation

### Étape 1 : Verrouillage universel par défaut
Activer systématiquement RLS sur TOUTES les tables créées. Par défaut, dès que RLS est activé, AUCUNE requête n'est autorisée tant qu'une politique n'est pas explicitement définie.

### Étape 2 : Définition des règles de lecture publique sélective
Autoriser la lecture pour le rôle `anon` uniquement sur les lignes et colonnes nécessaires au fonctionnement public (ex: commerciaux avec `actif = true`, témoignages validés avec `actif = true`).

### Étape 3 : Définition des règles d'insertion publique contrôlée
Autoriser l'insertion de leads, scans ou avis clients pour le rôle `anon`, mais INTERDIRE formellement la lecture, la modification ou la suppression pour ce même rôle.

### Étape 4 : Réservation des droits d'administration au rôle `authenticated`
Seuls les utilisateurs connectés ayant validé leur session peuvent exécuter `UPDATE` ou `DELETE`.

---

## 💻 Code / Configuration

### 1. Script SQL Complet de Durcissement RLS
```sql
-- 1. Verrouillage obligatoire de toutes les tables
ALTER TABLE public.commerciaux ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temoignages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients_logos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.echanges_cartes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rendez_vous ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parrainages ENABLE ROW LEVEL SECURITY;

-- 2. Suppression préventive des anciennes politiques
DROP POLICY IF EXISTS "Lecture publique commerciaux" ON public.commerciaux;
DROP POLICY IF EXISTS "Admin all commerciaux" ON public.commerciaux;

-- 3. POLITIQUES COMMERCIAUX
-- Public : Seuls les commerciaux avec actif = true sont visibles
CREATE POLICY "Public lecture commerciaux actifs"
  ON public.commerciaux FOR SELECT
  TO anon
  USING (actif = true);

-- Authentifié : L'administrateur voit tous les commerciaux (actifs et inactifs)
CREATE POLICY "Admin lecture totale commerciaux"
  ON public.commerciaux FOR SELECT
  TO authenticated
  USING (true);

-- Authentifié : L'administrateur peut créer, modifier ou supprimer
CREATE POLICY "Admin écriture commerciaux"
  ON public.commerciaux FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. POLITIQUES LEADS & CRM
-- Public : Peut uniquement insérer de nouvelles demandes (Capture de formulaire)
CREATE POLICY "Public insertion leads"
  ON public.leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Public : INTERDICTION FORMELLE DE LECTURE (Empêche l'espionnage de la concurrence)
-- Pas de politique SELECT pour anon sur 'leads' !

-- Authentifié : L'administrateur a le contrôle total du pipeline commercial
CREATE POLICY "Admin gestion totale leads"
  ON public.leads FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. POLITIQUES TEMOIGNAGES & AVIS
CREATE POLICY "Public lecture avis validés"
  ON public.temoignages FOR SELECT
  TO anon, authenticated
  USING (actif = true);

CREATE POLICY "Public insertion avis"
  ON public.temoignages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admin modération avis"
  ON public.temoignages FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

### 2. Politiques Supabase Storage pour le Bucket `photos`
```sql
-- Autoriser la lecture publique de tous les objets du bucket photos
CREATE POLICY "Lecture publique photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'photos');

-- Autoriser l'upload uniquement aux administrateurs ou pour des avatars contrôlés
CREATE POLICY "Upload photos authentifié"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'photos');

-- Suppression et mise à jour réservées aux utilisateurs connectés
CREATE POLICY "Suppression photos réservée admin"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'photos');
```

---

## ⚠️ Pièges à éviter
1. **Laisser la table `leads` lisible par `anon`** : Si vous écrivez `CREATE POLICY "Lecture leads" ON leads FOR SELECT TO anon USING (true);`, n'importe quel concurrent peut exécuter `supabase.from('leads').select('*')` depuis la console de son navigateur et télécharger l'ensemble de votre base de données clients !
2. **Utiliser `USING (true)` sur `FOR INSERT`** : Sur une clause `FOR INSERT`, la condition de validation est `WITH CHECK (...)` et non `USING (...)`.
3. **Tester les politiques RLS avec la clef `service_role`** : La clef `service_role` contourne nativement le RLS. Pour vérifier la sécurité d'une politique, vous devez impérativement tester vos requêtes avec la clef publique `anon`.

---

## ✅ Checklist de validation
- [ ] Une requête anonyme `SELECT * FROM leads` renvoie un tableau vide `[]` ou une erreur 401.
- [ ] Une tentative anonyme `DELETE FROM commerciaux` est rejetée par PostgreSQL.
- [ ] La soumission d'une demande de devis réussit toujours avec la clef `anon`.
- [ ] Seul un utilisateur connecté avec Supabase Auth peut modifier le statut d'une carte ou exporter la liste des leads.

---

## 🔗 Ressources liées
- [`02_supabase_patterns.md`](file:///C:/Users/DELL/Desktop/CRM%20LOUAMETAY.COM/lou-ame-tay-—-cartes-de-visite-digitales/lou-ame-tay-memory/SKILLS/02_supabase_patterns.md)
- [`08_admin_dashboard.md`](file:///C:/Users/DELL/Desktop/CRM%20LOUAMETAY.COM/lou-ame-tay-—-cartes-de-visite-digitales/lou-ame-tay-memory/SKILLS/08_admin_dashboard.md)
- [`PATTERNS/rls_policies.md`](file:///C:/Users/DELL/Desktop/CRM%20LOUAMETAY.COM/lou-ame-tay-—-cartes-de-visite-digitales/lou-ame-tay-memory/PATTERNS/rls_policies.md)

---

## 📊 Exemple concret (projet Lou Ame Tay)
Grâce à ce schéma RLS strict sur Lou Ame Tay, les coordonnées des restaurateurs ayant demandé des devis sont strictement protégées : aucun visiteur ne peut voir les leads enregistrés par d'autres établissements. De plus, lorsqu'un commercial quitte l'entreprise, sa carte est basculée sur `actif = false` : la politique RLS la rend instantanément invisible au grand public, affichant la page "Cette carte n'est plus active".
