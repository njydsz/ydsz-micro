// Runner: imports all data chunks and writes 158 JSON files
const fs = require('fs');
const path = require('path');

const BASE = 'D:/Code/open/ydsz-micro';
const SRC = `${BASE}/apps/nextwiki-web/src/locales/langs`;
const COMM = `${BASE}/comm/locales/src/langs`;

// Source key order
const zhBiz = JSON.parse(fs.readFileSync(`${SRC}/zh-CN/business.json`,'utf8'));
const zhPage = JSON.parse(fs.readFileSync(`${SRC}/zh-CN/page.json`,'utf8'));
const bizKeys = Object.keys(zhBiz);
const pageKeys = Object.keys(zhPage);

const commKeys = new Set(['cancel','confirm','create','delete','edit','query','refresh','seq','status']);

// Load chunks
const args = process.argv.slice(2);
let allData = {};
for (const f of args) {
  const chunk = require(f);
  Object.assign(allData, chunk);
}

let ok = 0, fail = 0;
for (const [locale, trans] of Object.entries(allData)) {
  try {
    // Read comm common.json once per locale
    let comm = {};
    try { comm = JSON.parse(fs.readFileSync(`${COMM}/${locale}/common.json`,'utf8')); } catch(e) {}
    
    const hasBiz = trans.biz && Object.keys(trans.biz).length > 0;
    const hasPage = trans.page && Object.keys(trans.page).length > 0;
    
    if (hasBiz) {
      const biz = {};
      for (const k of bizKeys) {
        if (commKeys.has(k) && comm[k]) {
          biz[k] = comm[k];
        } else {
          biz[k] = trans.biz[k] || trans.biz[k] !== undefined ? trans.biz[k] : '';
        }
      }
      const dir = `${SRC}/${locale}`;
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(`${dir}/business.json`, JSON.stringify(biz, null, 2));
    }
    
    if (hasPage) {
      const page = {};
      for (const k of pageKeys) {
        if (k === 'search' && comm[k]) {
          page[k] = comm[k];
        } else {
          page[k] = trans.page[k] || '';
        }
      }
      const dir = `${SRC}/${locale}`;
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(`${dir}/page.json`, JSON.stringify(page, null, 2));
    }
    ok++;
  } catch(e) {
    fail++;
    console.error(`FAIL: ${locale} - ${e.message}`);
  }
}

console.log(`Done! ${ok} locales OK, ${fail} failed. Total files: ${ok*2}`);
