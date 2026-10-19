import fs from 'fs';
import path from 'path';

function copyFileSafe(src, dest) {
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

// 3. JS critiques & Styles
copyFileSafe('js/commercial.js', 'public/js/commercial.js');
copyFileSafe('js/icons.js', 'public/js/icons.js');
copyFileSafe('js/admin.js', 'public/js/admin.js');
copyFileSafe('js/aissatou-knowledge-base.js', 'public/js/aissatou-knowledge-base.js');
copyFileSafe('css/style.css', 'public/css/style.css');

// 4. Knowledge
if (fs.existsSync('knowledge')) {
  const fiches = fs.readdirSync('knowledge');
  for (const f of fiches) {
    if (f.endsWith('.md')) {
      copyFileSafe(`knowledge/${f}`, `public/knowledge/${f}`);
    }
  }
}

console.log('✅ Tous les miroirs public/ sont synchronisés avec succès !');
