/**
 * SUITE DE TESTS END-TO-END (E2E) — SPRINT FINAL LOU AME TAY
 * Valide les 5 chantiers :
 * 1. Création et intégrité des prospects (leads)
 * 2. Répertoire des commerciaux (4 agents actifs)
 * 3. Messagerie interne Direction ↔ Commerciaux
 * 4. Fiches de connaissances Aissatou RAG (10 fiches dont Fiche 10 CEO)
 * 5. Intégrité des assets et de la PWA
 */

import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ugmdpjncplnlizhpongo.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function executerTests() {
  console.log('🚀 DÉMARRAGE DE LA SUITE DE TESTS E2E — SPRINT FINAL LOU AME TAY\n');
  let testsReussis = 0;
  let testsTotal = 0;

  function tester(nom, condition, details = '') {
    testsTotal++;
    if (condition) {
      testsReussis++;
      console.log(`  ✅ [PASS] ${nom} ${details ? '(' + details + ')' : ''}`);
    } else {
      console.error(`  ❌ [FAIL] ${nom} ${details ? '(' + details + ')' : ''}`);
    }
  }

  // TEST 1 : Vérification de la présence des 4 commerciaux
  console.log('--- TEST BLOC 1 : Répertoire des commerciaux actifs ---');
  try {
    const resComs = await fetch(`${SUPABASE_URL}/rest/v1/commerciaux?select=id,prenom,nom,telephone,pin_code,actif&order=created_at.asc`, {
      headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
    });
    const coms = await resComs.json();
    tester('Récupération de la liste des commerciaux', Array.isArray(coms) && coms.length >= 4, `${coms.length} commerciaux trouvés`);

    const tels = coms.map(c => c.telephone);
    tester('Commercial 1 : Babacar Gueye (+221771303678)', tels.includes('771303678') || tels.includes('+221771303678'));
    tester('Commercial 2 : Cheikh Ahmadou Bamba MBODJ (+221771492973)', tels.includes('771492973') || tels.includes('+221771492973'));
    tester('Commercial 3 : Arona Sow (+221770000001)', tels.includes('770000001') || tels.includes('+221770000001'));
    tester('Commercial 4 : Fatou Diop (+221770000002)', tels.includes('770000002') || tels.includes('+221770000002'));
  } catch (err) {
    tester('Erreur connexion Supabase Commerciaux', false, err.message);
  }

  // TEST 2 : Insertion d'un prospect (Lead) avec statut en minuscule
  console.log('\n--- TEST BLOC 2 : Création de prospect (Chantier 1 Fix) ---');
  try {
    const leadTest = {
      restaurant_nom: 'Test E2E Le Jardin des Almadies',
      prospect_nom: 'Mamadou Ndiaye',
      telephone: '+221778901234',
      ville: 'Dakar Almadies',
      formule: 'Xéweul',
      message: 'Test validation E2E automatique',
      source: 'test_e2e',
      statut: 'nouveau', // Minuscule requise
      score: 80
    };

    const resInsert = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(leadTest)
    });

    tester('Insertion prospect avec statut="nouveau"', resInsert.status === 201, `HTTP ${resInsert.status}`);

    if (resInsert.ok) {
      const inserted = await resInsert.json();
      const leadId = inserted[0]?.id;
      tester('ID généré du prospect', Boolean(leadId), `ID: ${leadId}`);

      // Nettoyage immédiat du test
      if (leadId) {
        await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${leadId}`, {
          method: 'DELETE',
          headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
        });
        console.log('    🧹 Lead de test nettoyé de la base.');
      }
    }
  } catch (err) {
    tester('Erreur insertion prospect', false, err.message);
  }

  // TEST 3 : Messagerie interne (Chantier 3)
  console.log('\n--- TEST BLOC 3 : Messagerie Direction ↔ Commerciaux ---');
  try {
    const msgTest = {
      titre: '[@ALL] Directive E2E Test',
      contenu: 'Message de validation E2E automatique pour la force de vente.',
      auteur: 'Direction Lou Ame Tay',
      type: 'info',
      actif: true
    };

    const resMsg = await fetch(`${SUPABASE_URL}/rest/v1/annonces_equipe`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(msgTest)
    });

    tester('Envoi message interne dans annonces_equipe', resMsg.status === 201, `HTTP ${resMsg.status}`);

    if (resMsg.ok) {
      const insMsg = await resMsg.json();
      const msgId = insMsg[0]?.id;
      if (msgId) {
        await fetch(`${SUPABASE_URL}/rest/v1/annonces_equipe?id=eq.${msgId}`, {
          method: 'DELETE',
          headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
        });
        console.log('    🧹 Message de test nettoyé de la base.');
      }
    }
  } catch (err) {
    tester('Erreur messagerie interne', false, err.message);
  }

  // TEST 4 : Fiches de connaissances Aissatou (10 fiches)
  console.log('\n--- TEST BLOC 4 : Base de connaissances Aissatou RAG ---');
  const fichesAttendues = [
    '01_aissatou_personnalite.md',
    '02_marche_chr.md',
    '03_concurrents.md',
    '04_personas.md',
    '05_pitchs.md',
    '06_objections.md',
    '07_dakar.md',
    '08_thies_saly.md',
    '09_saint_louis_casamance.md',
    '10_aissatou_ceo.md'
  ];

  let fichesOk = 0;
  for (const f of fichesAttendues) {
    const p = path.join(process.cwd(), 'knowledge', f);
    if (fs.existsSync(p)) fichesOk++;
  }
  tester('10 fiches de connaissances présentes dans knowledge/', fichesOk === 10, `${fichesOk}/10 fiches`);

  // TEST 5 : Vérification de l'avatar Aissatou
  console.log('\n--- TEST BLOC 5 : Intégrité visuelle & Assets ---');
  const avatarPath = path.join(process.cwd(), 'images', 'aissatou-avatar.png');
  tester('Image avatar Aissatou présente (images/aissatou-avatar.png)', fs.existsSync(avatarPath));

  // SYNTHÈSE
  console.log('\n======================================================');
  console.log(`🏁 RÉSULTATS DES TESTS : ${testsReussis} / ${testsTotal} validés (${Math.round((testsReussis/testsTotal)*100)}%)`);
  console.log('======================================================\n');

  if (testsReussis === testsTotal) {
    console.log('🎉 TOUS LES TESTS SONT AU VERT ! PRÊT POUR LE DÉPLOIEMENT PRODUCTION.');
    process.exit(0);
  } else {
    console.warn('⚠️ Certains tests ont échoué. Examinez les logs ci-dessus.');
    process.exit(1);
  }
}

executerTests();
