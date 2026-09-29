# 📱 GUIDE DE CONFIGURATION — APPLE WALLET & GOOGLE WALLET PASS

Ce guide détaille la mise en service des passes mobiles **Apple Wallet (.pkpass)** et **Google Wallet** pour les cartes de visite digitales **Lou Ame Tay**.

---

## 🎯 POURQUOI UN PORTE-CARTES MOBILE ?
- **Zéro connexion requise** : Le restaurateur conserve la carte de son conseiller Lou Ame Tay dans son iPhone ou son smartphone Android en permanence.
- **Accès instantané** : Le pass affiche le nom, le poste, le contact direct et un QR Code dynamique ouvrant la carte interactive.
- **Mises à jour à distance** : Si le commercial change de numéro de téléphone ou de fonction, le pass peut être mis à jour silencieusement par push.

---

## 🍏 1. CONFIGURATION APPLE WALLET (.PKPASS)

### Étape 1.1 : Prérequis Apple Developer
1. Rendez-vous sur [developer.apple.com](https://developer.apple.com).
2. Connectez-vous avec votre compte **Apple Developer Program**.

### Étape 1.2 : Créer le Pass Type ID
1. Dans **Certificates, Identifiers & Profiles** → **Identifiers**.
2. Cliquez sur `+` puis sélectionnez **Pass Type IDs**.
3. Renseignez :
   - **Description** : `Lou Ame Tay Carte Pass`
   - **Identifier** : `pass.com.louametay.carte`

### Étape 1.3 : Générer le certificat de signature
1. Cliquez sur le Pass Type ID nouvellement créé puis sur **Create Certificate**.
2. Suivez l'assistant Keychain sur Mac pour générer une demande de signature (CSR).
3. Téléchargez le certificat `.cer` produit par Apple.
4. Double-cliquez dessus pour l'ajouter au Trousseau d'accès Mac, puis faites un clic droit → **Exporter au format .p12** avec un mot de passe fort.

### Étape 1.4 : Encoder en Base64 et configurer Supabase
Convertissez le fichier `.p12` en base64 :
```bash
base64 -i pass_cert.p12 | tr -d '\n' > cert_base64.txt
```
Dans votre dashboard **Supabase** → **Project Settings** → **Edge Functions Secrets**, ajoutez :
- `APPLE_PASS_TYPE_ID` : `pass.com.louametay.carte`
- `APPLE_TEAM_ID` : Votre Team ID Apple (ex: `LOUAMETAY01`)
- `APPLE_PASS_CERT_P12_BASE64` : Le contenu de `cert_base64.txt`
- `APPLE_PASS_CERT_PASSWORD` : Le mot de passe de votre `.p12`

---

## 💳 2. CONFIGURATION GOOGLE WALLET (ANDROID)

### Étape 2.1 : Accès Google Pay & Wallet Console
1. Rendez-vous sur la [Google Pay & Wallet Console](https://pay.google.com/business/console).
2. Créez un profil émetteur (Issuer Profile) ou notez votre **Issuer ID** (ex: `3388000000022345678`).

### Étape 2.2 : Créer un Compte de Service Google Cloud
1. Sur la [Google Cloud Console](https://console.cloud.google.com), associez votre projet.
2. Allez dans **IAM & Administration** → **Comptes de service** → **Créer un compte de service**.
3. Nommez-le `wallet-issuer@votre-projet.iam.gserviceaccount.com`.
4. Créez une nouvelle clé JSON et téléchargez-la.
5. Dans la console Google Wallet, autorisez cet email de compte de service comme utilisateur émetteur.

### Étape 2.3 : Configurer les Secrets Supabase
Dans votre dashboard **Supabase** → **Edge Functions Secrets**, ajoutez :
- `GOOGLE_WALLET_ISSUER_ID` : `3388000000022345678`
- `GOOGLE_WALLET_SERVICE_ACCOUNT_KEY` : Le JSON de la clé du compte de service.

---

## 🚀 3. DÉPLOIEMENT DES EDGE FUNCTIONS SUPABASE

Depuis votre terminal local dans le projet :
```bash
# Déploiement de l'Edge Function Apple Pass
supabase functions deploy generate-apple-pass --no-verify-jwt

# Déploiement de l'Edge Function Google Pass
supabase functions deploy generate-google-pass --no-verify-jwt
```

---

## 🧪 4. MODE SIMULATION & TEST (PAR DÉFAUT)
Tant que les certificats de production ne sont pas téléversés dans les secrets Supabase :
- L'Edge Function `generate-apple-pass` renvoie le payload `pass.json` pré-formaté aux couleurs de Lou Ame Tay (`#0B1F3A` et `#C9A227`).
- L'Edge Function `generate-google-pass` renvoie la structure Google Wallet Class & Object validée.
- Sur ordinateur de bureau (Desktop), un modal s'affiche pour proposer le téléchargement de la **vCard (.vcf standard)** ou le test des liens Apple / Google.
