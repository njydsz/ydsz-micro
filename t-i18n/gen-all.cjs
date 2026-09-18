// Final generator: creates all 158 files using chunk translations + English fallback
const fs = require('fs');
const path = require('path');

const BASE = 'D:/Code/open/ydsz-micro';
const SRC = `${BASE}/apps/nextwiki-web/src/locales/langs`;
const COMM = `${BASE}/comm/locales/src/langs`;
const CHUNK_DIR = `${BASE}/t-i18n`;

// Source key order
const zhBiz = JSON.parse(fs.readFileSync(`${SRC}/zh-CN/business.json`,'utf8'));
const zhPage = JSON.parse(fs.readFileSync(`${SRC}/zh-CN/page.json`,'utf8'));
const enBiz = JSON.parse(fs.readFileSync(`${SRC}/en-US/business.json`,'utf8'));
const enPage = JSON.parse(fs.readFileSync(`${SRC}/en-US/page.json`,'utf8'));
const bizKeys = Object.keys(zhBiz);
const pageKeys = Object.keys(zhPage);

const commKeysBiz = new Set(['cancel','confirm','create','delete','edit','query','refresh','seq','status']);

// Load all chunk files
const chunkFiles = [];
const allFiles = fs.readdirSync(CHUNK_DIR).filter(f => f.startsWith('chunk') && f.endsWith('.cjs'));
for (const f of allFiles.sort()) {
  try {
    const chunk = require(`${CHUNK_DIR}/${f}`);
    chunkFiles.push(chunk);
  } catch(e) {
    console.error(`Error loading ${f}: ${e.message}`);
  }
}

// Merge all translations
let allTrans = {};
for (const chunk of chunkFiles) {
  Object.assign(allTrans, chunk);
}

const LOCALES = ['af-ZA','am-ET','ar-EG','ar-SA','az-AZ','bg-BG','bn-BD','bs-BA','ca-ES','cs-CZ','cy-GB','da-DK','de-AT','de-CH','de-DE','el-GR','en-GB','es-AR','es-ES','es-MX','et-EE','eu-ES','fa-IR','fi-FI','fil-PH','fr-CA','fr-FR','gl-ES','gu-IN','he-IL','hi-IN','hr-HR','hu-HU','hy-AM','id-ID','is-IS','it-IT','ja-JP','ka-GE','kk-KZ','km-KH','kn-IN','ko-KR','lo-LA','lt-LT','lv-LV','mk-MK','ml-IN','mn-MN','mr-IN','ms-MY','my-MM','nb-NO','ne-NP','nl-BE','nl-NL','pl-PL','pt-BR','pt-PT','ro-RO','ru-RU','si-LK','sk-SK','sl-SI','sq-AL','sr-RS','sv-SE','sw-KE','ta-IN','te-IN','th-TH','tr-TR','uk-UA','ur-PK','uz-UZ','vi-VN','zh-HK','zh-TW','zu-ZA'];

let ok = 0, fail = 0;
const stats = { complete: 0, partial: 0, empty: 0 };

for (const locale of LOCALES) {
  try {
    let comm = {};
    try { comm = JSON.parse(fs.readFileSync(`${COMM}/${locale}/common.json`,'utf8')); } catch(e) {}
    
    const trans = allTrans[locale] || { biz: {}, page: {} };
    const hasBiz = Object.keys(trans.biz || {}).length > 0;
    const hasPage = Object.keys(trans.page || {}).length > 0;
    
    if (!hasBiz && !hasPage) {
      stats.empty++;
      continue;
    }
    
    // Check completeness
    const missingKeys = bizKeys.filter(k => !commKeysBiz.has(k) && !(trans.biz && trans.biz[k]));
    if (missingKeys.length > 0) {
      stats.partial++;
    } else {
      stats.complete++;
    }
    
    // Build business.json
    const biz = {};
    for (const k of bizKeys) {
      if (commKeysBiz.has(k)) {
        biz[k] = comm[k] || enBiz[k] || '';
      } else {
        biz[k] = (trans.biz && trans.biz[k]) ? trans.biz[k] : (enBiz[k] || '');
      }
    }
    
    // Build page.json
    const page = {};
    for (const k of pageKeys) {
      if (k === 'search') {
        page[k] = comm[k] || (trans.page && trans.page[k]) || enPage[k] || '';
      } else {
        page[k] = (trans.page && trans.page[k]) ? trans.page[k] : (enPage[k] || '');
      }
    }
    
    fs.writeFileSync(`${SRC}/${locale}/business.json`, JSON.stringify(biz, null, 2));
    fs.writeFileSync(`${SRC}/${locale}/page.json`, JSON.stringify(page, null, 2));
    ok++;
  } catch(e) {
    fail++;
    console.error(`FAIL: ${locale} - ${e.message}`);
  }
}

console.log(`Done! ${ok} locales OK, ${fail} failed.`);
console.log(`Stats: ${stats.complete} complete, ${stats.partial} partial (English fallback used), ${stats.empty} empty (skipped)`);
console.log(`Files generated: ${ok * 2}`);
