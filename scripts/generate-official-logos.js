import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const artboardDir = path.join(rootDir, 'public', 'logo louametay originale');
const imagesDir = path.join(rootDir, 'images');
const publicImagesDir = path.join(rootDir, 'public', 'images');
const rootLogoOrigDir = path.join(rootDir, 'logo louametay originale');

console.log('--- Traitement et intégration des logos officiels Lou Ame Tay ---');

// Vérification des dossiers
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
if (!fs.existsSync(publicImagesDir)) fs.mkdirSync(publicImagesDir, { recursive: true });
if (!fs.existsSync(rootLogoOrigDir)) fs.mkdirSync(rootLogoOrigDir, { recursive: true });

// 1. Synchroniser le dossier original à la racine
const artboardFiles = ['Artboard 4.svg', 'Artboard 5.svg', 'Artboard 6.svg'];
for (const file of artboardFiles) {
  const src = path.join(artboardDir, file);
  const dest = path.join(rootLogoOrigDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
}

// 2. Préparer les variantes SVG officielles
const artboard4Content = fs.readFileSync(path.join(artboardDir, 'Artboard 4.svg'), 'utf8');
const artboard5Content = fs.readFileSync(path.join(artboardDir, 'Artboard 5.svg'), 'utf8');
const artboard6Content = fs.readFileSync(path.join(artboardDir, 'Artboard 6.svg'), 'utf8');

// Créer l'emblème seul (smartphone + emoji)
const gIndex = artboard5Content.indexOf('<g>');
let emblemSvg = artboard5Content.substring(0, gIndex) + '</svg>';
emblemSvg = emblemSvg.replace(/viewBox="[^"]*"/, 'viewBox="68 28 72 91"');

const svgVariants = [
  { name: 'logo-horizontal-chr.svg', content: artboard4Content },
  { name: 'logo-vertical.svg', content: artboard5Content },
  { name: 'logo-horizontal.svg', content: artboard6Content },
  { name: 'logo-emblem.svg', content: emblemSvg },
  { name: 'logo.svg', content: artboard5Content } // Logo principal standard
];

for (const variant of svgVariants) {
  fs.writeFileSync(path.join(imagesDir, variant.name), variant.content);
  fs.writeFileSync(path.join(publicImagesDir, variant.name), variant.content);
  console.log(`✓ SVG généré : images/${variant.name}`);
}

// 3. Génération des PNG haute définition avec Sharp
async function genererPngs() {
  // Logo principal carré 512x512 et 1024x1024
  const buf5 = Buffer.from(artboard5Content);
  await sharp(buf5, { density: 300 })
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(imagesDir, 'logo.png'));
  fs.copyFileSync(path.join(imagesDir, 'logo.png'), path.join(publicImagesDir, 'logo.png'));
  console.log('✓ PNG HD généré : images/logo.png (512x512)');

  await sharp(buf5, { density: 300 })
    .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(imagesDir, 'logo-1024.png'));
  fs.copyFileSync(path.join(imagesDir, 'logo-1024.png'), path.join(publicImagesDir, 'logo-1024.png'));
  console.log('✓ PNG HD généré : images/logo-1024.png (1024x1024)');

  // Emblème seul PNG
  const bufEmblem = Buffer.from(emblemSvg);
  await sharp(bufEmblem, { density: 300 })
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(imagesDir, 'logo-emblem.png'));
  fs.copyFileSync(path.join(imagesDir, 'logo-emblem.png'), path.join(publicImagesDir, 'logo-emblem.png'));
  console.log('✓ PNG Emblème généré : images/logo-emblem.png');

  // Logo horizontal PNG
  const buf6 = Buffer.from(artboard6Content);
  await sharp(buf6, { density: 300 })
    .resize(1000, null, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(imagesDir, 'logo-horizontal.png'));
  fs.copyFileSync(path.join(imagesDir, 'logo-horizontal.png'), path.join(publicImagesDir, 'logo-horizontal.png'));
  console.log('✓ PNG Horizontal généré : images/logo-horizontal.png');

  // Logo horizontal CHR PNG
  const buf4 = Buffer.from(artboard4Content);
  await sharp(buf4, { density: 300 })
    .resize(1000, null, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(imagesDir, 'logo-horizontal-chr.png'));
  fs.copyFileSync(path.join(imagesDir, 'logo-horizontal-chr.png'), path.join(publicImagesDir, 'logo-horizontal-chr.png'));
  console.log('✓ PNG Horizontal CHR généré : images/logo-horizontal-chr.png');

  // Logo vertical PNG
  await sharp(buf5, { density: 300 })
    .resize(null, 800, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(imagesDir, 'logo-vertical.png'));
  fs.copyFileSync(path.join(imagesDir, 'logo-vertical.png'), path.join(publicImagesDir, 'logo-vertical.png'));
  console.log('✓ PNG Vertical généré : images/logo-vertical.png');

  console.log('\n✨ Tous les logos officiels sont prêts et synchronisés dans images/ et public/images/ !');
}

genererPngs().catch(console.error);
