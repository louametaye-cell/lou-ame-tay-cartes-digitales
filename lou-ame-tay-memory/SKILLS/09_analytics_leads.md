# SKILL : Analytics de Scans, Traçabilité Terrain & Lead Scoring Automatisé

> **Version** : 2.0.0  
> **Date de création** : 2026-09-29  
> **Auteur** : Antigravity & Équipe Lou Ame Tay  
> **Tags** : `analytics`, `lead-scoring`, `crm`, `whatsapp-alert`, `geolocation`, `tracking`

---

## 🎯 Quand utiliser cette compétence
Utilisez cette compétence pour transformer une carte de visite digitale passive en un véritable capteur d'opportunités d'affaires (Inbound Sales Engine) :
- Pour enregistrer automatiquement chaque scan d'un QR code avec horodatage, agent utilisateur, IP et géolocalisation approximative.
- Pour calculer un score d'appétence commercial (0 à 100) pour chaque demande de devis ou prise de contact basée sur des critères objectifs (taille de l'établissement, formule demandée, urgence).
- Pour alerter instantanément le commercial concerné sur son numéro WhatsApp avec un lien d'action directe dès qu'un prospect chaud soumet ses coordonnées.
- Pour suivre le cycle de vie des opportunités dans un mini-CRM back-office (Nouveau ➔ Contacté ➔ Démo effectuée ➔ Converti ➔ Perdu).

---

## 📋 Prérequis
1. Tables Supabase : `scans` (traçabilité), `leads` (opportunités), et `commerciaux` (bénéficiaires des alertes).
2. Algorithme de scoring paramétrable selon la typologie des offres.
3. API WhatsApp Click-to-Chat (`wa.me`) pour l'envoi de messages pré-remplis sans frais d'API tierce.

---

## 🛠️ Étapes d'implémentation

### Étape 1 : Traçabilité transparente du scan (`trackerScan`)
Dès l'ouverture de la carte, déclencher un appel asynchrone non-bloquant `INSERT INTO scans (commercial_id, user_agent, page_url)`. Ne jamais ralentir l'affichage visuel pour le visiteur.

### Étape 2 : Moteur de calcul du Score de Lead (0 - 100)
Attribuer des points selon les données renseignées par le prospect :
- Formule souhaitée (+15 pts pour Tàmbali, +25 pts pour Nio Far, +40 pts pour Xéweul / Sur Mesure).
- Type d'établissement (+20 pts pour restaurant établi ou complexe hôtelier).
- Complétude des coordonnées (+15 pts si téléphone + email + nom de restaurant fournis).
- Disponibilité pour démo immédiate (+25 pts).

### Étape 3 : Alerte WhatsApp instantanée au commercial
Générer une URL WhatsApp vers le numéro du commercial avec un message structuré détaillant le lead et son niveau d'urgence ("🔥 LEAD CHAUD (Score 85/100)").

---

## 💻 Code / Configuration

### 1. Algorithme de Lead Scoring (`js/lead-scoring.js`)
```javascript
export function calculerScoreLead(donnees) {
  let score = 20; // Score de base

  // 1. Formule envisagée
  const formule = (donnees.formule || '').toLowerCase();
  if (formule.includes('surmesure') || formule.includes('sur mesure')) score += 40;
  else if (formule.includes('xeweul')) score += 35;
  else if (formule.includes('niofar') || formule.includes('nio far')) score += 25;
  else if (formule.includes('tambali')) score += 15;

  // 2. Localisation stratégique
  const ville = (donnees.ville || '').toLowerCase();
  if (['dakar', 'almadies', 'plateau', 'saly'].some(v => ville.includes(v))) {
    score += 15;
  } else if (['thies', 'mbour'].some(v => ville.includes(v))) {
    score += 10;
  }

  // 3. Complétude du profil
  if (donnees.email && donnees.email.includes('@')) score += 10;
  if (donnees.nom_restaurant && donnees.nom_restaurant.length > 3) score += 15;

  return Math.min(score, 100);
}

export function getPrioriteBadge(score) {
  if (score >= 75) return { libelle: '🔥 Très Chaud', classe: 'priorite-haute' };
  if (score >= 50) return { libelle: '⚡ Tiède', classe: 'priorite-moyenne' };
  return { libelle: '❄️ Froid', classe: 'priorite-basse' };
}
```

### 2. Enregistrement du Lead & Notification WhatsApp
```javascript
import { supabase } from './supabase-client.js';
import { calculerScoreLead } from './lead-scoring.js';

export async function enregistrerLeadEtNotifier(leadData, commercial) {
  const score = calculerScoreLead(leadData);

  // 1. Sauvegarde dans Supabase
  const { data: nouveauLead, error } = await supabase
    .from('leads')
    .insert([{
      commercial_id: commercial.id,
      nom_contact: leadData.nom,
      nom_restaurant: leadData.restaurant,
      telephone: leadData.telephone,
      email: leadData.email || '',
      ville: leadData.ville || 'Dakar',
      formule_souhaitee: leadData.formule,
      score_priorite: score,
      statut: 'nouveau'
    }])
    .select()
    .single();

  if (error) console.error('Erreur sauvegarde lead :', error);

  // 2. Génération du message WhatsApp d'alerte pour le commercial
  const numeroCommercial = commercial.whatsapp.replace(/\D/g, '');
  const texteAlerte = 
    `🚨 *NOUVEAU LEAD LOU AME TAY (${score}/100)*\n\n` +
    `👤 *Contact* : ${leadData.nom}\n` +
    `🍽️ *Restaurant* : ${leadData.restaurant}\n` +
    `📞 *Téléphone* : ${leadData.telephone}\n` +
    `📍 *Ville* : ${leadData.ville || 'Sénégal'}\n` +
    `📦 *Formule* : ${leadData.formule}\n\n` +
    `👉 *Action immédiate* : Recontacter le gérant sous 15 minutes pour planifier la démo en salle !`;

  const lienWhatsApp = `https://wa.me/${numeroCommercial}?text=${encodeURIComponent(texteAlerte)}`;
  
  return { lead: nouveauLead, lienWhatsApp };
}
```

---

## ⚠️ Pièges à éviter
1. **Bloquer la soumission utilisateur sur l'API de géolocalisation** : Ne jamais forcer un prompt de géolocalisation intrusif du navigateur (demande d'autorisation de position GPS). Se contenter d'une détection IP ou d'une déclaration volontaire dans le formulaire.
2. **Ne pas assainir les numéros WhatsApp sénégalais** : Les numéros au Sénégal peuvent être saisis sous la forme `77 123 45 67`, `00221...` ou `+221...`. Toujours formater avec l'indicatif international `221` sans espaces ni symboles pour `wa.me/22177...`.
3. **Leads orphelins si le commercial est désactivé** : Toujours prévoir un commercial par défaut (ex: Direction Commerciale) si `commercial_id` est absent ou inactif.

---

## ✅ Checklist de validation
- [ ] Chaque scan de carte incrémente le compteur de la table `scans`.
- [ ] Le calcul du score est instantané et attribue entre 20 et 100 points.
- [ ] La soumission d'une demande de devis insère le prospect dans `leads` et prépare l'alerte WhatsApp.
- [ ] Le tableau des leads dans `admin.html` classe les prospects par score décroissant avec badge de couleur.

---

## 🔗 Ressources liées
- [`02_supabase_patterns.md`](file:///C:/Users/DELL/Desktop/CRM%20LOUAMETAY.COM/lou-ame-tay-—-cartes-de-visite-digitales/lou-ame-tay-memory/SKILLS/02_supabase_patterns.md)
- [`08_admin_dashboard.md`](file:///C:/Users/DELL/Desktop/CRM%20LOUAMETAY.COM/lou-ame-tay-—-cartes-de-visite-digitales/lou-ame-tay-memory/SKILLS/08_admin_dashboard.md)

---

## 📊 Exemple concret (projet Lou Ame Tay)
Lorsqu'un restaurateur de Saly scanne la carte de Fatou Sow et remplit la demande de devis express pour la formule Xéweul, le lead reçoit automatiquement un score de 85/100 ("Très Chaud"). Fatou Sow reçoit en moins de 10 secondes une alerte WhatsApp avec le nom du restaurant et le bouton d'appel direct, lui permettant de rappeler le client pendant qu'il consulte encore la carte.
