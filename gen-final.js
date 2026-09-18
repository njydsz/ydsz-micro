const fs = require('fs');
const path = require('path');
const vm = require('vm');

const BASE = 'D:/Code/open/ydsz-micro';
const SRC = `${BASE}/apps/nextwiki-web/src/locales/langs`;

// Get key order from zh-CN
const zhBiz = JSON.parse(fs.readFileSync(`${SRC}/zh-CN/business.json`,'utf8'));
const zhPage = JSON.parse(fs.readFileSync(`${SRC}/zh-CN/page.json`,'utf8'));
const enBiz = JSON.parse(fs.readFileSync(`${SRC}/en-US/business.json`,'utf8'));
const enPage = JSON.parse(fs.readFileSync(`${SRC}/en-US/page.json`,'utf8'));
const bizKeys = Object.keys(zhBiz);
const pageKeys = Object.keys(zhPage);

// Read existing files to find what's missing
const allLocales = fs.readdirSync(SRC).filter(l => !['zh-CN','en-US'].includes(l));
let missing = [];

for (const loc of allLocales) {
  try {
    const biz = JSON.parse(fs.readFileSync(`${SRC}/${loc}/business.json`,'utf8'));
    // Check if more than 10 values differ from English (i.e., proper translation exists)
    let diff = 0;
    for (const k of bizKeys) {
      if (biz[k] !== enBiz[k] && biz[k] !== '') diff++;
    }
    if (diff < 50) missing.push(loc);
  } catch(e) {
    missing.push(loc);
  }
}

console.log(`Locales needing translations: ${missing.length}`);
console.log(missing.join(', '));
