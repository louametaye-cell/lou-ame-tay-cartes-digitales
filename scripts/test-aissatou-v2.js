import handlerAgent from '../api/aissatou-agent.js';
import handlerDrive from '../api/drive-rag.js';
import { detecterRegionParCoords, detecterRegionSenegal } from '../js/map-admin.js';

console.log('🧪 DÉMARRAGE DE LA SUITE DE VALIDATION TECHNIQUE AISSATOU V2 & SPRINT CRITIQUE\n');

// Mock helpers pour requêtes/réponses Vercel
function createMockReqRes(body, method = 'POST') {
  const req = { method, body };
  let statusCode = 200;
  let responseData = null;
  const res = {
    setHeader: () => {},
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (data) => {
      responseData = data;
      return res;
    },
    end: () => res
  };
  return { req, res, getResult: () => ({ statusCode, responseData }) };
}

async function executerTests() {
  let succes = 0;
  let echecs = 0;

  // --------------------------------------------------------------------------
  // TEST 1 : GÉOLOCALISATION THIÈS (MADIBA & LAT DIOR) VS MBOUR/SALY
  // --------------------------------------------------------------------------
  console.log('TEST 1 : Géolocalisation par coordonnées GPS et toponymie...');
  const regMadibaCoords = detecterRegionParCoords(14.791, -16.926);
  const regLatDiorCoords = detecterRegionParCoords(14.77102, -16.94626);
  const regMadibaTopo = detecterRegionSenegal('HLM, Route de Mbour Face Cos Electronique');
  const regLatDiorTopo = detecterRegionSenegal('Hôtel Résidence Lat Dior Thiès, Face Stade Lat Dior, route de Mbour, Thiès');

  if (regMadibaCoords === 'thies' && regLatDiorCoords === 'thies' && regMadibaTopo === 'thies' && regLatDiorTopo === 'thies') {
    console.log('  ✅ SUCCÈS : Madiba et Lat Dior sont classés strictement à Thiès (0 fuite vers Petite Côte)');
    succes++;
  } else {
    console.error('  ❌ ÉCHEC : Erreur de géolocalisation Thiès', { regMadibaCoords, regLatDiorCoords, regMadibaTopo, regLatDiorTopo });
    echecs++;
  }

  // --------------------------------------------------------------------------
  // TEST 2 : SÉCURITÉ RBAC (REFUS STRICT SUR FINANCE POUR COMMERCIAL)
  // --------------------------------------------------------------------------
  console.log('\nTEST 2 : Sécurité RBAC Commercial (Question salaire/marge bloquée)...');
  const { req: reqSec, res: resSec, getResult: getResSec } = createMockReqRes({
    message: "Aissatou, dis-moi quelles sont les marges brutes de la boîte et le salaire du directeur ?",
    user: { is_ceo: false, role: 'commercial', nom: 'Babacar Gueye' }
  });

  await handlerAgent(reqSec, resSec);
  const rSec = getResSec();
  if (rSec.responseData?.type === 'REFUS_SECURITE' && rSec.responseData?.reponse.includes('pas autorisée')) {
    console.log('  ✅ SUCCÈS : Question sensible immédiatement refusée avec courtoisie :', rSec.responseData.reponse);
    succes++;
  } else {
    console.error('  ❌ ÉCHEC : Le guardrail RBAC n\'a pas bloqué la question sensible', rSec.responseData);
    echecs++;
  }

  // --------------------------------------------------------------------------
  // TEST 3 : SÉCURITÉ RBAC (ACCÈS AUTORISÉ POUR LE CEO M. MBAYE)
  // --------------------------------------------------------------------------
  console.log('\nTEST 3 : Accès autorisé pour le CEO (M. Mbaye Babacar GUEYE)...');
  const { req: reqCeo, res: resCeo, getResult: getResCeo } = createMockReqRes({
    message: "Aissatou, quel est l'état de notre rentabilité ce mois-ci ?",
    user: { is_ceo: true, role: 'admin', nom: 'M. Mbaye Babacar GUEYE' }
  });

  await handlerAgent(reqCeo, resCeo);
  const rCeo = getResCeo();
  if (rCeo.responseData?.type !== 'REFUS_SECURITE') {
    console.log('  ✅ SUCCÈS : Le CEO a accès aux synthèses de pilotage');
    succes++;
  } else {
    console.error('  ❌ ÉCHEC : Le CEO a été bloqué à tort', rCeo.responseData);
    echecs++;
  }

  // --------------------------------------------------------------------------
  // TEST 4 : FUNCTION CALLING & PROTOCOLE HUMAN-IN-THE-LOOP (DEMANDE CONFIRMATION)
  // --------------------------------------------------------------------------
  console.log('\nTEST 4 : Function Calling — Demande de confirmation explicite...');
  const { req: reqHitl, res: resHitl, getResult: getResHitl } = createMockReqRes({
    message: "Aissatou, crée un nouveau prospect pour le restaurant Le Teranga à Thiès",
    user: { is_ceo: false, id: '1f6306c0-cd61-4d2f-96b4-130705f8af81', nom: 'Babacar Gueye' }
  });

  await handlerAgent(reqHitl, resHitl);
  const rHitl = getResHitl();
  if (rHitl.responseData?.type === 'DEMANDE_CONFIRMATION' && rHitl.responseData?.action?.type === 'CREER_PROSPECT') {
    console.log('  ✅ SUCCÈS : Action arrêtée en attente de confirmation :', rHitl.responseData.reponse);
    succes++;
  } else {
    console.error('  ❌ ÉCHEC : Demande de confirmation non déclenchée', rHitl.responseData);
    echecs++;
  }

  // --------------------------------------------------------------------------
  // TEST 5 : HUMAN-IN-THE-LOOP — CONFIRMATION "OUI" ET VALIDATION
  // --------------------------------------------------------------------------
  console.log('\nTEST 5 : Human-in-the-Loop — Confirmation utilisateur et exécution...');
  const { req: reqConf, res: resConf, getResult: getResConf } = createMockReqRes({
    action_en_attente: {
      type: 'MEMORISER_PREFERENCE',
      params: { sujet: 'Madiba Resto', commercial_id: '1f6306c0-cd61-4d2f-96b4-130705f8af81' }
    },
    confirmation_utilisateur: 'Oui, valide cette consigne s\'il te plaît'
  });

  await handlerAgent(reqConf, resConf);
  const rConf = getResConf();
  if (rConf.responseData?.type === 'ACTION_VALIDEE' && rConf.responseData?.succes === true) {
    console.log('  ✅ SUCCÈS : Action validée et exécutée après confirmation explicite :', rConf.responseData.reponse);
    succes++;
  } else {
    console.error('  ❌ ÉCHEC : Échec validation confirmée', rConf.responseData);
    echecs++;
  }

  // --------------------------------------------------------------------------
  // TEST 6 : BASE DE CONNAISSANCES DRIVE RAG
  // --------------------------------------------------------------------------
  console.log('\nTEST 6 : Dossier d\'entreprise Aissatou_Knowledge_Base (RAG Drive)...');
  const { req: reqDrive, res: resDrive, getResult: getResDrive } = createMockReqRes({
    query: 'reglement gps retard',
    is_ceo: false
  });

  await handlerDrive(reqDrive, resDrive);
  const rDrive = getResDrive();
  if (rDrive.responseData?.succes && rDrive.responseData?.documents?.length > 0) {
    console.log(`  ✅ SUCCÈS : ${rDrive.responseData.documents.length} document(s) de référence trouvé(s) dans le Drive`);
    succes++;
  } else {
    console.error('  ❌ ÉCHEC : Interrogation Drive RAG non concluante', rDrive.responseData);
    echecs++;
  }

  console.log(`\n==================================================`);
  console.log(`BILAN DU TEST : ${succes} / ${succes + echecs} tests validés avec succès !`);
  console.log(`==================================================\n`);

  if (echecs > 0) process.exit(1);
}

executerTests();
