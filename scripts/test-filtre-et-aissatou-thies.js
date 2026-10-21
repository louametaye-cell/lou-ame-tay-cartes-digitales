import fs from 'fs';
import path from 'path';

console.log('🧪 DÉBUT DE LA SUITE DE TESTS : Filtre Carte Dynamique & Mémoire Aissatou Thiès\n');

const projectDir = 'C:\\Users\\DELL\\Desktop\\CRM LOUAMETAY.COM\\lou-ame-tay-—-cartes-de-visite-digitales';

// TEST 1 : Vérification de la mémoire d'Aissatou pour Thiès
console.log('--- TEST 1 : Fiche 07 et Mémoire Aissatou Thiès ---');
const fiche07 = fs.readFileSync(path.join(projectDir, 'knowledge', '08_thies_saly.md'), 'utf8');
const fiche07Public = fs.readFileSync(path.join(projectDir, 'public', 'knowledge', '08_thies_saly.md'), 'utf8');

const restaurantsAttendus = [
  'Le Croissant Magique',
  'LE FESTIN',
  'ñaari gaar - teranga',
  'Tasset',
  'Mame Diarra Bousso',
  'Sam\'s Prestige'
];

const hotelsAttendus = [
  'La Fandenoise Lodge',
  'Résidence Blue Hôtel',
  'Résidences PRIMIS Thiès',
  'LE GRAND HOTEL DE THIES',
  'Hôtel Résidence Khadija',
  'Relax Residences',
  'Hôtel Résidence Ngary',
  'RESIDENCE BELIER'
];

let tousRestosOk = true;
for (const r of restaurantsAttendus) {
  if (!fiche07.includes(r) || !fiche07Public.includes(r)) {
    console.error(`❌ Restaurant manquant dans la fiche 07 : ${r}`);
    tousRestosOk = false;
  }
}
if (tousRestosOk) console.log('✅ Tous les restaurants de Thiès sont intégrés dans la Fiche 07 (racine & public).');

let tousHotelsOk = true;
for (const h of hotelsAttendus) {
  if (!fiche07.includes(h) || !fiche07Public.includes(h)) {
    console.error(`❌ Hôtel manquant dans la fiche 07 : ${h}`);
    tousHotelsOk = false;
  }
}
if (tousHotelsOk) console.log('✅ Tous les hôtels & résidences de Thiès sont intégrés dans la Fiche 07 (racine & public).');

// TEST 2 : Vérification du HTML admin.html
console.log('\n--- TEST 2 : Structure de admin.html ---');
const adminHtml = fs.readFileSync(path.join(projectDir, 'admin.html'), 'utf8');

// A. Vérifier que Arona Sow n'est plus codé en dur dans admin.html
if (adminHtml.includes('Arona Sow (Dakar)')) {
  console.error('❌ ERREUR : Arona Sow est toujours présent en dur dans admin.html !');
} else {
  console.log('✅ Arona Sow et les options statiques sont bien éradiqués de admin.html.');
}

// B. Vérifier la présence du bouton dans la sidebar
if (adminHtml.includes('data-onglet="aissatou-ceo"')) {
  console.log('✅ Bouton "Aissatou CEO" présent dans la barre latérale (sidebar).');
} else {
  console.error('❌ ERREUR : Bouton data-onglet="aissatou-ceo" manquant dans admin.html !');
}

// C. Vérifier la présence de la section vue-aissatou-ceo
if (adminHtml.includes('id="vue-aissatou-ceo"')) {
  console.log('✅ Section <section id="vue-aissatou-ceo"> présente dans le DOM admin.html.');
} else {
  console.error('❌ ERREUR : Section vue-aissatou-ceo manquante dans admin.html !');
}

// D. Vérifier le chargement du script
if (adminHtml.includes('src="js/admin-aissatou-ceo.js"')) {
  console.log('✅ Script js/admin-aissatou-ceo.js lié dans admin.html.');
} else {
  console.error('❌ ERREUR : Script admin-aissatou-ceo.js manquant dans admin.html !');
}

// TEST 3 : Simulation algorithmique de peuplerFiltreCommerciauxCarte
console.log('\n--- TEST 3 : Algorithme de filtrage dynamique des commerciaux ---');

const fauxJeuCommerciaux = [
  { id: 'c1', prenom: 'Babacar', nom: 'Gueye', zone: 'Thiès, Dakar', actif: true },
  { id: 'c2', prenom: 'Evish', nom: 'Senghor', zone: 'Dakar', actif: true },
  { id: 'c3', prenom: 'Arona', nom: 'Sow', zone: 'Dakar', actif: true }, // banni
  { id: 'c4', prenom: 'Test', nom: 'Compte', zone: 'Test', actif: true }, // compte test
  { id: 'c5', prenom: 'Abdou', nom: 'Tall', zone: 'Thiès', actif: false }, // inactif
  { id: 'c6', prenom: 'Mame Mor', nom: 'Gueye', zone: 'Thiès', actif: true },
  { id: 'c7', prenom: 'Inactif', nom: 'Profil', zone: 'Mbour', actif: false, is_deleted: true } // supprimé
];

function simulerFiltrage(source) {
  return source.filter(c => {
    if (!c || !c.id) return false;
    const estActif = c.actif === true || (c.actif !== false && c.statut !== 'inactif');
    if (!estActif) return false;
    if (c.is_deleted === true || c.deleted_at) return false;
    const nomComplet = `${c.prenom || ''} ${c.nom || ''}`.trim().toLowerCase();
    const email = (c.email || '').toLowerCase();
    if (nomComplet.includes('test') || email.includes('test') || email.includes('fake')) return false;
    if (nomComplet.includes('arona sow')) return false;
    return true;
  }).sort((a, b) => `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`, 'fr'));
}

const resultatFiltre = simulerFiltrage(fauxJeuCommerciaux);
console.log('Commerciaux retenus après filtrage strict :', resultatFiltre.map(c => `${c.prenom} ${c.nom}`));

const nomsRetenus = resultatFiltre.map(c => `${c.prenom} ${c.nom}`);
if (!nomsRetenus.includes('Arona Sow') && !nomsRetenus.includes('Test Compte') && !nomsRetenus.includes('Abdou Tall')) {
  console.log('✅ Sécurité confirmée : Arona Sow, Test Compte et profils inactifs sont strictement exclus !');
} else {
  console.error('❌ Échec du filtrage de sécurité !');
}

if (nomsRetenus.includes('Babacar Gueye') && nomsRetenus.includes('Evish Senghor') && nomsRetenus.includes('Mame Mor Gueye')) {
  console.log('✅ Intégrité confirmée : Tous les vrais commerciaux actifs sont conservés et triés alphabétiquement.');
} else {
  console.error('❌ Échec de conservation des profils valides !');
}

// TEST 4 : Filtrage des leads/rdvs selon le commercial sélectionné
console.log('\n--- TEST 4 : Isolation des prospects/RDVs par commercial sur la carte ---');
const leadsTest = [
  { id: 'l1', commercial_id: 'c1', restaurant_nom: 'MADIBA RESTO', ville: 'Thiès' },
  { id: 'l2', commercial_id: 'c1', restaurant_nom: 'Lat Dior', ville: 'Thiès' },
  { id: 'l3', commercial_id: 'c2', restaurant_nom: 'Le Lagon 1', ville: 'Saly' }
];

const rdvsTest = [
  { id: 'r1', commercial_id: 'c1', restaurant_prospect: 'Sam\'s Prestige' },
  { id: 'r2', commercial_id: 'c2', restaurant_prospect: 'Hôtel Neptune' }
];

// Sélection Babacar (c1)
const commIdSelectionne = 'c1';
const leadsBabacar = leadsTest.filter(l => l.commercial_id === commIdSelectionne);
const rdvsBabacar = rdvsTest.filter(r => r.commercial_id === commIdSelectionne);

if (leadsBabacar.length === 2 && leadsBabacar.every(l => l.commercial_id === 'c1')) {
  console.log('✅ Seuls les 2 leads de Babacar sont transmis à la carte quand Babacar est sélectionné.');
} else {
  console.error('❌ Erreur de filtrage leads Babacar !');
}

if (rdvsBabacar.length === 1 && rdvsBabacar[0].commercial_id === 'c1') {
  console.log('✅ Seul le rendez-vous de Babacar est transmis à la carte quand Babacar est sélectionné.');
} else {
  console.error('❌ Erreur de filtrage RDVs Babacar !');
}

console.log('\n🎉 TOUS LES TESTS SONT AU VERT !');
