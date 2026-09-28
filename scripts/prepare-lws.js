import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const zipFile = path.join(rootDir, 'louametay-lws-dist.zip');

console.log('--- Préparation du build de production pour LWS ---');

// 1. Vérification que dist existe
if (!fs.existsSync(distDir)) {
  console.error('Erreur: Le dossier dist/ n\'existe pas. Exécutez vite build d\'abord.');
  process.exit(1);
}

// 2. Fichiers essentiels LWS à synchroniser dans dist/
const fichiersLWS = [
  { source: path.join(rootDir, '.htaccess'), dest: path.join(distDir, '.htaccess') },
  { source: path.join(rootDir, 'robots.txt'), dest: path.join(distDir, 'robots.txt') },
  { source: path.join(rootDir, 'sitemap.xml'), dest: path.join(distDir, 'sitemap.xml') },
  { source: path.join(rootDir, 'js', 'env.js'), dest: path.join(distDir, 'js', 'env.js') },
  { source: path.join(rootDir, '404.html'), dest: path.join(distDir, '404.html') }
];

for (const { source, dest } of fichiersLWS) {
  if (fs.existsSync(source)) {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(source, dest);
    console.log(`✓ Synchronisé dans dist: ${path.basename(dest)}`);
  } else {
    console.warn(`! Avertissement: ${source} introuvable.`);
  }
}

// 3. Compression en archive ZIP prête pour LWS
if (fs.existsSync(zipFile)) {
  fs.unlinkSync(zipFile);
}

try {
  console.log('\nGénération de l\'archive louametay-lws-dist.zip...');
  // Commande PowerShell fiable sur Windows
  const psCmd = `powershell -Command "Compress-Archive -Path '${distDir}/*', '${path.join(distDir, '.htaccess')}' -DestinationPath '${zipFile}' -Force"`;
  execSync(psCmd, { stdio: 'inherit' });
  const stat = fs.statSync(zipFile);
  console.log(`✓ Archive ZIP prête : louametay-lws-dist.zip (${(stat.size / 1024).toFixed(1)} Ko)`);
} catch (e) {
  console.warn('Impossible de générer le zip automatiquement:', e.message);
}

// 4. Rapport de vérification des fichiers critiques LWS
const checklist = [
  'index.html',
  'carte.html',
  'admin.html',
  'login.html',
  '404.html',
  '.htaccess',
  'robots.txt',
  'sitemap.xml',
  'manifest.json',
  'service-worker.js',
  'js/env.js'
];

console.log('\n--- Checklist d\'intégrité LWS (dist/) ---');
let toutOk = true;
for (const item of checklist) {
  const p = path.join(distDir, item);
  if (fs.existsSync(p)) {
    console.log(`  [OK] ${item}`);
  } else {
    console.log(`  [MANQUANT] ${item}`);
    toutOk = false;
  }
}

if (toutOk) {
  console.log('\n✨ Tous les fichiers nécessaires à LWS sont prêts dans dist/ et dans louametay-lws-dist.zip !');
} else {
  console.error('\n⚠️ Certains fichiers critiques sont manquants dans dist/.');
}
