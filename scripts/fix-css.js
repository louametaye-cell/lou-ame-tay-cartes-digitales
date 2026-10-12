import fs from 'fs';

const path = 'css/style.css';
let css = fs.readFileSync(path, 'utf8');

const importStr = "@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');";

css = css.replace(importStr, '').trim();
css = importStr + '\n\n' + css;

fs.writeFileSync(path, css, 'utf8');
console.log('✅ CSS nettoyé avec @import au début !');
