# 📧 Guide de Configuration : E-mails Professionnels Commerciaux Gratuits & Illimités
**Plateforme :** Lou Ame Tay (CHR Sénégal)  
**Domaine :** `louametay.online` (Géré chez LWS)  
**Objectif :** Attribuer à chaque conseiller commercial une adresse professionnelle de prestige (`prenom.nom@louametay.online`) à **0 FCFA / mois** sans souscrire à des forfaits coûteux.

---

## 💡 Principe du Système

Au lieu de payer 6 € / mois (4 000 FCFA) par commercial chez Google Workspace ou Microsoft 365, nous utilisons le **Routage / Redirection d'e-mails illimité inclus dans ton nom de domaine LWS** :
- **Réception :** Tout email envoyé à `agent@louametay.online` est immédiatement transféré vers le compte Gmail personnel de l'agent sur son smartphone.
- **Envoi :** L'agent configure son compte Gmail pour envoyer des e-mails avec son adresse `@louametay.online` via le serveur SMTP sécurisé de Lou Ame Tay. Le client ne voit jamais son adresse Gmail personnelle.

---

## 🛠️ Partie 1 : Création de la Redirection dans LWS (Par le CEO ou l'Admin - 2 minutes)

1. Connecte-toi sur ton espace client LWS : **[https://panel.lws.fr](https://panel.lws.fr)**
2. Dans la liste de tes services, clique sur **`louametay.online`** (Gérer).
3. Rends-toi dans la section **« Adresses E-mails »** puis clique sur **« Redirections E-mails »**.
4. Clique sur le bouton bleu **« Ajouter une redirection »** :
   - **Adresse e-mail source :** Saisis le préfixe de l'agent (ex: `modou.gueye` ou `lat.com01`).
   - **Domaine :** Laisse sélectionné `@louametay.online`.
   - **Rediriger vers :** Saisis l'adresse Gmail personnelle de l'agent (ex: `modou.commercial221@gmail.com`).
5. Clique sur **« Valider »**.

✅ **C'est tout !** L'adresse est immédiatement active. Tout message envoyé à `modou.gueye@louametay.online` arrive dans son Gmail en moins de 2 secondes.

---

## 📱 Partie 2 : Configuration de l'Envoi depuis Gmail (Par le Commercial - 3 minutes)

Pour que l'agent puisse **écrire et répondre aux clients avec son adresse officielle `@louametay.online` directement depuis son application Gmail**, donne-lui cette fiche :

1. Sur son ordinateur ou sur le navigateur de son smartphone (en mode version pour ordinateur), ouvrir **[mail.google.com](https://mail.google.com)**.
2. Cliquer sur l'icône **Paramètres ⚙️** en haut à droite ➔ **« Voir tous les paramètres »**.
3. Cliquer sur l'onglet **« Comptes et importation »**.
4. Dans la section **« Envoyer des e-mails en tant que : »**, cliquer sur **« Ajouter une autre adresse e-mail »**.
5. Remplir la fenêtre contextuelle :
   - **Nom :** Son nom complet officiel (ex: `Modou GUEYE — Lou Ame Tay`).
   - **Adresse e-mail :** Son adresse pro (ex: `modou.gueye@louametay.online`).
   - Laisser cochée la case : `Traiter comme un alias`.
   - Cliquer sur **Étape suivante**.
6. Paramètres du serveur sortant SMTP :
   - **Serveur SMTP :** `mail.louametay.online`
   - **Port :** `587` (avec connexion sécurisée TLS)
   - **Nom d'utilisateur :** `contact@louametay.online` *(ou le compte principal LWS)*
   - **Mot de passe :** Le mot de passe de cette boîte principale.
7. Cliquer sur **« Ajouter un compte »**.
8. Gmail envoie un code de validation à 6 chiffres par e-mail. L'agent ouvre son Gmail, copie le code reçu et clique sur **« Confirmer »**.

✅ **Résultat final :**  
Dans l'application Gmail sur son téléphone, lorsqu'il clique sur *Nouveau message*, il peut désormais choisir d'envoyer depuis son adresse professionnelle **`modou.gueye@louametay.online`** avec une signature automatique officielle !

---

## 📋 Nomenclature Officielle Recommandée pour l'Équipe

Pour une image d'entreprise rigoureuse et uniforme :
- **Format Nominatif Standard :** `prenom.nom@louametay.online` (ex: `babacar.gueye@louametay.online`, `awa.diop@louametay.online`).
- **Format Régional / Sectoriel :** `dakar.plateau@louametay.online`, `saly.terroir@louametay.online`, `thies.centre@louametay.online`.
- **Format Matricule Sécurisé :** `com.2026.01@louametay.online`.
