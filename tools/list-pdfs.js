import { randomInt } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';

const PDF_DIR = 'public/pdf';
const CATALOG = 'src/data/pdfs.ts';

const files = readdirSync(PDF_DIR).filter((name) =>
  name.toLowerCase().endsWith('.pdf'),
);

const catalogSource = readFileSync(CATALOG, 'utf8');
const entryRe = /id:\s*'([^']+)'[\s\S]*?fileName:\s*'([^']+)'/g;
const idsByFile = new Map(
  [...catalogSource.matchAll(entryRe)].map((match) => [match[2], match[1]]),
);

function generateId() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 10; i++) id += alphabet[randomInt(alphabet.length)];
  return id;
}

function extractIndex(fileName) {
  const match = /^(\d{2}-\d{4})/.exec(fileName);
  return match ? match[1] : '';
}

function escapeQuotes(value) {
  return value.replace(/'/g, "\\'");
}

console.log(`PDF-файлы в ${PDF_DIR}/, каталог: ${CATALOG}\n`);

for (const file of files) {
  const id = idsByFile.get(file);
  if (id) {
    console.log(`✓ ${file}`);
    console.log(`    id: ${id}\n`);
  } else {
    console.log(`+ ${file}`);
    console.log('    нет в каталоге — добавьте в src/data/pdfs.ts запись:');
    console.log('    {');
    console.log(`      id: '${generateId()}',`);
    console.log(`      index: '${extractIndex(file)}',`);
    console.log(`      title: '${escapeQuotes(file.replace(/\.pdf$/i, ''))}',`);
    console.log(`      description: '',`);
    console.log(`      fileName: '${escapeQuotes(file)}',`);
    console.log('    },\n');
  }
}

if (files.length === 0) console.log('(пусто)');
