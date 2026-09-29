# PROMPT TYPE : Résolution Chirurgicale de Bug & Non-Régression

> **Usage** : Utilisez ce prompt lors de la découverte d'une anomalie en production ou d'un comportement inattendu pour forcer l'agent à adopter une démarche méthodique.

---

```markdown
# MISSION : Correctif Urgent — [Description du problème]

## 🐛 ANOMALIE CONSTATÉE
[Décrire le bug avec précision : quel bouton a été cliqué, quelle URL a été ouverte, quel résultat faux s'est produit]

Exemple : 
"Dans admin.html, le clic sur l'icône 👁️ (voir profil) ouvre systématiquement la carte de Mamadou Diallo au lieu du commercial sélectionné."

## 🔍 ÉTAPE 1 : DIAGNOSTIC OBLIGATOIRE (Ne pas écrire de code)
1. Ouvrir les fichiers concernés et inspecter les valeurs des attributs DOM (`data-id`, `onclick`, `href`).
2. Examiner la console du navigateur et les réponses réseau (Codes HTTP 400, 401, 403, 404, 500).
3. Vérifier les types SQL dans la base de données (ex: UUID vs String vs Entier).
4. Établir la liste des causes racines possibles et formuler l'hypothèse principale.

## 🛠️ ÉTAPE 2 : APPLICATION DU CORRECTIF CHIRURGICAL
- Remplacer UNIQUEMENT les lignes incriminées via `replace_file_content`.
- Ne pas écraser les blocs non concernés.
- Assurer la rétrocompatibilité (fallback gracieux en cas de données historiques imparfaites).

## 🧪 ÉTAPE 3 : PROTOCOLE DE VALIDATION PLAYWRIGHT
- Rédiger un script de test scratch avec Playwright qui teste au moins 3 cas de figure différents.
- Vérifier que l'URL résultante et le texte affiché correspondent exactement à l'attendu.
- Sauvegarder les captures d'écran de chaque test réussi.

## 📦 ÉTAPE 4 : LIVRABLE
- Rapport succinct : Cause racine identifiée ➔ Correctif appliqué ➔ Tableau des tests Playwright ➔ Capture d'écran.
```
