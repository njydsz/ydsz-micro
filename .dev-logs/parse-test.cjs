const fs = require('fs');
const sfc = require('../node_modules/.pnpm/@vue+compiler-sfc@3.5.40/node_modules/@vue/compiler-sfc/dist/compiler-sfc.cjs.js');
const raw = fs.readFileSync('comm/@core/ui-kit/ydsz-ui/src/components/fieldset/YdFieldset.vue', 'utf8');
const lines = raw.split(/\r?\n/);
const variants = {
  full: raw,
  noHeader: lines.slice(11).join('\n'),
  noStyle: lines.slice(0, 128).join('\n'),
  noScript: lines.slice(0, 11).join('\n') + lines.slice(43).join('\n'),
  scriptPlusClose: lines.slice(11, 43).join('\n') + '\n<template>\n<div>x</div>\n</template>\n',
  bodyOnly: lines.slice(43).join('\n'),
};
for (const [k, v] of Object.entries(variants)) {
  const { errors } = sfc.parse(v, { filename: k + '.vue' });
  console.log(k, errors.map((e) => e.message));
}
