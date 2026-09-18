// Merge proper translations from chunk files into existing files
const fs = require('fs');
const path = require('path');

const BASE = 'D:/Code/open/ydsz-micro';
const SRC = `${BASE}/apps/nextwiki-web/src/locales/langs`;
const CHUNK_DIR = `${BASE}/t-i18n`;

// Load all valid chunks
const allFiles = fs.readdirSync(CHUNK_DIR).filter(f => f.startsWith('chunk') && f.endsWith('.cjs')).sort();
let allTrans = {};
let loadedChunks = 0;
let loadedLocales = 0;

for (const f of allFiles) {
  try {
    const chunk = require(`${CHUNK_DIR}/${f}`);
    let count = 0;
    for (const [loc, data] of Object.entries(chunk)) {
      if (data && (data.biz || data.page)) {
        if (!allTrans[loc]) allTrans[loc] = { biz: {}, page: {} };
        if (data.biz) Object.assign(allTrans[loc].biz, data.biz);
        if (data.page) Object.assign(allTrans[loc].page, data.page);
        count++;
      }
    }
    if (count > 0) loadedChunks++;
    loadedLocales += count;
  } catch(e) {
    console.error(`Skip ${f}: ${e.message}`);
  }
}

console.log(`Loaded ${loadedChunks} chunks, ${loadedLocales} locale entries`);

// Now merge into files
let merged = 0;
const locales = fs.readdirSync(SRC).filter(l => !['zh-CN','en-US'].includes(l));

for (const locale of locales) {
  const trans = allTrans[locale];
  if (!trans) continue;
  
  // Merge business.json
  try {
    const bizPath = `${SRC}/${locale}/business.json`;
    const existingBiz = JSON.parse(fs.readFileSync(bizPath, 'utf8'));
    let changed = false;
    
    for (const [k, v] of Object.entries(trans.biz || {})) {
      if (v && v !== '' && v !== existingBiz[k]) {
        existingBiz[k] = v;
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(bizPath, JSON.stringify(existingBiz, null, 2));
    }
  } catch(e) {}
  
  // Merge page.json
  try {
    const pagePath = `${SRC}/${locale}/page.json`;
    const existingPage = JSON.parse(fs.readFileSync(pagePath, 'utf8'));
    let changed = false;
    
    for (const [k, v] of Object.entries(trans.page || {})) {
      if (v && v !== '' && v !== existingPage[k]) {
        existingPage[k] = v;
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(pagePath, JSON.stringify(existingPage, null, 2));
    }
  } catch(e) {}
  
  if ((trans.biz && Object.keys(trans.biz).length > 0) || (trans.page && Object.keys(trans.page).length > 0)) {
    merged++;
  }
}

console.log(`Merged translations for ${merged} locales`);
