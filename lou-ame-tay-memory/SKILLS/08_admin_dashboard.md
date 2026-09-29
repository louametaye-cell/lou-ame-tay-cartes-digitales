# SKILL : Tableau de Bord d'Administration SaaS & CRUD Temps Réel

> **Version** : 2.0.0  
> **Date de création** : 2026-09-29  
> **Auteur** : Antigravity & Équipe Lou Ame Tay  
> **Tags** : `admin`, `dashboard`, `crud`, `image-compression`, `toast`, `realtime`

---

## 🎯 Quand utiliser cette compétence
Utilisez cette compétence pour construire un back-office d'administration complet, fluide et autonome sans framework lourd :
- Pour gérer le cycle de vie complet d'une entité commerciale (Création, Lecture, Modification, Suppression, Bascule Actif/Inactif en 1 clic).
- Pour compresser automatiquement les photos lourdes côté navigateur avant l'envoi vers le cloud.
- Pour afficher des KPIs décisionnels en temps réel (total des cartes, actives, inactives, nouveaux leads, MRR estimé).
- Pour filtrer et rechercher instantanément dans de grands volumes de données côté client.
- Pour fournir des retours visuels immédiats non-bloquants (toasts de confirmation verts/rouges).

---

## 📋 Prérequis
1. Authentification Supabase Auth active avec redirection automatique vers `login.html` si non connecté.
2. Table `commerciaux` et table `leads` configurées avec RLS autorisant le rôle `authenticated`.
3. Bibliothèque `browser-image-compression` chargée pour l'optimisation des photos mobiles.
4. Bibliothèque `Chart.js` pour les visualisations d'évolution et graphiques d'activité.

---

## 🛠️ Étapes d'implémentation

### Étape 1 : Protection d'accès et cycle d'authentification
Vérifier l'état de session dès le `DOMContentLoaded` via `supabase.auth.getSession()`. Écouter les changements d'état (`onAuthStateChange`) pour gérer la déconnexion immédiate.

### Étape 2 : Chargement des données et rendu du tableau dynamique
Exécuter une requête ordonnée `SELECT * FROM commerciaux ORDER BY created_at DESC`, calculer les compteurs statistiques et injecter les lignes du tableau via `innerHTML` ou fragments DOM.

### Étape 3 : Compression intelligente de l'image (Côté client)
Intercepter la sélection du fichier dans le formulaire modal. Réduire la résolution à 1200px max et la taille à < 1 Mo avant tout appel à `supabase.storage.upload`.

### Étape 4 : Bascule Actif / Inactif en 1 clic
Mettre à jour la base de données avec `UPDATE commerciaux SET actif = ? WHERE id = ?` lors du changement d'un checkbox de type switch, sans recharger la page.

---

## 💻 Code / Configuration

### 1. Compression Client & Téléversement
```javascript
import { supabase } from './supabase-client.js';

export async function compresserEtUploaderPhoto(file, commercialId) {
  let fichierAEnvoyer = file;

  // Compression via browser-image-compression si disponible
  if (typeof window !== 'undefined' && window.imageCompression) {
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        initialQuality: 0.85
      };
      fichierAEnvoyer = await window.imageCompression(file, options);
      console.log(`[Compression] Réduit de ${(file.size / 1024).toFixed(0)} Ko à ${(fichierAEnvoyer.size / 1024).toFixed(0)} Ko`);
    } catch (err) {
      console.warn('[Compression] Erreur, envoi de l\'image originale :', err);
    }
  }

  const ext = file.name ? file.name.split('.').pop() : 'jpg';
  const cleanId = String(commercialId || 'nouveau').replace(/[^a-zA-Z0-9_-]/g, '');
  const filePath = `commerciaux/${cleanId}_${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('photos')
    .upload(filePath, fichierAEnvoyer, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || 'image/jpeg'
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('photos')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}
```

### 2. Bascule de Statut 1-Clic
```javascript
export async function toggleActif(id, nouvelEtat) {
  try {
    const { error } = await supabase
      .from('commerciaux')
      .update({ actif: nouvelEtat, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    afficherToast(nouvelEtat ? '✓ Carte activée avec succès.' : 'Carte désactivée.');
  } catch (err) {
    console.error('Erreur bascule statut :', err);
    afficherToast('Erreur lors du changement de statut : ' + err.message, 'erreur');
  }
}
```

### 3. Système de Notifications Toast Fluide
```javascript
export function afficherToast(message, type = 'succes') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast-notification';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.className = `toast-notification visible ${type === 'erreur' ? 'toast-erreur' : 'toast-succes'}`;

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('visible');
  }, 3500);
}
```

---

## ⚠️ Pièges à éviter
1. **Bloquer l'UI pendant l'upload d'image** : Toujours afficher un indicateur de chargement ("Téléversement en cours...") et désactiver le bouton Soumettre pour éviter les doubles clics.
2. **Hardcoder les URLs dans les boutons d'action du tableau** : Le bouton "Voir le profil" 👁️ doit impérativement utiliser l'UUID Supabase réel de la ligne (`voirProfil('${c.id}')`), sous peine d'ouvrir systématiquement le même commercial par défaut.
3. **Suppression définitive sans confirmation explicite** : Toujours ouvrir un modal de confirmation demandant le nom du commercial avant d'exécuter un `DELETE FROM commerciaux`.

---

## ✅ Checklist de validation
- [ ] Le formulaire modal s'ouvre proprement en création (champs vides) et en édition (champs pré-remplis).
- [ ] La photo compressée pèse moins de 1 Mo même si la photo initiale faisait plus de 10 Mo.
- [ ] Le switch actif/inactif met à jour la ligne dans PostgreSQL sans rechargement complet de la page.
- [ ] Le bouton 👁️ ouvre exactement la carte du commercial sélectionné avec son UUID.
- [ ] Les toasts d'information disparaissent automatiquement après 3,5 secondes.

---

## 🔗 Ressources liées
- [`02_supabase_patterns.md`](file:///C:/Users/DELL/Desktop/CRM%20LOUAMETAY.COM/lou-ame-tay-—-cartes-de-visite-digitales/lou-ame-tay-memory/SKILLS/02_supabase_patterns.md)
- [`PATTERNS/toast_notifications.md`](file:///C:/Users/DELL/Desktop/CRM%20LOUAMETAY.COM/lou-ame-tay-—-cartes-de-visite-digitales/lou-ame-tay-memory/PATTERNS/toast_notifications.md)
- [`PATTERNS/modal_component.md`](file:///C:/Users/DELL/Desktop/CRM%20LOUAMETAY.COM/lou-ame-tay-—-cartes-de-visite-digitales/lou-ame-tay-memory/PATTERNS/modal_component.md)

---

## 📊 Exemple concret (projet Lou Ame Tay)
L'interface d'administration de Lou Ame Tay (`admin.html`) permet à la direction à Thiès de piloter les 5 commerciaux déployés sur Dakar, Thiès et Mbour. Chaque nouveau conseiller créé voit sa carte générée instantanément avec son QR Code prêt à être imprimé et son profil synchronisé dans Supabase.
