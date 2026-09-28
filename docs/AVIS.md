# Guide du Système d'Avis Clients (0/10) & Localisation — Lou Ame Tay v2.0

Ce document détaille l'architecture, l'intégration technique, les règles de sécurité et les processus de modération des **deux nouvelles fonctionnalités interactives** de Lou Ame Tay :
1. **Localisation cliquable & itinéraire GPS** (Google Maps & Apple Maps).
2. **Système de notation et d'avis clients de 0 à 10** avec calcul de moyenne en direct et modération administrative.

---

## 1. Vue d'Ensemble & Objectifs

### 📍 Localisation Cliquable
- **Objectif** : Permettre aux restaurateurs, hôteliers et prospects terrain de localiser immédiatement le bureau de rattachement ou la zone d'intervention d'un conseiller commercial Lou Ame Tay.
- **Support Universel** :
  - **Android / Desktop** : Ouvre Google Maps (`/dir/?api=1&destination=LAT,LNG` ou recherche par adresse).
  - **iOS / macOS** : Supporte les liens Apple Maps et la redirection universelle.
  - **Fallback automatique** : Si seules les coordonnées textuelles existent, l'itinéraire calcule le point de chute via l'adresse textuelle encodée.

### ⭐ Système d'Avis Clients (0 à 10)
- **Objectif** : Renforcer la preuve sociale et la crédibilité des conseillers auprès des propriétaires de restaurants sénégalais.
- **Expérience Utilisateur** :
  - Sélecteur de **10 étoiles dorées interactives** utilisable sans connexion préalable.
  - Saisie optionnelle d'un commentaire, du nom du visiteur et du nom de l'établissement (restaurant/maquis/hôtel).
  - Calcul et affichage en temps réel de la **note moyenne** et du **nombre d'avis** via une vue Supabase optimisée.
  - Chargement asynchrone et intelligent (Lazy-Loading via `IntersectionObserver`).

---

## 2. Architecture de la Base de Données Supabase

### Table `public.avis`
Créée dans [`sql/05_avis.sql`](file:///C:/Users/DELL/Desktop/CRM%20LOUAMETAY.COM/lou-ame-tay-%E2%80%94-cartes-de-visite-digitales/sql/05_avis.sql) :

```sql
CREATE TABLE IF NOT EXISTS public.avis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  commercial_id UUID NOT NULL REFERENCES public.commerciaux(id) ON DELETE CASCADE,
  note INTEGER NOT NULL CHECK (note >= 0 AND note <= 10),
  commentaire TEXT,
  nom_visiteur TEXT,
  telephone_visiteur TEXT,
  ville_visiteur TEXT,
  restaurant_visiteur TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  statut TEXT DEFAULT 'publie' CHECK (statut IN ('publie', 'masque', 'en_attente')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Vue Analytique `public.commerciaux_notes`
Permet un calcul instantané et agrégé des notes sans recalcul lourd côté frontend :
```sql
CREATE OR REPLACE VIEW public.commerciaux_notes AS
SELECT 
  commercial_id,
  ROUND(AVG(note)::numeric, 1) AS note_moyenne,
  COUNT(*) AS nb_avis,
  ROUND(AVG(note) FILTER (WHERE created_at > NOW() - INTERVAL '30 days')::numeric, 1) AS note_moyenne_30j
FROM public.avis
WHERE statut = 'publie'
GROUP BY commercial_id;
```

### Colonnes de Localisation sur `public.commerciaux`
```sql
ALTER TABLE public.commerciaux 
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS adresse TEXT,
  ADD COLUMN IF NOT EXISTS maps_url TEXT;
```

---

## 3. Sécurité RLS & Dispositif Anti-Spam

Conçu dans [`sql/06_avis_rls.sql`](file:///C:/Users/DELL/Desktop/CRM%20LOUAMETAY.COM/lou-ame-tay-%E2%80%94-cartes-de-visite-digitales/sql/06_avis_rls.sql) :

### Politiques Row-Level Security (RLS)
1. **Lecture Publique Hermétique** :
   ```sql
   CREATE POLICY "Lecture publique avis publiés"
     ON public.avis FOR SELECT
     USING (statut = 'publie');
   ```
   *Garantie : Un avis masqué par l'administrateur ne sera jamais transmis aux visiteurs publics.*
2. **Insertion Publique Contrôlée** :
   ```sql
   CREATE POLICY "Insertion publique avis"
     ON public.avis FOR INSERT
     WITH CHECK (note >= 0 AND note <= 10 AND (statut IS NULL OR statut = 'publie'));
   ```
3. **Privilèges Administrateur Totaux** :
   ```sql
   CREATE POLICY "Admin gère les avis"
     ON public.avis FOR ALL TO authenticated
     USING (true) WITH CHECK (true);
   ```

### Dispositif Anti-Spam à 2 Niveaux (Client & Serveur)
1. **Niveau 1 — Client (`localStorage`)** :
   - Dès qu'un visiteur note un conseiller, la clé `LOUAMETAY_AVIS_<ID_COMMERCIAL>` enregistre le timestamp de soumission.
   - Toute nouvelle tentative dans les **24 heures** est bloquée avant même d'émettre une requête réseau, avec un message courtois indiquant le temps d'attente restant.
2. **Niveau 2 — Trigger PostgreSQL (`trig_check_avis_recent`)** :
   - Un trigger s'exécute côté base de données avant tout `INSERT` :
     ```sql
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
     ```

---

## 4. Guide d'Utilisation Côté Administration (`admin.html`)

### 1. Consulter les Avis
1. Accédez à l'espace d'administration et cliquez sur l'onglet **⭐ Avis clients** dans le menu latéral.
2. Consultez les 4 cartes statistiques :
   - **Note Moyenne Globale** (ex: `9.4 / 10`)
   - **Total des Avis**
   - **Avis Publiés**
   - **Avis Masqués**

### 2. Filtrer & Rechercher
- **Champ de recherche** : Filtre instantané sur le nom du visiteur, le nom de son restaurant, le contenu du commentaire ou le conseiller concerné.
- **Filtre par Note** :
  - *Excellents* (8 à 10 ⭐)
  - *Moyens* (5 à 7 ⭐)
  - *Critiques* (Moins de 5 ⭐)
- **Filtre par Statut** : Publiés / Masqués.

### 3. Modération en 1 Clic
- **Masquer un avis** : Cliquez sur le bouton `👁️ Masquer`. Le statut passe instantanément à `masque` et l'avis disparaît immédiatement de la carte digitale publique.
- **Publier un avis** : Cliquez sur `✓ Publier` pour rétablir l'avis en ligne.
- **Suppression définitive** : Cliquez sur le bouton rouge `🗑️` pour purger définitivement l'avis après confirmation.

### 4. Export CSV
- Cliquez sur le bouton **📥 Exporter en CSV** en haut à droite du tableau pour obtenir un fichier `.csv` complet encodé en UTF-8 (avec BOM Excel) incluant la date, le conseiller, le visiteur, le restaurant, la note et le commentaire.

### 5. Configurer la Localisation d'un Conseiller
1. Dans l'onglet **Commerciaux**, cliquez sur l'icône de crayon d'un conseiller (ou sur **+ Nouveau commercial**).
2. Renseignez :
   - **Adresse de référence** (ex: `Dakar, Plateau — Point E, Immeuble Horizon CHR`)
   - **Latitude & Longitude** (ex: `14.692800`, `-17.446700`)
   - Ou cliquez directement sur **📍 Détecter ma position GPS** pour capturer automatiquement les coordonnées du conseiller sur le terrain.
   - *(Optionnel)* Saisissez une URL Google Maps personnalisée.
3. Cliquez sur **Enregistrer le commercial**.
