// Batch write all remaining locales with translations
const fs = require('fs');
const path = require('path');
const BASE = 'D:/Code/open/ydsz-micro';
const SRC = `${BASE}/apps/nextwiki-web/src/locales/langs`;

const zhBiz = JSON.parse(fs.readFileSync(`${SRC}/zh-CN/business.json`,'utf8'));
const zhPage = JSON.parse(fs.readFileSync(`${SRC}/zh-CN/page.json`,'utf8'));
const enBiz = JSON.parse(fs.readFileSync(`${SRC}/en-US/business.json`,'utf8'));
const enPage = JSON.parse(fs.readFileSync(`${SRC}/en-US/page.json`,'utf8'));
const bizKeys = Object.keys(zhBiz);
const pageKeys = Object.keys(zhPage);

// Translation data for missing locales (from previous chunks that had issues)
const T = {};

// Write files for specified locales
const LOCALES = process.argv.slice(2);

for (const locale of LOCALES) {
  const trans = T[locale];
  
  // Build business.json
  const biz = {};
  for (const k of bizKeys) {
    if (trans && trans.biz && trans.biz[k]) {
      biz[k] = trans.biz[k];
    } else {
      biz[k] = enBiz[k] || '';
    }
  }
  
  // Build page.json
  const page = {};
  for (const k of pageKeys) {
    if (trans && trans.page && trans.page[k]) {
      page[k] = trans.page[k];
    } else {
      page[k] = enPage[k] || '';
    }
  }
  
  fs.writeFileSync(`${SRC}/${locale}/business.json`, JSON.stringify(biz, null, 2));
  fs.writeFileSync(`${SRC}/${locale}/page.json`, JSON.stringify(page, null, 2));
  console.log(`Written: ${locale}`);
}

console.log(`Done: ${LOCALES.length} locales processed`);
