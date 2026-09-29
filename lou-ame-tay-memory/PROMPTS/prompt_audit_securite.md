# PROMPT TYPE : Audit de Sécurité Base de Données, RLS & OWASP

> **Usage** : Utilisez ce prompt périodiquement ou avant tout passage en production pour vous assurer qu'aucune donnée sensible n'est exposée à des tiers.

---

```markdown
# MISSION : Audit de Sécurité Approfondi & Cloisonnement RLS

## 🎯 OBJECTIF
Examiner minutieusement toutes les tables de la base Supabase et les points de contact du frontend afin de certifier l'absence totale de vulnérabilités et de fuites de données clients.

## 📋 GRILLE D'AUDIT SYSTÉMATIQUE

### 1. Contrôle des Politiques RLS (Row Level Security)
- Vérifier que `rowsecurity = true` sur 100% des tables publiques (`commerciaux`, `leads`, `scans`, `temoignages`, `echanges_cartes`, etc.).
- Tester spécifiquement le rôle anonyme `anon` :
  - Peut-il lire (`SELECT`) la table des `leads` ? (RÉPONSE ATTENDUE : NON STRICT, 0 ligne retournée).
  - Peut-il lire (`SELECT`) les commerciaux inactifs ? (RÉPONSE ATTENDUE : NON).
  - Peut-il supprimer (`DELETE`) ou modifier (`UPDATE`) la moindre ligne ? (RÉPONSE ATTENDUE : NON).

### 2. Contrôle des Clés d'API & Variables d'Environnement
- Vérifier qu'aucune clé `service_role` n'apparaît dans le code client, les commits Git ou le fichier `js/env.js`.
- Confirmer que seule la clé publique `anon` est distribuée aux navigateurs.

### 3. Contrôle du Bucket de Stockage (Storage)
- Le bucket `photos` permet-il la lecture publique des avatars ?
- Les visiteurs anonymes sont-ils empêchés d'écraser (`upsert`) ou de supprimer les fichiers existants ?

### 4. En-têtes HTTP Apache (`.htaccess`)
- Le site force-t-il `HTTPS` avec `HSTS` ?
- Les en-têtes `X-Frame-Options`, `X-Content-Type-Options` et `Referrer-Policy` sont-ils actifs ?

## 📦 LIVRABLE
Produire un rapport d'audit avec matrice des risques, commandes SQL correctives et validation finale.
```
