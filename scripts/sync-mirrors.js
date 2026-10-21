import fs from 'fs';
import path from 'path';

function copyFileSafe(src, dest) {
  if (!fs.existsSync(src)) return;
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`Synced: ${src} -> ${dest}`);
}

// 1. Service worker
copyFileSafe('service-worker.js', 'public/service-worker.js');

// 2. HTML
copyFileSafe('commercial.html', 'public/commercial.html');
copyFileSafe('admin.html', 'public/admin.html');
copyFileSafe('carte.html', 'public/carte.html');
copyFileSafe('index.html', 'public/index.html');

// 3. JS critiques & Modules V2
const fichiersJs = [
  'commercial.js',
  'icons.js',
  'admin.js',
  'admin-v2.js',
  'map-admin.js',
  'wallet-pass.js',
  'carte.js',
  'aissatou-voice.js',
  'aissatou-guardrails.js',
  'aissatou-memory.js',
  'aissatou-actions.js',
  'aissatou-drive.js',
  'aissatou-knowledge-base.js',
  'admin-aissatou-ceo.js',
  'gemini-copilot.js',
  'supabase-client.js'
];

for (const js of fichiersJs) {
  copyFileSafe(`js/${js}`, `public/js/${js}`);
}

// 4. Styles
copyFileSafe('css/style.css', 'public/css/style.css');
copyFileSafe('css/admin.css', 'public/css/admin.css');
copyFileSafe('css/admin-v2.css', 'public/css/admin-v2.css');

// 5. Knowledge
if (fs.existsSync('knowledge')) {
  const fiches = fs.readdirSync('knowledge');
  for (const f of fiches) {
    if (f.endsWith('.md')) {
      copyFileSafe(`knowledge/${f}`, `public/knowledge/${f}`);
    }
  }
}

console.log('✅ Tous les miroirs public/ sont synchronisés avec succès !');
