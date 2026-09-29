# MÉMOIRE : 05 — Personas Utilisateurs & Parcours d'Expérience

> **Projet** : Lou Ame Tay  
> **Date de création** : 2026-09-29  
> **Version** : 2.0.0  
> **Auteur** : Antigravity & Équipe Lou Ame Tay  

---

## 📅 Contexte historique
Pour garantir que chaque fonctionnalité réponde à un besoin réel sur le terrain sénégalais, la conception de Lou Ame Tay s'est appuyée sur 4 personas primaires représentatifs de l'écosystème CHR.

---

## 🎯 Profils Détaillés des Personas

### Persona 1 : Babacar Gueye (CEO & Super Administrateur)
- **Rôle** : Fondateur et dirigeant de Lou Ame Tay.
- **Localisation** : Thiès & Dakar.
- **Objectifs** :
  - Suivre la croissance du MRR (Monthly Recurring Revenue) en direct.
  - Superviser les performances de déploiement de son équipe commerciale terrain.
  - Activer ou désactiver les cartes digitales des conseillers en un clic.
  - Exporter les statistiques financières et les listes de leads pour les réunions de direction.
- **Pain Points** : Manque de visibilité sur l'activité réelle des commerciaux sur la route ; risque de fuite de leads si un commercial quitte l'entreprise avec ses contacts.
- **Fonctionnalités clés utilisées** : Dashboard CEO temps réel, CRM Leads avec export CSV, Gestion des accès et switch Actif/Inactif 1-clic.

### Persona 2 : Mamadou Diallo (Directeur Commercial Terrain)
- **Rôle** : Directeur Commercial & Grands Comptes.
- **Localisation** : Dakar (Plateau, Almadies, Point E).
- **Objectifs** :
  - Démontrer l'efficacité du menu QR Code et du KDS en 30 secondes chrono lors de visites spontanées.
  - Laisser une trace inoubliable au gérant en lui faisant ajouter son contact dans son téléphone d'un tap.
  - Recevoir instantanément une alerte WhatsApp dès qu'un prospect montre de l'intérêt.
- **Pain Points** : Cartes de visite papier froissées ou perdues par les restaurateurs ; zones blanches dans les restaurants en sous-sol ou mal desservis en réseau.
- **Fonctionnalités clés utilisées** : Mode PWA offline avec fallback de secours, bouton vCard doré, QR Code HD 1000px, Kit Networking ZIP en 1 clic.

### Persona 3 : M. Ousmane Diop (Gérant de Restaurant — Prospect / Client)
- **Rôle** : Propriétaire du restaurant *Le Teranga* (Dakar).
- **Établissement** : 80 couverts, terrasse animée, service midi et soir.
- **Objectifs** :
  - Réduire les disputes entre serveurs et cuisine aux heures de pointe.
  - Éviter d'imprimer de nouvelles cartes à chaque fois que le prix du thiof ou de la lotte augmente.
  - Offrir aux clients le paiement sans contact par Wave et Orange Money.
- **Pain Points** : Peur des logiciels informatiques complexes nécessitant des semaines de formation ; personnel de salle qui tourne souvent et ne sait pas toujours lire les descriptions techniques.
- **Attentes vis-à-vis de Lou Ame Tay** : Simplicité enfantine, démonstration sur place, support technique disponible le soir sur WhatsApp.

### Persona 4 : Le Client du Restaurant (Visiteur Final)
- **Rôle** : Client attablé venu déjeuner ou dîner.
- **Comportement** : Sort son smartphone, scanne le chevalet QR sur la table.
- **Attentes** : Le menu doit s'ouvrir en moins de 2 secondes, sans installer d'application, avec de belles photos et des prix clairs en FCFA.

---

## 📊 Matrice d'Alignement Fonctionnel

| Persona | Besoin Majeur | Solution Lou Ame Tay | Bénéfice Mesurable |
| :--- | :--- | :--- | :--- |
| **CEO (Babacar)** | Contrôle centralisé & KPIs | Dashboard Admin sécurisé avec stats temps réel | Pilotage à distance à 100% |
| **Commercial (Mamadou)** | Impact en prospection terrain | Carte PWA haute conversion style QRCodeChimp | Taux de contact enregistré > 65% |
| **Restaurateur (Ousmane)** | Sérénité opérationnelle | Écran Cuisine KDS + Menu QR sans appli | -90% d'erreurs de commande |
| **Client final** | Rapidité et fluidité | Scan QR instantané et paiement Wave/OM | Panier moyen augmenté de +25% |

---

## 📝 Leçons apprises
1. **L'empathie culturelle prime sur l'élégance technique** : Connaître le quotidien d'un restaurateur à Dakar (coupures de courant, bruit ambiant, rotation des serveurs) dicte les choix d'interface : gros boutons tactiles, zéro mot de passe compliqué, alertes sonores nettes.
