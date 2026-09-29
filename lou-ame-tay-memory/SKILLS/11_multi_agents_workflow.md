# SKILL : Méthodologie & Workflow de Développement Multi-Agents Haute Précision

> **Version** : 2.0.0  
> **Date de création** : 2026-09-29  
> **Auteur** : Antigravity & Équipe Lou Ame Tay  
> **Tags** : `multi-agents`, `workflow`, `playwright`, `e2e`, `sprints`, `artifacts`

---

## 🎯 Quand utiliser cette compétence
Utilisez cette compétence lorsque vous pilotez un agent IA autonome ou une équipe d'agents collaboratifs pour développer, refactoriser ou débugger un projet logiciel complexe :
- Pour structurer les chantiers en Sprints courts jalonnés d'objectifs vérifiables.
- Pour éliminer les régressions grâce à un protocole de test E2E automatisé (Playwright) systématique après chaque modification.
- Pour documenter l'avancement via des artefacts vivants (Task Lists, Rapports d'intervention, Diff plans).
- Pour maintenir la continuité de contexte malgré la compaction de l'historique de conversation.

---

## 📋 Prérequis
1. Environnement Antigravity ou Google Gemini CLI avec capacités d'exécution d'outils (`run_command`, `write_to_file`, `replace_file_content`, `manage_task`).
2. Navigateur Chromium headless / Playwright installé pour l'exécution des tests d'intégration visuels et fonctionnels.
3. Règle d'or : Ne JAMAIS déclarer une tâche terminée sans avoir exécuté un test de validation et produit une preuve visuelle (capture d'écran).

---

## 🛠️ Étapes d'implémentation

### Étape 1 : Le Protocole en 4 Temps (Diagnostiquer ➔ Corriger ➔ Tester ➔ Livrer)
1. **Diagnostiquer** : Identifier la cause racine réelle (lire les logs, inspecter le DOM, vérifier les schémas de base de données). Ne pas agir à l'aveugle.
2. **Corriger chirurgicalement** : Appliquer les modifications ciblées avec `replace_file_content`. Ne pas réécrire inutilement des fichiers entiers de 2000 lignes.
3. **Tester de bout en bout** : Rédiger un script scratch Playwright simulant le parcours utilisateur exact, capturer les éventuelles erreurs console, et prendre des screenshots de validation.
4. **Livrer & Documenter** : Mettre à jour le package de déploiement (`build:lws`) et consigner les résultats dans un artefact structuré.

### Étape 2 : Gestion des Sprints par Artefacts
Pour chaque sprint :
- Créer un fichier `task_list_sprintX.md` décrivant les tâches à exécuter.
- Mettre à jour l'avancement au fur et à mesure (`[x] Validé`).
- À l'issue du sprint, produire le document récapitulatif `rapport_sprintX.md`.

### Étape 3 : Gestion du Contexte et des Tâches Asynchrones
Lors de l'exécution de commandes longues (serveurs dev, builds, tests E2E) :
- Ne pas boucler en boucle avec `status`.
- Utiliser le système de notification réactive ou `schedule` pour relâcher l'exécution jusqu'au résultat de la tâche.

---

## 💻 Code / Configuration

### 1. Modèle de Script de Validation E2E Playwright (`scratch/test_workflow.js`)
```javascript
import { chromium } from 'playwright';
import path from 'path';

async function validerComportement() {
  console.log('--- DÉMARRAGE TEST AUTOMATISÉ E2E ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // Écoute des erreurs de console du navigateur
  const erreursConsole = [];
  page.on('console', msg => {
    if (msg.type() === 'error') erreursConsole.push(msg.text());
  });

  try {
    // 1. Navigation
    await page.goto('http://localhost:3000/carte.html?id=22222222-2222-2222-2222-222222222222', {
      waitUntil: 'domcontentloaded'
    });
    await page.waitForTimeout(1500);

    // 2. Assertions
    const nomAffiche = await page.locator('#commercial-nom-complet').textContent();
    console.log(`Nom détecté sur la carte : "${nomAffiche.trim()}"`);

    if (!nomAffiche.includes('Cheikh Ndiaye')) {
      throw new Error(`Incohérence : attendu 'Cheikh Ndiaye', reçu '${nomAffiche}'`);
    }

    // 3. Capture de preuve
    const cheminCapture = path.resolve('capture_validation_e2e.png');
    await page.screenshot({ path: cheminCapture, fullPage: true });
    console.log(`✓ Preuve visuelle enregistrée : ${cheminCapture}`);

    if (erreursConsole.length > 0) {
      console.warn(`Avertissement : ${erreursConsole.length} erreurs console détectées :`, erreursConsole);
    }

    console.log('✅ TEST PLAYWRIGHT VALIDÉ AVEC SUCCÈS.');
  } finally {
    await browser.close();
  }
}

validerComportement().catch(err => {
  console.error('❌ ÉCHEC DU TEST E2E :', err);
  process.exit(1);
});
```

---

## ⚠️ Pièges à éviter
1. **Édition massive aveugle** : Réécrire un fichier complet de 80 Ko pour corriger une ligne introduit souvent des régressions cachées. Toujours privilégier `replace_file_content` ciblé.
2. **Déclarer un bug résolu sans test navigateur** : Une fonction peut sembler correcte en syntaxe mais échouer au runtime à cause d'une politique RLS, d'un problème de CORS ou d'un sélecteur CSS manquant.
3. **Ignorer le blocage de `networkidle` sur Vite** : En environnement Vite de développement, le WebSocket de rechargement à chaud reste connecté, empêchant `networkidle` de se terminer. Toujours privilégier `domcontentloaded` ou `load`.

---

## ✅ Checklist de validation
- [ ] Le plan de travail est découpé en tâches atomiques avec critères d'acceptation clairs.
- [ ] Chaque modification de code est immédiatement testée dans le navigateur via Playwright.
- [ ] Les captures d'écran de vérification sont archivées.
- [ ] Le build de production est recompilé et le paquet ZIP final est mis à jour.
- [ ] L'artefact de rapport est rédigé en pointant vers les éléments concrets.

---

## 🔗 Ressources liées
- [`01_architecture_saas.md`](file:///C:/Users/DELL/Desktop/CRM%20LOUAMETAY.COM/lou-ame-tay-—-cartes-de-visite-digitales/lou-ame-tay-memory/SKILLS/01_architecture_saas.md)
- [`08_admin_dashboard.md`](file:///C:/Users/DELL/Desktop/CRM%20LOUAMETAY.COM/lou-ame-tay-—-cartes-de-visite-digitales/lou-ame-tay-memory/SKILLS/08_admin_dashboard.md)

---

## 📊 Exemple concret (projet Lou Ame Tay)
Lors du sprint de correctif du bouton "Voir le profil" 👁️, le problème a été diagnostiqué en inspectant les requêtes Supabase, corrigé chirurgicalement dans `admin.js` et `carte.js`, puis validé par un script Playwright qui a cliqué successivement sur les 5 commerciaux réels, ouvert chaque popup et confirmé à 100% que la bonne carte s'affichait avec sa capture d'écran horodatée.
