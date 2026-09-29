# PATTERN : Génération de Fichier Contact vCard 3.0 (.vcf) avec Téléchargement Mobile Direct

> **Langage** : JavaScript (ESM)  
> **Standard** : RFC 2426 (vCard 3.0)  
> **Compatibilité** : iOS Contacts (iPhone), Android Contacts (Google), macOS & Windows  

---

## 🎯 Objectif
Permettre à un utilisateur scannant une carte de visite digitale de cliquer sur le bouton "Ajouter aux contacts" et d'enregistrer instantanément le profil complet du commercial dans son carnet d'adresses smartphone sans ressaisie manuelle.

---

## 💻 Code Réutilisable

```javascript
/**
 * Génère le contenu texte brut selon la norme vCard 3.0
 * @param {Object} c - Données du conseiller
 * @returns {string} - Chaîne formatée vCard
 */
export function construireContenuVCard(c) {
  const nom = c.nom || '';
  const prenom = c.prenom || '';
  const poste = c.poste || 'Conseiller Commercial CHR';
  const societe = 'Lou Ame Tay 🍽️';
  const telephone = (c.telephone || '').replace(/[^\d+]/g, '');
  const email = c.email || '';
  const siteWeb = 'https://www.louametay.online';
  const urlCarte = `https://www.louametay.online/carte.html?id=${c.id}`;
  const note = `Conseiller terrain Lou Ame Tay pour la transition digitale de la restauration au Sénégal. Carte interactive : ${urlCarte}`;

  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N;CHARSET=UTF-8:${nom};${prenom};;;`,
    `FN;CHARSET=UTF-8:${prenom} ${nom}`,
    `ORG;CHARSET=UTF-8:${societe}`,
    `TITLE;CHARSET=UTF-8:${poste}`,
    `TEL;TYPE=WORK,VOICE:${telephone}`,
    `TEL;TYPE=CELL,VOICE:${telephone}`,
    `EMAIL;TYPE=PREF,INTERNET:${email}`,
    `URL;TYPE=WORK:${siteWeb}`,
    `URL;TYPE=DIGITAL_CARD:${urlCarte}`,
    `NOTE;CHARSET=UTF-8:${note}`,
    `ADR;TYPE=WORK;CHARSET=UTF-8:;;Quartier Dixième / Point E;Thiès / Dakar;;;Sénégal`,
    'END:VCARD'
  ].join('\r\n');
}

/**
 * Déclenche le téléchargement du fichier .vcf sur mobile ou desktop
 * @param {Object} commercial - Données du conseiller
 */
export function telechargerVCard(commercial) {
  const contenuVcf = construireContenuVCard(commercial);
  const blob = new Blob([contenuVcf], { type: 'text/vcard;charset=utf-8' });
  const urlBlob = URL.createObjectURL(blob);

  const nomFichier = `${commercial.prenom}_${commercial.nom}.vcf`.replace(/\s+/g, '_');
  const lien = document.createElement('a');
  lien.href = urlBlob;
  lien.setAttribute('download', nomFichier);
  document.body.appendChild(lien);
  lien.click();

  // Nettoyage après téléchargement
  setTimeout(() => {
    document.body.removeChild(lien);
    URL.revokeObjectURL(urlBlob);
  }, 300);
}
```

---

## 🛠️ Exemple d'Attachement sur le Bouton HTML
```javascript
const btnVCard = document.getElementById('btn-ajouter-contact');
if (btnVCard) {
  btnVCard.addEventListener('click', (e) => {
    e.preventDefault();
    telechargerVCard(commercialActuel);
    afficherToast('✓ Contact téléchargé dans votre répertoire !');
  });
}
```
