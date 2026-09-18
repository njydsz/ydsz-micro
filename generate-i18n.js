const fs = require('fs');
const path = require('path');

const BASE = 'D:/Code/open/ydsz-micro';
const SRC = `${BASE}/apps/nextwiki-web/src/locales/langs`;
const COMM = `${BASE}/comm/locales/src/langs`;

const LOCALES = ['en-US'];

// Read zh-CN and en-US to get key order
const zhBiz = JSON.parse(fs.readFileSync(`${SRC}/zh-CN/business.json`,'utf8'));
const zhPage = JSON.parse(fs.readFileSync(`${SRC}/zh-CN/page.json`,'utf8'));
const enBiz = JSON.parse(fs.readFileSync(`${SRC}/en-US/business.json`,'utf8'));
const enPage = JSON.parse(fs.readFileSync(`${SRC}/en-US/page.json`,'utf8'));

const bizKeys = Object.keys(zhBiz);
const pageKeys = Object.keys(zhPage);

// Keys covered by comm layer
const commCommonKeys = new Set(['cancel','confirm','create','delete','edit','query','refresh','seq','status']);

// Read a locale's common.json from comm layer
function getCommCommon(locale) {
  try {
    return JSON.parse(fs.readFileSync(`${COMM}/${locale}/common.json`,'utf8'));
  } catch(e) { return {}; }
}

console.log(`Syncing locales: ${LOCALES.length} target(s)`);
