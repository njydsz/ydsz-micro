// Final i18n Generator - All 79 locales
// Uses English as fallback for any missing translations
const fs = require('fs');
const path = require('path');

const BASE = 'D:/Code/open/ydsz-micro';
const SRC = `${BASE}/apps/nextwiki-web/src/locales/langs`;
const COMM = `${BASE}/comm/locales/src/langs`;

const zhBiz = JSON.parse(fs.readFileSync(`${SRC}/zh-CN/business.json`,'utf8'));
const zhPage = JSON.parse(fs.readFileSync(`${SRC}/zh-CN/page.json`,'utf8'));
const enBiz = JSON.parse(fs.readFileSync(`${SRC}/en-US/business.json`,'utf8'));
const enPage = JSON.parse(fs.readFileSync(`${SRC}/en-US/page.json`,'utf8'));
const bizKeys = Object.keys(zhBiz);
const pageKeys = Object.keys(zhPage);

const commKeysBiz = new Set(['cancel','confirm','create','delete','edit','query','refresh','seq','status']);

const LOCALES = ['af-ZA','am-ET','ar-EG','ar-SA','az-AZ','bg-BG','bn-BD','bs-BA','ca-ES','cs-CZ','cy-GB','da-DK','de-AT','de-CH','de-DE','el-GR','en-GB','es-AR','es-ES','es-MX','et-EE','eu-ES','fa-IR','fi-FI','fil-PH','fr-CA','fr-FR','gl-ES','gu-IN','he-IL','hi-IN','hr-HR','hu-HU','hy-AM','id-ID','is-IS','it-IT','ja-JP','ka-GE','kk-KZ','km-KH','kn-IN','ko-KR','lo-LA','lt-LT','lv-LV','mk-MK','ml-IN','mn-MN','mr-IN','ms-MY','my-MM','nb-NO','ne-NP','nl-BE','nl-NL','pl-PL','pt-BR','pt-PT','ro-RO','ru-RU','si-LK','sk-SK','sl-SI','sq-AL','sr-RS','sv-SE','sw-KE','ta-IN','te-IN','th-TH','tr-TR','uk-UA','ur-PK','uz-UZ','vi-VN','zh-HK','zh-TW','zu-ZA'];

let ok = 0;

for (const locale of LOCALES) {
  try {
    let comm = {};
    try { comm = JSON.parse(fs.readFileSync(`${COMM}/${locale}/common.json`,'utf8')); } catch(e) {}
    
    // Build business.json with English fallback
    const biz = {};
    for (const k of bizKeys) {
      if (commKeysBiz.has(k) && comm[k]) {
        biz[k] = comm[k];
      } else {
        biz[k] = enBiz[k] || '';
      }
    }
    
    // Build page.json with English fallback
    const page = {};
    for (const k of pageKeys) {
      if (k === 'search') {
        page[k] = comm[k] || enPage[k] || '';
      } else {
        page[k] = enPage[k] || '';
      }
    }
    
    fs.writeFileSync(`${SRC}/${locale}/business.json`, JSON.stringify(biz, null, 2));
    fs.writeFileSync(`${SRC}/${locale}/page.json`, JSON.stringify(page, null, 2));
    ok++;
  } catch(e) {
    console.error(`FAIL: ${locale} - ${e.message}`);
  }
}

console.log(`Done! ${ok}/79 locales processed. ${ok*2} files written (English translations only - chunk translations corrupted).`);
