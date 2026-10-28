const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) results = results.concat(walk(full));
    else if (full.endsWith('.tsx')) results.push(full);
  }
  return results;
}

const files = walk(path.join(__dirname, '../pages'));
console.log('Auditing', files.length, 'page files...');

let issues = 0;
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const base = path.basename(file);

  // Check h1/h2 titles
  for (const m of content.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)) {
    const raw = m[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
    if (!raw.includes('{') && raw.length > 0) {
      const words = raw.split(' ').filter(Boolean);
      if (words.length > 3) {
        console.log(`[TITLE > 3 WORDS] ${base}: "${raw}" (${words.length} words)`);
        issues++;
      }
    }
  }

  // Check consumer text in JSX
  for (const m of content.matchAll(/>([^<]*consumer[^<]*)<\//gi)) {
    if (m[1]) {
      console.log(`[CONSUMER IN UI] ${base}: "${m[1].trim()}"`);
      issues++;
    }
  }

  // Check paragraphs longer than 130 chars
  for (const m of content.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)) {
    const raw = m[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
    if (!raw.includes('{') && raw.length > 130) {
      console.log(`[LONG PARAGRAPH] ${base} (${raw.length} chars): "${raw.slice(0, 70)}..."`);
      issues++;
    }
  }
}

console.log('Total potential issues:', issues);
