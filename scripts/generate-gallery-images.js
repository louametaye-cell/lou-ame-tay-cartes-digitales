/**
 * ==============================================================================
 * FICHIER : scripts/generate-gallery-images.js
 * GÉNÉRATEUR AUTOMATIQUE DES IMAGES DE LA GALERIE "DÉPLOIEMENTS"
 * ==============================================================================
 * Génère en haute définition (1200x800 px) :
 * - deploiement1.jpg : Écran Cuisine (KDS) en action
 * - deploiement2.jpg : Chevalet de table & Formation équipe
 * - deploiement3.jpg : Carte du Sénégal (Dakar, Thiès, Mbour) & Support 7j/7
 */

import sharp from 'sharp';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');
const ROOT_IMAGES_DIR = path.join(__dirname, '..', 'images');
const WIDTH = 1200;
const HEIGHT = 800;

// Palette officielle Lou Ame Tay
const MARINE = '#0B1F3A';
const MARINE_CLAIR = '#1a3a5f';
const DORE = '#C9A227';
const BLANC = '#FFFFFF';
const GRIS = '#F8F9FA';

// --- SVG 1 : Écran Cuisine (KDS) en action ---
function genererSVG1() {
  return `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${MARINE}"/>
      <stop offset="100%" stop-color="${MARINE_CLAIR}"/>
    </linearGradient>
    <linearGradient id="ecran" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e4d7b"/>
      <stop offset="100%" stop-color="#0a1a2e"/>
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.4"/>
    </filter>
  </defs>
  
  <!-- Fond -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg1)"/>
  
  <!-- Titre haut -->
  <text x="60" y="80" font-family="Poppins, Arial, sans-serif" font-size="32" font-weight="700" fill="${DORE}">LOU AME TAY 🐘</text>
  <text x="60" y="120" font-family="Poppins, Arial, sans-serif" font-size="18" fill="${BLANC}" opacity="0.75">La transition digitale de la restauration au Sénégal</text>
  
  <!-- Écran KDS avec ombre -->
  <rect x="250" y="180" width="700" height="450" rx="20" fill="url(#ecran)" stroke="${DORE}" stroke-width="3" filter="url(#shadow)"/>
  
  <!-- Barre titre écran -->
  <path d="M 250 200 Q 250 180 270 180 L 930 180 Q 950 180 950 200 L 950 240 L 250 240 Z" fill="${DORE}"/>
  <text x="280" y="222" font-family="Poppins, Arial, sans-serif" font-size="22" font-weight="700" fill="${MARINE}">🍽️ ÉCRAN CUISINE (KDS) — COMMANDES EN DIRECT</text>
  
  <!-- Lignes de commandes -->
  <rect x="280" y="270" width="640" height="60" rx="10" fill="${BLANC}" opacity="0.12"/>
  <text x="310" y="307" font-family="Poppins, Arial, sans-serif" font-size="20" font-weight="600" fill="${BLANC}">Table 5  —  2x Thiéboudienne Penda Mbaye</text>
  <text x="830" y="307" font-family="Poppins, Arial, sans-serif" font-size="16" font-weight="700" fill="#34D399">03:45 min</text>
  
  <rect x="280" y="345" width="640" height="60" rx="10" fill="${BLANC}" opacity="0.12"/>
  <text x="310" y="382" font-family="Poppins, Arial, sans-serif" font-size="20" font-weight="600" fill="${BLANC}">Table 8  —  1x Yassa Poulet braisé + Bissap</text>
  <text x="830" y="382" font-family="Poppins, Arial, sans-serif" font-size="16" font-weight="700" fill="#FBBF24">07:12 min</text>
  
  <rect x="280" y="420" width="640" height="60" rx="10" fill="${BLANC}" opacity="0.12"/>
  <text x="310" y="457" font-family="Poppins, Arial, sans-serif" font-size="20" font-weight="600" fill="${BLANC}">Table 3  —  3x Mafé Bœuf &amp; Alloco</text>
  <text x="830" y="457" font-family="Poppins, Arial, sans-serif" font-size="16" font-weight="700" fill="#60A5FA">01:20 min</text>
  
  <rect x="280" y="495" width="640" height="60" rx="10" fill="${DORE}" opacity="0.25"/>
  <text x="310" y="532" font-family="Poppins, Arial, sans-serif" font-size="20" font-weight="600" fill="${BLANC}">Table 12 —  2x Burger Teranga ✅ PRÊT</text>
  <text x="830" y="532" font-family="Poppins, Arial, sans-serif" font-size="16" font-weight="700" fill="#34D399">SERVI</text>
  
  <!-- QR code en bas à droite -->
  <rect x="1000" y="590" width="140" height="140" rx="12" fill="${BLANC}" stroke="${DORE}" stroke-width="3" filter="url(#shadow)"/>
  <rect x="1015" y="605" width="110" height="110" rx="6" fill="${MARINE}"/>
  <text x="1070" y="678" font-family="monospace" font-size="52" font-weight="800" text-anchor="middle" fill="${DORE}">QR</text>
  
  <!-- Texte bas -->
  <text x="60" y="740" font-family="Poppins, Arial, sans-serif" font-size="24" font-weight="700" fill="${DORE}">Menu digital &amp; commande instantanée à table</text>
</svg>`;
}

// --- SVG 2 : Formation équipe en salle & Chevalet QR ---
function genererSVG2() {
  return `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#C9A227"/>
      <stop offset="100%" stop-color="#7A5C10"/>
    </linearGradient>
    <filter id="shadow2" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>
  
  <!-- Fond -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg2)"/>
  
  <!-- Titre haut -->
  <text x="60" y="80" font-family="Poppins, Arial, sans-serif" font-size="32" font-weight="700" fill="${MARINE}">LOU AME TAY 🐘</text>
  <text x="60" y="120" font-family="Poppins, Arial, sans-serif" font-size="18" font-weight="600" fill="${MARINE}" opacity="0.85">Support QR sur table &amp; formation des serveurs</text>
  
  <!-- Chevalet de table -->
  <rect x="130" y="230" width="320" height="430" rx="18" fill="${BLANC}" stroke="${MARINE}" stroke-width="4" filter="url(#shadow2)"/>
  <rect x="180" y="275" width="220" height="220" rx="12" fill="${MARINE}"/>
  <text x="290" y="405" font-family="monospace" font-size="90" font-weight="800" text-anchor="middle" fill="${DORE}">QR</text>
  <text x="290" y="540" font-family="Poppins, Arial, sans-serif" font-size="22" font-weight="800" text-anchor="middle" fill="${MARINE}">Scannez pour</text>
  <text x="290" y="570" font-family="Poppins, Arial, sans-serif" font-size="22" font-weight="800" text-anchor="middle" fill="${MARINE}">commander</text>
  <text x="290" y="615" font-family="Poppins, Arial, sans-serif" font-size="14" font-weight="700" text-anchor="middle" fill="${DORE}">TABLE N° 04</text>
  
  <!-- Smartphone -->
  <rect x="580" y="210" width="240" height="460" rx="32" fill="${MARINE}" stroke="${BLANC}" stroke-width="4" filter="url(#shadow2)"/>
  <rect x="600" y="245" width="200" height="390" rx="18" fill="${BLANC}"/>
  <rect x="625" y="275" width="150" height="150" rx="10" fill="${DORE}"/>
  <text x="700" y="370" font-family="monospace" font-size="60" font-weight="800" text-anchor="middle" fill="${MARINE}">QR</text>
  <rect x="625" y="450" width="150" height="22" rx="5" fill="${MARINE}" opacity="0.35"/>
  <rect x="625" y="490" width="150" height="22" rx="5" fill="${MARINE}" opacity="0.35"/>
  <rect x="625" y="530" width="95" height="22" rx="5" fill="${MARINE}" opacity="0.35"/>
  <rect x="625" y="570" width="150" height="36" rx="8" fill="#10B981"/>
  <text x="700" y="594" font-family="Poppins, Arial, sans-serif" font-size="14" font-weight="700" text-anchor="middle" fill="${BLANC}">Valider (Wave / OM)</text>
  
  <!-- Flèche pointillée de scan -->
  <path d="M 460 410 Q 520 360 570 380" stroke="${MARINE}" stroke-width="4" fill="none" stroke-dasharray="10,5"/>
  <polygon points="565,372 585,384 570,396" fill="${MARINE}"/>
  
  <!-- Badge Équipe formée -->
  <circle cx="980" cy="340" r="70" fill="${MARINE}" stroke="${BLANC}" stroke-width="3" filter="url(#shadow2)"/>
  <text x="980" y="365" font-family="Poppins, Arial, sans-serif" font-size="65" text-anchor="middle" fill="${DORE}">👥</text>
  <rect x="880" y="440" width="200" height="60" rx="12" fill="${MARINE}" filter="url(#shadow2)"/>
  <text x="980" y="468" font-family="Poppins, Arial, sans-serif" font-size="18" font-weight="700" text-anchor="middle" fill="${DORE}">Équipe formée</text>
  <text x="980" y="488" font-family="Poppins, Arial, sans-serif" font-size="13" text-anchor="middle" fill="${BLANC}">Adoption en moins de 48h</text>
  
  <!-- Texte bas -->
  <text x="60" y="740" font-family="Poppins, Arial, sans-serif" font-size="24" font-weight="700" fill="${MARINE}">Chevalets QR résistants • Formation brigade de salle • Support</text>
</svg>`;
}

// --- SVG 3 : Carte du Sénégal & Support terrain 7j/7 ---
function genererSVG3() {
  return `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${MARINE}"/>
      <stop offset="100%" stop-color="#05101f"/>
    </linearGradient>
    <radialGradient id="point" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${DORE}"/>
      <stop offset="100%" stop-color="${DORE}" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow3" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>
  
  <!-- Fond -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg3)"/>
  
  <!-- Titre haut -->
  <text x="60" y="80" font-family="Poppins, Arial, sans-serif" font-size="32" font-weight="700" fill="${DORE}">LOU AME TAY 🐘</text>
  <text x="60" y="120" font-family="Poppins, Arial, sans-serif" font-size="18" fill="${BLANC}" opacity="0.75">Déploiements et assistance sur l'axe Thiès — Dakar — Mbour</text>
  
  <!-- Carte stylisée du Sénégal (contour géographique stylisé) -->
  <path d="M 230 220 Q 380 180 540 210 Q 690 240 840 230 Q 940 220 980 270 Q 1030 340 980 440 Q 930 540 830 590 Q 680 640 530 620 Q 380 600 280 560 Q 180 510 160 420 Q 140 330 180 260 Z" 
        fill="${MARINE_CLAIR}" stroke="${DORE}" stroke-width="3" opacity="0.85" filter="url(#shadow3)"/>
  
  <!-- Point DAKAR -->
  <circle cx="260" cy="360" r="70" fill="url(#point)" opacity="0.4"/>
  <circle cx="260" cy="360" r="18" fill="${DORE}" stroke="${BLANC}" stroke-width="3"/>
  <text x="260" y="325" font-family="Poppins, Arial, sans-serif" font-size="20" font-weight="800" text-anchor="middle" fill="${BLANC}">DAKAR</text>
  <text x="260" y="405" font-family="Poppins, Arial, sans-serif" font-size="12" font-weight="600" text-anchor="middle" fill="${DORE}">Plateau • Almadies</text>
  
  <!-- Point THIÈS (Siège opérationnel) -->
  <circle cx="410" cy="390" r="70" fill="url(#point)" opacity="0.4"/>
  <circle cx="410" cy="390" r="22" fill="#EAB308" stroke="${BLANC}" stroke-width="3"/>
  <text x="410" y="350" font-family="Poppins, Arial, sans-serif" font-size="22" font-weight="800" text-anchor="middle" fill="${DORE}">★ THIÈS</text>
  <text x="410" y="435" font-family="Poppins, Arial, sans-serif" font-size="12" font-weight="600" text-anchor="middle" fill="${BLANC}">Bureaux &amp; Atelier</text>
  
  <!-- Point MBOUR / SALY -->
  <circle cx="490" cy="490" r="70" fill="url(#point)" opacity="0.4"/>
  <circle cx="490" cy="490" r="18" fill="${DORE}" stroke="${BLANC}" stroke-width="3"/>
  <text x="490" y="455" font-family="Poppins, Arial, sans-serif" font-size="20" font-weight="800" text-anchor="middle" fill="${BLANC}">MBOUR</text>
  <text x="490" y="535" font-family="Poppins, Arial, sans-serif" font-size="12" font-weight="600" text-anchor="middle" fill="${DORE}">Saly Portudal</text>
  
  <!-- Lignes de connexion dorées en pointillés -->
  <line x1="260" y1="360" x2="410" y2="390" stroke="${DORE}" stroke-width="3" stroke-dasharray="10,5"/>
  <line x1="410" y1="390" x2="490" y2="490" stroke="${DORE}" stroke-width="3" stroke-dasharray="10,5"/>
  
  <!-- Panneau WhatsApp Support à droite -->
  <rect x="760" y="290" width="370" height="210" rx="20" fill="${BLANC}" filter="url(#shadow3)"/>
  <rect x="785" y="315" width="60" height="60" rx="30" fill="#25D366"/>
  <text x="815" y="357" font-family="Poppins, Arial, sans-serif" font-size="34" text-anchor="middle" fill="${BLANC}">💬</text>
  
  <text x="860" y="340" font-family="Poppins, Arial, sans-serif" font-size="20" font-weight="800" fill="${MARINE}">Support WhatsApp</text>
  <text x="860" y="365" font-family="Poppins, Arial, sans-serif" font-size="14" font-weight="600" fill="#64748B">7j/7 de 08h00 à 20h00</text>
  
  <rect x="785" y="395" width="320" height="50" rx="10" fill="#F1F5F9"/>
  <text x="945" y="428" font-family="Poppins, Arial, sans-serif" font-size="22" font-weight="800" text-anchor="middle" fill="${DORE}">+221 76 231 20 03</text>
  <text x="945" y="475" font-family="Poppins, Arial, sans-serif" font-size="13" font-weight="600" text-anchor="middle" fill="#059669">⚡ Dépannage &amp; assistance express</text>
  
  <!-- Texte bas -->
  <text x="60" y="740" font-family="Poppins, Arial, sans-serif" font-size="24" font-weight="700" fill="${DORE}">Interventions terrain 7j/7 sur tout l'axe sénégalais</text>
</svg>`;
}

async function genererToutesLesImages() {
  console.log('🎨 Génération des 3 images professionnelles de la galerie Lou Ame Tay...');
  
  await fs.ensureDir(PUBLIC_IMAGES_DIR);
  await fs.ensureDir(ROOT_IMAGES_DIR);
  
  const images = [
    { nom: 'deploiement1.jpg', svg: genererSVG1(), description: 'Écran Cuisine (KDS) en action' },
    { nom: 'deploiement2.jpg', svg: genererSVG2(), description: 'Chevalet QR & Formation équipe en salle' },
    { nom: 'deploiement3.jpg', svg: genererSVG3(), description: 'Carte du Sénégal & Support terrain 7j/7' }
  ];
  
  for (const { nom, svg, description } of images) {
    const cheminPublicJpg = path.join(PUBLIC_IMAGES_DIR, nom);
    const cheminRootJpg = path.join(ROOT_IMAGES_DIR, nom);
    const nomSvg = nom.replace('.jpg', '.svg');
    const cheminPublicSvg = path.join(PUBLIC_IMAGES_DIR, nomSvg);
    const cheminRootSvg = path.join(ROOT_IMAGES_DIR, nomSvg);

    // 1. Sauvegarde des sources SVG
    await fs.writeFile(cheminPublicSvg, svg, 'utf8');
    await fs.writeFile(cheminRootSvg, svg, 'utf8');

    // 2. Conversion en JPG haute qualité (90%) via sharp
    const bufferJpg = await sharp(Buffer.from(svg))
      .jpeg({ quality: 90, progressive: true })
      .toBuffer();

    await fs.writeFile(cheminPublicJpg, bufferJpg);
    await fs.writeFile(cheminRootJpg, bufferJpg);
    
    const stats = await fs.stat(cheminPublicJpg);
    const tailleKo = Math.round(stats.size / 1024);
    console.log(`✅ ${nom} (${tailleKo} Ko) & ${nomSvg} générés avec succès — ${description}`);
  }
  
  console.log('');
  console.log('🎉 Les 3 images ont été générées dans :');
  console.log('   - public/images/');
  console.log('   - images/');
  console.log('');
  console.log('📋 Prêt pour build de production : npm run build:lws');
}

genererToutesLesImages().catch(err => {
  console.error('❌ Erreur lors de la génération :', err);
  process.exit(1);
});
