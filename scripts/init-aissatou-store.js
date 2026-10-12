// scripts/init-aissatou-store.js
// Usage : node scripts/init-aissatou-store.js
// Crée un File Search Store Gemini et indexe les 9 fiches

import { GoogleGenAI } from '@google/genai';
import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error('❌ Clé GEMINI_API_KEY manquante dans .env ou .env.local');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const STORE_DISPLAY_NAME = 'aissatou-knowledge-v1';

async function main() {
  console.log('🚀 Initialisation du File Search Store...');
  
  // 1. Chercher un store existant
  let store = null;
  try {
    const list = await ai.fileSearchStores.list();
    for await (const s of list) {
      if (s.displayName === STORE_DISPLAY_NAME) {
        store = s;
        console.log(`✅ Store trouvé : ${s.name}`);
        break;
      }
    }
  } catch (err) {
    console.log('Aucun store existant, création...');
  }
  
  // 2. Créer si absent
  if (!store) {
    store = await ai.fileSearchStores.create({
      config: { displayName: STORE_DISPLAY_NAME }
    });
    console.log(`✅ Store créé : ${store.name}`);
  }
  
  // 3. Uploader les 9 fiches
  const knowledgeDir = path.join(process.cwd(), 'knowledge');
  const files = await fs.readdir(knowledgeDir);
  const mdFiles = files.filter(f => f.endsWith('.md')).sort();
  
  console.log(`📁 ${mdFiles.length} fiches à indexer`);
  
  for (const file of mdFiles) {
    const filePath = path.join(knowledgeDir, file);
    console.log(`📤 Upload : ${file}...`);
    
    let operation = await ai.fileSearchStores.uploadToFileSearchStore({
      file: filePath,
      fileSearchStoreName: store.name,
      config: {
        displayName: file.replace('.md', ''),
        mimeType: 'text/markdown'
      }
    });
    
    // Attendre la fin de l'indexation
    while (!operation.done) {
      await new Promise(r => setTimeout(r, 2000));
      operation = await ai.operations.get({ operation });
    }
    
    console.log(`   ✅ ${file} indexé`);
  }
  
  // 4. Sauvegarder le nom du store dans un fichier de config
  const configPath = path.join(process.cwd(), 'js', 'aissatou-store-config.js');
  const publicConfigPath = path.join(process.cwd(), 'public', 'js', 'aissatou-store-config.js');
  
  const configContent = `// Auto-généré par scripts/init-aissatou-store.js\n` +
    `// Ne pas modifier manuellement\n` +
    `export const AISSATOU_STORE_NAME = '${store.name}';\n`;
    
  fs.writeFileSync(configPath, configContent);
  if (fs.existsSync(path.dirname(publicConfigPath))) {
    fs.writeFileSync(publicConfigPath, configContent);
  }
  
  console.log('');
  console.log('🎉 Base de connaissances indexée avec succès !');
  console.log(`📌 Store : ${store.name}`);
  console.log(`📌 Config sauvegardée dans js/aissatou-store-config.js`);
}

main().catch(err => {
  console.error('❌ Erreur :', err);
  process.exit(1);
});
